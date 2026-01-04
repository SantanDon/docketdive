/**
 * Firecrawl Legal Data Ingestion Pipeline
 * 
 * Crawls South African legal sources and ingests them into the vector database.
 * Primary sources: SAFLII, Government Gazette, Parliament, Info Regulator
 * 
 * Usage:
 *   npx tsx scripts/firecrawl-ingest.ts --court=ZACC --limit=10
 *   npx tsx scripts/firecrawl-ingest.ts --all --limit=5
 */

import { FirecrawlClient } from '@mendable/firecrawl-js';
import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// Configuration
// ============================================

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const ASTRA_DB_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
const ASTRA_DB_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT;
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'docketdive';

// SA Court codes for SAFLII
const COURT_CODES = {
  ZACC: { name: 'Constitutional Court', priority: 1 },
  ZASCA: { name: 'Supreme Court of Appeal', priority: 2 },
  ZAGPJHC: { name: 'Gauteng High Court (Johannesburg)', priority: 3 },
  ZAGPPHC: { name: 'Gauteng High Court (Pretoria)', priority: 3 },
  ZAWCHC: { name: 'Western Cape High Court', priority: 3 },
  ZAKZDHC: { name: 'KwaZulu-Natal High Court (Durban)', priority: 3 },
  ZAECGHC: { name: 'Eastern Cape High Court (Grahamstown)', priority: 3 },
  ZALAC: { name: 'Labour Appeal Court', priority: 4 },
  ZALC: { name: 'Labour Court', priority: 4 },
} as const;

type CourtCode = keyof typeof COURT_CODES;

// ============================================
// Interfaces
// ============================================

interface CaseMetadata {
  citation: string | null;
  caseName: string | null;
  court: string;
  date: Date | null;
  judges: string[];
  parties: string[];
  url: string;
}

interface IngestDocument {
  content: string;
  metadata: CaseMetadata & {
    source: string;
    ingestedAt: Date;
    chunkIndex?: number;
  };
}

// ============================================
// Firecrawl Client
// ============================================

let firecrawlClient: FirecrawlClient | null = null;

function getFirecrawlClient(): FirecrawlClient {
  if (!firecrawlClient) {
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not set in environment variables');
    }
    firecrawlClient = new FirecrawlClient({ apiKey: FIRECRAWL_API_KEY });
  }
  return firecrawlClient;
}

// ============================================
// Astra DB Client
// ============================================

let astraCollection: any = null;

async function getAstraCollection() {
  if (!astraCollection) {
    if (!ASTRA_DB_TOKEN || !ASTRA_DB_ENDPOINT) {
      throw new Error('Astra DB credentials not set');
    }
    const client = new DataAPIClient(ASTRA_DB_TOKEN);
    const db = client.db(ASTRA_DB_ENDPOINT);
    astraCollection = db.collection(COLLECTION_NAME);
  }
  return astraCollection;
}

// ============================================
// Metadata Extraction
// ============================================

function extractCaseMetadata(markdown: string, url: string, courtCode: string): CaseMetadata {
  const metadata: CaseMetadata = {
    citation: null,
    caseName: null,
    court: COURT_CODES[courtCode as CourtCode]?.name || courtCode,
    date: null,
    judges: [],
    parties: [],
    url,
  };

  // Extract citation patterns
  const neutralCitationMatch = markdown.match(/\[(\d{4})\]\s*(ZA[A-Z]+)\s*(\d+)/);
  if (neutralCitationMatch) {
    metadata.citation = neutralCitationMatch[0];
  }

  const saLawReportsMatch = markdown.match(/(\d{4})\s*\((\d+)\)\s*SA\s*(\d+)\s*\(([A-Z]+)\)/);
  if (saLawReportsMatch && !metadata.citation) {
    metadata.citation = saLawReportsMatch[0];
  }

  // Extract case name
  const caseNameMatch = markdown.match(/^#\s*(.+?)(?:\n|$)/m) || 
                        markdown.match(/\*\*(.+?)\*\*/);
  if (caseNameMatch && caseNameMatch[1]) {
    metadata.caseName = caseNameMatch[1].trim().substring(0, 200);
  }

  // Extract date
  const datePatterns = [
    /(?:Date|Decided|Judgment)[:\s]+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
  ];
  
  for (const pattern of datePatterns) {
    const dateMatch = markdown.match(pattern);
    if (dateMatch) {
      const dateStr = `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`;
      metadata.date = new Date(dateStr);
      if (!isNaN(metadata.date.getTime())) break;
      metadata.date = null;
    }
  }

  // Extract judges
  const judgesMatch = markdown.match(/(?:Coram|Before|Judge[s]?)[:\s]+([^\n]+)/i);
  if (judgesMatch && judgesMatch[1]) {
    metadata.judges = judgesMatch[1]
      .split(/[,;]/)
      .map(j => j.trim())
      .filter(j => j.length > 2 && j.length < 50);
  }

  return metadata;
}

// ============================================
// Chunking
// ============================================

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '800', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '150', 10);

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      const sentenceBreak = text.lastIndexOf('. ', end);
      
      if (paragraphBreak > start + CHUNK_SIZE / 2) {
        end = paragraphBreak + 2;
      } else if (sentenceBreak > start + CHUNK_SIZE / 2) {
        end = sentenceBreak + 2;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter(chunk => chunk.length > 50);
}

