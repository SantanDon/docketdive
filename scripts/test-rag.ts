/**
 * Test RAG retrieval to verify case law is being used correctly
 */

import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
dotenv.config();

const HF_EMBED_MODEL = "intfloat/multilingual-e5-large";

async function generateQueryEmbedding(text: string): Promise<number[]> {
  const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
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
    throw new Error(`HF API error: ${response.status}`);
  }

  const result = await response.json();
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
}

async function testQuery(query: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 QUERY: "${query}"`);
  console.log('='.repeat(60));
  
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
  const collection = db.collection('docketdive');
  
  // Generate embedding for query
  console.log('\n📡 Generating query embedding...');
  const queryVector = await generateQueryEmbedding(query);
  console.log(`✅ Embedding generated (${queryVector.length} dimensions)`);
  
  // Search vector database
  console.log('\n🔎 Searching vector database...');
  const results = await collection.find({}, {
    sort: { $vector: queryVector },
    limit: 5,
    includeSimilarity: true,
    projection: { content: 1, metadata: 1 },
  }).toArray();
  
  console.log(`\n📚 Found ${results.length} relevant documents:\n`);
  
  for (let i = 0; i < results.length; i++) {
    const doc = results[i];
    if (!doc) continue;
    const similarity = ((doc.$similarity ?? 0) * 100).toFixed(1);
    const court = doc.metadata?.court || 'Unknown';
    const url = doc.metadata?.url || '';
    const content = doc.content?.substring(0, 300) || '';
    
    console.log(`[${i + 1}] Similarity: ${similarity}%`);
    console.log(`    Court: ${court}`);
    console.log(`    URL: ${url}`);
    console.log(`    Content: ${content}...`);
    console.log();
  }
  
  return results;
}

async function main() {
  console.log('🧪 Testing RAG Retrieval with Ingested Case Law\n');
  
  // Test queries that should match our ingested content
  const testQueries = [
    "What are the constitutional requirements for eviction in South Africa?",
    "Labour court unfair dismissal remedies",
    "Constitutional Court interpretation of property rights",
  ];
  
  for (const query of testQueries) {
    await testQuery(query);
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }
  
  console.log('\n✅ RAG Test Complete!');
}

main().catch(console.error);
