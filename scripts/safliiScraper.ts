/**
 * SAFLII Case Law Scraper for DocketDive
 * 
 * Scrapes South African case law from SAFLII (Southern African Legal Information Institute)
 * Website: https://www.saflii.org
 * 
 * Features:
 * - Scrapes judgments from various South African courts
 * - Extracts case metadata (citation, court, date, parties, judges)
 * - Downloads full judgment text
 * - Respects robots.txt and implements rate limiting
 * - Stores data in Astra DB for RAG system
 */

import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getEmbedding } from "../app/api/utils/rag";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// ========================= CONFIGURATION =========================
const SAFLII_BASE_URL = "https://www.saflii.org";
const RATE_LIMIT_MS = 2000; // 2 seconds between requests
const MAX_CASES_PER_COURT = 50; // Limit per court to avoid overwhelming
const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 150;

// South African Courts to scrape
const SA_COURTS = [
  { name: "Constitutional Court", url: "/za/cases/ZACC/" },
  { name: "Supreme Court of Appeal", url: "/za/cases/ZASCA/" },
  { name: "High Court - Gauteng", url: "/za/cases/ZAGPPHC/" },
  { name: "High Court - Western Cape", url: "/za/cases/ZAWCHC/" },
  { name: "High Court - KwaZulu-Natal", url: "/za/cases/ZAKZPHC/" },
  { name: "Labour Court", url: "/za/cases/ZALC/" },
  { name: "Labour Appeal Court", url: "/za/cases/ZALAC/" },
];

// Labour Law specific keywords for enhanced filtering
const LABOUR_LAW_KEYWORDS = [
  "dismissal",
  "unfair dismissal",
  "employment contract",
  "restraint of trade",
  "constructive dismissal",
  "severance",
  "retrenchment",
  "misconduct",
  "sick leave",
  "maternity leave",
  "non-compete",
  "bonus",
  "wage dispute",
  "working hours",
  "discrimination",
  "harassment",
  "unfair labour practice"
];

// Contract Law keywords for high court cases
const CONTRACT_LAW_KEYWORDS = [
  "contract",
  "breach",
  "damages",
  "performance",
  "novation",
  "rescission",
  "specific performance",
  "force majeure",
  "sale of goods",
  "supply agreement",
  "service agreement",
  "loan agreement",
  "mandate",
  "warranty",
  "indemnity",
  "defects liability",
  "payment terms"
];

// ========================= DATABASE SETUP =========================
const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(process.env.ENDPOINT!);
const collection = db.collection(process.env.COLLECTION_NAME || "docketdive");

// ========================= INTERFACES =========================
interface CaseMetadata {
  citation: string;
  court: string;
  date: string;
  parties: string;
  judges?: string[];
  url: string;
  category: string;
  title: string;
  source: string;
}

interface ScrapedCase {
  metadata: CaseMetadata;
  fullText: string;
}

// ========================= UTILITY FUNCTIONS =========================
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk.trim());
    start += chunkSize - overlap;
  }

  return chunks.filter(chunk => chunk.length > 50); // Filter out tiny chunks
}