// ============================================
// Embedding Generation (using HuggingFace - same as RAG)
// ============================================

const HF_EMBED_MODEL = "intfloat/multilingual-e5-large";

async function generateEmbedding(text: string): Promise<number[]> {
  const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  if (!HUGGINGFACE_API_KEY) {
    console.warn('⚠️ HUGGINGFACE_API_KEY not set, using fallback embedding');
    return generateSimpleEmbedding(text);
  }

  try {
    // E5 models require "passage: " prefix for documents
    const prefixedText = text.startsWith("passage:") ? text : `passage: ${text.substring(0, 8000)}`;
    
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
      const errText = await response.text();
      console.error(`HuggingFace API error (${response.status}):`, errText.substring(0, 100));
      // Fall back to simple embedding on error
      return generateSimpleEmbedding(text);
    }

    const result = await response.json();
    const embedding = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
    
    if (!embedding || embedding.length !== 1024) {
      console.warn(`Unexpected embedding dimension: ${embedding?.length}, using fallback`);
      return generateSimpleEmbedding(text);
    }
    
    return embedding;
  } catch (error: any) {
    console.error('Embedding generation failed:', error.message);
    return generateSimpleEmbedding(text);
  }
}

function generateSimpleEmbedding(text: string): number[] {
  // Generate a 1024-dimensional embedding using text hashing
  // This matches the Astra DB collection's vector dimension
  const VECTOR_DIM = 1024;
  const embedding = new Array(VECTOR_DIM).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      // Spread across the full 1024 dimensions
      const idx1 = (charCode * (i + 1) * (j + 1)) % VECTOR_DIM;
      const idx2 = (charCode * (i + 2) * (j + 3)) % VECTOR_DIM;
      const idx3 = ((charCode + i) * (j + 1)) % VECTOR_DIM;
      embedding[idx1] += 1 / (1 + Math.log(words.length + 1));
      embedding[idx2] += 0.5 / (1 + Math.log(words.length + 1));
      embedding[idx3] += 0.25 / (1 + Math.log(words.length + 1));
    }
  }
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

// ============================================
// Vector DB Ingestion
// ============================================

