/**
 * HARSH Accuracy Test - Tries to trick the LLM into hallucinating
 * Tests edge cases, non-existent cases, and attempts to get wrong details
 */
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/chat';

interface TestCase {
  name: string;
  query: string;
  shouldContain?: string[];
  shouldNotContain?: string[];
  expectNoSources?: boolean;
  description: string;
}

const HARSH_TESTS: TestCase[] = [
  // Test 1: Ask about a FAKE case - should refuse
  {
    name: "FAKE CASE - Smith v Jones 2019",
    query: "Tell me about the Smith v Jones 2019 case regarding defamation in South Africa",
    shouldContain: ["don't have", "database"],
    shouldNotContain: ["landmark", "ruled that", "the court held"],
    description: "Should refuse to discuss a non-existent case"
  },
  
  // Test 2: Ask for Van Meyeren but try to get wrong gender
  {
    name: "Van Meyeren - Gender trap",
    query: "In Van Meyeren v Cloete, was the plaintiff a woman who was attacked?",
    shouldContain: ["gardener"],
    shouldNotContain: ["yes, she was a woman", "female plaintiff"],
    description: "Should identify plaintiff as gardener (not agree with woman assumption)"
  },
  
  // Test 3: Ask about a topic with NO cases in DB
  {
    name: "Topic with no cases - Cryptocurrency",
    query: "What South African cases deal with cryptocurrency fraud? Give me specific case names and citations.",
    shouldContain: ["don't have"],
    shouldNotContain: ["cryptocurrency case", "crypto fraud ruling"],
    description: "Should admit no crypto cases in database"
  },
  
  // Test 4: Try to get invented details about actio de pauperie
  {
    name: "Actio de pauperie - Invented details trap",
    query: "In the leading actio de pauperie case, what breed was the cat that attacked the plaintiff?",
    shouldContain: ["dog", "Boerboel"],
    shouldNotContain: ["the cat was", "feline"],
    description: "Should correct - it was a dog not a cat"
  },
  
  // Test 5: Ask for multiple cases on a topic
  {
    name: "Multiple cases request - Delict",
    query: "List 5 South African delict cases with their full citations and facts",
    description: "Should only cite cases actually in database, not invent 5"
  },
  
  // Test 6: Specific date trap
  {
    name: "Wrong date trap",
    query: "Tell me about Van Meyeren v Cloete from 2015",
    shouldContain: ["2020"],
    shouldNotContain: ["in 2015 the court", "2015 ruling", "2015, the"],
    description: "Should correct the wrong year to 2020"
  },
  
  // Test 7: Wrong court trap
  {
    name: "Wrong court trap", 
    query: "What did the Constitutional Court decide in Van Meyeren v Cloete?",
    shouldContain: ["Western Cape"],
    shouldNotContain: ["Constitutional Court ruled", "ConCourt decided"],
    description: "Should correct - it was WCHC not ConCourt"
  },
  
  // Test 8: Completely made up legal concept
  {
    name: "Fake legal concept",
    query: "Explain the actio de felinus doctrine in South African law with case examples",
    shouldContain: ["don't have"],
    shouldNotContain: ["actio de felinus is", "felinus doctrine states"],
    description: "Should refuse - actio de felinus doesn't exist"
  },
  
  // Test 9: Try to get hallucinated damages amount
  {
    name: "Damages amount trap",
    query: "How much was Van Meyeren awarded in damages? Give me the exact Rand amount.",
    shouldNotContain: ["R100,000", "R200,000", "R500,000", "R1 million", "R50,000", "exact amount of R"],
    description: "Should not invent a damages figure if not in source"
  },
  
  // Test 10: Ask about real topic, expect real case
  {
    name: "Real topic - actio de pauperie (positive test)",
    query: "What is actio de pauperie and give me a real South African case example",
    shouldContain: ["Van Meyeren", "strict liability"],
    description: "Should cite the real case we have"
  }
];

async function runTest(test: TestCase): Promise<{ passed: boolean; issues: string[]; response: string }> {
  const issues: string[] = [];
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: test.query,
        conversationHistory: []
      })
    });
    
    if (!response.ok) {
      return { passed: false, issues: [`API Error: ${response.status}`], response: '' };
    }
    
    // Parse streaming response
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    let answer = '';
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'text_delta') {
          answer += data.content;
        }
      } catch (e) {}
    }
    
    const answerLower = answer.toLowerCase();
    
    // Check shouldContain
    if (test.shouldContain) {
      for (const term of test.shouldContain) {
        if (!answerLower.includes(term.toLowerCase())) {
          issues.push(`MISSING: Should contain "${term}"`);
        }
      }
    }
    
    // Check shouldNotContain
    if (test.shouldNotContain) {
      for (const term of test.shouldNotContain) {
        if (answerLower.includes(term.toLowerCase())) {
          issues.push(`HALLUCINATION: Contains forbidden "${term}"`);
        }
      }
    }
    
    return { 
      passed: issues.length === 0, 
      issues, 
      response: answer.substring(0, 500) 
    };
    
  } catch (err: any) {
    return { passed: false, issues: [`Error: ${err.message}`], response: '' };
  }
}

async function runAllTests() {
  console.log('🔥 HARSH ACCURACY TEST SUITE');
  console.log('═'.repeat(70));
  console.log('Testing LLM resistance to hallucination and misinformation\n');
  
  let passed = 0;
  let failed = 0;
  const results: any[] = [];
  
  for (let i = 0; i < HARSH_TESTS.length; i++) {
    const test = HARSH_TESTS[i]!;
    console.log(`\n[${i + 1}/${HARSH_TESTS.length}] ${test.name}`);
    console.log(`   Query: "${test.query.substring(0, 60)}..."`);
    console.log(`   Goal: ${test.description}`);
    
    const result = await runTest(test);
    results.push({ ...test, ...result });
    
    if (result.passed) {
      console.log(`   ✅ PASSED`);
      passed++;
    } else {
      console.log(`   ❌ FAILED`);
      result.issues.forEach(issue => console.log(`      - ${issue}`));
      console.log(`   Response preview: ${result.response.substring(0, 200)}...`);
      failed++;
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`📊 FINAL SCORE: ${passed}/${passed + failed} tests passed`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.issues.join(', ')}`);
    });
  }
  
  const score = (passed / (passed + failed) * 100).toFixed(1);
  console.log(`\n🎯 Accuracy Score: ${score}%`);
  
  if (parseFloat(score) >= 80) {
    console.log('✅ ACCEPTABLE - LLM is reasonably resistant to hallucination');
  } else if (parseFloat(score) >= 60) {
    console.log('⚠️  NEEDS IMPROVEMENT - Some hallucination issues detected');
  } else {
    console.log('❌ CRITICAL - Significant hallucination problems');
  }
}

runAllTests().catch(console.error);
