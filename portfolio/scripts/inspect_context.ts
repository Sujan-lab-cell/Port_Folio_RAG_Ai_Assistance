import { performHybridRetrieval } from "../src/lib/rag/retrieval";
import { assembleContext } from "../src/lib/rag/context";

async function inspectGeoSentinelContext() {
  const { topChunks } = await performHybridRetrieval("Tell me about GeoSentinel", 30, 5);
  const context = assembleContext(topChunks);
  console.log("=== GEOSENTINEL ASSEMBLED CONTEXT ===");
  console.log(context.formattedContext);
}

inspectGeoSentinelContext();
