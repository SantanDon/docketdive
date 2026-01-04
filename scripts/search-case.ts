/**
 * Search for a specific case in the database using vector search
 */
import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
dotenv.config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY?.trim();

async function getEmbedding(text: string): Promise<number[]> {
  const model = "intfloat/multilingual-e5-large";
  const prefixedText = `query: ${text.trim()}`;
  
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      inputs: prefixedText,
      options: { wait_for_model: true }
    }),
  });

  if (!response.ok) {
    throw new Error(`HF error: ${response.status}`);
  }

  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : result;
}

async function searchCase() {
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
  const collection = db.collection('docketdive');
  
  console.log('Searching for Van Meyeren / actio de pauperie cases...\n');
  
  // Search queries
  const searchQueries = [
    'Van Meyeren v Cloete actio de pauperie dog bite case',
    'actio de pauperie animal liability South African law',
    'dog attack liability owner responsibility South Africa'
  ];
  
  for (const query of searchQueries) {
    console.log(`\n🔍 Searching for: "${query}"`);
    
    try {
      const vector = await getEmbedding(query);
      console.log(`   Embedding dimension: ${vector.length}`);
      
      const results = await collection.find({}, {
        sort: { $vector: vector },
        limit: 5,
        includeSimilarity: true,
        projection: { content: 1, metadata: 1 }
      }).toArray();
      
      console.log(`   Found ${results.length} results`);
      
      results.forEach((r: any, i: number) => {
        const similarity = (r.$similarity * 100).toFixed(1);
        console.log(`   [${i+1}] ${similarity}% - ${r.metadata?.title || 'Unknown'}`);
        console.log(`       Source: ${r.metadata?.source || 'Unknown'}`);
        console.log(`       Court: ${r.metadata?.court || 'Unknown'}`);
        console.log(`       Content preview: ${r.content?.substring(0, 200)}...`);
      });
    } catch (err: any) {
      console.log(`   Error: ${err.message}`);
    }
  }
}

searchCase().catch(console.error);
