/**
 * Quick test for fake case handling
 */
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/chat';

async function test() {
  console.log('🧪 Testing FAKE case handling...\n');
  
  const query = "Tell me about Smith v Jones 2019 defamation case";
  console.log(`Query: "${query}"\n`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, conversationHistory: [] }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      return;
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    let answer = '';
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'text_delta') answer += data.content;
      } catch (e) {}
    }
    
    console.log('Response:');
    console.log(answer.substring(0, 600));
    
    // Check if it refused or hallucinated
    const hallucinated = answer.toLowerCase().includes('smith v jones') && 
                         !answer.toLowerCase().includes("don't have");
    
    if (hallucinated) {
      console.log('\n❌ FAILED - LLM hallucinated the fake case');
    } else {
      console.log('\n✅ PASSED - LLM refused or said it doesn\'t have info');
    }
    
  } catch (err: any) {
    clearTimeout(timeout);
    console.log(`❌ Error: ${err.message}`);
  }
}

test().catch(console.error);
