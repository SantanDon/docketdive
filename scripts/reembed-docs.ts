/**
 * Re-embed existing documents with proper HuggingFace embeddings
 * This fixes documents that were ingested with fallback hash embeddings
 */

import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
dotenv.config();

const HF_EMBED_MODEL = "intfloat/multilingual-e5-large";
const BATCH_SIZE = 5; // Process 5 docs at a time to avoid rate limits

async function generateEmbedding(text: string): Promise<number[]> {
  const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY required for re-embedding');
  }

  const prefixedText = `passage: ${text.substring(0, 8000)}`;
  
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

async function main() {
  console.log('🔄 Re-embedding documents with HuggingFace model...\n');
  
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
  const collection = db.collection('docketdive');
  
  // Get all documents
  const docs = await collection.find({}).limit(500).toArray();
  console.log(`Found ${docs.length} documents to re-embed\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    
    for (const doc of batch) {
      try {
        const content = doc.content || '';
        if (content.length < 50) continue;
        
        const embedding = await generateEmbedding(content);
        
        // Update the document with new embedding
        await collection.updateOne(
          { _id: doc._id },
          { $set: { $vector: embedding } }
        );
        
        updated++;
        process.stdout.write(`\r✅ Updated ${updated}/${docs.length} documents`);
        
        // Rate limit
        await new Promise(r => setTimeout(r, 200));
      } catch (error: any) {
        failed++;
        console.error(`\n❌ Failed ${doc._id}: ${error.message}`);
      }
    }
    
    // Longer pause between batches
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n\n🎉 Complete! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
