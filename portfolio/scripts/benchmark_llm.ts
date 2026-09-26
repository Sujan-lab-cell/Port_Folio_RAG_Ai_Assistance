import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";
import { generateGroundedAnswer } from "../src/lib/rag/generator";

const TEST_QUERIES = [
  "Tell me about Sujan",
  "Where did Sujan complete his internship?",
  "What projects has Sujan built?",
  "What are his technical skills?",
];

async function runGrokBenchmark() {
  console.log("=======================================================================");
  console.log("        GROK / xAI API END-TO-END RAG LATENCY BENCHMARK");
  console.log("=======================================================================\n");

  const results: Array<{
    query: string;
    answer: string;
    provider: string;
    embeddingMs: number;
    supabaseMs: number;
    rerankingMs: number;
    contextMs: number;
    llmMs: number;
    totalMs: number;
    error?: string;
  }> = [];

  for (const query of TEST_QUERIES) {
    const totalStart = performance.now();

    try {
      // 1. Embedding, Supabase & Hybrid Reranking
      const { topChunks, metrics: retrievalMetrics } = await performHybridRetrieval(query, 30, 5);

      // 2. Context Assembly
      const context = assembleContext(topChunks);

      // 3. Grok API Answer Generation
      const generationResult = await generateGroundedAnswer(query, context);

      const totalEnd = performance.now();
      const totalDuration = Math.round((totalEnd - totalStart) * 100) / 100;

      const subTele = generationResult.metrics.subTelemetry || {};
      const provider = subTele.provider_used || generationResult.metrics.processState;

      results.push({
        query,
        answer: generationResult.answer,
        provider,
        embeddingMs: retrievalMetrics.embedding.durationMs,
        supabaseMs: retrievalMetrics.supabase.durationMs,
        rerankingMs: retrievalMetrics.reranking.durationMs,
        contextMs: context.metrics.durationMs,
        llmMs: generationResult.metrics.durationMs,
        totalMs: totalDuration,
      });
    } catch (err: any) {
      results.push({
        query,
        answer: `Error: ${err.message}`,
        provider: "error",
        embeddingMs: 0,
        supabaseMs: 0,
        rerankingMs: 0,
        contextMs: 0,
        llmMs: 0,
        totalMs: 0,
        error: err.message,
      });
    }
  }

  // Print results
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`[QUERY ${i + 1}]: "${r.query}"`);
    console.log(`CONFIRMED MODEL / PROVIDER: ${r.provider}`);
    console.log(`--------------------------------------------------`);
    console.log(`ANSWER:\n${r.answer}\n`);
    console.log(`TIMING BREAKDOWN:`);
    console.log(`  - BGE-M3 Query Embedding : ${r.embeddingMs} ms`);
    console.log(`  - Supabase Vector Search : ${r.supabaseMs} ms`);
    console.log(`  - Hybrid Reranking       : ${r.rerankingMs} ms`);
    console.log(`  - Context Assembly       : ${r.contextMs} ms`);
    console.log(`  - Grok API Generation    : ${r.llmMs} ms`);
    console.log(`  - TOTAL END-TO-END       : ${r.totalMs} ms`);
    console.log(`--------------------------------------------------\n`);
  }

  const validResults = results.filter((r) => !r.error);
  if (validResults.length > 0) {
    const avgEmbedding = Math.round((validResults.reduce((a, b) => a + b.embeddingMs, 0) / validResults.length) * 100) / 100;
    const avgSupabase = Math.round((validResults.reduce((a, b) => a + b.supabaseMs, 0) / validResults.length) * 100) / 100;
    const avgRerank = Math.round((validResults.reduce((a, b) => a + b.rerankingMs, 0) / validResults.length) * 100) / 100;
    const avgContext = Math.round((validResults.reduce((a, b) => a + b.contextMs, 0) / validResults.length) * 100) / 100;
    const avgLLM = Math.round((validResults.reduce((a, b) => a + b.llmMs, 0) / validResults.length) * 100) / 100;
    const avgTotal = Math.round((validResults.reduce((a, b) => a + b.totalMs, 0) / validResults.length) * 100) / 100;

    console.log("=======================================================================");
    console.log("                GROK RAG AVERAGE LATENCY SUMMARY");
    console.log("=======================================================================");
    console.log(`  Average BGE-M3 Query Embedding : ${avgEmbedding} ms`);
    console.log(`  Average Supabase Search        : ${avgSupabase} ms`);
    console.log(`  Average Hybrid Reranking       : ${avgRerank} ms`);
    console.log(`  Average Context Assembly       : ${avgContext} ms`);
    console.log(`  Average Grok API Generation    : ${avgLLM} ms`);
    console.log(`  Average TOTAL End-to-End       : ${avgTotal} ms`);
    console.log("=======================================================================\n");
  }
}

runGrokBenchmark().catch(console.error);
