import fetch from 'node-fetch';

async function compareProviders() {
  console.log('🧪 Comparing Ollama vs Groq Response Times\n');
  console.log('='.repeat(80));

  const query = "What are the essential elements of a valid contract?";

  // Test with Ollama (default)
  console.log('\n📍 Testing with OLLAMA (local)...');
  try {
    const start1 = Date.now();
    const res1 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query }),
    });
    const data1 = await res1.json();
    const time1 = ((Date.now() - start1) / 1000).toFixed(2);
    
    console.log(`✅ Ollama Response Time: ${time1}s`);
    console.log(`   Answer length: ${(data1.answer?.length || 0)} characters`);
    console.log(`   Sources: ${data1.sources?.length || 0}`);
  } catch (error) {
    console.error('❌ Ollama error:', (error as any).message);
  }

  // Test with Groq
  console.log('\n📍 Testing with GROQ (cloud)...');
  try {
    const start2 = Date.now();
    const res2 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, provider: 'groq' }),
    });
    const data2 = await res2.json();
    const time2 = ((Date.now() - start2) / 1000).toFixed(2);
    
    console.log(`✅ Groq Response Time: ${time2}s`);
    console.log(`   Answer length: ${(data2.answer?.length || 0)} characters`);
    console.log(`   Sources: ${data2.sources?.length || 0}`);
    
    // Check citations
    const hasActualSources = /\(\*[^*]+\*\)/i.test(data2.answer || '');
    console.log(`   Citations with actual names: ${hasActualSources ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Groq error:', (error as any).message);
  }

  console.log('\n' + '='.repeat(80));
}

compareProviders();
