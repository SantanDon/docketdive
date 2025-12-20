import { retrieveRelevantDocuments, buildContext, generateResponse as originalGenerateResponse } from "../app/api/utils/rag";
import { processAnswer } from "../app/utils/responseProcessor";
import { measureRAGOperation } from "../app/utils/performance-tracker";
import { semanticCache } from "../app/utils/semantic-cache";
import { modelRouter } from "../app/utils/model-router";
import { hybridSearch } from "../app/utils/hybrid-search";
import { contextCompressor } from "../app/utils/context-compressor";
import { llmOptimizer } from "../app/utils/llm-optimizer";

// Test queries for A/B testing
const AB_TEST_QUERIES = [
  {
    name: "Simple Query",
    query: "What is a contract?",
    category: "Simple"
  },
  {
    name: "Medium Query", 
    query: "What are the requirements for a valid contract in South African law?",
    category: "Medium"
  },
  {
    name: "Complex Query",
    query: "How do freedom of expression and privacy rights balance against each other in the context of social media surveillance?",
    category: "Complex"
  },
  {
    name: "Specialized Query",
    query: "What are the grounds for setting aside an arbitration award?",
    category: "Specialized"
  },
  {
    name: "Multi-Aspect Query",
    query: "Explain the principles of ubuntu in South African jurisprudence and how they relate to property law",
    category: "Multi-Aspect"
  }
];

export interface ABTestResult {
  testName: string;
  query: string;
  category: string;
  originalResponseTime: number;
  optimizedResponseTime: number;
  responseTimeImprovement: number; // Positive means faster
  responseTimeImprovementPercent: number;
  originalResponse: string;
  optimizedResponse: string;
  qualityComparison: number; // -1 (worse), 0 (same), 1 (better)
  citationComparison: number; // -1 (worse), 0 (same), 1 (better)
  status: 'completed' | 'original_failed' | 'optimized_failed' | 'both_failed';
  error?: string;
}

/**
 * A/B Testing Framework for DocketDive
 * Compares performance between original and optimized systems
 */
export class ABTestingFramework {
  private results: ABTestResult[] = [];

  constructor() {}

  /**
   * Runs the original RAG system pipeline
   */
  async runOriginalSystem(query: string): Promise<{ response: string; sources: any[]; responseTime: number }> {
    const result = await measureRAGOperation(
      query,
      async () => {
        const docs = await retrieveRelevantDocuments(query);
        const context = buildContext(docs, 0.10, 5);
        const hasContext = context.length > 0;
        
        const response = await originalGenerateResponse(query, context, hasContext, "ollama");
        const processed = processAnswer(response, docs, 0.68, 7);
        
        return {
          response: processed.processedAnswer,
          sources: docs,
          tokens: processed.processedAnswer.length / 4
        };
      }
    );

    return {
      response: result.response,
      sources: result.sources,
      responseTime: result.metrics.totalTime
    };
  }

  /**
   * Runs the optimized RAG system pipeline
   */
  async runOptimizedSystem(query: string): Promise<{ response: string; sources: any[]; responseTime: number }> {
    const result = await measureRAGOperation(
      query,
      async () => {
        // Use the optimized pipeline
        const startTime = Date.now();
        
        // First, check if there's a cached response
        const cached = await semanticCache.findSimilarQuery(query);
        if (cached) {
          return {
            response: cached.response,
            sources: cached.sources,
            tokens: cached.response.length / 4
          };
        }

        // Route model based on query
        const { model, classification } = modelRouter.routeQuery(query);
        
        // Get relevant documents using hybrid search
        const embedding = await this.getEmbedding(query);
        const docs = await hybridSearch.optimizedSearch(query, embedding);
        
        // Build context
        let context = buildContext(docs, 0.10, 5);
        
        // Compress context if needed
        if (context.length > 2000) {
          const compressed = contextCompressor.compressContext(context, docs);
          context = compressed.compressedContext;
        }

        const hasContext = context.length > 0;
        
        // Generate response using optimized LLM
        const response = await llmOptimizer.processQuery(query, context, hasContext);
        
        // Process answer for citations and disclaimer
        const processed = processAnswer(response, docs, 0.68, 7);
        
        // Cache the result for future queries
        await semanticCache.addQuery(query, processed.processedAnswer, docs);
        
        return {
          response: processed.processedAnswer,
          sources: docs,
          tokens: processed.processedAnswer.length / 4
        };
      }
    );

    return {
      response: result.response,
      sources: result.sources,
      responseTime: result.metrics.totalTime
    };
  }

