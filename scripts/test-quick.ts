/**
 * Quick accuracy test with short timeout
 */
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/chat';

async function testQuery(name: string, query: string, timeoutMs: number = 45000) {
  console.log(`\n🧪 ${name}`);
  console.log(`   Query: "${query}"`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, conversationHistory: [] }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log(`   ❌ API Error: ${response.status}`);
      return null;
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
    
    console.log(`   ✅ Got response (${answer.length} chars)`);
    return answer;
    
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.log(`   ⏱️ Timeout after ${timeoutMs/1000}s`);
    } else {
      console.log(`   ❌ Error: ${err.message}`);
    }
    return null;
  }
}

async function main() {
  console.log('🔬 QUICK ACCURACY TEST\n');
  console.log('Testing with 45s timeout per query...');
  
  // Test 1: Real case
  const r1 = await testQuery("Real case - Van Meyeren", "Tell me about Van Meyeren v Cloete");
  if (r1) {
    const hasCorrectName = r1.toLowerCase().includes('johannes') || r1.toLowerCase().includes('petrus');
    const hasGardener = r1.toLowerCase().includes('gardener');
    const hasMale = r1.includes(' he ') || r1.includes(' his ');
    console.log(`   Checks: Name=${hasCorrectName}, Gardener=${hasGardener}, Male=${hasMale}`);
  }
  
  // Test 2: Gender correction
  const r2 = await testQuery("Gender correction", "Was the plaintiff in Van Meyeren v Cloete a woman?");
  if (r2) {
    const saysNo = r2.toLowerCase().includes('no') || r2.toLowerCase().includes('male') || r2.includes(' he ');
    const saysWoman = r2.toLowerCase().includes('yes') && r2.toLowerCase().includes('woman');
    console.log(`   Checks: CorrectlyDenied=${saysNo}, WronglyAgreed=${saysWoman}`);
  }
  
  console.log('\n✅ Test complete');
}

main().catch(console.error);
