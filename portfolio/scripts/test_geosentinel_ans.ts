import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";
import { generateGroundedAnswer } from "../src/lib/rag/generator";

async function testGeoSentinelAnswer() {
  const { topChunks } = await performHybridRetrieval("Tell me about GeoSentinel", 30, 5);
  const context = assembleContext(topChunks);
  const answer = await generateGroundedAnswer("Tell me about GeoSentinel", context);
  console.log("=== ANS ===");
  console.log(JSON.stringify(answer, null, 2));
}

testGeoSentinelAnswer().catch(console.error);
