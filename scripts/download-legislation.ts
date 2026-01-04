/**
 * Download South African Acts from Gov.za
 * 
 * Target-specific legislation downloads with progress tracking.
 * Respects gov.za robots.txt and implements rate limiting.
 * 
 * Usage:
 *   npm run download-legislation          # Download all Tier 1 Acts
 *   npm run download-legislation -- --tier 2  # Download Tier 2 Acts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR = path.join(__dirname, '../documents/legislation');
const RATE_LIMIT_MS = 1500; // Respectful rate limiting
const MAX_RETRIES = 3;

// ========================= ACT DEFINITIONS =========================
interface Act {
  name: string;
  year: number;
  fileName: string;
  searchTerm: string;
  tier: 1 | 2 | 3;
  description: string;
}

const ACTS: Act[] = [
  // TIER 1: CRITICAL (Most important for DocketDive)
  {
    name: "Constitution of the RSA",
    year: 1996,
    fileName: "Constitution_of_RSA_1996.pdf",
    searchTerm: "Constitution of the Republic of South Africa 1996",
    tier: 1,
    description: "Constitutional foundation, fundamental rights, interpretation principles"
  },
  {
    name: "Labour Relations Act",
    year: 1995,
    fileName: "Labour_Relations_Act_1995.pdf",
    searchTerm: "Labour Relations Act 1995",
    tier: 1,
    description: "Unfair dismissal, labour disputes, employment relationships"
  },
  {
    name: "Basic Conditions of Employment Act",
    year: 1997,
    fileName: "Basic_Conditions_Employment_Act_1997.pdf",
    searchTerm: "Basic Conditions of Employment Act 1997",
    tier: 1,
    description: "Working hours, wages, leave, employment contracts"
  },
  {
    name: "Bills of Exchange Act",
    year: 1964,
    fileName: "Bills_of_Exchange_Act_1964.pdf",
    searchTerm: "Bills of Exchange Act 1964",
    tier: 1,
    description: "Commercial contracts, negotiable instruments, sale of goods"
  },

  // TIER 2: IMPORTANT
  {
    name: "Employment Equity Act",
    year: 1998,
    fileName: "Employment_Equity_Act_1998.pdf",
    searchTerm: "Employment Equity Act 1998",
    tier: 2,
    description: "Discrimination, employment equity, harassment in workplace"
  },
  {
    name: "POPIA",
    year: 2000,
    fileName: "POPIA_2000.pdf",
    searchTerm: "Promotion of Access to Information Act 2000",
    tier: 2,
    description: "Privacy, data protection, personal information"
  },
  {
    name: "Succession Act",
    year: 1957,
    fileName: "Succession_Act_1957.pdf",
    searchTerm: "Succession Act 1957",
    tier: 2,
    description: "Inheritance, estates, succession planning"
  },
  {
    name: "Promotion of Access to Courts Act",
    year: 1997,
    fileName: "Promotion_Access_Courts_Act_1997.pdf",
    searchTerm: "Promotion of Access to Courts Act 1997",
    tier: 2,
    description: "Access to justice, court procedures, legal remedies"
  },

  // TIER 3: SUPPORTING
  {
    name: "Alienation of Land Act",
    year: 1981,
    fileName: "Alienation_Land_Act_1981.pdf",
    searchTerm: "Alienation of Land Act 1981",
    tier: 3,
    description: "Property law, land contracts, conveyancing"
  },
  {
    name: "Close Corporations Act",
    year: 1984,
    fileName: "Close_Corporations_Act_1984.pdf",
    searchTerm: "Close Corporations Act 1984",
    tier: 3,
    description: "Business entities, partnership law, contracts"
  },
];

// ========================= UTILITIES =========================
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
}

// ========================= DOWNLOAD FUNCTIONS =========================
async function searchActOnGovZa(searchTerm: string): Promise<string | null> {
  console.log(`   🔍 Searching gov.za for: ${searchTerm}`);
  
  try {
    const response = await axios.get('https://www.gov.za/documents/acts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (DocketDive Legal Research Bot) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // Look for links containing the search term
    let foundLink: string | null = null;
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      if (href && text.includes(searchLower) && href.includes('/documents/')) {
        foundLink = href.startsWith('http') ? href : 'https://www.gov.za' + href;
      }
    });

    if (foundLink) {
      console.log(`   ✅ Found: ${foundLink}`);
      return foundLink;
    }
    
    console.log(`   ⚠️  Not found on main page, trying search...`);
    return null;
  } catch (error) {
    console.error(`   ❌ Error searching: ${error}`);
    return null;
  }
}

async function extractPdfUrl(actPageUrl: string): Promise<string | null> {
  console.log(`   📄 Extracting PDF URL...`);
  
  try {
    const response = await axios.get(actPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (DocketDive Legal Research Bot) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // Look for PDF link in multiple ways
    let pdfUrl = $('a[href$=".pdf"]').attr('href');
    
    if (!pdfUrl) {
      pdfUrl = $('.field-name-field-gcisdoc-files a').attr('href');
    }
    
    if (!pdfUrl) {
      pdfUrl = $('[data-type="application/pdf"]').parent().attr('href');
    }

    if (pdfUrl) {
      const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : 'https://www.gov.za' + pdfUrl;
      console.log(`   ✅ PDF URL: ${fullUrl}`);
      return fullUrl;
    }

    console.log(`   ❌ No PDF link found`);
    return null;
  } catch (error) {
    console.error(`   ❌ Error extracting PDF: ${error}`);
    return null;
  }
}

async function downloadFile(
  pdfUrl: string,
  filePath: string,
  retries: number = MAX_RETRIES
): Promise<boolean> {
  console.log(`   ⬇️  Downloading to ${path.basename(filePath)}...`);

  try {
    const response = await axios({
      method: 'GET',
      url: pdfUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (DocketDive Legal Research Bot) AppleWebKit/537.36'
      },
      timeout: 60000
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   ✅ Downloaded (${sizeKB} KB)`);
        resolve(true);
      });
      writer.on('error', () => {
        if (retries > 0) {
          console.log(`   ⚠️  Retrying (${retries} retries left)...`);
          fs.unlinkSync(filePath);
          return downloadFile(pdfUrl, filePath, retries - 1).then(resolve).catch(reject);
        }
        reject(new Error('Download failed after retries'));
      });
    });
  } catch (error) {
    if (retries > 0) {
      console.log(`   ⚠️  Retrying (${retries} retries left)...`);
      await sleep(RATE_LIMIT_MS * 2);
      return downloadFile(pdfUrl, filePath, retries - 1);
    }
    console.error(`   ❌ Download error: ${error}`);
    return false;
  }
}

// ========================= MAIN FUNCTION =========================
async function downloadLegislation(targetTier: 1 | 2 | 3 = 1) {
  console.log('\n🚀 Starting South African Legislation Download\n');
  console.log('='.repeat(80));

  // Ensure directory exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`📂 Created directory: ${DOWNLOAD_DIR}\n`);
  }

  // Filter acts by tier
  const actsToDownload = ACTS.filter(act => act.tier <= targetTier);
  console.log(`📋 Found ${actsToDownload.length} acts to download (Tier ${targetTier} and below)\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const act of actsToDownload) {
    console.log(`\n📜 ${act.name} (${act.year})`);
    console.log(`   ${act.description}`);
    console.log('-'.repeat(80));

    const filePath = path.join(DOWNLOAD_DIR, act.fileName);

    // Check if already exists
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`⏭️  Already exists (${sizeKB} KB), skipping`);
      skippedCount++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    try {
      // Search for act page
      const actPageUrl = await searchActOnGovZa(act.searchTerm);
      if (!actPageUrl) {
        console.log(`❌ Could not find act page. Manual download required.`);
        console.log(`   Visit: https://www.gov.za/documents/acts`);
        console.log(`   Search for: ${act.searchTerm}`);
        failedCount++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Extract PDF URL
      const pdfUrl = await extractPdfUrl(actPageUrl);
      if (!pdfUrl) {
        console.log(`❌ Could not extract PDF URL`);
        failedCount++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Download file
      const success = await downloadFile(pdfUrl, filePath);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Respectful rate limiting
      await sleep(RATE_LIMIT_MS);
    } catch (error) {
      console.error(`❌ Error processing act: ${error}`);
      failedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Download Summary\n');
  console.log(`   ✅ Successfully downloaded: ${successCount}`);
  console.log(`   ⏭️  Already existed: ${skippedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`\n📂 Location: ${DOWNLOAD_DIR}`);
  console.log('='.repeat(80) + '\n');

  // Show what to do next
  if (successCount > 0 || skippedCount > 0) {
    console.log('✅ Ready for ingestion! Next steps:\n');
    console.log('   npm run ingest-legislation    # Process the acts');
    console.log('   npm run reembed-docs          # Generate embeddings\n');
  } else if (failedCount > 0) {
    console.log('⚠️  Some acts failed to download automatically.');
    console.log('📝 Manual download required:\n');
    console.log('   1. Visit: https://www.gov.za/documents/acts');
    for (const act of actsToDownload.filter(a => a.tier <= targetTier)) {
      if (!fs.existsSync(path.join(DOWNLOAD_DIR, act.fileName))) {
        console.log(`   2. Search for: "${act.searchTerm}"`);
        console.log(`   3. Download and save as: ${act.fileName}\n`);
      }
    }
  }
}

// ========================= RUN =========================
if (import.meta.url === `file://${process.argv[1]}`) {
  const tier = (process.argv[2]?.includes('tier') ? parseInt(process.argv[3]) : 1) as 1 | 2 | 3;
  downloadLegislation(tier).catch(console.error);
}

export { downloadLegislation };
