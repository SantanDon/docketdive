import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://www.scielo.org.za';
const SUBJECT_URL = 'http://www.scielo.org.za/scielo.php?script=sci_subject&lng=en&nrm=iso';
const DOWNLOAD_DIR = path.join(__dirname, '../documents');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Keywords to identify Law journals
const LAW_KEYWORDS = [
  'law', 'juridica', 'juris', 'rights', 'legal', 'criminology', 'attorney', 'bar', 'justice'
];

async function fetchHtml(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return data;
  } catch (err: any) {
    console.error(`❌ Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function scrapeSciELO() {
  console.log(`🚀 Starting SciELO Scraper...`);

  // 1. Fetch Subject Page
  const subjectHtml = await fetchHtml(SUBJECT_URL);
  if (!subjectHtml) return;
  const $ = cheerio.load(subjectHtml);

  // 2. Find Law Journals
  const journalLinks: { title: string; url: string }[] = [];
  
  $('a').each((_, element) => {
    const href = $(element).attr('href');
    const title = $(element).text().trim();
    
    if (href && href.includes('script=sci_serial') && title) {
      const lowerTitle = title.toLowerCase();
      if (LAW_KEYWORDS.some(kw => lowerTitle.includes(kw))) {
        journalLinks.push({ title, url: href });
      }
    }
  });

  console.log(`Found ${journalLinks.length} Law Journals:`);
  journalLinks.forEach(j => console.log(` - ${j.title}`));

  // 3. Process Each Journal
  for (const journal of journalLinks) {
    console.log(`\n📚 Processing Journal: ${journal.title}`);
    
    // Get "All Issues" link (construct from PID)
    // URL: script=sci_serial&pid=XXXX-XXXX...
    // We want: script=sci_issues&pid=XXXX-XXXX...
    const pidMatch = journal.url.match(/pid=([\w-]+)/);
    if (!pidMatch) continue;
    
    const pid = pidMatch[1];
    const issuesUrl = `${BASE_URL}/scielo.php?script=sci_issues&pid=${pid}&lng=en&nrm=iso`;
    
    const issuesHtml = await fetchHtml(issuesUrl);
    if (!issuesHtml) continue;
    const $issues = cheerio.load(issuesHtml);

    // 4. Find Issues (Limit to recent 5 issues for now to avoid overload, can be increased)
    const issueLinks: string[] = [];
    $issues('a').each((_, el) => {
      const href = $issues(el).attr('href');
      if (href && href.includes('script=sci_issuetoc')) {
        issueLinks.push(href);
      }
    });

    // Unique issues
    const uniqueIssues = [...new Set(issueLinks)];
    console.log(`   Found ${uniqueIssues.length} issues. Scraping recent ones...`);

    // Process recent issues (reverse order usually implies newest first, but let's check)
    // SciELO usually lists newest at top or in a grid.
    // We'll take the first 10 found.
    for (const issueUrl of uniqueIssues.slice(0, 10)) {
      console.log(`   📖 Processing Issue: ${issueUrl}`);
      
      const issueHtml = await fetchHtml(issueUrl);
      if (!issueHtml) continue;
      const $issue = cheerio.load(issueHtml);

      // 5. Find PDF Links
      const pdfLinks: { url: string; title: string }[] = [];
      $issue('a').each((_, el) => {
        const href = $issue(el).attr('href');
        const text = $issue(el).text().trim();
        
        // Look for PDF links. Usually they are like /pdf/dejure/v58n1/01.pdf
        // Or links with text "pdf" or "PDF"
        if (href && href.includes('.pdf') && !href.includes('script=')) {
           // Try to find the title of the article. 
           // Usually the PDF link is near the title link.
           // This is tricky. Let's just use the filename or a generic name.
           pdfLinks.push({ url: href, title: 'Article' });
        }
      });
      
      // Fallback: SciELO often uses a "pdf" text link that points to the PDF
      if (pdfLinks.length === 0) {
         $issue('div.text').each((_, div) => {
             // Structure often: Title ... [ en ] [ pdf ]
             const title = $issue(div).find('.title').text().trim() || 'Unknown_Article';
             const pdfHref = $issue(div).find('a[href*=".pdf"]').attr('href');
             if (pdfHref) {
                 pdfLinks.push({ url: pdfHref, title });
             }
         });
      }

      console.log(`     Found ${pdfLinks.length} PDFs.`);

      // 6. Download PDFs
      for (const pdf of pdfLinks) {
        const pdfUrl = pdf.url.startsWith('http') ? pdf.url : BASE_URL + pdf.url;
        // Clean title for filename
        const safeTitle = pdf.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const safeJournal = journal.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        const filename = `SciELO_${safeJournal}_${safeTitle}_${path.basename(pdfUrl)}`;
        const filePath = path.join(DOWNLOAD_DIR, filename);

        if (fs.existsSync(filePath)) {
            // console.log(`       ⚠️ Exists: ${filename}`);
            continue;
        }

        console.log(`       ⬇️ Downloading: ${filename}`);
        try {
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
                writer.on('finish', () => resolve(undefined));
                writer.on('error', reject);
            });
            
            // Polite delay
            await new Promise(r => setTimeout(r, 500));

        } catch (err: any) {
            console.error(`       ❌ Failed to download ${pdfUrl}: ${err.message}`);
        }
      }
    }
  }
  
  console.log('\n✨ SciELO Scraper Complete!');
}

scrapeSciELO();
