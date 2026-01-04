import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/chat';

async function testQuery(query: string) {
  console.log('Query:', query);
  console.log('---');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, conversationHistory: [] })
  });
  
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  let answer = '';
  let sources: any[] = [];
  let metadata: any = {};
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'text_delta') answer += data.content;
      if (data.type === 'sources') sources = data.content;
      if (data.type === 'metadata') metadata = data.content;
    } catch (e) {}
  }
  
  console.log('Sources found:', sources.length);
  sources.forEach((s, i) => console.log(`  [${i+1}] ${s.title} (${(s.relevance * 100).toFixed(1)}%)`));
  console.log('\nMetadata:', metadata);
  console.log('\nAnswer:', answer.substring(0, 800));
}

const query = process.argv[2] || 'In the leading actio de pauperie case, what breed was the cat that attacked the plaintiff?';
testQuery(query).catch(console.error);
