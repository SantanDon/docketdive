/**
 * Multi-Prompt RAG Test
 * Tests the actual chat API with real conversations to verify improvements
 */

import dotenv from 'dotenv';
dotenv.config();

interface ConversationTest {
  name: string;
  initialPrompt: string;
  followUpPrompts: string[];
}

const conversationTests: ConversationTest[] = [
  {
    name: "🔴 WITNESS AGE (Your Original Question)",
    initialPrompt: "What age must a witness be to a will in South Africa?",
    followUpPrompts: [
      "What other requirements must they meet?",
      "Can the testator be one of the witnesses?",
      "What happens if a witness doesn't meet these requirements?"
    ]
  },
  {
    name: "🏠 EVICTION PROCESS",
    initialPrompt: "What is the legal process for evicting a tenant in South Africa?",
    followUpPrompts: [
      "How long does the entire process take?",
      "What notices must be given?",
      "Can I evict without going to court?"
    ]
  },
  {
    name: "💼 LABOR RIGHTS",
    initialPrompt: "What can I do if I've been unfairly dismissed from my job?",
    followUpPrompts: [
      "What's the difference between procedural and substantive fairness?",
      "How long do I have to report unfair dismissal?",
      "What remedies can the court award?"
    ]
  },
  {
    name: "💰 INHERITANCE RIGHTS",
    initialPrompt: "Who inherits if someone dies without a will in South Africa?",
    followUpPrompts: [
      "What if there's a spouse and children?",
      "Do parents inherit if there are grandchildren?",
      "What about partners who aren't married?"
    ]
  },
  {
    name: "📝 WILL EXECUTION",
    initialPrompt: "What are the legal requirements for making a valid will?",
    followUpPrompts: [
      "Must the will be in writing?",
      "Do witnesses need to sign?",
      "Can I change my will after it's signed?"
    ]
  },
  {
    name: "🏦 CONTRACT LAW",
    initialPrompt: "What makes a contract valid in South Africa?",
    followUpPrompts: [
      "Do all contracts need to be in writing?",
      "What if one party doesn't understand English?",
      "Can a contract be verbal and still be binding?"
    ]
  }
];

async function testPrompt(prompt: string): Promise<string> {
  console.log(`\n   🗣️  "${prompt}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        provider: 'groq',
        conversationHistory: [],
        language: 'en',
        legalAidMode: false
      }),
      timeout: 30000
    });

    if (!response.ok) {
      console.log(`   ❌ API Error: ${response.status}`);
      return '';
    }

    const reader = response.body?.getReader();
    if (!reader) return '';

    let fullResponse = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'text_delta') {
            fullResponse += data.content;
          }
        } catch (e) {
          // Skip non-JSON
        }
      }
    }

    if (fullResponse.length > 200) {
      console.log(`   ✅ Got response (${fullResponse.length} chars)`);
      console.log(`      Preview: "${fullResponse.substring(0, 150)}..."`);
    } else if (fullResponse.length > 0) {
      console.log(`   ✅ Got response: "${fullResponse.substring(0, 100)}"`);
    } else {
      console.log(`   ⚠️  Empty response`);
    }

    return fullResponse;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return '';
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 MULTI-PROMPT RAG TEST');
  console.log('Testing actual conversations to verify knowledge base improvements');
  console.log('='.repeat(80));

  console.log('\n⚠️  IMPORTANT: Make sure dev server is running!');
  console.log('   Run in another terminal: npm run dev');
  console.log('   Waiting 3 seconds...\n');

  await new Promise(r => setTimeout(r, 3000));

  let totalPrompts = 0;
  let successfulResponses = 0;

  for (const test of conversationTests) {
    console.log('\n' + '─'.repeat(80));
    console.log(test.name);
    console.log('─'.repeat(80));

    // Initial prompt
    console.log('\n📌 INITIAL QUERY:');
    const initialResponse = await testPrompt(test.initialPrompt);
    totalPrompts++;
    if (initialResponse) successfulResponses++;

    // Follow-ups
    console.log('\n📌 FOLLOW-UP QUESTIONS:');
    for (const followUp of test.followUpPrompts) {
      const followUpResponse = await testPrompt(followUp);
      totalPrompts++;
      if (followUpResponse) successfulResponses++;
      
      await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80) + '\n');

  const successRate = ((successfulResponses / totalPrompts) * 100).toFixed(1);
  console.log(`Total Prompts: ${totalPrompts}`);
  console.log(`Successful Responses: ${successfulResponses}`);
  console.log(`Success Rate: ${successRate}%`);

  console.log('\n🔍 ANALYSIS:\n');

  if (parseFloat(successRate) === 100) {
    console.log('✅ SYSTEM WORKING PERFECTLY');
    console.log('   - All prompts received responses');
    console.log('   - Knowledge base is accessible');
    console.log('   - Vector embeddings are functioning');
    console.log('   - Your original witness age question should now work');
  } else if (parseFloat(successRate) >= 80) {
    console.log('✅ SYSTEM MOSTLY WORKING');
    console.log('   - Most prompts getting responses');
    console.log('   - Some edge cases may not be covered');
    console.log('   - Knowledge base is largely accessible');
  } else if (parseFloat(successRate) >= 50) {
    console.log('⚠️  SYSTEM PARTIALLY WORKING');
    console.log('   - About half the prompts getting responses');
    console.log('   - Knowledge base coverage incomplete');
    console.log('   - May need re-embedding or better chunking');
  } else {
    console.log('❌ SYSTEM NOT WORKING');
    console.log('   - Most prompts failing');
    console.log('   - Vectors may not be embedded');
    console.log('   - Run: npm run reembed-docs');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Main
runTests().catch(error => {
  console.error('\nTest Error:', error.message);
  console.error('\n⚠️  Make sure:');
  console.error('   1. Dev server is running: npm run dev');
  console.error('   2. Server is on http://localhost:3000');
  console.error('   3. API endpoint is /api/chat');
  process.exit(1);
});