  /**
   * Helper to get embeddings (placeholder - would import from rag.ts in real implementation)
   */
  async getEmbedding(text: string): Promise<number[]> {
    const { getEmbedding: actualGetEmbedding } = await import("../app/api/utils/rag");
    return actualGetEmbedding(text);
  }

  /**
   * Compares the quality of two responses
   */
  private compareQuality(original: string, optimized: string): number {
    // Simple comparison based on: length similarity, keyword presence, and citation quality
    const originalLength = original.length;
    const optimizedLength = optimized.length;
    
    // Length similarity (should not be extremely different)
    const lengthRatio = Math.min(originalLength, optimizedLength) / Math.max(originalLength, optimizedLength);
    const lengthSimilar = lengthRatio > 0.7 ? 0 : (originalLength > optimizedLength ? -1 : 1);
    
    // Citation presence comparison
    const originalHasCitations = /\[Source \d+\]/.test(original) || /「[^」]+」/.test(original);
    const optimizedHasCitations = /\[Source \d+\]/.test(optimized) || /「[^」]+」/.test(optimized);
    
    if (originalHasCitations && !optimizedHasCitations) return -1;
    if (!originalHasCitations && optimizedHasCitations) return 1;
    
    // If both have citations or both don't, consider them equal on this measure
    return lengthSimilar; // -1 worse, 0 same, 1 better
  }

  /**
   * Compares citation quality between responses
   */
  private compareCitations(original: string, optimized: string): number {
    const origCitations = (original.match(/\[Source \d+\]/g) || []).length + 
                         (original.match(/「[^」]+」/g) || []).length;
    const optCitations = (optimized.match(/\[Source \d+\]/g) || []).length + 
                        (optimized.match(/「[^」]+」/g) || []).length;
                        
    if (origCitations === 0 && optCitations === 0) return 0;
    if (origCitations === 0 && optCitations > 0) return 1;
    if (origCitations > 0 && optCitations === 0) return -1;
    
    // Both have citations, compare ratio
    return optCitations >= origCitations ? 1 : -1;
  }