async function ingestToVectorDB(doc: IngestDocument): Promise<void> {
  const collection = await getAstraCollection();
  const chunks = chunkText(doc.content);

  console.log(`  📄 Ingesting ${chunks.length} chunks for: ${doc.metadata.caseName || doc.metadata.url}`);

  // Process in batches for better performance
  const BATCH_SIZE = 10;
  let successCount = 0;
  
  for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
    const batchPromises = [];
    
    for (let i = batchStart; i < batchEnd; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      
      const processChunk = async () => {
        try {
          const embedding = await generateEmbedding(chunk);
          
          const documentId = `${doc.metadata.source}_${doc.metadata.citation || Date.now()}_chunk_${i}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          
          await collection.insertOne({
            _id: documentId,
            $vector: embedding,
            content: chunk,
            metadata: {
              ...doc.metadata,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          });
          
          successCount++;
        } catch (error: any) {
          // Only log non-duplicate errors
          if (!error.message?.includes('Document already exists')) {
            console.error(`  ❌ Failed chunk ${i}:`, error.message?.substring(0, 100));
          }
        }
      };
      
      batchPromises.push(processChunk());
    }
    
    await Promise.all(batchPromises);
    
    // Progress indicator
    if (chunks.length > 20) {
      process.stdout.write(`\r  Progress: ${Math.min(batchEnd, chunks.length)}/${chunks.length} chunks`);
    }
  }
  
  if (chunks.length > 20) {
    console.log(); // New line after progress
  }
  console.log(`  ✅ Successfully ingested ${successCount}/${chunks.length} chunks`);
}

// ============================================
// SAFLII Crawler
// ============================================

export async function crawlSAFLII(courtCode: CourtCode, limit: number = 10): Promise<number> {
  console.log(`\n🔍 Crawling SAFLII - ${COURT_CODES[courtCode].name} (limit: ${limit})`);
  
  const firecrawl = getFirecrawlClient();
  const baseUrl = `https://www.saflii.org/za/cases/${courtCode}/`;

  try {
    console.log(`  📡 Starting crawl of ${baseUrl}...`);
    
    // Use crawl which waits for completion
    // Include pattern to focus on actual case pages (year/number.html format)
    const result = await firecrawl.crawl(baseUrl, {
      limit,
      scrapeOptions: {
        formats: ['markdown'],
      },
      includePaths: [`/za/cases/${courtCode}/20*/*.html`], // Focus on case pages from 2000+
      excludePaths: ['/toc-*', '/index*'], // Exclude table of contents and index pages
    });

    const data = result.data || [];
    console.log(`✅ Crawled ${data.length} pages`);

    let ingested = 0;
    for (const page of data) {
      if (!page.markdown || page.markdown.length < 500) {
        console.log(`  ⏭️  Skipping short page: ${page.metadata?.sourceURL}`);
        continue;
      }

      // Skip index/listing pages
      const url = page.metadata?.sourceURL || '';
      if (url.includes('toc-') || url.endsWith(`/${courtCode}/`) || !url.includes('.html')) {
        console.log(`  ⏭️  Skipping index page: ${url}`);
        continue;
      }

      const metadata = extractCaseMetadata(page.markdown, url, courtCode);
      
      await ingestToVectorDB({
        content: page.markdown,
        metadata: {
          ...metadata,
          source: 'SAFLII',
          ingestedAt: new Date(),
        },
      });
      
      ingested++;
    }

    console.log(`✅ Ingested ${ingested} documents from ${courtCode}`);
    return ingested;

  } catch (error) {
    console.error(`❌ Error crawling ${courtCode}:`, error);
    return 0;
  }
}

// ============================================
// Scrape Single URL (for testing)
// ============================================

export async function scrapeSingleUrl(url: string): Promise<void> {
  console.log(`\n🔍 Scraping single URL: ${url}`);
  
  const firecrawl = getFirecrawlClient();

  try {
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    });

    console.log('✅ Scrape successful!');
    console.log('Title:', result.metadata?.title);
    console.log('Content length:', result.markdown?.length || 0, 'chars');
    console.log('\n--- First 500 chars ---');
    console.log(result.markdown?.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Error scraping:', error);
  }
}

// ============================================
// Scrape Specific Cases (more targeted approach)
// ============================================

export async function scrapeRecentCases(courtCode: CourtCode, year: number = 2024, count: number = 5): Promise<number> {
  console.log(`\n🔍 Scraping recent ${courtCode} cases from ${year} (count: ${count})`);
  
  const firecrawl = getFirecrawlClient();
  let ingested = 0;

  for (let i = 1; i <= count; i++) {
    const url = `https://www.saflii.org/za/cases/${courtCode}/${year}/${i}.html`;
    console.log(`  📡 Trying: ${url}`);
    
    try {
      const result = await firecrawl.scrape(url, {
        formats: ['markdown'],
      });

      if (!result.markdown || result.markdown.length < 1000) {
        console.log(`  ⏭️  Skipping (too short or not found)`);
        continue;
      }

      const metadata = extractCaseMetadata(result.markdown, url, courtCode);
      
      await ingestToVectorDB({
        content: result.markdown,
        metadata: {
          ...metadata,
          source: 'SAFLII',
          ingestedAt: new Date(),
        },
      });
      
      console.log(`  ✅ Ingested: ${metadata.caseName || url}`);
      ingested++;
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`  ⏭️  Not found: ${url}`);
      } else {
        console.error(`  ❌ Error:`, error.message);
      }
    }
  }

  console.log(`\n✅ Ingested ${ingested} cases from ${courtCode} ${year}`);
  return ingested;
}

