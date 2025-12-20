import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.gov.za';
const ACTS_URL = 'https://www.gov.za/documents/acts';
const DOWNLOAD_DIR = path.join(__dirname, '../documents');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function scrapeActs() {
  console.log(`🚀 Starting scraper for ${ACTS_URL}...`);

  try {
    // 1. Fetch Main Page
    const { data: mainPageHtml } = await axios.get(ACTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(mainPageHtml);

    // 2. Extract Act Links (Broader Strategy)
    const actLinks: { title: string; url: string }[] = [];
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('/documents/acts/') && href !== '/documents/acts') {
        const title = $(element).text().trim();
        if (title && title.length > 5) { // Filter out short/empty links
            const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
            // Avoid duplicates
            if (!actLinks.some(l => l.url === fullUrl)) {
                actLinks.push({ title, url: fullUrl });
            }
        }
      }
    });

    console.log(`Found ${actLinks.length} acts. Processing the first 50...`);

    // 3. Process each act (Limit to 50 for safety)
    for (const act of actLinks.slice(0, 50)) {
      console.log(`\nProcessing: ${act.title}`);
      
      try {
        const { data: detailPageHtml } = await axios.get(act.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
        const $detail = cheerio.load(detailPageHtml);

        // 4. Find PDF Link
        let pdfHref = $detail('.field-name-field-gcisdoc-files a').attr('href');
        
        // Fallback: Look for any link ending in .pdf
        if (!pdfHref) {
            pdfHref = $detail('a[href$=".pdf"]').attr('href');
        }
        
        if (pdfHref) {
          const pdfUrl = pdfHref.startsWith('http') ? pdfHref : BASE_URL + pdfHref;
          const fileName = `${act.title.replace(/[^a-z0-9]/gi, '_').substring(0, 100)}.pdf`;
          const filePath = path.join(DOWNLOAD_DIR, fileName);

          if (fs.existsSync(filePath)) {
             console.log(`  ⚠️  File already exists: ${fileName}`);
             continue;
          }

          // 5. Download PDF
          console.log(`  ⬇️  Downloading PDF from ${pdfUrl}...`);
          const response = await axios({
            method: 'GET',
            url: pdfUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
          });

          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          console.log(`  ✅ Saved to ${fileName}`);
        } else {
          console.log('  ❌ No PDF link found.');
        }
      } catch (err: any) {
        console.error(`  ❌ Error processing ${act.title}:`, err.message);
      }
      
      // Polite delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✨ Scraping complete!');

  } catch (error: any) {
    console.error('Fatal Scraper Error:', error.message);
  }
}

scrapeActs();