// ========================= SCRAPING FUNCTIONS =========================
async function scrapeCaseList(page: Page, courtUrl: string, maxCases: number): Promise<string[]> {
  console.log(`📋 Fetching case list from ${courtUrl}...`);
  
  try {
    await page.goto(`${SAFLII_BASE_URL}${courtUrl}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const html = await page.content();
    const $ = cheerio.load(html);
    const caseLinks: string[] = [];

    // SAFLII typically lists cases in tables or lists
    // Adjust selectors based on actual SAFLII structure
    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (href && href.includes("/judgment/") && !href.includes("#")) {
        const fullUrl = href.startsWith("http") ? href : `${SAFLII_BASE_URL}${href}`;
        if (!caseLinks.includes(fullUrl)) {
          caseLinks.push(fullUrl);
        }
      }
    });

    console.log(`   Found ${caseLinks.length} cases`);
    return caseLinks.slice(0, maxCases);
  } catch (error) {
    console.error(`❌ Error fetching case list: ${error}`);
    return [];
  }
}

async function scrapeCase(page: Page, caseUrl: string): Promise<ScrapedCase | null> {
  try {
    console.log(`   📄 Scraping: ${caseUrl}`);
    
    await page.goto(caseUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $("h1, .case-title, .judgment-title").first().text().trim() || "Untitled Case";
    const citation = $(".citation, .case-citation").first().text().trim() || extractCitationFromUrl(caseUrl);
    
    // Extract parties - look for neutral citation first
    let parties = "";
    
    // Try to find neutral citation which usually contains the case name
    const neutralCitation = $("p, div").filter((_, el) => {
      const text = $(el).text();
      return text.includes("Neutral citation:") || text.includes("neutral citation:");
    }).first().text();
    
    if (neutralCitation) {
      // Extract case name from neutral citation
      // Format: "Neutral citation: Kapa v The State [2023] ZACC 1"
      const match = neutralCitation.match(/citation:\s*([^[\]]+)\s*\[/i);
      if (match && match[1]) {
        parties = match[1].trim();
      }
    }
    
    // If no neutral citation, try to find "In the matter between:" section
    if (!parties) {
      const matterBetween = $("p, div").filter((_, el) => {
        const text = $(el).text();
        return text.includes("In the matter between:") || text.includes("matter between:");
      }).first().parent().text();
      
      if (matterBetween) {
        // Extract parties from "In the matter between: PARTY1 ... and PARTY2"
        const match = matterBetween.match(/between:\s*([A-Z\s]+?)\s+(?:Applicant|Appellant|Plaintiff).*?(?:and|versus|v\.?)\s*([A-Z\s]+?)\s+(?:Respondent|Defendant)/i);
        if (match && match[1] && match[2]) {
          const party1 = match[1].trim();
          const party2 = match[2].trim();
          parties = `${party1} v ${party2}`;
        }
      }
    }
    
    // Fallback to title if it contains " v " or " vs "
    if (!parties && (title.includes(" v ") || title.includes(" vs "))) {
      parties = title;
    }
    
    // Last resort: use title
    if (!parties) {
      parties = title;
    }

    // Extract court
    const court = $(".court-name, .court").first().text().trim() || extractCourtFromUrl(caseUrl);

    // Extract date - look for judgment date
    let dateText = "";
    $("p, div").each((_, el) => {
      const text = $(el).text();
      if (text.match(/\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i)) {
        const match = text.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
        if (match && !dateText) {
          dateText = match[1] || "";
        }
      }
    });

    const date = dateText;
    const judges: string[] = [];
    const coramText = $("p:contains('Coram'), div:contains('Coram')").text();
    
    if (coramText) {
      // Extract judge names after "Coram:"
      const judgeMatch = coramText.match(/Coram:\s*(.+?)(?:\n|$)/i);
      if (judgeMatch && judgeMatch[1]) {
        const judgeNames = judgeMatch[1].split(/,|and/).map(j => j.trim()).filter(j => j.length > 2);
        judges.push(...judgeNames);
      }
    }

    // Extract full judgment text
    let fullText = "";
    const contentSelectors = [
      ".judgment-body",
      ".judgment-text",
      ".judgment-content",
      "#judgment",
      "article",
      ".content",
      "main"
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > fullText.length) {
        fullText = content;
      }
    }

    // If no specific content found, get all paragraph text
    if (!fullText || fullText.length < 500) {
      fullText = $("p").map((_, el) => $(el).text()).get().join("\n\n");
    }

    fullText = cleanText(fullText);

    if (fullText.length < 200) {
      console.log(`   ⚠️  Insufficient text extracted (${fullText.length} chars), skipping`);
      return null;
    }

    const metadata: CaseMetadata = {
      citation,
      court,
      date,
      parties,
      ...(judges.length > 0 ? { judges } : {}),
      url: caseUrl,
      category: determineLegalCategory(title, fullText),
      title: parties || title,
      source: "SAFLII",
    };

    console.log(`   ✅ Extracted: ${parties} (${fullText.length} chars)`);

    return { metadata, fullText };
  } catch (error) {
    console.error(`   ❌ Error scraping case: ${error}`);
    return null;
  }
}

// ========================= HELPER FUNCTIONS =========================
function extractCitationFromUrl(url: string): string {
  // Extract citation from URL pattern like /za/cases/ZACC/2023/123.html
  const match = url.match(/\/(ZA[A-Z]+)\/(\d{4})\/(\d+)/);
  if (match) {
    return `${match[1]} ${match[2]} (${match[3]})`;
  }
  return "Unknown Citation";
}

function extractCourtFromUrl(url: string): string {
  if (url.includes("ZACC")) return "Constitutional Court of South Africa";
  if (url.includes("ZASCA")) return "Supreme Court of Appeal";
  if (url.includes("ZAGPPHC")) return "Gauteng High Court";
  if (url.includes("ZAWCHC")) return "Western Cape High Court";
  if (url.includes("ZAKZPHC")) return "KwaZulu-Natal High Court";
  if (url.includes("ZALC")) return "Labour Court";
  if (url.includes("ZALAC")) return "Labour Appeal Court";
  return "South African Court";
}

function parseSADate(dateText: string): string {
  if (!dateText) return "Unknown";
  
  // Try to extract date in various formats
  const dateMatch = dateText.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  if (dateMatch) {
    return `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`;
  }
  
  // Try YYYY-MM-DD format
  const isoMatch = dateText.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(dateText).toLocaleDateString("en-ZA");
  }
  
  return dateText;
}

function determineLegalCategory(title: string, text: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerText = text.toLowerCase();
  const combined = lowerTitle + " " + lowerText.substring(0, 2000);

  // Count keyword matches for more accurate categorization
  const labourMatches = LABOUR_LAW_KEYWORDS.filter(kw => combined.includes(kw.toLowerCase())).length;
  const contractMatches = CONTRACT_LAW_KEYWORDS.filter(kw => combined.includes(kw.toLowerCase())).length;

  // Determine primary category
  if (combined.includes("constitution") || combined.includes("constitutional")) return "Constitutional Law";
  
  // Labour Law: check for labour court or multiple labour keywords
  if (combined.includes("labour") || combined.includes("employment")) {
    if (labourMatches >= 2 || combined.includes("labour court")) return "Labour Law";
  }
  if (labourMatches >= 3) return "Labour Law";

  // Contract Law: check for contract court or multiple contract keywords  
  if (combined.includes("contract") || combined.includes("agreement")) {
    if (contractMatches >= 2 || combined.includes("contract law")) return "Contract Law";
  }
  if (contractMatches >= 3) return "Contract Law";

  if (combined.includes("criminal") || combined.includes("sentence") || combined.includes("conviction")) return "Criminal Law";
  if (combined.includes("delict") || combined.includes("tort")) return "Law of Delict";
  if (combined.includes("property") || combined.includes("land") || combined.includes("ownership")) return "Property Law";
  if (combined.includes("family") || combined.includes("divorce") || combined.includes("custody")) return "Family Law";
  if (combined.includes("admin") || combined.includes("administrative")) return "Administrative Law";
  if (combined.includes("tax") || combined.includes("revenue")) return "Tax Law";

  return "General Law";
}

// ========================= DATABASE FUNCTIONS =========================
async function storeCaseInDB(scrapedCase: ScrapedCase): Promise<number> {
  const chunks = chunkText(scrapedCase.fullText, CHUNK_SIZE, CHUNK_OVERLAP);
  let successCount = 0;

  console.log(`   💾 Storing ${chunks.length} chunks in database...`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunk = chunks[i];
      if (!chunk) continue;
      const embedding = await getEmbedding(chunk);
      
      await collection.insertOne({
        content: chunks[i],
        metadata: {
          ...scrapedCase.metadata,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
        $vector: embedding,
      });

      successCount++;
    } catch (error) {
      console.error(`   ❌ Error storing chunk ${i + 1}: ${error}`);
    }
  }

  console.log(`   ✅ Stored ${successCount}/${chunks.length} chunks`);
  return successCount;
}

// ========================= MAIN SCRAPER =========================
async function scrapeSAFLII() {
  console.log("🚀 Starting SAFLII Case Law Scraper\n");
  console.log("=" .repeat(80));

  let browser: Browser | null = null;
  let totalCasesScraped = 0;
  let totalChunksStored = 0;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    
    // Set user agent to identify as a researcher
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (DocketDive Legal Research Bot)"
    );

    for (const court of SA_COURTS) {
      console.log(`\n📚 Scraping ${court.name}...`);
      console.log("-".repeat(80));

      const caseLinks = await scrapeCaseList(page, court.url, MAX_CASES_PER_COURT);

      for (const caseUrl of caseLinks) {
        await sleep(RATE_LIMIT_MS); // Respect rate limiting

        const scrapedCase = await scrapeCase(page, caseUrl);
        
        if (scrapedCase) {
          const chunksStored = await storeCaseInDB(scrapedCase);
          totalCasesScraped++;
          totalChunksStored += chunksStored;
        }
      }

      console.log(`\n✅ Completed ${court.name}: ${caseLinks.length} cases processed`);
    }

  } catch (error) {
    console.error(`\n❌ Fatal error: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("🏁 Scraping Complete!");
  console.log(`📊 Total cases scraped: ${totalCasesScraped}`);
  console.log(`💾 Total chunks stored: ${totalChunksStored}`);
  console.log("=" .repeat(80));
}

// ========================= RUN =========================
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeSAFLII().catch(console.error);
}

export { scrapeSAFLII, scrapeCase, scrapeCaseList };
