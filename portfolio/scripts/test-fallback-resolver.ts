import { resolveFallbackQuery } from "../src/lib/assistant/fallback/resolver";

const testQueries = [
  "What is Sujan's CGPA?",
  "Where does Sujan study?",
  "How many projects has Sujan built?",
  "Show me his projects",
  "Tell me about GeoSentinel",
  "Open the experience page",
  "Explain the BGE-M3 hybrid reranking implementation",
];

console.log("=======================================================================");
console.log("[FALLBACK RESOLVER TEST] Testing Fallback Resolver Queries");
console.log("=======================================================================\n");

testQueries.forEach((query, index) => {
  console.log(`Query ${index + 1}: "${query}"`);
  const result = resolveFallbackQuery(query);
  console.log("Result:", JSON.stringify(result, null, 2));
  console.log("-----------------------------------------------------------------------\n");
});
