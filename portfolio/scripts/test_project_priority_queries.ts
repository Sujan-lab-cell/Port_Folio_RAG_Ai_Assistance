import { performHybridRetrieval } from '../src/lib/rag/retrieval';
import { assembleContext } from '../src/lib/rag/context';
import { generateGroundedAnswer } from '../src/lib/rag/generator';

const TEST_QUERIES = [
  { id: 1, query: "List Sujan's major projects", expectMajor: true, expectPowerBiMajor: false },
  { id: 2, query: "What are Sujan's main projects?", expectMajor: true, expectPowerBiMajor: false },
  { id: 3, query: "What is his most valuable project?", expectMajor: true, expectPowerBiMajor: false },
  { id: 4, query: "Tell me about his important projects", expectMajor: true, expectPowerBiMajor: false },
  { id: 5, query: "What is Sujan's Power BI project?", expectPowerBiDetail: true },
  { id: 6, query: "Does Sujan have a Power BI project?", expectPowerBiDetail: true },
  { id: 7, query: "List all of Sujan's projects", expectAll: true },
  { id: 8, query: "Tell me about his GeoSentinel project", expectGeoSentinel: true },
  { id: 9, query: "Tell me about his RAG project", expectRag: true },
  { id: 10, query: "What project did he build during his AyusLab internship?", expectAyusLab: true },
];

async function runTests() {
  console.log(`======================================================================`);
  console.log(`TESTING PROJECT PRIORITIZATION & RETRIEVAL (10 MANDATORY QUERIES)`);
  console.log(`======================================================================\n`);

  let passedCount = 0;

  for (const item of TEST_QUERIES) {
    console.log(`----------------------------------------------------------------------`);
    console.log(`Query ${item.id}: "${item.query}"`);
    console.log(`----------------------------------------------------------------------`);

    const { topChunks } = await performHybridRetrieval(item.query, 30, 5);
    const assembled = assembleContext(topChunks);
    const result = await generateGroundedAnswer(item.query, assembled);

    console.log(`Answer:\n${result.answer}\n`);

    let passed = true;

    if (item.expectMajor) {
      const lower = result.answer.toLowerCase();
      // Must mention GeoSentinel or RAG or Primary projects
      if (!lower.includes("geosentinel") && !lower.includes("rag")) {
        console.error(`❌ FAILED: Query ${item.id} did not prioritize major projects.`);
        passed = false;
      }
      // Must NOT frame Power BI as a major/flagship project
      if (lower.includes("power bi is sujan's major") || lower.includes("power bi is his major") || lower.includes("major projects:") && lower.includes("power bi") && !lower.includes("secondary")) {
        console.error(`❌ FAILED: Query ${item.id} incorrectly framed Power BI as a major project.`);
        passed = false;
      }
    }

    if (item.expectPowerBiDetail) {
      const lower = result.answer.toLowerCase();
      if (!lower.includes("power bi") && !lower.includes("e-commerce")) {
        console.error(`❌ FAILED: Query ${item.id} failed to retrieve/explain Power BI project.`);
        passed = false;
      }
    }

    if (item.expectGeoSentinel) {
      const lower = result.answer.toLowerCase();
      if (!lower.includes("geosentinel") && !lower.includes("landslide")) {
        console.error(`❌ FAILED: Query ${item.id} failed to answer GeoSentinel details.`);
        passed = false;
      }
    }

    if (item.expectRag) {
      const lower = result.answer.toLowerCase();
      if (!lower.includes("rag") && !lower.includes("assistant")) {
        console.error(`❌ FAILED: Query ${item.id} failed to answer RAG assistant details.`);
        passed = false;
      }
    }

    if (item.expectAyusLab) {
      const lower = result.answer.toLowerCase();
      if (!lower.includes("ayuslab") && !lower.includes("invoice") && !lower.includes("parser")) {
        console.error(`❌ FAILED: Query ${item.id} failed to answer AyusLab project details.`);
        passed = false;
      }
    }

    if (passed) {
      console.log(`✅ Query ${item.id} PASSED`);
      passedCount++;
    }
  }

  console.log(`\n======================================================================`);
  console.log(`SUMMARY: ${passedCount}/${TEST_QUERIES.length} QUERIES PASSED`);
  console.log(`======================================================================\n`);
}

runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
