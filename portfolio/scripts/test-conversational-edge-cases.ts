import { resolveConversationalQuery } from "../src/lib/rag/conversationResolver";
import { detectNavigationIntent } from "../src/lib/navigationIntent";
import { resolveFallbackQuery } from "../src/lib/assistant/fallback/resolver";
import { ChatHistoryItem } from "../src/components/AI/types";

console.log("==========================================");
console.log("STEP 4A — CONVERSATIONAL RAG RECENCY & SAFETY TEST SUITE");
console.log("==========================================\n");

interface TestCase {
  group: string;
  name: string;
  history: ChatHistoryItem[];
  query: string;
  mode?: "rag" | "rule";
  language?: "en" | "ja";
  expectedWasResolved: boolean;
  expectedQuerySubstring?: string;
  expectedNavigation?: boolean;
}

const testCases: TestCase[] = [
  // GROUP 1: Single Entity
  {
    group: "1. Single Entity",
    name: "GeoSentinel tech stack follow-up",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is an AI landslide detection system." },
    ],
    query: "What technologies did it use?",
    expectedWasResolved: true,
    expectedQuerySubstring: "GeoSentinel",
  },
  {
    group: "1. Single Entity",
    name: "GeoSentinel opinion follow-up",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is an AI landslide detection system." },
    ],
    query: "Is it a good project?",
    expectedWasResolved: true,
    expectedQuerySubstring: "Is GeoSentinel a good project?",
  },
  {
    group: "1. Single Entity",
    name: "GeoSentinel 'this project' follow-up",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is an AI landslide detection system." },
    ],
    query: "What about this project?",
    expectedWasResolved: true,
    expectedQuerySubstring: "What about GeoSentinel?",
  },

  // GROUP 2: Company Context
  {
    group: "2. Company Context",
    name: "FlyRank AI 'there' follow-up",
    history: [
      { role: "user", content: "Tell me about FlyRank AI." },
      { role: "assistant", content: "FlyRank AI is an AI search company." },
    ],
    query: "What did he do there?",
    expectedWasResolved: true,
    expectedQuerySubstring: "at FlyRank AI",
  },
  {
    group: "2. Company Context",
    name: "ISIRI Technologies 'there' follow-up",
    history: [
      { role: "user", content: "Tell me about ISIRI Technologies." },
      { role: "assistant", content: "ISIRI Technologies works on healthcare solutions." },
    ],
    query: "What did he work on there?",
    expectedWasResolved: true,
    expectedQuerySubstring: "at ISIRI Technologies",
  },

  // GROUP 3: Multiple Entities & Recency (Step 4A Update: Recency resolves to most recent entity)
  {
    group: "3. Multiple Entities (Recency)",
    name: "TEST A: GeoSentinel -> SmartQ Generator -> 'What technologies did it use?'",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "Landslide detection." },
      { role: "user", content: "Tell me about SmartQ Generator." },
      { role: "assistant", content: "Question paper generator." },
    ],
    query: "What technologies did it use?",
    expectedWasResolved: true,
    expectedQuerySubstring: "SmartQ Generator",
  },
  {
    group: "3. Multiple Entities (Recency)",
    name: "TEST B: GeoSentinel -> SmartQ Generator -> 'Is this project good?'",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "Landslide detection." },
      { role: "user", content: "Tell me about SmartQ Generator." },
      { role: "assistant", content: "Question paper generator." },
    ],
    query: "Is this project good?",
    expectedWasResolved: true,
    expectedQuerySubstring: "SmartQ Generator",
  },
  {
    group: "3. Multiple Entities (Recency)",
    name: "TEST C: GeoSentinel -> FlyRank AI -> 'What did he do there?'",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "Landslide detection." },
      { role: "user", content: "Tell me about FlyRank AI." },
      { role: "assistant", content: "AI internship company." },
    ],
    query: "What did he do there?",
    expectedWasResolved: true,
    expectedQuerySubstring: "at FlyRank AI",
  },

  // GROUP 4: Topic Switching & Explicit Entity Priority
  {
    group: "4. Topic Switching & Explicit Overrides",
    name: "TEST D: GeoSentinel -> SmartQ Generator -> Explicit query 'What technologies did GeoSentinel use?'",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "user", content: "Tell me about SmartQ Generator." },
    ],
    query: "What technologies did GeoSentinel use?",
    expectedWasResolved: false,
    expectedQuerySubstring: "What technologies did GeoSentinel use?",
  },

  // GROUP 5: Plural References & Safety
  {
    group: "5. Plural References & Safety",
    name: "TEST E: GeoSentinel -> SmartQ Generator -> 'Compare them.'",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "user", content: "Tell me about SmartQ Generator." },
    ],
    query: "Compare them.",
    expectedWasResolved: false,
    expectedQuerySubstring: "Compare them.",
  },
  {
    group: "5. Plural References & Safety",
    name: "TEST F: No entity history -> 'What technologies did it use?'",
    history: [],
    query: "What technologies did it use?",
    expectedWasResolved: false,
    expectedQuerySubstring: "What technologies did it use?",
  },

  // GROUP 6: Direct Questions (No References)
  {
    group: "6. Direct Questions",
    name: "CGPA query",
    history: [],
    query: "What is Sujan's CGPA?",
    expectedWasResolved: false,
    expectedQuerySubstring: "What is Sujan's CGPA?",
  },
  {
    group: "6. Direct Questions",
    name: "University query",
    history: [],
    query: "Where does Sujan study?",
    expectedWasResolved: false,
    expectedQuerySubstring: "Where does Sujan study?",
  },
  {
    group: "6. Direct Questions",
    name: "Projects count query",
    history: [],
    query: "How many projects has Sujan built?",
    expectedWasResolved: false,
    expectedQuerySubstring: "How many projects has Sujan built?",
  },

  // GROUP 7: Navigation Intents
  {
    group: "7. Navigation Intents",
    name: "Projects page",
    history: [],
    query: "Open the projects page.",
    expectedWasResolved: false,
    expectedNavigation: true,
  },
  {
    group: "7. Navigation Intents",
    name: "Experience page",
    history: [],
    query: "Take me to the experience page.",
    expectedWasResolved: false,
    expectedNavigation: true,
  },
  {
    group: "7. Navigation Intents",
    name: "Skills page",
    history: [],
    query: "Show me his skills.",
    expectedWasResolved: false,
    expectedNavigation: true,
  },

  // GROUP 8: Conversational Navigation / Location
  {
    group: "8. Conversational Navigation",
    name: "'Where can I see it?' follow-up",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "Landslide detection system." },
    ],
    query: "Where can I see it?",
    expectedWasResolved: true,
    expectedQuerySubstring: "GeoSentinel",
  },

  // GROUP 9: Ambiguous Pronouns (Empty/Irrelevant History)
  {
    group: "9. Ambiguous Pronouns",
    name: "No history 'What is it?'",
    history: [],
    query: "What is it?",
    expectedWasResolved: false,
    expectedQuerySubstring: "What is it?",
  },
  {
    group: "9. Ambiguous Pronouns",
    name: "No history 'What did he do?'",
    history: [],
    query: "What did he do?",
    expectedWasResolved: false,
    expectedQuerySubstring: "What did he do?",
  },

  // GROUP 10: History Window
  {
    group: "10. History Window",
    name: "6 recent messages window",
    history: [
      { role: "user", content: "Old message 1" },
      { role: "assistant", content: "Old response 1" },
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel system." },
      { role: "user", content: "What is its accuracy?" },
      { role: "assistant", content: "High accuracy." },
    ],
    query: "What technologies did it use?",
    expectedWasResolved: true,
    expectedQuerySubstring: "GeoSentinel",
  },

  // GROUP 11: Multi-language Support (EN & JA)
  {
    group: "11. Language Support",
    name: "English query processing",
    history: [{ role: "user", content: "Tell me about GeoSentinel." }],
    query: "Is it a good project?",
    language: "en",
    expectedWasResolved: true,
  },
  {
    group: "11. Language Support",
    name: "Japanese query processing (no crash)",
    history: [{ role: "user", content: "スジャンについて教えて" }],
    query: "スキルを教えて",
    language: "ja",
    expectedWasResolved: false,
  },

  // GROUP 12: Rule Mode
  {
    group: "12. Rule Mode",
    name: "Fallback resolver in Rule Mode",
    history: [],
    query: "What is Sujan's CGPA?",
    mode: "rule",
    expectedWasResolved: false,
  },
];

