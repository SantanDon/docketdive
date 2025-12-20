import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { getEmbedding } from '../app/api/utils/rag';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const DOCUMENTS_DIR = path.join(__dirname, '../documents');
const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 150;

// Initialize Astra DB
const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
const collection = db.collection(process.env.COLLECTION_NAME || 'docketdive');

async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  
  return '';
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.substring(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks.filter(chunk => chunk.length > 50);
}

async function ingestFolder() {
  console.log(`🚀 Starting ingestion from ${DOCUMENTS_DIR}...`);

  if (!fs.existsSync(DOCUMENTS_DIR)) {
    console.error(`❌ Directory not found: ${DOCUMENTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(DOCUMENTS_DIR).filter(f => ['.pdf', '.docx', '.txt'].includes(path.extname(f).toLowerCase()));
  console.log(`Found ${files.length} documents.`);

  for (const file of files) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    
    // 1. Check if already exists
    const existing = await collection.findOne({ 'metadata.fileName': file });
    if (existing) {
      console.log(`⏭️  Skipping ${file} (Already in DB)`);
      continue;
    }

    console.log(`Processing ${file}...`);
    
    try {
      // 2. Extract Text
      const text = await extractText(filePath);
      if (!text || text.length < 50) {
        console.warn(`  ⚠️  No text extracted from ${file}`);
        continue;
      }

      // 3. Chunk
      const chunks = chunkText(text);
      console.log(`  📄 Extracted ${chunks.length} chunks.`);

      // 4. Embed and Store
      let successCount = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!;
        try {
            const embedding = await getEmbedding(chunk);
            await collection.insertOne({
                content: chunk,
                metadata: {
                    source: 'local_ingestion',
                    fileName: file,
                    uploadDate: new Date().toISOString(),
                    chunkIndex: i,
                    totalChunks: chunks.length,
                    title: file,
                    category: 'Legal Act'
                },
                $vector: embedding,
            });
            successCount++;
            process.stdout.write('.'); // Progress dot
        } catch (err: any) {
            console.error(`\n  ❌ Error chunk ${i}:`, err.message);
        }
      }
      console.log(`\n  ✅ Successfully stored ${successCount}/${chunks.length} chunks.`);

    } catch (err: any) {
      console.error(`  ❌ Error processing file ${file}:`, err.message);
    }
  }

  console.log('\n✨ Ingestion complete!');
}

ingestFolder();
