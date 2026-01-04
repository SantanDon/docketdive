/**
 * Quick script to check Astra DB contents
 */
import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
  const collection = db.collection('docketdive');
  
  console.log('Checking docketdive collection...\n');
  
  // Get sample to estimate
  const sample = await collection.find({}).limit(1000).toArray();
  console.log(`📊 Found at least ${sample.length} documents`);
  
  // Count unique URLs from sample
  const uniqueUrls = new Set(sample.map(d => d.metadata?.url));
  console.log(`📁 Unique cases in sample: ${uniqueUrls.size}`);
  
  // Count by court
  const courtCounts: Record<string, number> = {};
  for (const doc of sample) {
    const court = doc.metadata?.court || 'Unknown';
    courtCounts[court] = (courtCounts[court] || 0) + 1;
  }
  
  console.log('\n📁 By Court (from sample):');
  for (const [court, count] of Object.entries(courtCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${court}: ${count} chunks`);
  }
}

main().catch(console.error);