// ============================================
// Additional SA Legal Sources
// ============================================

const LEGAL_SOURCES = {
  // Government & Legislation
  govza: {
    name: 'Government of SA',
    urls: [
      'https://www.gov.za/documents/acts',
      'https://www.gov.za/documents/regulations',
    ]
  },
  justice: {
    name: 'Department of Justice',
    urls: [
      'https://www.justice.gov.za/legislation/acts/acts.html',
      'https://www.justice.gov.za/rules/rules.html',
    ]
  },
  // Regulatory Bodies
  infoReg: {
    name: 'Information Regulator (POPIA)',
    urls: [
      'https://inforegulator.org.za/guidance-notes/',
      'https://inforegulator.org.za/enforcement-notices/',
    ]
  },
  // Legal Resources
  lawSociety: {
    name: 'Law Society of SA',
    urls: [
      'https://www.lssa.org.za/legal-practitioners/legal-resources/',
    ]
  },
};

export async function scrapeGenericUrl(url: string, sourceName: string): Promise<number> {
  console.log(`\n🔍 Scraping ${sourceName}: ${url}`);
  
  const firecrawl = getFirecrawlClient();

  try {
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    });

    if (!result.markdown || result.markdown.length < 500) {
      console.log(`  ⏭️  Skipping (content too short)`);
      return 0;
    }

    await ingestToVectorDB({
      content: result.markdown,
      metadata: {
        citation: null,
        caseName: result.metadata?.title || url,
        court: sourceName,
        date: new Date(),
        judges: [],
        parties: [],
        url,
        source: sourceName,
        ingestedAt: new Date(),
      },
    });

    console.log(`  ✅ Ingested: ${result.metadata?.title || url}`);
    return 1;
  } catch (error: any) {
    console.error(`  ❌ Error:`, error.message?.substring(0, 100));
    return 0;
  }
}

export async function crawlSource(url: string, sourceName: string, limit: number = 10): Promise<number> {
  console.log(`\n🔍 Crawling ${sourceName}: ${url} (limit: ${limit})`);
  
  const firecrawl = getFirecrawlClient();

  try {
    const result = await firecrawl.crawl(url, {
      limit,
      scrapeOptions: { formats: ['markdown'] },
    });

    const data = result.data || [];
    console.log(`✅ Crawled ${data.length} pages`);

    let ingested = 0;
    for (const page of data) {
      if (!page.markdown || page.markdown.length < 500) continue;

      await ingestToVectorDB({
        content: page.markdown,
        metadata: {
          citation: null,
          caseName: page.metadata?.title || page.metadata?.sourceURL || '',
          court: sourceName,
          date: new Date(),
          judges: [],
          parties: [],
          url: page.metadata?.sourceURL || url,
          source: sourceName,
          ingestedAt: new Date(),
        },
      });
      ingested++;
    }

    console.log(`✅ Ingested ${ingested} documents from ${sourceName}`);
    return ingested;
  } catch (error: any) {
    console.error(`❌ Error crawling ${sourceName}:`, error.message?.substring(0, 100));
    return 0;
  }
}

// ============================================
// Main Entry Points
// ============================================

