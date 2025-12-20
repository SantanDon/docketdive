
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { getEmbedding } from "../app/api/utils/rag";
import { searchSouthAfricanLaw } from "../app/api/utils/internet-search";
import { expandQuery, identifyLegalEntities } from "../app/api/utils/semantic-search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const COLLECTION_NAME = "docketdive";

async function debugRetrieval() {
  // Test cases:
  // 1. "criminal law elements" (General concept)
  // 2. "crimnal law elemnts" (Spelling mistakes)
  // 3. "actio de pauperie" (Specific term)
  const queries = [
    "criminal law elements",
    "crimnal law elemnts", 
    "actio de pauperie"
  ];

  for (const query of queries) {
    console.log(`\n\n🔍 Debugging Retrieval for: "${query}"`);

  // 1. Check Environment Variables
  if (!process.env.ASTRA_DB_APPLICATION_TOKEN || !process.env.ASTRA_DB_API_ENDPOINT) {
    console.error("❌ Missing Astra DB credentials");
    return;
  }

  // 1.5 Check Semantic Understanding
  console.log("\n🧠 Checking Semantic Understanding...");
  const expanded = await expandQuery(query);
  console.log("Expanded Queries:", expanded);
  
  const entities = identifyLegalEntities(query);
  console.log("Identified Entities:", entities);

  // 2. Generate Embedding
  console.log("Generating embedding...");
  let vector: number[];
  try {
    vector = await getEmbedding(query);
    console.log("✅ Embedding generated successfully");
  } catch (error) {
    console.error("❌ Embedding generation failed:", error);
    return;
  }

  // 3. Query Vector Store
  console.log("Querying Astra DB...");
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT);
  const collection = db.collection(COLLECTION_NAME);

  try {
    // List collections to verify
    const collections = await db.listCollections();
    console.log("📂 Available Collections:", collections.map((c: any) => c.name));

    if (collections.length > 0) {
      const firstDoc = await collection.findOne({});
      console.log("First document schema:", Object.keys(firstDoc || {}));
    }

    const results = await collection.find(
      {},
      {
        sort: { $vector: vector },
        limit: 10,
        includeSimilarity: true,
        projection: { content: 1, metadata: 1 },
      }
    ).toArray();

    console.log(`\n📊 Found ${results.length} results:\n`);
    
    results.forEach((doc: any, i) => {
      const title = doc.metadata?.title || "Untitled";
      const score = doc.$similarity;
      const snippet = doc.content.substring(0, 100).replace(/\n/g, " ");
      console.log(`[${i + 1}] Score: ${score.toFixed(4)} | Title: ${title}`);
      console.log(`    Snippet: ${snippet}...`);
    });

    // 4. Test Internet Search
    // console.log("\n🌐 Testing Internet Search Fallback...");
    // // Hack to bypass SSL error for testing
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    // const internetResults = await searchSouthAfricanLaw(query);
    // console.log(`Found ${internetResults.length} internet results.`);
    // internetResults.forEach((res, i) => {
    //   console.log(`[${i+1}] ${res.title} (${res.source}) - ${res.url}`);
    // });

  } catch (error: any) {
    console.error("❌ Database query failed:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response, null, 2));
    }
  }
  } // End loop
}

debugRetrieval();