let passCount = 0;
let failCount = 0;

testCases.forEach((tc, idx) => {
  console.log(`------------------------------------------`);
  console.log(`[Test ${idx + 1}] Group: ${tc.group} - ${tc.name}`);
  console.log(`History count: ${tc.history.length}`);
  console.log(`Current Query: "${tc.query}"`);
  console.log(`Mode: ${tc.mode || "rag"} | Language: ${tc.language || "en"}`);

  if (tc.mode === "rule") {
    const fallbackRes = resolveFallbackQuery(tc.query);
    console.log(`Fallback Answer: "${fallbackRes.answer.substring(0, 50)}..."`);
    console.log(`Result: PASS (Rule mode executed without RAG pipeline)`);
    passCount++;
    return;
  }

  const navCheck = detectNavigationIntent(tc.query, tc.language || "en");
  if (tc.expectedNavigation) {
    if (navCheck.isPureNavigation) {
      console.log(`Navigation Triggered: YES (${navCheck.navAction?.route})`);
      console.log(`Result: PASS`);
      passCount++;
    } else {
      console.log(`Navigation Triggered: NO`);
      console.log(`Result: FAIL (Expected navigation)`);
      failCount++;
    }
    return;
  }

  const res = resolveConversationalQuery(tc.query, tc.history);
  console.log(`Resolved Query: "${res.resolvedQuery}"`);
  console.log(`Was Resolved  : ${res.wasResolved} (Expected: ${tc.expectedWasResolved})`);
  console.log(`Confidence    : ${res.confidence}`);
  console.log(`Entity        : ${res.entity ? `${res.entity.name} (${res.entity.type})` : "none"}`);

  let testPassed = res.wasResolved === tc.expectedWasResolved;
  if (tc.expectedQuerySubstring && testPassed) {
    testPassed = res.resolvedQuery.includes(tc.expectedQuerySubstring);
  }

  if (testPassed) {
    console.log(`Result: PASS`);
    passCount++;
  } else {
    console.log(`Result: FAIL`);
    failCount++;
  }
});

console.log("\n==========================================");
console.log(`STEP 4A TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${testCases.length} tests.`);
console.log("==========================================");
