import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";
import { generateGroundedAnswer } from "../src/lib/rag/generator";

async function runDiagnosis() {
  const query = "Tell me about Sujan";
  console.log("=======================================================================");
  console.log(`DIAGNOSING PIPELINE FOR QUERY: "${query}"`);
  console.log("=======================================================================\n");

  // Step 1 & 2: Embedding, Supabase Retrieval & Reranking
  const { topChunks, metrics } = await performHybridRetrieval(query, 30, 5);

  console.log(`1. Retrieved chunk count: ${topChunks.length}`);
  console.log(`2. Retrieved chunk contents / previews:`);
  topChunks.forEach((chunk, i) => {
    console.log(`   Chunk ${i + 1} [Source: ${chunk.source || chunk.metadata?.source}, Section: ${chunk.section || chunk.metadata?.section}]:`);
    console.log(`   "${chunk.content.substring(0, 150).replace(/\n/g, ' ')}..."\n`);
  });

  // Step 3: Context Assembly
  const assembledContext = assembleContext(topChunks);
  console.log(`3. Final assembled context length: ${assembledContext.formattedContext.length} characters`);
  console.log(`   Chunk count used in context: ${assembledContext.chunkCount}`);

  // Step 4: Pass to Generator
  console.log(`\n4. Assembled Context Preview passed into Generator/Grok:\n---`);
  console.log(assembledContext.formattedContext.substring(0, 500));
  console.log(`...\n---`);

  // Step 5, 6, 7: Call Generator (Grok API)
  const genResult = await generateGroundedAnswer(query, assembledContext);

  console.log(`5. Grok Model / Provider: ${genResult.metrics.subTelemetry?.provider_used || genResult.metrics.processState}`);
  console.log(`6. Generation Response Status: ${genResult.answer ? "SUCCESS" : "EMPTY/ERROR"}`);
  console.log(`7. Grok Response Content:\n"${genResult.answer}"\n`);
}

runDiagnosis().catch(console.error);
