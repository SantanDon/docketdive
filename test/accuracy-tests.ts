/**
 * DocketDive Accuracy Testing Suite
 * 
 * Tests the retrieval pipeline for accuracy with various legal queries,
 * especially Latin legal terms that were previously causing issues.
 * 
 * Run: npx ts-node --esm test/accuracy-tests.ts
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { getEmbedding, MIN_SIMILARITY_THRESHOLD, TOP_K } from "../app/api/utils/rag";
import { 
  expandQuery, 
  identifyLegalEntities, 
  rankRelevance, 
  hasKeywordMatches,
  computeKeywordBoost 
} from "../app/api/utils/semantic-search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const COLLECTION_NAME = "docketdive";

// Test configuration
interface TestCase {
  query: string;
  expectedKeywords: string[];      // Keywords that SHOULD appear in results
  forbiddenKeywords: string[];     // Keywords that should NOT appear in top results
  expectedTopics: string[];        // Expected topic areas
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    query: "What is actio de pauperie in South Africa?",
    expectedKeywords: ["actio de pauperie", "animal", "owner", "strict liability", "damage"],
    forbiddenKeywords: ["children", "minor", "parent", "guardian", "custody"],
    expectedTopics: ["delict", "animals", "strict liability"],
    description: "Latin legal term - actio de pauperie (animal owner liability)"
  },
  {
    query: "Explain lex Aquilia in South African delict law",
    expectedKeywords: ["lex aquilia", "delict", "damage", "wrongful", "negligence"],
    forbiddenKeywords: ["contract", "breach of contract", "performance"],
    expectedTopics: ["delict", "damages", "wrongfulness"],
    description: "Latin legal term - lex Aquilia (Aquilian action)"
  },
  {
    query: "What are the elements of a valid contract?",
    expectedKeywords: ["contract", "offer", "acceptance", "consideration", "capacity", "consensus"],
    forbiddenKeywords: ["criminal", "crime", "sentence", "conviction"],
    expectedTopics: ["contract", "agreement", "obligations"],
    description: "General contract law query"
  },
  {
    query: "condictio indebiti South Africa",
    expectedKeywords: ["condictio", "enrichment", "unjustified", "undue", "payment"],
    forbiddenKeywords: ["criminal", "delict", "negligence"],
    expectedTopics: ["enrichment", "restitution"],
    description: "Latin legal term - condictio indebiti (undue payment)"
  },
  {
    query: "What is delictual liability in South African law?",
    expectedKeywords: ["delict", "liability", "wrongful", "damage", "negligence", "causation"],
    forbiddenKeywords: ["succession", "will", "estate", "inheritance"],
    expectedTopics: ["delict", "damages", "liability"],
    description: "Delictual liability query"
  }
];

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// ===== TEST 1: Query Expansion Preservation =====
async function testQueryExpansion(): Promise<boolean> {
  log("\n=== TEST 1: Query Expansion Preservation ===", colors.blue);
  let passed = true;

  for (const testCase of TEST_CASES) {
    log(`\nTesting: "${testCase.query}"`, colors.cyan);
    
    const expanded = await expandQuery(testCase.query);
    
    // Check that original query is preserved (or very similar first element)
    const originalPresent = expanded.some(q => 
      q.toLowerCase().includes(testCase.query.toLowerCase().split(" ").slice(0, 3).join(" "))
    );
    
    if (!originalPresent && expanded[0] !== testCase.query) {
      log(`  ❌ Original query not preserved in expansion: ${JSON.stringify(expanded)}`, colors.red);
      passed = false;
    } else {
      log(`  ✓ Expansion preserved original: ${JSON.stringify(expanded)}`, colors.green);
    }
    
    // For Latin terms, expansion should be minimal
    const hasLatinTerm = /actio|lex|condictio/i.test(testCase.query);
    if (hasLatinTerm && expanded.length > 1) {
      log(`  ⚠️ Warning: Latin term query expanded (should remain unchanged)`, colors.yellow);
    }
  }

  return passed;
}

// ===== TEST 2: Entity Identification =====
function testEntityIdentification(): boolean {
  log("\n=== TEST 2: Entity Identification ===", colors.blue);
  let passed = true;

  for (const testCase of TEST_CASES) {
    log(`\nTesting: "${testCase.query}"`, colors.cyan);
    
    const entities = identifyLegalEntities(testCase.query);
    
    // Check Latin terms are identified
    const hasLatinTerm = /actio|lex|condictio/i.test(testCase.query);
    if (hasLatinTerm && entities.latin_terms.length === 0) {
      log(`  ❌ Failed to identify Latin term in query`, colors.red);
      passed = false;
    } else if (hasLatinTerm) {
      log(`  ✓ Latin terms identified: ${JSON.stringify(entities.latin_terms)}`, colors.green);
    }
    
    // Check legal terms are identified
    if (entities.legal_terms.length === 0 && entities.latin_terms.length === 0) {
      log(`  ⚠️ No legal terms identified`, colors.yellow);
    } else {
      log(`  ✓ Legal terms: ${JSON.stringify(entities.legal_terms.slice(0, 5))}`, colors.green);
    }
  }

  return passed;
}

// ===== TEST 3: Keyword Boost Calculation =====
function testKeywordBoost(): boolean {
  log("\n=== TEST 3: Keyword Boost Calculation ===", colors.blue);
  let passed = true;

  // Synthetic test: correct doc vs wrong doc
  const correctDoc = {
    content: "The actio de pauperie is a strict liability action in South African law that holds the owner of a domestic animal liable for damage caused by the animal. This action derives from Roman law and applies when an animal acts contra naturam (against its nature).",
    metadata: { title: "Law of Damages - Animal Liability" }
  };

  const wrongDoc = {
    content: "Children's rights are protected under the Constitution of South Africa. The Bill of Rights ensures that every child has the right to basic education, healthcare, and protection from abuse. Parents and guardians have corresponding duties.",
    metadata: { title: "Constitutional Rights of Children" }
  };

  const query = "What is actio de pauperie in South Africa?";

  const correctBoost = computeKeywordBoost(correctDoc, query);
  const wrongBoost = computeKeywordBoost(wrongDoc, query);

  log(`\nQuery: "${query}"`, colors.cyan);
  log(`  Correct doc boost: ${correctBoost.toFixed(3)} (${correctDoc.metadata.title})`, colors.green);
  log(`  Wrong doc boost: ${wrongBoost.toFixed(3)} (${wrongDoc.metadata.title})`, colors.yellow);

  if (correctBoost <= wrongBoost) {
    log(`  ❌ FAIL: Correct document should have higher boost`, colors.red);
    passed = false;
  } else {
    log(`  ✓ PASS: Correct document has higher keyword boost`, colors.green);
  }

  // Test Latin phrase boost specifically
  if (correctBoost < 0.4) {
    log(`  ⚠️ Warning: Latin phrase boost seems low (expected >= 0.4)`, colors.yellow);
  }

  return passed;
}

// ===== TEST 4: Full Retrieval Pipeline =====
async function testRetrievalPipeline(): Promise<boolean> {
  log("\n=== TEST 4: Full Retrieval Pipeline ===", colors.blue);
  let passed = true;

  if (!process.env.ASTRA_DB_APPLICATION_TOKEN || !process.env.ASTRA_DB_API_ENDPOINT) {
    log("  ⚠️ Astra DB credentials not set, skipping retrieval test", colors.yellow);
    return true;
  }

  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT);
  const collection = db.collection(COLLECTION_NAME);

  for (const testCase of TEST_CASES) {
    log(`\n📖 Testing: ${testCase.description}`, colors.cyan);
    log(`   Query: "${testCase.query}"`, colors.reset);

    try {
      // Get expanded queries
      const expandedQueries = await expandQuery(testCase.query);
      const entities = identifyLegalEntities(testCase.query);

      // Retrieve documents
      const allResults: any[] = [];
      
      for (const q of expandedQueries) {
        const vector = await getEmbedding(q);
        const results = await collection
          .find({}, {
            sort: { $vector: vector },
            limit: TOP_K,
            includeSimilarity: true,
            projection: { content: 1, metadata: 1 },
          })
          .toArray();
        allResults.push(...results);
      }

      // Deduplicate
      const uniqueMap = new Map();
      for (const r of allResults) {
        const id = String(r._id);
        if (!uniqueMap.has(id) || uniqueMap.get(id).$similarity < r.$similarity) {
          uniqueMap.set(id, r);
        }
      }

      const uniqueResults = Array.from(uniqueMap.values())
        .sort((a, b) => (b.$similarity || 0) - (a.$similarity || 0))
        .slice(0, TOP_K);

      // Apply ranking
      const ranked = rankRelevance(uniqueResults, testCase.query, entities);

      // Check top 3 results
      const top3 = ranked.slice(0, 3);
      
      log(`   Top 3 results:`, colors.reset);
      for (let i = 0; i < top3.length; i++) {
        const doc = top3[i];
        const title = doc.metadata?.title || doc.metadata?.source || "Unknown";
        const score = (doc.relevanceScore || doc.$similarity || 0).toFixed(3);
        const snippet = doc.content.substring(0, 100).replace(/\n/g, " ");
        log(`   [${i + 1}] Score: ${score} | ${title.substring(0, 40)}`, colors.reset);
        log(`       Snippet: ${snippet}...`, colors.reset);
      }

      // Verify expected keywords present
      const allContent = top3.map(d => d.content.toLowerCase()).join(" ");
      
      let foundExpected = 0;
      for (const keyword of testCase.expectedKeywords) {
        if (allContent.includes(keyword.toLowerCase())) {
          foundExpected++;
        }
      }
      
      let foundForbidden = 0;
      for (const keyword of testCase.forbiddenKeywords) {
        if (allContent.includes(keyword.toLowerCase())) {
          foundForbidden++;
          log(`   ⚠️ Found forbidden keyword: "${keyword}"`, colors.yellow);
        }
      }

      const expectedRatio = foundExpected / testCase.expectedKeywords.length;
      
      if (expectedRatio >= 0.5 && foundForbidden === 0) {
        log(`   ✓ PASS: ${foundExpected}/${testCase.expectedKeywords.length} expected keywords found, no forbidden keywords`, colors.green);
      } else if (expectedRatio >= 0.3) {
        log(`   ⚠️ PARTIAL: ${foundExpected}/${testCase.expectedKeywords.length} expected keywords, ${foundForbidden} forbidden`, colors.yellow);
      } else {
        log(`   ❌ FAIL: Only ${foundExpected}/${testCase.expectedKeywords.length} expected keywords found`, colors.red);
        passed = false;
      }

    } catch (err: any) {
      log(`   ❌ Error: ${err.message}`, colors.red);
      passed = false;
    }
  }

  return passed;
}

// ===== TEST 5: Keyword Gating =====
function testKeywordGating(): boolean {
  log("\n=== TEST 5: Keyword Gating ===", colors.blue);
  let passed = true;

  const query = "What is actio de pauperie?";
  
  const relevantDocs = [
    { content: "The actio de pauperie is an action for damages caused by animals...", metadata: {} }
  ];
  
  const irrelevantDocs = [
    { content: "The constitution provides for various rights including...", metadata: {} }
  ];

  const relevantResult = hasKeywordMatches(relevantDocs, query);
  const irrelevantResult = hasKeywordMatches(irrelevantDocs, query);

  log(`\nQuery: "${query}"`, colors.cyan);
  log(`  Relevant docs have matches: ${relevantResult}`, relevantResult ? colors.green : colors.red);
  log(`  Irrelevant docs have matches: ${irrelevantResult}`, !irrelevantResult ? colors.green : colors.red);

  if (!relevantResult) {
    log(`  ❌ FAIL: Should have found matches in relevant docs`, colors.red);
    passed = false;
  }
  
  if (irrelevantResult) {
    log(`  ❌ FAIL: Should NOT have found matches in irrelevant docs`, colors.red);
    passed = false;
  }

  if (passed) {
    log(`  ✓ PASS: Keyword gating works correctly`, colors.green);
  }

  return passed;
}

// ===== MAIN =====
async function runAllTests() {
  log("\n" + "=".repeat(60), colors.blue);
  log("   DocketDive Accuracy Test Suite", colors.blue);
  log("=".repeat(60), colors.blue);

  const results: { name: string; passed: boolean }[] = [];

  // Test 1: Query Expansion
  results.push({ name: "Query Expansion", passed: await testQueryExpansion() });

  // Test 2: Entity Identification
  results.push({ name: "Entity Identification", passed: testEntityIdentification() });

  // Test 3: Keyword Boost
  results.push({ name: "Keyword Boost", passed: testKeywordBoost() });

  // Test 4: Full Retrieval (requires DB)
  results.push({ name: "Full Retrieval", passed: await testRetrievalPipeline() });

  // Test 5: Keyword Gating
  results.push({ name: "Keyword Gating", passed: testKeywordGating() });

  // Summary
  log("\n" + "=".repeat(60), colors.blue);
  log("   TEST SUMMARY", colors.blue);
  log("=".repeat(60), colors.blue);

  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? "✓ PASS" : "❌ FAIL";
    const color = result.passed ? colors.green : colors.red;
    log(`  ${status}: ${result.name}`, color);
    if (!result.passed) allPassed = false;
  }

  log("\n" + "=".repeat(60), colors.blue);
  if (allPassed) {
    log("   ALL TESTS PASSED ✓", colors.green);
  } else {
    log("   SOME TESTS FAILED ❌", colors.red);
  }
  log("=".repeat(60), colors.blue);

  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(console.error);
