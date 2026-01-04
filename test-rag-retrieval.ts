/**
 * Comprehensive RAG Retrieval Test Suite
 * Tests knowledge base retrieval at every stage of the pipeline
 * Identifies bottlenecks and retrieval failures
 */

import { DataAPIClient } from "@datastax/astra-db-ts";
import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN || "");
const astraDb = client.db(process.env.ENDPOINT || "");

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

// Test queries covering different legal topics
const testQueries = [
  {
    query: "What age must a witness be for a will in South Africa",
    expectedKeywords: ["witness", "14", "age", "will", "testator"],
    category: "succession",
  },
  {
    query: "witness requirements for testament",
    expectedKeywords: ["witness", "age", "testator", "present"],
    category: "succession",
  },
  {
    query: "How old can a witness be",
    expectedKeywords: ["14", "years", "old", "witness"],
    category: "succession",
  },
  {
    query: "POPIA compliance requirements",
    expectedKeywords: ["POPIA", "data", "processing", "consent"],
    category: "compliance",
  },
  {
    query: "contract analysis risk assessment",
    expectedKeywords: ["contract", "risk", "clause", "liability"],
    category: "contract",
  },
];

interface RetrievalResult {
  query: string;
  documents: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata: any;
  }>;
  embedding: number[];
  retrievalTime: number;
  keywordMatch: boolean;
}

interface PipelineResult {
  stage: string;
  success: boolean;
  time: number;
  data: any;
  error?: string;
}

const results: {
  query: string;
  category: string;
  pipeline: PipelineResult[];
  finalResult: RetrievalResult | null;
  success: boolean;
  keywordCoverage: number;
}[] = [];

async function testEmbeddingGeneration(
  query: string
): Promise<PipelineResult> {
  const startTime = performance.now();
  try {
    // Test HuggingFace embeddings
    const embedding = await hf.featureExtraction({
      model: "intfloat/multilingual-e5-large",
      inputs: query,
      truncate: true,
    });

    const time = performance.now() - startTime;

    return {
      stage: "Embedding Generation",
      success: true,
      time,
      data: {
        embeddingDimensions: Array.isArray(embedding)
          ? embedding.length
          : (embedding as any)[0]?.length,
        query,
      },
    };
  } catch (err: any) {
    return {
      stage: "Embedding Generation",
      success: false,
      time: performance.now() - startTime,
      data: null,
      error: err.message,
    };
  }
}

async function testVectorSearch(
  query: string,
  embedding: number[]
): Promise<PipelineResult> {
  const startTime = performance.now();
  try {
    const collection = astraDb
      .collection(process.env.COLLECTION_NAME || "docketdive");

    // Search with vector similarity
    const results = await collection.find(
      {
        $or: [
          { $vector: embedding },
        ],
      },
      {
        limit: 10,
        includeSimilarity: true,
      }
    ).toArray();

    const time = performance.now() - startTime;

    return {
      stage: "Vector Search",
      success: results.length > 0,
      time,
      data: {
        documentsFound: results.length,
        topScores: results.slice(0, 3).map((r: any) => ({
          similarity: r.$similarity,
          id: r._id,
        })),
      },
    };
  } catch (err: any) {
    return {
      stage: "Vector Search",
      success: false,
      time: performance.now() - startTime,
      data: null,
      error: err.message,
    };
  }
}

async function testKeywordMatching(
  query: string,
  expectedKeywords: string[]
): Promise<PipelineResult> {
  const startTime = performance.now();
  try {
    const collection = astraDb
      .collection(process.env.COLLECTION_NAME || "docketdive");

    const lowerQuery = query.toLowerCase();
    const found: { keyword: string; count: number }[] = [];

    for (const keyword of expectedKeywords) {
      // Search for keyword in documents
      const results = await collection
        .find({
          content: { $regex: keyword, $options: "i" },
        })
        .limit(5)
        .toArray();

      if (results.length > 0) {
        found.push({
          keyword,
          count: results.length,
        });
      }
    }

    const time = performance.now() - startTime;
    const coverage = found.length / expectedKeywords.length;

    return {
      stage: "Keyword Matching",
      success: found.length > 0,
      time,
      data: {
        keywordsFound: found,
        coverage: `${(coverage * 100).toFixed(1)}%`,
        expectedKeywords,
      },
    };
  } catch (err: any) {
    return {
      stage: "Keyword Matching",
      success: false,
      time: performance.now() - startTime,
      data: null,
      error: err.message,
    };
  }
}

