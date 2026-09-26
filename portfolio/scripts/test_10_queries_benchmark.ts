import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";
import { generateGroundedAnswer } from "../src/lib/rag/generator";

const benchmarkQueries = [
  "Tell me about Sujan",
  "How many projects has Sujan built?",
  "What projects has Sujan built?",
  "What has Sujan created?",
  "Where did Sujan complete his internships?",
  "What did Sujan do during his internships?",
  "What did Sujan do at FlyRank?",
  "What are Sujan's technical skills?",
  "Tell me about GeoSentinel",
  "Tell me about SmartQ Generator"
];

async function runBenchmark() {
  console.log("=======================================================================");
  console.log("RUNNING 10-QUERY HYBRID QUERY-INTENT / DOMAIN ROUTING BENCHMARK");
  console.log("=======================================================================\n");

  for (let i = 0; i < benchmarkQueries.length; i++) {
    const q = benchmarkQueries[i];
    console.log(`\n-----------------------------------------------------------------------`);
    console.log(`BENCHMARK QUERY ${i + 1}: "${q}"`);
    console.log(`-----------------------------------------------------------------------`);

    const { topChunks, metrics } = await performHybridRetrieval(q, 30, 5);
    const assembledContext = assembleContext(topChunks);
    const genResult = await generateGroundedAnswer(q, assembledContext);

    console.log(`Detected Intent    : ${metrics.route.intent}`);
    console.log(`Confidence         : ${metrics.route.confidence}`);
    console.log(`Language           : ${metrics.route.language}`);
    console.log(`Detected Entity    : ${metrics.route.entity || 'None'}`);

    console.log(`\nTop Retrieved Source Files & Chunk Scores:`);
    topChunks.forEach((chunk, idx) => {
      const src = chunk.source || chunk.metadata?.source || 'unknown';
      const sec = chunk.section || chunk.metadata?.section || 'Overview';
      console.log(`  [Chunk ${idx + 1}] Source: ${src} | Section: ${sec}`);
      console.log(`             FinalScore: ${chunk.finalScore?.toFixed(4)} | VectorSim: ${chunk.similarity?.toFixed(4)} | IntentBoost: ${chunk.intentBoost?.toFixed(2)} | EntityBoost: ${chunk.entityBoost?.toFixed(2)}`);
    });

    console.log(`\nFinal Assembled Context Size: ${assembledContext.formattedContext.length} chars`);
    console.log(`\nFinal Grok Answer:\n${genResult.answer}\n`);

    // Short pause between queries to respect API rate limits
    await new Promise(r => setTimeout(r, 600));
  }
}

runBenchmark().catch(console.error);
