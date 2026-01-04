/**
 * Comprehensive RAG Pipeline Test
 * Tests: Vector embeddings, knowledge base retrieval, and follow-up question handling
 */

import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
dotenv.config();

const HF_EMBED_MODEL = "intfloat/multilingual-e5-large";

interface TestResult {
  query: string;
  foundResults: boolean;
  resultsCount: number;
  topSimilarity: number;
  topContent: string;
  topSource: string;
  passed: boolean;
}

async function generateQueryEmbedding(text: string): Promise<number[]> {
  const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY not set');
  }

  // E5 models require "query: " prefix for queries
  const prefixedText = `query: ${text}`;

  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_EMBED_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prefixedText,
      options: { wait_for_model: true }
    }),
  });

  if (!response.ok) {
    throw new Error(`HF API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
}

async function testQuery(query: string, minSimilarity: number = 0.5): Promise<TestResult> {
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
  const collection = db.collection('docketdive');

  try {
    // Generate embedding for query
    const queryVector = await generateQueryEmbedding(query);

    // Search vector database
    const results = await collection.find({}, {
      sort: { $vector: queryVector },
      limit: 5,
      includeSimilarity: true,
      projection: { content: 1, metadata: 1 },
    }).toArray();

    const hasResults = results.length > 0;
    const topResult = results[0];
    const similarity = topResult?.$similarity ?? 0;
    const topContent = topResult?.content?.substring(0, 200) || '';
    const topSource = topResult?.metadata?.url || topResult?.metadata?.source || 'Unknown';

    return {
      query,
      foundResults: hasResults && similarity > minSimilarity,
      resultsCount: results.length,
      topSimilarity: similarity,
      topContent,
      topSource,
      passed: hasResults && similarity > minSimilarity
    };
  } catch (error: any) {
    return {
      query,
      foundResults: false,
      resultsCount: 0,
      topSimilarity: 0,
      topContent: `ERROR: ${error.message}`,
      topSource: 'N/A',
      passed: false
    };
  }
}

async function runComprehensiveTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPREHENSIVE RAG PIPELINE TEST');
  console.log('='.repeat(80) + '\n');

  const testSets = [
    {
      name: '📋 WITNESS AGE REQUIREMENT (Initial Query)',
      queries: [
        "What age must a witness be to a will?",
        "witness age requirement South Africa will",
        "14 years old witness testament"
      ]
    },
    {
      name: '🔄 FOLLOW-UP: Witness Requirements (Context-Aware)',
      queries: [
        "What other requirements must they meet?",
        "witness presence requirements will making",
        "witness competency testator presence"
      ]
    },
    {
      name: '📋 EVICTION LAE (Initial Query)',
      queries: [
        "What are the requirements for eviction in South Africa?",
        "eviction PIE Act notice",
        "unlawful occupation eviction procedure"
      ]
    },
    {
      name: '🔄 FOLLOW-UP: Eviction Timeline (Context-Aware)',
      queries: [
        "How long does the process take?",
        "eviction timeline court order execution",
        "PIE Act notice period days"
      ]
    },
    {
      name: '📋 UNFAIR DISMISSAL (Initial Query)',
      queries: [
        "What remedies are available for unfair dismissal?",
        "unfair dismissal remedies reinstatement compensation",
        "Labour Court unfair dismissal relief"
      ]
    },
    {
      name: '🔄 FOLLOW-UP: Burden of Proof (Context-Aware)',
      queries: [
        "Who has to prove it was unfair?",
        "burden of proof unfair dismissal employer",
        "substantive fairness procedural fairness dismissal"
      ]
    },
    {
      name: '📋 SUCCESSION LAW (Initial Query)',
      queries: [
        "What is the order of intestate succession?",
        "intestate succession South Africa spouse children",
        "intestate heirs distribution estate"
      ]
    },
    {
      name: '🔄 FOLLOW-UP: Specific Scenarios (Context-Aware)',
      queries: [
        "What if there are multiple dependents?",
        "dependents inheritance share succession",
        "maintenance and dependents succession act"
      ]
    }
  ];

  const allResults: TestResult[] = [];

  for (const testSet of testSets) {
    console.log('\n' + '─'.repeat(80));
    console.log(testSet.name);
    console.log('─'.repeat(80) + '\n');

    for (const query of testSet.queries) {
      const result = await testQuery(query);
      allResults.push(result);

      const status = result.passed ? '✅' : '❌';
      const similarity = (result.topSimilarity * 100).toFixed(1);

      console.log(`${status} Query: "${query}"`);
      console.log(`   Found: ${result.resultsCount} results | Top similarity: ${similarity}%`);
      
      if (result.foundResults) {
        console.log(`   Source: ${result.topSource}`);
        console.log(`   Content: "${result.topContent}..."`);
      } else if (result.topContent.includes('ERROR')) {
        console.log(`   Error: ${result.topContent}`);
      } else {
        console.log(`   ⚠️  No relevant results found (similarity below threshold)`);
      }
      console.log();

      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Summary Report
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passedTests = allResults.filter(r => r.passed).length;
  const totalTests = allResults.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Pass Rate: ${passRate}%\n`);

  // Group by result type
  const byResult = {
    passed: allResults.filter(r => r.passed),
    failed: allResults.filter(r => !r.passed)
  };

  if (byResult.failed.length > 0) {
    console.log('Failed Queries:');
    byResult.failed.forEach(r => {
      console.log(`  ❌ "${r.query}"`);
      if (r.topContent.includes('ERROR')) {
        console.log(`     → ${r.topContent}`);
      } else {
        console.log(`     → Similarity too low: ${(r.topSimilarity * 100).toFixed(1)}%`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNOSIS');
  console.log('='.repeat(80) + '\n');

  if (passRate === '100') {
    console.log('✅ PIPELINE HEALTHY: All queries returning relevant results');
    console.log('   Knowledge base is properly embedded and searchable');
  } else if (parseFloat(passRate) >= 80) {
    console.log('⚠️  PIPELINE MOSTLY WORKING: Some queries not finding relevant documents');
    console.log('   → Check if all documents are embedded');
    console.log('   → Run: npm run reembed-docs');
  } else if (parseFloat(passRate) >= 50) {
    console.log('❌ PIPELINE PARTIALLY BROKEN: Many queries failing');
    console.log('   → Vector embeddings may be missing');
    console.log('   → Run diagnostic: npx tsx diagnose-rag.ts');
    console.log('   → Then re-embed: npm run reembed-docs');
  } else {
    console.log('🔴 PIPELINE BROKEN: Most queries failing');
    console.log('   → Vectors likely not embedded');
    console.log('   CRITICAL FIX:');
    console.log('   1. Run: npx tsx diagnose-rag.ts');
    console.log('   2. Run: npm run reembed-docs');
    console.log('   3. Verify: npm run test-rag');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return allResults;
}

// Run the test
runComprehensiveTest()
  .then(results => {
    const passRate = ((results.filter(r => r.passed).length / results.length) * 100).toFixed(0);
    process.exit(parseInt(passRate) >= 80 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  });
