import { getAssistantMode } from "../src/lib/assistant/mode";
import { resolveFallbackQuery } from "../src/lib/assistant/fallback/resolver";

async function testModeIntegration() {
  console.log("=======================================================================");
  console.log("[CHAT MODE INTEGRATION TEST] Testing RAG & RULE Modes");
  console.log("=======================================================================\n");

  // TEST 1 — RAG MODE
  process.env.AI_ASSISTANT_MODE = "rag";
  console.log("TEST 1: RAG MODE");
  console.log(`Current Mode: "${getAssistantMode()}"`);
  console.log('Query: "What is Sujan\'s CGPA?"');
  console.log('Expected: Route will execute full RAG pipeline (BGE-M3 + Supabase + Grok)');
  console.log("-----------------------------------------------------------------------\n");

  // TEST 2-6 — RULE MODE
  process.env.AI_ASSISTANT_MODE = "rule";
  console.log("TESTS 2-6: RULE MODE (No BGE-M3, Supabase, or Grok calls)");
  console.log(`Current Mode: "${getAssistantMode()}"\n`);

  const ruleQueries = [
    { name: "TEST 2", query: "What is Sujan's CGPA?" },
    { name: "TEST 3", query: "Show me his projects" },
    { name: "TEST 4", query: "Tell me about GeoSentinel" },
    { name: "TEST 5", query: "Open the experience page" },
    { name: "TEST 6", query: "Explain the BGE-M3 hybrid reranking implementation" },
  ];

  ruleQueries.forEach(({ name, query }) => {
    console.log(`${name}: "${query}"`);
    const fallbackResult = resolveFallbackQuery(query);
    let navAction: { route: string; label: string } | undefined = undefined;

    if (fallbackResult.type === "navigation") {
      navAction = {
        route: fallbackResult.route,
        label: fallbackResult.label.includes("→") ? fallbackResult.label : `${fallbackResult.label} →`,
      };
    } else if (fallbackResult.type === "unsupported" && fallbackResult.route) {
      navAction = {
        route: fallbackResult.route,
        label: fallbackResult.label ? (fallbackResult.label.includes("→") ? fallbackResult.label : `${fallbackResult.label} →`) : "Explore Portfolio →",
      };
    }

    const response = {
      answer: fallbackResult.answer,
      navAction,
    };

    console.log("API Response Payload:", JSON.stringify(response, null, 2));
    console.log("-----------------------------------------------------------------------\n");
  });
}

testModeIntegration();
