/**
 * Test that the Van Meyeren v Cloete case is correctly retrieved and described
 */
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/chat';

async function testVanMeyerenCase() {
  console.log('🧪 Testing Van Meyeren v Cloete case accuracy...\n');
  
  const testQueries = [
    'What is actio de pauperie in South African law? Give me a case example.',
    'Tell me about the Van Meyeren v Cloete case',
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('─'.repeat(60));
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: []
        })
      });
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`);
        continue;
      }
      
      // Parse streaming response
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      let answer = '';
      let sources: any[] = [];
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'text_delta') {
            answer += data.content;
          } else if (data.type === 'sources') {
            sources = data.content || [];
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
      
      // Check for accuracy markers
      const checks = {
        'Mentions Van Meyeren': /van\s*meyeren/i.test(answer),
        'Correct citation [2020] ZAWCHC 107': /\[?2020\]?\s*ZAWCHC\s*107/i.test(answer),
        'Mentions Johannes Petrus (male)': /johannes\s*petrus/i.test(answer),
        'Mentions gardener': /gardener/i.test(answer),
        'Mentions Boerboel/dog': /boerboel|dog/i.test(answer),
        'Does NOT say "she" for plaintiff': !/plaintiff.*she|she.*plaintiff/i.test(answer),
        'Mentions actio de pauperie': /actio\s*de\s*pauperie/i.test(answer),
        'Mentions strict liability': /strict\s*liability/i.test(answer),
      };
      
      console.log('\n✅ Accuracy Checks:');
      let passed = 0;
      let failed = 0;
      
      for (const [check, result] of Object.entries(checks)) {
        const icon = result ? '✓' : '✗';
        console.log(`   ${icon} ${check}`);
        if (result) passed++;
        else failed++;
      }
      
      console.log(`\n📊 Score: ${passed}/${passed + failed} checks passed`);
      console.log(`📚 Sources retrieved: ${sources.length}`);
      
      // Show relevant excerpt
      console.log('\n📄 Response excerpt (first 1200 chars):');
      console.log(answer.substring(0, 1200) + '...');
      
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
}

testVanMeyerenCase().catch(console.error);
