import { NextRequest, NextResponse } from 'next/server';
import { performHybridRetrieval } from '@/src/lib/rag/retrieval';
import { assembleContext } from '@/src/lib/rag/context';
import { generateGroundedAnswer } from '@/src/lib/rag/generator';
import { detectNavigationIntent } from '@/src/lib/navigation/navigationIntent';
import { detectNavigationTarget, extractNavigationMetadata } from '@/src/lib/navigation/navigationTarget';
import { getAssistantMode } from '@/src/lib/assistant/mode';
import { resolveFallbackQuery, resolveCloudFallbackQuery } from '@/src/lib/assistant/fallback/resolver';
import { resolveConversationalQuery } from '@/src/lib/rag/conversationResolver';

async function handleFallbackCascade(
  query: string,
  language: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  // Tier 2: Cloud LLM Fallback (Groq / xAI serverless fetch)
  const cloudResult = await resolveCloudFallbackQuery(query, language, history);
  if (cloudResult) {
    return NextResponse.json({
      answer: cloudResult.answer,
      navigation: cloudResult.navigation,
      isFallback: true,
    });
  }

  // Tier 3: Final Rule-based Safety Fallback
  const fallbackResult = resolveFallbackQuery(query);
  const fallbackRoute = fallbackResult.type !== 'answer' ? fallbackResult.route : undefined;
  const navigation = extractNavigationMetadata(query, language, fallbackRoute);

  return NextResponse.json({
    answer: fallbackResult.answer,
    navigation,
    isFallback: true,
  });
}

export async function POST(req: NextRequest) {
  // Stage 1: Request received
  const totalStart = performance.now();
  const stage1_requestReceivedISO = new Date().toISOString();

  try {
    const body = await req.json();
    const query = body.message || body.prompt || body.query;
    const language = body.language || 'en';

    // Validate optional short-term history array (up to 6 items)
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (Array.isArray(body.history)) {
      history = body.history
        .filter(
          (item: any) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string' &&
            item.content.trim().length > 0
        )
        .map((item: any) => ({
          role: item.role as 'user' | 'assistant',
          content: item.content.trim(),
        }));
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid chat query/message is required.' },
        { status: 400 }
      );
    }

    // Check Assistant Operating Mode ("rag" vs "rule")
    const assistantMode = getAssistantMode();

    if (assistantMode === 'rule') {
      return await handleFallbackCascade(query, language, history);
    }

    // Provider Method 1: Grounded RAG AI Pipeline (Tier 1)
    try {
      // Check for pure navigation intent
      const { isPureNavigation } = detectNavigationIntent(query, language);
      const structuredNav = detectNavigationTarget(query, language);

      if (isPureNavigation && structuredNav) {
        const pageName = structuredNav.section.charAt(0).toUpperCase() + structuredNav.section.slice(1);
        const defaultAnswer = language === 'ja'
          ? `かしこまりました。スジャンの${pageName}ページはこちらです。`
          : `Sure — here's Sujan's ${pageName} page.`;

        return NextResponse.json({
          answer: defaultAnswer,
          navigation: { section: structuredNav.section, target: structuredNav.target },
        });
      }

      // Resolve conversational query/pronouns using short-term memory
      const resolution = resolveConversationalQuery(query, history);
      const retrievalQuery = resolution.wasResolved ? resolution.resolvedQuery : query;

      // Detect target navigation metadata from query
      const ragNavTarget = detectNavigationTarget(retrievalQuery, language) || structuredNav;
      const navigation = ragNavTarget
        ? { section: ragNavTarget.section, target: ragNavTarget.target }
        : extractNavigationMetadata(query, language);

      // Stages 2, 3, 4: Embedding, Supabase Retrieval, Reranking
      const { topChunks, metrics: retrievalMetrics } = await performHybridRetrieval(retrievalQuery, 30, 5);

      // Stage 5: Context Assembly
      const assembledContext = assembleContext(topChunks);

      // Stage 6: Grounded Answer Generation
      const generationResult = await generateGroundedAnswer(retrievalQuery, assembledContext);

      // Stage 7: Response returned
      const totalEnd = performance.now();
      const stage7_responseReturnedISO = new Date().toISOString();
      const totalDurationMs = Math.round((totalEnd - totalStart) * 100) / 100;

      const telemetry = {
        originalQuery: query,
        retrievalQuery,
        conversationalResolution: {
          wasResolved: resolution.wasResolved,
          confidence: resolution.confidence,
          resolvedQuery: resolution.resolvedQuery,
          entity: resolution.entity,
        },
        stage1_requestReceived: {
          timestamp: stage1_requestReceivedISO,
        },
        stage2_queryEmbedding: {
          startTime: retrievalMetrics.embedding.startTime,
          endTime: retrievalMetrics.embedding.endTime,
          durationMs: retrievalMetrics.embedding.durationMs,
          processState: retrievalMetrics.embedding.processState,
        },
        stage3_supabaseRetrieval: {
          startTime: retrievalMetrics.supabase.startTime,
          endTime: retrievalMetrics.supabase.endTime,
          durationMs: retrievalMetrics.supabase.durationMs,
          rawCandidatesRetrieved: retrievalMetrics.supabase.rawCandidateCount,
        },
        stage4_hybridReranking: {
          startTime: retrievalMetrics.reranking.startTime,
          endTime: retrievalMetrics.reranking.endTime,
          durationMs: retrievalMetrics.reranking.durationMs,
          retrievedTopChunksCount: topChunks.length,
        },
        stage5_contextAssembly: {
          startTime: assembledContext.metrics.startTime,
          endTime: assembledContext.metrics.endTime,
          durationMs: assembledContext.metrics.durationMs,
          usedChunkCount: assembledContext.chunkCount,
          contextCharacterSize: assembledContext.totalCharacters,
        },
        stage6_llmGeneration: {
          startTime: generationResult.metrics.startTime,
          endTime: generationResult.metrics.endTime,
          durationMs: generationResult.metrics.durationMs,
          processState: generationResult.metrics.processState,
        },
        stage7_responseReturned: {
          timestamp: stage7_responseReturnedISO,
        },
        totalEndToEndDurationMs: totalDurationMs,
      };

      console.log('[RAG TELEMETRY]', JSON.stringify(telemetry, null, 2));

      return NextResponse.json({
        answer: generationResult.answer,
        navigation,
        chunks: assembledContext.usedChunks,
        chunkCount: assembledContext.chunkCount,
        telemetry,
      });

    } catch (ragError: any) {
      console.warn('RAG AI execution unavailable, attempting Tier 2 (Cloud LLM) -> Tier 3 (Rule Fallback) cascade:', ragError);
      return await handleFallbackCascade(query, language, history);
    }

  } catch (error: any) {
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during chat processing.' },
      { status: 500 }
    );
  }
}
