import { resolveConversationalQuery } from "../src/lib/rag/conversationResolver";
import { detectNavigationIntent } from "../src/lib/navigationIntent";
import { resolveFallbackQuery } from "../src/lib/assistant/fallback/resolver";
import { ChatHistoryItem } from "../src/components/AI/types";

console.log("==========================================");
console.log("RUNNING CONVERSATIONAL RAG INTEGRATION TESTS");
console.log("==========================================\n");

// Helper simulating end-to-end pipeline decision in /api/chat
function simulateApiChatPipeline(
  query: string,
  history: ChatHistoryItem[] = [],
  mode: "rag" | "rule" = "rag"
) {
  if (mode === "rule") {
    const fallbackResult = resolveFallbackQuery(query);
    return {
      mode: "rule",
      originalQuery: query,
      retrievalQuery: null,
      wasResolved: false,
      confidence: "n/a",
      navigation: fallbackResult.type === "navigation",
      answer: fallbackResult.answer,
    };
  }

  // Check navigation intent first
  const { isPureNavigation, navAction } = detectNavigationIntent(query, "en");
  if (isPureNavigation && navAction) {
    return {
      mode: "rag",
      originalQuery: query,
      retrievalQuery: query,
      wasResolved: false,
      confidence: "high",
      navigation: true,
      navAction,
    };
  }

  // Conversation Resolution
  const resolution = resolveConversationalQuery(query, history);
  const retrievalQuery = resolution.wasResolved ? resolution.resolvedQuery : query;

  return {
    mode: "rag",
    originalQuery: query,
    resolvedQuery: resolution.resolvedQuery,
    wasResolved: resolution.wasResolved,
    confidence: resolution.confidence,
    retrievalQuery,
    detectedEntity: resolution.entity ? `${resolution.entity.name} (${resolution.entity.type})` : undefined,
    navigation: false,
  };
}

const tests = [
  {
    name: "TEST 1: GeoSentinel follow-up 'What technologies did it use?'",
    history: [
      { role: "user" as const, content: "Tell me about GeoSentinel." },
      { role: "assistant" as const, content: "GeoSentinel is an AI-powered landslide detection system." },
    ],
    query: "What technologies did it use?",
    mode: "rag" as const,
  },
  {
    name: "TEST 2: GeoSentinel follow-up 'Is it a good project?'",
    history: [
      { role: "user" as const, content: "Tell me about GeoSentinel." },
      { role: "assistant" as const, content: "GeoSentinel is an AI-powered landslide detection system." },
    ],
    query: "Is it a good project?",
    mode: "rag" as const,
  },
  {
    name: "TEST 3: Multiple entities context (GeoSentinel + SmartQ) -> Resolves via Recency",
    history: [
      { role: "user" as const, content: "Tell me about GeoSentinel." },
      { role: "assistant" as const, content: "Landslide detection." },
      { role: "user" as const, content: "Tell me about SmartQ Generator." },
      { role: "assistant" as const, content: "Question paper generator." },
    ],
    query: "What technologies did it use?",
    mode: "rag" as const,
  },
  {
    name: "TEST 4: Direct query without history 'What is Sujan's CGPA?'",
    history: [],
    query: "What is Sujan's CGPA?",
    mode: "rag" as const,
  },
  {
    name: "TEST 5: Pure navigation intent 'Show me the projects page.'",
    history: [],
    query: "Show me the projects page.",
    mode: "rag" as const,
  },
  {
    name: "TEST 6: Rule Mode fallback execution",
    history: [],
    query: "What is Sujan's CGPA?",
    mode: "rule" as const,
  },
];

tests.forEach((t, i) => {
  console.log(`--- [TEST ${i + 1}] ${t.name} ---`);
  console.log(`Assistant Mode: ${t.mode}`);
  console.log(`Original Query: "${t.query}"`);
  
  const result = simulateApiChatPipeline(t.query, t.history, t.mode);

  console.log(`Was Resolved  : ${result.wasResolved}`);
  console.log(`Confidence    : ${result.confidence}`);
  console.log(`Retrieval Query: "${result.retrievalQuery}"`);
  if (result.detectedEntity) {
    console.log(`Detected Entity: ${result.detectedEntity}`);
  }
  if (result.navigation) {
    console.log(`Navigation Triggered: YES (${result.navAction?.route || "Fallback Route"})`);
  }
  console.log("\n");
});

console.log("==========================================");
console.log("CONVERSATIONAL RAG INTEGRATION TESTS COMPLETE");
console.log("==========================================");
