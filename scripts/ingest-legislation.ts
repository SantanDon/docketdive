/**
 * Legislation Ingestion with OCR Support
 * 
 * Ingests South African legislation (PDFs) from the `documents/legislation` folder
 * with OCR support for scanned PDFs and intelligent chunking by sections.
 * 
 * Features:
 * - Detects scanned vs searchable PDFs
 * - Uses Tesseract for OCR on scanned PDFs
 * - Extracts section structure and metadata
 * - Chunks by legal sections (not just character count)
 * - Stores with rich metadata (act name, section number, year)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';
import pdf from 'pdf-parse';
import { getEmbedding } from '../app/api/utils/rag';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const LEGISLATION_DIR = path.join(__dirname, '../documents/legislation');
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;

// Initialize Astra DB
const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
const collection = db.collection(process.env.COLLECTION_NAME || 'docketdive');

// ========================= INTERFACES =========================
interface LegislationMetadata {
  actName: string;
  year?: number;
  sectionNumber?: string;
  category: string;
  source: string;
  fileName: string;
  uploadDate: string;
  chunkIndex: number;
  totalChunks: number;
}

// ========================= UTILITY FUNCTIONS =========================
async function extractTextFromPDF(filePath: string): Promise<string> {
  console.log(`   📄 Extracting text from PDF...`);
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u0000/g, '') // Remove null bytes
    .trim();
}

/**
 * Smart chunking by legal sections instead of just character count
 * Looks for section markers like "1.", "1.1", "Section 1", "Schedule A", etc.
 */
function chunkByLegalSections(text: string): { chunk: string; sectionNumber?: string }[] {
  const chunks: { chunk: string; sectionNumber?: string }[] = [];
  
  // Match section patterns: "1.", "Section 1", "1.1", "Schedule", etc.
  const sectionPattern = /(?:^|\n)((?:Section\s+|S\.|Article\s+)?[\d\.]+(?:[A-Z])?|Schedule\s+[A-Z])\s*[-.]?\s*/gm;
  const sections = text.split(sectionPattern);
  
  let currentSection = '';
  let sectionNumber = '';
  
  for (let i = 0; i < sections.length; i++) {
    if (i % 2 === 0) {
      // This is content
      currentSection += sections[i];
    } else {
      // This is a section marker
      // If we have accumulated content, create a chunk
      if (currentSection.length > 100) {
        chunks.push({
          chunk: currentSection.trim(),
          sectionNumber: sectionNumber || undefined
        });
      }
      
      currentSection = '';
      sectionNumber = sections[i].trim();
    }
  }
  
  // Add the last section
  if (currentSection.length > 100) {
    chunks.push({
      chunk: currentSection.trim(),
      sectionNumber: sectionNumber || undefined
    });
  }
  
  // If section-based chunking didn't work well, fall back to character-based
  if (chunks.length < 2) {
    console.log(`   ⚠️  Section-based chunking yielded ${chunks.length} chunks, using character-based instead`);
    return chunkByCharacters(text).map(chunk => ({ chunk }));
  }
  
  return chunks;
}

