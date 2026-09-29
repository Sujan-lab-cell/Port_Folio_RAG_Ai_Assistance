import { resolveFallbackQuery } from '../src/lib/assistant/fallback/resolver';
import { extractNavigationMetadata } from '../src/lib/navigation/navigationTarget';

const testCases = [
  { name: "1. Tell me about Sujan's projects", query: "Tell me about Sujan's projects", lang: "en" },
  { name: "2. how my projects did sujan do", query: "how my projects did sujan do", lang: "en" },
  { name: "3. Tell me about GeoSentinel", query: "Tell me about GeoSentinel", lang: "en" },
  { name: "4. What technologies were used in GeoSentinel?", query: "What technologies were used in GeoSentinel?", lang: "en" },
  { name: "5. Tell me about SmartQ Generator", query: "Tell me about SmartQ Generator", lang: "en" },
  { name: "6. Tell me about the invoice parser", query: "Tell me about the invoice parser", lang: "en" },
  { name: "7. Tell me about Sujan's internships", query: "Tell me about Sujan's internships", lang: "en" },
  { name: "8. Tell me about FlyRank", query: "Tell me about FlyRank", lang: "en" },
  { name: "9. What are Sujan's skills?", query: "What are Sujan's skills?", lang: "en" },
  { name: "10. What is his CGPA?", query: "What is his CGPA?", lang: "en" },
  { name: "11. What are his achievements?", query: "What are his achievements?", lang: "en" },
  { name: "12. What is his GitHub?", query: "What is his GitHub?", lang: "en" },
  { name: "13. Japanese project question", query: "スジャンのプロジェクトについて教えて", lang: "ja" },
  { name: "14. Japanese GeoSentinel question", query: "GeoSentinelについて教えて", lang: "ja" },
  { name: "15. Japanese skills question", query: "スキルについて教えて", lang: "ja" },
];

console.log("==========================================");
console.log("RUNNING TIER 3 KNOWLEDGE FALLBACK AUDIT");
console.log("==========================================\n");

let passedCount = 0;

for (const tc of testCases) {
  const fallbackResult = resolveFallbackQuery(tc.query, tc.lang);
  const fallbackRoute = fallbackResult.type !== 'answer' ? fallbackResult.route : undefined;
  const nav = extractNavigationMetadata(tc.query, tc.lang, fallbackRoute);

  const isGenericError = fallbackResult.answer.includes("detailed RAG technical breakdowns");
  const isWeakError = fallbackResult.answer.includes("I don't have that specific information") && !tc.query.includes("unknown_random");

  console.log(`--- [TEST] ${tc.name} ---`);
  console.log(`Query: "${tc.query}"`);
  console.log(`Answer:\n${fallbackResult.answer}`);
  console.log(`Navigation:`, JSON.stringify(nav));

  if (!isGenericError && fallbackResult.answer.length > 30) {
    console.log(`STATUS: PASS ✅\n`);
    passedCount++;
  } else {
    console.log(`STATUS: FAIL ❌\n`);
  }
}

console.log("==========================================");
console.log(`RESULTS: ${passedCount} / ${testCases.length} PASSED`);
console.log("==========================================");

if (passedCount < testCases.length) {
  process.exit(1);
}
