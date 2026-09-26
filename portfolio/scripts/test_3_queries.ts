import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";
import { generateGroundedAnswer } from "../src/lib/rag/generator";

const queries = [
  "Tell me about Sujan",
  "Where did Sujan complete his internship?",
  "What projects has Sujan built?"
];

async function runTests() {
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`\n=======================================================================`);
    console.log(`TEST QUERY ${i + 1}: "${q}"`);
    console.log(`=======================================================================`);

    const { topChunks } = await performHybridRetrieval(q, 30, 5);
    const assembledContext = assembleContext(topChunks);
    const genResult = await generateGroundedAnswer(q, assembledContext);

    console.log(`1. Retrieved Chunk Count: ${topChunks.length}`);
    console.log(`2. Final Assembled Context Length: ${assembledContext.formattedContext.length} characters`);
    console.log(`3. Provider / Model: ${genResult.metrics.subTelemetry?.provider_used || genResult.metrics.processState}`);
    console.log(`4. Duration: ${genResult.metrics.durationMs} ms`);
    console.log(`5. Response Content:\n${genResult.answer}`);
  }
}

runTests().catch(console.error);