async function testSemanticRelevance(
  query: string,
  documents: any[]
): Promise<PipelineResult> {
  const startTime = performance.now();
  try {
    // Score relevance by checking document metadata and content
    const scored = documents.map((doc: any) => ({
      id: doc._id,
      relevance: doc.$similarity || 0,
      hasMetadata: !!doc.metadata,
      category: doc.metadata?.category,
      source: doc.metadata?.source,
    }));

    const avgRelevance =
      scored.reduce((sum: number, doc: any) => sum + doc.relevance, 0) /
      scored.length;

    const time = performance.now() - startTime;

    return {
      stage: "Semantic Relevance",
      success: avgRelevance > 0.5,
      time,
      data: {
        averageRelevance: avgRelevance.toFixed(3),
        documentCount: scored.length,
        topRelevant: scored.slice(0, 3),
      },
    };
  } catch (err: any) {
    return {
      stage: "Semantic Relevance",
      success: false,
      time: performance.now() - startTime,
      data: null,
      error: err.message,
    };
  }
}

async function runFullPipelineTest(testQuery: {
  query: string;
  expectedKeywords: string[];
  category: string;
}): Promise<void> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📋 Testing Query: "${testQuery.query}"`);
  console.log(`Category: ${testQuery.category}`);
  console.log(`${"=".repeat(80)}\n`);

  const pipeline: PipelineResult[] = [];
  let embedding: number[] = [];

  // Stage 1: Embedding
  console.log("⏳ Stage 1: Generating embeddings...");
  const embeddingResult = await testEmbeddingGeneration(testQuery.query);
  pipeline.push(embeddingResult);
  console.log(`  Result: ${embeddingResult.success ? "✅ Success" : "❌ Failed"}`);
  console.log(`  Time: ${embeddingResult.time.toFixed(2)}ms`);
  if (embeddingResult.error) console.log(`  Error: ${embeddingResult.error}`);

  // Stage 2: Vector Search
  console.log("\n⏳ Stage 2: Vector search...");
  // Note: We'd need actual embedding array to proceed
  // For now, skip if embedding generation failed
  if (embeddingResult.success) {
    // Get embedding from HuggingFace
    const emb = await hf.featureExtraction({
      model: "intfloat/multilingual-e5-large",
      inputs: testQuery.query,
      truncate: true,
    });
    embedding = Array.isArray(emb) ? emb : (emb as any)[0];

    const searchResult = await testVectorSearch(testQuery.query, embedding);
    pipeline.push(searchResult);
    console.log(`  Result: ${searchResult.success ? "✅ Success" : "❌ Failed"}`);
    console.log(`  Time: ${searchResult.time.toFixed(2)}ms`);
    console.log(
      `  Documents Found: ${searchResult.data?.documentsFound || 0}`
    );
    if (searchResult.data?.topScores) {
      searchResult.data.topScores.forEach((score: any, idx: number) => {
        console.log(
          `    ${idx + 1}. Similarity: ${(score.similarity * 100).toFixed(1)}%`
        );
      });
    }
  }

  // Stage 3: Keyword Matching
  console.log("\n⏳ Stage 3: Keyword matching...");
  const keywordResult = await testKeywordMatching(
    testQuery.query,
    testQuery.expectedKeywords
  );
  pipeline.push(keywordResult);
  console.log(`  Result: ${keywordResult.success ? "✅ Success" : "❌ Failed"}`);
  console.log(`  Time: ${keywordResult.time.toFixed(2)}ms`);
  console.log(`  Coverage: ${keywordResult.data?.coverage}`);
  if (keywordResult.data?.keywordsFound) {
    console.log(`  Keywords Found:`);
    keywordResult.data.keywordsFound.forEach((kw: any) => {
      console.log(`    • ${kw.keyword}: ${kw.count} documents`);
    });
  }

  // Stage 4: Semantic Relevance (mock)
  console.log("\n⏳ Stage 4: Semantic relevance scoring...");
  const relevanceResult = await testSemanticRelevance(testQuery.query, []);
  pipeline.push(relevanceResult);
  console.log(`  Result: ${relevanceResult.success ? "✅ Success" : "❌ Failed"}`);

  // Store results
  const keywordCoverage = keywordResult.success
    ? pipeline.filter((p) => p.success).length / pipeline.length
    : 0;

  results.push({
    query: testQuery.query,
    category: testQuery.category,
    pipeline,
    finalResult: null,
    success: pipeline.every((p) => p.success),
    keywordCoverage,
  });
}

async function generateReport(): Promise<void> {
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("📊 RAG RETRIEVAL TEST SUMMARY");
  console.log(`${"=".repeat(80)}\n`);

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;
  const overallSuccess = (successCount / totalCount) * 100;

  console.log(`Overall Success Rate: ${overallSuccess.toFixed(1)}% (${successCount}/${totalCount})\n`);

  results.forEach((result, idx) => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} Query ${idx + 1}: "${result.query}"`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Pipeline Stages: ${result.pipeline.length}`);
    console.log(`   Successful Stages: ${result.pipeline.filter((p) => p.success).length}`);
    result.pipeline.forEach((stage) => {
      console.log(
        `     • ${stage.stage}: ${stage.success ? "✅" : "❌"} (${stage.time.toFixed(2)}ms)`
      );
    });
    console.log();
  });

  // Identify bottlenecks
  console.log(`${"=".repeat(80)}`);
  console.log("🔍 BOTTLENECK ANALYSIS\n");

  const stagePerformance: { [key: string]: { count: number; totalTime: number; failures: number } } = {};

  results.forEach((result) => {
    result.pipeline.forEach((stage) => {
      if (!stagePerformance[stage.stage]) {
        stagePerformance[stage.stage] = {
          count: 0,
          totalTime: 0,
          failures: 0,
        };
      }
      stagePerformance[stage.stage].count++;
      stagePerformance[stage.stage].totalTime += stage.time;
      if (!stage.success) stagePerformance[stage.stage].failures++;
    });
  });

  Object.entries(stagePerformance).forEach(([stage, stats]) => {
    const avgTime = stats.totalTime / stats.count;
    const failureRate = (stats.failures / stats.count) * 100;
    console.log(`${stage}:`);
    console.log(`  Average Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Failure Rate: ${failureRate.toFixed(1)}%`);
    if (failureRate > 20) {
      console.log(`  ⚠️  HIGH FAILURE RATE - NEEDS ATTENTION`);
    }
    console.log();
  });
}

async function main(): Promise<void> {
  console.log("🚀 Starting RAG Retrieval Comprehensive Test Suite\n");
  console.log(`Database: ${process.env.COLLECTION_NAME || "docketdive"}`);
  console.log(`Test Queries: ${testQueries.length}`);
  console.log(`Testing will now start...\n`);

  for (const testQuery of testQueries) {
    try {
      await runFullPipelineTest(testQuery);
    } catch (err: any) {
      console.error(`\n❌ Test failed for query: ${testQuery.query}`);
      console.error(`Error: ${err.message}\n`);
    }
  }

  await generateReport();

  console.log(`\n${"=".repeat(80)}`);
  console.log("💡 RECOMMENDATIONS\n");
  console.log("1. Check Astra DB connection and collection existence");
  console.log("2. Verify document ingestion completed successfully");
  console.log("3. Ensure vector dimensions match (768 for nomic-embed-text:v1.5)");
  console.log("4. Review chunking strategy for context preservation");
  console.log("5. Consider hybrid search if vector-only retrieval fails");
  console.log("6. Add keyword boosting for legal-specific terms");
  console.log("7. Implement query expansion for synonyms\n");
}

main().catch(console.error);
