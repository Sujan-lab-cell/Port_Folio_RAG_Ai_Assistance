import { resolveConversationalQuery } from "../src/lib/rag/conversationResolver";
import { ChatHistoryItem } from "../src/components/AI/types";

console.log("==========================================");
console.log("RUNNING CONVERSATION RESOLVER TESTS");
console.log("==========================================\n");

const tests: Array<{
  name: string;
  history: ChatHistoryItem[];
  query: string;
}> = [
  {
    name: "TEST 1: Single project entity with 'it' reference",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is an AI-powered landslide detection system." },
    ],
    query: "Is it a good project?",
  },
  {
    name: "TEST 2: Single project entity with 'it' in tech stack question",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is an AI-powered landslide detection system." },
    ],
    query: "What technologies did it use?",
  },
  {
    name: "TEST 3: Company entity with 'there' reference",
    history: [
      { role: "user", content: "Tell me about FlyRank AI." },
      { role: "assistant", content: "FlyRank AI is a company where Sujan interned as an AI engineer." },
    ],
    query: "What did he do there?",
  },
  {
    name: "TEST 4: Multiple project entities (Recency resolves to most recent entity SmartQ Generator)",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is a landslide detection project." },
      { role: "user", content: "Tell me about SmartQ Generator." },
      { role: "assistant", content: "SmartQ Generator generates question papers." },
    ],
    query: "What technologies did it use?",
  },
  {
    name: "TEST 5: Direct question without references (CGPA)",
    history: [],
    query: "What is Sujan's CGPA?",
  },
  {
    name: "TEST 6: Direct question without references (Projects count)",
    history: [],
    query: "What projects has Sujan built?",
  },
  {
    name: "TEST 7: Single project entity with 'this project' reference",
    history: [
      { role: "user", content: "Tell me about GeoSentinel." },
      { role: "assistant", content: "GeoSentinel is an AI-powered landslide detection system." },
    ],
    query: "What about this project?",
  },
];

let passed = 0;

tests.forEach((t, index) => {
  console.log(`--- [TEST ${index + 1}] ${t.name} ---`);
  console.log(`Original Query: "${t.query}"`);
  if (t.history.length > 0) {
    console.log(`History (${t.history.length} items):`);
    t.history.forEach((h) => console.log(`  - [${h.role}]: "${h.content}"`));
  } else {
    console.log(`History: (empty)`);
  }

  const result = resolveConversationalQuery(t.query, t.history);

  console.log(`Resolved Query: "${result.resolvedQuery}"`);
  console.log(`wasResolved   : ${result.wasResolved}`);
  console.log(`confidence    : ${result.confidence}`);
  console.log(`detected entity: ${result.entity ? `${result.entity.name} (${result.entity.type})` : "none"}`);
  console.log("\n");

  passed++;
});

console.log(`==========================================`);
console.log(`TEST SUITE COMPLETED: ${passed}/${tests.length} tests executed.`);
console.log(`==========================================`);