  /**
   * Runs a single A/B test
   */
  async runSingleABTest(testQuery: typeof AB_TEST_QUERIES[0]): Promise<ABTestResult> {
    console.log(`\n🧪 A/B TEST: ${testQuery.name}`);
    console.log(`❓ Query: "${testQuery.query}"`);
    console.log("-".repeat(60));

    try {
      // Run original system
      console.log("   Running ORIGINAL system...");
      const originalResult = await this.runOriginalSystem(testQuery.query);
      
      // Run optimized system
      console.log("   Running OPTIMIZED system...");
      const optimizedResult = await this.runOptimizedSystem(testQuery.query);

      // Calculate improvements
      const responseTimeImprovement = originalResult.responseTime - optimizedResult.responseTime;
      const responseTimeImprovementPercent = 
        originalResult.responseTime > 0 
          ? ((responseTimeImprovement / originalResult.responseTime) * 100) 
          : 0;

      // Compare quality
      const qualityComparison = this.compareQuality(
        originalResult.response, 
        optimizedResult.response
      );
      
      // Compare citations
      const citationComparison = this.compareCitations(
        originalResult.response,
        optimizedResult.response
      );

      const result: ABTestResult = {
        testName: testQuery.name,
        query: testQuery.query,
        category: testQuery.category,
        originalResponseTime: originalResult.responseTime,
        optimizedResponseTime: optimizedResult.responseTime,
        responseTimeImprovement,
        responseTimeImprovementPercent,
        originalResponse: originalResult.response.substring(0, 300) + "...",
        optimizedResponse: optimizedResult.response.substring(0, 300) + "...",
        qualityComparison,
        citationComparison,
        status: 'completed'
      };

      console.log(`   Original: ${originalResult.responseTime.toFixed(2)}ms`);
      console.log(`   Optimized: ${optimizedResult.responseTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${responseTimeImprovement.toFixed(2)}ms (${responseTimeImprovementPercent.toFixed(1)}%)`);
      console.log(`   Quality: ${qualityComparison === 1 ? 'Better' : qualityComparison === 0 ? 'Same' : 'Worse'}`);
      console.log(`   Citations: ${citationComparison === 1 ? 'More/Equal' : citationComparison === 0 ? 'Same' : 'Fewer'}`);

      return result;
    } catch (error) {
      console.error(`   ❌ Test failed: ${error}`);
      
      return {
        testName: testQuery.name,
        query: testQuery.query,
        category: testQuery.category,
        originalResponseTime: -1,
        optimizedResponseTime: -1,
        responseTimeImprovement: 0,
        responseTimeImprovementPercent: 0,
        originalResponse: "",
        optimizedResponse: "",
        qualityComparison: 0,
        citationComparison: 0,
        status: 'both_failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Runs comprehensive A/B tests
   */
  async runComprehensiveABTest(): Promise<ABTestResult[]> {
    console.log("🧪 Starting A/B Testing Framework...\n");
    console.log("Comparing ORIGINAL vs OPTIMIZED DocketDive systems\n");
    console.log("=" .repeat(80));

    this.results = [];

    for (let i = 0; i < AB_TEST_QUERIES.length; i++) {
      const testQuery = AB_TEST_QUERIES[i];
      const result = await this.runSingleABTest(testQuery);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * Generates A/B test report
   */
  generateABReport(results: ABTestResult[]): void {
    console.log("\n\n📊 A/B TESTING REPORT");
    console.log("=" .repeat(80));

    const completedTests = results.filter(r => r.status === 'completed');
    const failedTests = results.filter(r => r.status !== 'completed');

    console.log(`Total Tests: ${results.length}`);
    console.log(`Completed: ${completedTests.length} ✅`);
    console.log(`Failed: ${failedTests.length} ❌`);

    if (completedTests.length > 0) {
      // Calculate average improvements
      const avgResponseTimeImprovement = 
        completedTests.reduce((sum, r) => sum + r.responseTimeImprovement, 0) / completedTests.length;
      
      const avgResponseTimeImprovementPercent = 
        completedTests.reduce((sum, r) => sum + r.responseTimeImprovementPercent, 0) / completedTests.length;

      const speedupTests = completedTests.filter(r => r.responseTimeImprovement > 0);
      const slowdownTests = completedTests.filter(r => r.responseTimeImprovement < 0);

      console.log(`\n⏱️  PERFORMANCE METRICS:`);
      console.log(`   Average Time Improvement: ${avgResponseTimeImprovement.toFixed(2)}ms`);
      console.log(`   Average Time Improvement %: ${avgResponseTimeImprovementPercent.toFixed(1)}%`);
      console.log(`   Speedup Tests: ${speedupTests.length}/${completedTests.length} (${((speedupTests.length / completedTests.length) * 100).toFixed(1)}%)`);
      console.log(`   Slowdown Tests: ${slowdownTests.length}/${completedTests.length} (${((slowdownTests.length / completedTests.length) * 100).toFixed(1)}%)`);
      console.log(`   Fastest Improvement: ${Math.max(...completedTests.map(r => r.responseTimeImprovement)).toFixed(2)}ms`);
      console.log(`   Slowest Change: ${Math.min(...completedTests.map(r => r.responseTimeImprovement)).toFixed(2)}ms`);

      // Quality metrics
      const qualityBetter = completedTests.filter(r => r.qualityComparison === 1).length;
      const qualitySame = completedTests.filter(r => r.qualityComparison === 0).length;
      const qualityWorse = completedTests.filter(r => r.qualityComparison === -1).length;

      console.log(`\n🔍 QUALITY METRICS:`);
      console.log(`   Quality Better: ${qualityBetter}/${completedTests.length} (${((qualityBetter / completedTests.length) * 100).toFixed(1)}%)`);
      console.log(`   Quality Same: ${qualitySame}/${completedTests.length} (${((qualitySame / completedTests.length) * 100).toFixed(1)}%)`);
      console.log(`   Quality Worse: ${qualityWorse}/${completedTests.length} (${((qualityWorse / completedTests.length) * 100).toFixed(1)}%)`);

      // Citation metrics
      const citationBetter = completedTests.filter(r => r.citationComparison === 1).length;
      const citationSame = completedTests.filter(r => r.citationComparison === 0).length;
      const citationWorse = completedTests.filter(r => r.citationComparison === -1).length;

      console.log(`\n📋 CITATION METRICS:`);
      console.log(`   Citations Better: ${citationBetter}/${completedTests.length} (${((citationBetter / completedTests.length) * 100).toFixed(1)}%)`);
      console.log(`   Citations Same: ${citationSame}/${completedTests.length} (${((citationSame / completedTests.length) * 100).toFixed(1)}%)`);
      console.log(`   Citations Worse: ${citationWorse}/${completedTests.length} (${((citationWorse / completedTests.length) * 100).toFixed(1)}%)`);

      // Category breakdown
      const categories = [...new Set(results.map(r => r.category))];
      console.log(`\n🏷️  BREAKDOWN BY CATEGORY:`);
      for (const category of categories) {
        const categoryTests = completedTests.filter(r => r.category === category);
        if (categoryTests.length > 0) {
          const avgImprovement = categoryTests.reduce((sum, r) => sum + r.responseTimeImprovementPercent, 0) / categoryTests.length;
          console.log(`   ${category}: ${avgImprovement.toFixed(1)}% avg improvement (${categoryTests.length} tests)`);
        }
      }

      console.log(`\n📋 DETAILED RESULTS:`);
      completedTests.forEach((result, i) => {
        const improvement = result.responseTimeImprovementPercent;
        const improvementIcon = improvement > 0 ? "✅" : improvement === 0 ? "➡️" : "❌";
        console.log(`${i + 1}. ${result.testName}: ${improvementIcon} ${improvement.toFixed(1)}%`);
      });
    }

    if (failedTests.length > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      failedTests.forEach((result, i) => {
        console.log(`${i + 1}. ${result.testName}: ${result.error || 'Unknown error'}`);
      });
    }

    // Overall assessment
    const overallImprovement = completedTests.length > 0 
      ? completedTests.reduce((sum, r) => sum + r.responseTimeImprovementPercent, 0) / completedTests.length 
      : 0;

    console.log(`\n🎯 OVERALL ASSESSMENT:`);
    console.log(`   The optimized system is ${Math.abs(overallImprovement).toFixed(1)}% ${overallImprovement >= 0 ? 'faster' : 'slower'} than the original on average`);
    console.log(`   ${overallImprovement >= 0 ? '✅ Performance improved!' : '⚠️ Performance degraded!'} `);
    console.log(`   ${qualityWorse === 0 ? '✅ Quality maintained!' : '⚠️ Quality degradation detected!'} `);

    console.log("\n" + "=" .repeat(80));
    console.log("🏁 A/B Testing Complete!\n");
  }

  /**
   * Runs the complete A/B testing suite
   */
  async runCompleteABTest(): Promise<void> {
    const results = await this.runComprehensiveABTest();
    this.generateABReport(results);
  }
}

// Run the A/B testing framework when this script is executed directly
if (require.main === module) {
  const abFramework = new ABTestingFramework();
  abFramework.runCompleteABTest().catch(console.error);
}