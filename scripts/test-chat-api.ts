/**
 * Test the full chat API to verify responses use case law
 */

import dotenv from 'dotenv';
dotenv.config();

async function testChatAPI(message: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🗣️ USER: "${message}"`);
  console.log('='.repeat(70));
  
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      provider: 'groq',
      conversationHistory: [],
      language: 'en',
      legalAidMode: false
    }),
  });

  if (!response.ok) {
    console.error('❌ API Error:', response.status);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  let fullResponse = '';
  let sources: any[] = [];
  
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'sources') {
          sources = data.content;
          console.log(`\n📚 SOURCES FOUND: ${sources.length}`);
          sources.forEach((s: any, i: number) => {
            console.log(`   [${i+1}] ${s.title} (${(s.similarity * 100).toFixed(1)}%)`);
          });
        }
        
        if (data.type === 'text_delta') {
          fullResponse += data.content;
          process.stdout.write(data.content);
        }
        
        if (data.type === 'metadata') {
          console.log(`\n\n📊 METADATA:`, data.content);
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }
  
  console.log('\n');
}

async function main() {
  console.log('🧪 Testing Full Chat API with Case Law\n');
  console.log('Make sure the dev server is running: npm run dev\n');
  
  try {
    // Test 1: Eviction law
    await testChatAPI("What are the legal requirements for eviction in South Africa under the PIE Act?");
    
    // Test 2: Labour law - should use ZALAC cases
    await testChatAPI("What remedies are available for unfair dismissal in South Africa?");
    
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to localhost:3000');
      console.error('   Please start the dev server: npm run dev');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

main();