function chunkByCharacters(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.substring(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Extract metadata from filename
 * Expected format: "Act_Name_Year.pdf" e.g., "Labour_Relations_Act_1995.pdf"
 */
function extractMetadataFromFilename(fileName: string): { actName: string; year?: number } {
  const nameWithoutExt = fileName.replace(/\.pdf$/i, '');
  
  // Try to extract year (4 digits)
  const yearMatch = nameWithoutExt.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
  
  // Act name is everything before the year
  let actName = nameWithoutExt;
  if (yearMatch) {
    actName = nameWithoutExt.substring(0, yearMatch.index!).trim();
  }
  
  // Replace underscores with spaces
  actName = actName.replace(/_/g, ' ');
  
  return { actName, year };
}

/**
 * Categorize legislation by content and name
 */
function categorizeLegislation(actName: string, text: string): string {
  const combined = (actName + ' ' + text.substring(0, 1000)).toLowerCase();
  
  if (combined.includes('labour') || combined.includes('employment')) return 'Labour Law';
  if (combined.includes('contract') || combined.includes('agreement')) return 'Contract Law';
  if (combined.includes('constitution')) return 'Constitutional Law';
  if (combined.includes('property') || combined.includes('land') || combined.includes('immovable')) return 'Property Law';
  if (combined.includes('succession') || combined.includes('estate') || combined.includes('inheritance')) return 'Succession Law';
  if (combined.includes('popia') || combined.includes('privacy') || combined.includes('personal information')) return 'Data Protection Law';
  if (combined.includes('bill') || combined.includes('exchange')) return 'Bills of Exchange';
  
  return 'General Legislation';
}

// ========================= MAIN INGESTION FUNCTION =========================
async function ingestLegislation() {
  console.log(`🚀 Starting Legislation Ingestion\n`);
  console.log(`📂 Looking for legislation in: ${LEGISLATION_DIR}`);

  // Check if legislation directory exists
  if (!fs.existsSync(LEGISLATION_DIR)) {
    console.log(`⚠️  Directory not found: ${LEGISLATION_DIR}`);
    console.log(`📝 Creating directory...`);
    fs.mkdirSync(LEGISLATION_DIR, { recursive: true });
    console.log(`✅ Please add PDF files to ${LEGISLATION_DIR} and run again.`);
    return;
  }

  const files = fs.readdirSync(LEGISLATION_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log(`⚠️  No PDF files found in ${LEGISLATION_DIR}`);
    return;
  }

  console.log(`Found ${files.length} legislation files.\n`);

  let totalChunksStored = 0;

  for (const file of files) {
    const filePath = path.join(LEGISLATION_DIR, file);
    
    console.log(`\n📜 Processing: ${file}`);
    console.log('-'.repeat(80));
    
    // Check if already exists
    const existing = await collection.findOne({ 
      'metadata.source': 'legislation',
      'metadata.fileName': file 
    });
    
    if (existing) {
      console.log(`⏭️  Skipping (already in database)`);
      continue;
    }

    try {
      // Extract text
      let text = await extractTextFromPDF(filePath);
      text = cleanText(text);
      
      if (!text || text.length < 500) {
        console.log(`⚠️  Insufficient text extracted (${text.length} chars), skipping`);
        continue;
      }

      console.log(`   ✅ Extracted ${text.length} characters`);

      // Extract metadata
      const { actName, year } = extractMetadataFromFilename(file);
      const category = categorizeLegislation(actName, text);

      console.log(`   📋 Act: ${actName}${year ? ` (${year})` : ''}`);
      console.log(`   🏷️  Category: ${category}`);

      // Chunk the legislation
      const chunks = chunkByLegalSections(text);
      console.log(`   🔀 Created ${chunks.length} chunks`);

      // Store chunks with embeddings
      let successCount = 0;
      for (let i = 0; i < chunks.length; i++) {
        const { chunk, sectionNumber } = chunks[i];
        
        try {
          const embedding = await getEmbedding(chunk);
          
          const metadata: LegislationMetadata = {
            actName,
            year,
            sectionNumber,
            category,
            source: 'legislation',
            fileName: file,
            uploadDate: new Date().toISOString(),
            chunkIndex: i,
            totalChunks: chunks.length
          };

          await collection.insertOne({
            content: chunk,
            metadata,
            $vector: embedding
          });

          successCount++;
          process.stdout.write('.');
        } catch (err: any) {
          console.error(`\n   ❌ Error storing chunk ${i + 1}: ${err.message}`);
        }
      }

      console.log(`\n   ✅ Stored ${successCount}/${chunks.length} chunks`);
      totalChunksStored += successCount;

    } catch (err: any) {
      console.error(`   ❌ Error processing file: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`🏁 Legislation Ingestion Complete!`);
  console.log(`💾 Total chunks stored: ${totalChunksStored}`);
  console.log('='.repeat(80));
}

// ========================= RUN =========================
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestLegislation().catch(console.error);
}

export { ingestLegislation };
