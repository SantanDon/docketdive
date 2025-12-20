/**
 * Test script for SAFLII scraper
 * Tests scraping a single case to verify functionality
 */

import puppeteer from "puppeteer";
import { scrapeCase } from "./safliiScraper";

async function testScraper() {
  console.log("🧪 Testing SAFLII Scraper\n");
  console.log("=" .repeat(80));

  const testCases = [
    {
      name: "Constitutional Court Case",
      url: "https://www.saflii.org/za/cases/ZACC/2023/1.html"
    },
    {
      name: "Supreme Court of Appeal Case",
      url: "https://www.saflii.org/za/cases/ZASCA/2023/1.html"
    }
  ];

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (DocketDive Test Bot)"
    );

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`🔗 URL: ${testCase.url}`);
      console.log("-".repeat(80));

      const result = await scrapeCase(page, testCase.url);

      if (result) {
        console.log("\n✅ SUCCESS - Case scraped successfully!");
        console.log("\n📊 Metadata:");
        console.log(`   Citation: ${result.metadata.citation}`);
        console.log(`   Court: ${result.metadata.court}`);
        console.log(`   Date: ${result.metadata.date}`);
        console.log(`   Parties: ${result.metadata.parties}`);
        console.log(`   Category: ${result.metadata.category}`);
        if (result.metadata.judges && result.metadata.judges.length > 0) {
          console.log(`   Judges: ${result.metadata.judges.join(", ")}`);
        }
        console.log(`\n📄 Text Length: ${result.fullText.length} characters`);
        console.log(`\n📝 Text Preview (first 300 chars):`);
        console.log(result.fullText.substring(0, 300) + "...");
      } else {
        console.log("\n❌ FAILED - Could not scrape case");
      }

      console.log("\n" + "=".repeat(80));
    }

  } catch (error) {
    console.error(`\n❌ Test failed with error: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log("\n🏁 Test Complete!");
}

testScraper().catch(console.error);
