import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  ['.env.local', '.env'].forEach((envFile) => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf-8');
      for (const line of envConfig.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const k = key.trim();
          const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (k && val) {
            process.env[k] = val;
          }
        }
      }
    }
  });

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`[RETRIEVAL DEBUG] URL: ${SUPABASE_URL} | KEY: ${SUPABASE_KEY?.substring(0, 15)}...`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export interface MatchResult {
  id: string;
  content: string;
  source: string;
  section: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface RerankedResult extends MatchResult {
  entityBoost: number;
  specificityBoost: number;
  languageBoost: number;
  finalScore: number;
}

export function detectQueryLanguage(query: string): 'ja' | 'en' {
  const jaRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return jaRegex.test(query) ? 'ja' : 'en';
}

import { routeQuery, RouteResult } from './queryRouter';

export interface MatchResult {
  id: string;
  content: string;
  source: string;
  section: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface RerankedResult extends MatchResult {
  entityBoost: number;
  specificityBoost: number;
  languageBoost: number;
  intentBoost: number;
  finalScore: number;
}

export function computeHybridReranking(
  item: MatchResult,
  route: RouteResult
): RerankedResult {
  const vectorSim = typeof item.similarity === 'number' ? item.similarity : parseFloat(item.similarity as any);
  const chunkLang = (item.metadata?.language || (item.source?.startsWith('ja/') ? 'ja' : 'en')).toLowerCase();

  const contentLower = item.content.toLowerCase();
  const sourceLower = (item.source || item.metadata?.source || '').toLowerCase();
  const sectionLower = (item.section || item.metadata?.section || '').toLowerCase();

  let entityBoost = 0;
  let specificityBoost = 0;
  let languageBoost = 0;
  let intentBoost = 0;

  // 1. Language Alignment Boost & Penalty
  if (route.language === chunkLang) {
    languageBoost += 0.25;
  } else {
    languageBoost -= 0.35; // Strongly penalize cross-language chunk pollution
  }

  // 2. Query Intent / Domain Source Reranking
  for (const [srcPattern, boostVal] of Object.entries(route.sourceBoosts)) {
    if (sourceLower.includes(srcPattern.toLowerCase())) {
      intentBoost += boostVal;
    }
  }

  // 3. Entity Alignment Reranking
  if (route.entity) {
    const entLower = route.entity.toLowerCase();
    const isEntityMatch = contentLower.includes(entLower) || sectionLower.includes(entLower);
    
    // Check key entity synonyms
    const isFlyRankMatch = route.entity === 'FlyRank' && (contentLower.includes('flyrank') || sectionLower.includes('flyrank') || contentLower.includes('フライランク'));
    const isIsiriMatch = route.entity.includes('ISIRI') && (contentLower.includes('isiri') || contentLower.includes('ayuslab') || sectionLower.includes('isiri') || contentLower.includes('アユスラボ'));
    const isGeoMatch = route.entity === 'GeoSentinel' && (contentLower.includes('geosentinel') || contentLower.includes('landslide') || contentLower.includes('土砂崩れ'));
    const isSmartQMatch = route.entity === 'SmartQ Generator' && (contentLower.includes('smartq') || contentLower.includes('多言語問題'));
    
    if (isEntityMatch || isFlyRankMatch || isIsiriMatch || isGeoMatch || isSmartQMatch) {
      entityBoost += 0.30;
    }
  }

  // 4. Section Specificity & Overview Priority
  if (sectionLower.includes('leakage prevention') || sectionLower.includes('disclaimer') || sectionLower.includes('license')) {
    specificityBoost -= 0.30;
  }

  // Prioritize primary project/experience overview chunks over deep sub-features
  if (sectionLower.includes('overview') || sectionLower.includes('summary') || sectionLower.includes('quick key metrics') || sectionLower.includes('project overview')) {
    specificityBoost += 0.10;
  }

  const finalScore = vectorSim + entityBoost + specificityBoost + languageBoost + intentBoost;

  return {
    ...item,
    entityBoost,
    specificityBoost,
    languageBoost,
    intentBoost,
    finalScore,
  };
}

export interface RetrievalMetrics {
  embedding: {
    startTime: string;
    endTime: string;
    durationMs: number;
    processState: string;
    subTelemetry?: any;
  };
  supabase: {
    startTime: string;
    endTime: string;
    durationMs: number;
    rawCandidateCount: number;
  };
  reranking: {
    startTime: string;
    endTime: string;
    durationMs: number;
  };
  route: RouteResult;
}

export async function performHybridRetrieval(
  queryText: string,
  candidateCount = 30,
  topK = 5
): Promise<{ topChunks: RerankedResult[]; metrics: RetrievalMetrics }> {
  const supabase = getSupabaseClient();

  // Stage 1: Lightweight Query Intent & Entity Router
  const route = routeQuery(queryText);

  // Stage 2: Embedding Generation (Warm persistent microservice with CLI fallback)
  const embStart = performance.now();
  const embStartTimeISO = new Date().toISOString();

  let queryVector: number[] = [];
  let processState = 'Persistent FastAPI Microservice (BAAI/bge-m3 warm in-memory)';
  let embedSubTelemetry: any = null;

  const serviceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://127.0.0.1:8000/embed';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const serviceRes = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: queryText }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (serviceRes.ok) {
      const serviceData = await serviceRes.json();
      if (serviceData.embedding && Array.isArray(serviceData.embedding)) {
        queryVector = serviceData.embedding;
        embedSubTelemetry = {
          service_url: serviceUrl,
          inference_ms: serviceData.inference_ms,
          model_name: "BAAI/bge-m3",
          dimension: serviceData.dimension || 1024,
          cached_in_memory: true,
        };
      }
    }
  } catch (err: any) {
    // Graceful fallback if persistent service is not running or still loading
  }

  // Fallback to CLI script if persistent service is unavailable
  if (!queryVector || queryVector.length === 0) {
    processState = 'Cold start fallback: Python child_process spawned & SentenceTransformer BAAI/bge-m3 initialized per query';
    const pythonScript = path.join(process.cwd(), 'scripts', 'embed_query.py');
    const rawOutput = execSync(`python "${pythonScript}" "${JSON.stringify([queryText]).replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    const jsonStart = rawOutput.indexOf('{');
    const jsonEnd = rawOutput.lastIndexOf('}');
    const cleanJson = jsonStart !== -1 && jsonEnd !== -1 ? rawOutput.substring(jsonStart, jsonEnd + 1) : rawOutput;
    const parsedEmbeddings = JSON.parse(cleanJson);
    queryVector = Array.isArray(parsedEmbeddings) ? parsedEmbeddings[0].embedding : parsedEmbeddings.embedding;
    embedSubTelemetry = Array.isArray(parsedEmbeddings) ? parsedEmbeddings[0]._telemetry : parsedEmbeddings._telemetry;
  }

  const embEnd = performance.now();
  const embEndTimeISO = new Date().toISOString();
  const embDurationMs = Math.round((embEnd - embStart) * 100) / 100;

  // Stage 3: Supabase vector retrieval
  const supaStart = performance.now();
  const supaStartTimeISO = new Date().toISOString();

  let { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: queryVector,
    match_count: candidateCount,
    match_threshold: 0.0,
  });

  if (error && error.code === 'PGRST202') {
    const fallbackRes = await supabase.rpc('match_knowledge_embeddings', {
      query_embedding: queryVector,
      match_count: candidateCount,
      match_threshold: 0.0,
    });
    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  const supaEnd = performance.now();
  const supaEndTimeISO = new Date().toISOString();
  const supaDurationMs = Math.round((supaEnd - supaStart) * 100) / 100;

  if (error) {
    throw new Error(`Supabase retrieval error: ${error.message}`);
  }

  const rawResults: MatchResult[] = data || [];

  // Stage 4: Router Metadata & Hybrid Reranking
  const rerankStart = performance.now();
  const rerankStartTimeISO = new Date().toISOString();

  const rawSortedBefore = [...rawResults].sort((a, b) => b.similarity - a.similarity).slice(0, topK);

  const reranked: RerankedResult[] = rawResults.map((item) => computeHybridReranking(item, route));
  reranked.sort((a, b) => b.finalScore - a.finalScore);
  const topChunks = reranked.slice(0, topK);

  const rerankEnd = performance.now();
  const rerankEndTimeISO = new Date().toISOString();
  const rerankDurationMs = Math.round((rerankEnd - rerankStart) * 100) / 100;

  // Diagnostic logging in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n=======================================================================`);
    console.log(`[QUERY ROUTER DIAGNOSTIC LOG]`);
    console.log(`Query: "${queryText}"`);
    console.log(`Intent: ${route.intent}`);
    console.log(`Intent confidence: ${route.confidence}`);
    console.log(`Language: ${route.language}`);
    console.log(`Detected entity: ${route.entity || 'None'}`);
    console.log(`\nTop retrieved chunks before routing:`);
    rawSortedBefore.forEach((c, i) => {
      const src = c.source || c.metadata?.source || 'unknown';
      const sec = c.section || c.metadata?.section || 'Overview';
      console.log(`  ${i + 1}. [Source: ${src} | Section: ${sec}] VectorSim: ${c.similarity?.toFixed(4)}`);
    });
    console.log(`\nTop retrieved chunks after routing:`);
    topChunks.forEach((c, i) => {
      const src = c.source || c.metadata?.source || 'unknown';
      const sec = c.section || c.metadata?.section || 'Overview';
      console.log(`  ${i + 1}. [Source: ${src} | Section: ${sec}] FinalScore: ${c.finalScore?.toFixed(4)} (VectorSim: ${c.similarity?.toFixed(4)})`);
    });
    console.log(`=======================================================================\n`);
  }

  const metrics: RetrievalMetrics = {
    embedding: {
      startTime: embStartTimeISO,
      endTime: embEndTimeISO,
      durationMs: embDurationMs,
      processState,
      subTelemetry: embedSubTelemetry,
    },
    supabase: {
      startTime: supaStartTimeISO,
      endTime: supaEndTimeISO,
      durationMs: supaDurationMs,
      rawCandidateCount: rawResults.length,
    },
    reranking: {
      startTime: rerankStartTimeISO,
      endTime: rerankEndTimeISO,
      durationMs: rerankDurationMs,
    },
    route,
  };

  return { topChunks, metrics };
}
