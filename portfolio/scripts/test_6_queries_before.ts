import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";
import { generateGroundedAnswer } from "../src/lib/rag/generator";

const testQueries = [
  "Tell me about Sujan",
  "How many projects has Sujan built?",
  "What projects has Sujan built?",
  "Where did Sujan complete his internships?",
  "What did Sujan do during his internships?",
  "What are Sujan's technical skills?"
];

async function runBeforeTests() {
  for (let i = 0; i < testQueries.length; i++) {
    const q = testQueries[i];
    console.log(`\n=======================================================================`);
    console.log(`QUERY ${i + 1}: "${q}"`);
    console.log(`=======================================================================`);

    const { topChunks } = await performHybridRetrieval(q, 30, 5);
    const assembledContext = assembleContext(topChunks);
    const genResult = await generateGroundedAnswer(q, assembledContext);

    console.log(`\n--- RETRIEVED CHUNKS (${topChunks.length}) ---`);
    topChunks.forEach((chunk, idx) => {
      console.log(`[Chunk ${idx + 1}] Source: ${chunk.source || chunk.metadata?.source} | Section: ${chunk.section || chunk.metadata?.section}`);
      console.log(`           Vector Sim: ${chunk.similarity?.toFixed(4)} | Entity Boost: ${chunk.entityBoost?.toFixed(2)} | Specificity Boost: ${chunk.specificityBoost?.toFixed(2)} | Final Score: ${chunk.finalScore?.toFixed(4)}`);
    });

    console.log(`\n--- FINAL CONTEXT SENT TO GROK (${assembledContext.formattedContext.length} chars) ---`);
    console.log(assembledContext.formattedContext);

    console.log(`\n--- GROK ANSWER ---`);
    console.log(genResult.answer);
  }
}

runBeforeTests().catch(console.error);
