/**
 * Simple accuracy test - just a few key tests
 */
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/chat';

async function testQuery(name: string, query: string) {
  console.log(`\n🧪 ${name}`);
  console.log(`   Query: "${query}"`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, conversationHistory: [] })
    });
    
    if (!response.ok) {
      console.log(`   ❌ API Error: ${response.status}`);
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
    
    console.log(`   Response (first 400 chars):`);
    console.log(`   ${answer.substring(0, 400).replace(/\n/g, '\n   ')}...`);
    
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function main() {
  console.log('🔬 SIMPLE ACCURACY TEST\n');
  
  // Test 1: Real case we have
  await testQuery(
    "Real case - Van Meyeren",
    "Tell me about Van Meyeren v Cloete"
  );
  
  // Test 2: Fake case
  await testQuery(
    "FAKE case - should refuse",
    "Tell me about Smith v Jones 2019 defamation case"
  );
  
  // Test 3: Gender correction
  await testQuery(
    "Gender test - should say male/he",
    "Was the plaintiff in Van Meyeren v Cloete a woman?"
  );
  
  console.log('\n✅ Test complete');
}

main().catch(console.error);