export async function crawlAllCourts(limitPerCourt: number = 5): Promise<void> {
  console.log('🚀 Starting full SAFLII crawl...\n');
  
  const courts = Object.keys(COURT_CODES) as CourtCode[];
  let totalIngested = 0;

  for (const court of courts) {
    const count = await crawlSAFLII(court, limitPerCourt);
    totalIngested += count;
    
    // Rate limiting between courts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Total documents ingested: ${totalIngested}`);
}

export async function scrapeAllSources(): Promise<void> {
  console.log('🚀 Starting comprehensive SA legal scrape...\n');
  let totalIngested = 0;

  // 1. SAFLII - Priority courts, recent cases
  const priorityCourts: CourtCode[] = ['ZACC', 'ZASCA', 'ZAGPJHC', 'ZAWCHC', 'ZALAC'];
  for (const court of priorityCourts) {
    for (const year of [2024, 2023]) {
      const count = await scrapeRecentCases(court, year, 5);
      totalIngested += count;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 2. Info Regulator (POPIA guidance)
  for (const url of LEGAL_SOURCES.infoReg.urls) {
    const count = await crawlSource(url, 'Info Regulator', 5);
    totalIngested += count;
    await new Promise(r => setTimeout(r, 2000));
  }

  // 3. Government legislation
  for (const url of LEGAL_SOURCES.govza.urls) {
    const count = await crawlSource(url, 'Gov.za', 5);
    totalIngested += count;
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n🎉 COMPLETE! Total documents ingested: ${totalIngested}`);
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Firecrawl Legal Data Ingestion

Usage:
  npx tsx scripts/firecrawl-ingest.ts --court=ZACC --year=2024 --count=10
  npx tsx scripts/firecrawl-ingest.ts --all-sources
  npx tsx scripts/firecrawl-ingest.ts --crawl-url=https://example.com --source=SourceName --limit=10

Options:
  --court=CODE      Court code (ZACC, ZASCA, ZAGPJHC, etc.)
  --year=YYYY       Target specific year for case scraping (default: 2024)
  --count=N         Number of cases to try per year (default: 10)
  --all             Crawl all SAFLII courts
  --all-sources     Comprehensive scrape of all SA legal sources
  --crawl-url=URL   Crawl a specific URL
  --source=NAME     Source name for crawl-url
  --limit=N         Max pages per crawl (default: 10)
  --test-url=URL    Scrape a single URL for testing
  --help            Show this help

Court Codes:
  ZACC    - Constitutional Court
  ZASCA   - Supreme Court of Appeal
  ZAGPJHC - Gauteng High Court (Johannesburg)
  ZAGPPHC - Gauteng High Court (Pretoria)
  ZAWCHC  - Western Cape High Court
  ZALAC   - Labour Appeal Court
  ZALC    - Labour Court
    `);
    return;
  }

  if (!FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY not set');
    process.exit(1);
  }

  // Full comprehensive scrape
  if (args.includes('--all-sources')) {
    await scrapeAllSources();
    return;
  }

  // Custom URL crawl
  const crawlUrlArg = args.find(a => a.startsWith('--crawl-url='));
  if (crawlUrlArg) {
    const url = crawlUrlArg.split('=')[1] || '';
    const sourceArg = args.find(a => a.startsWith('--source='));
    const source = sourceArg ? sourceArg.split('=')[1] || 'Custom' : 'Custom';
    const limitArg = args.find(a => a.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1] || '10', 10) : 10;
    
    await crawlSource(url, source, limit);
    return;
  }

  const testUrlArg = args.find(a => a.startsWith('--test-url='));
  if (testUrlArg) {
    const url = testUrlArg.split('=')[1] || '';
    if (url) await scrapeSingleUrl(url);
    return;
  }

  const courtArg = args.find(a => a.startsWith('--court='));
  const courtCode = courtArg ? courtArg.split('=')[1] as CourtCode : 'ZACC';
  
  if (courtArg && !COURT_CODES[courtCode]) {
    console.error(`❌ Invalid court code: ${courtCode}`);
    process.exit(1);
  }

  const yearArg = args.find(a => a.startsWith('--year='));
  if (yearArg) {
    const year = parseInt(yearArg.split('=')[1] || '2024', 10);
    const countArg = args.find(a => a.startsWith('--count='));
    const count = countArg ? parseInt(countArg.split('=')[1] || '10', 10) : 10;
    await scrapeRecentCases(courtCode, year, count);
    return;
  }

  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || '10', 10) : 10;

  if (args.includes('--all')) {
    await crawlAllCourts(limit);
  } else {
    await crawlSAFLII(courtCode, limit);
  }
}

main().catch(console.error);
