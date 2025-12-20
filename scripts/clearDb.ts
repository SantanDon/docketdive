// Script to clear the Astra DB collection using batch delete approach
import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Path helpers (for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env - corrected path
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Log loaded .env variables for debugging
console.log("🚀 Loading environment variables...");
console.log(
  `   ASTRA_DB_APPLICATION_TOKEN: ${process.env.ASTRA_DB_APPLICATION_TOKEN ? "********" + process.env.ASTRA_DB_APPLICATION_TOKEN.slice(-4) : "NOT SET"}`,
);
console.log(`   ASTRA_DB_ID: ${process.env.ASTRA_DB_ID || "NOT SET"}`);
console.log(`   ASTRA_DB_REGION: ${process.env.ASTRA_DB_REGION || "NOT SET"}`);
console.log(
  `   COLLECTION_NAME: ${process.env.COLLECTION_NAME || "default (docketdive)"}`,
);
console.log(`   NAMESPACE: ${process.env.NAMESPACE || "default"}`);
console.log(`   ENDPOINT: ${process.env.ENDPOINT || "NOT SET"}`);

// Configuration
const token = process.env.ASTRA_DB_APPLICATION_TOKEN!;
const endpoint = process.env.ENDPOINT!;
const collectionName = process.env.COLLECTION_NAME || "docketdive";

if (!token || !endpoint) {
  console.error("❌ Missing required environment variables!");
  console.error("   Required: ASTRA_DB_APPLICATION_TOKEN, ENDPOINT");
  process.exit(1);
}

async function clearDatabase() {
  let totalDeleted = 0;

  try {
    console.log(
      "\n⚠️  WARNING: This will delete ALL documents from the collection!",
    );
    console.log(`   Collection: ${collectionName}`);
    console.log(`   Endpoint: ${endpoint}\n`);

    console.log("🗑️  Connecting to Astra DB...");
    const client = new DataAPIClient(token);
    const db = client.db(endpoint);
    const collection = db.collection(collectionName);

    console.log("🗑️  Starting batch delete process...\n");

    // Delete in batches using cursor-based approach
    let batchNumber = 0;
    let hasMore = true;

    while (hasMore) {
      batchNumber++;
      console.log(`   Processing batch ${batchNumber}...`);

      try {
        // Find documents in batches
        const cursor = collection.find(
          {},
          {
            limit: 20,
            projection: { _id: 1 },
          },
        );

        const documents = await cursor.toArray();

        if (documents.length === 0) {
          hasMore = false;
          console.log(`   ✅ No more documents to delete`);
          break;
        }

        // Delete each document
        for (const doc of documents) {
          try {
            await collection.deleteOne({ _id: doc._id });
            totalDeleted++;

            if (totalDeleted % 10 === 0) {
              process.stdout.write(
                `\r   Deleted: ${totalDeleted} documents...`,
              );
            }
          } catch (delError: any) {
            console.error(
              `\n   ⚠️  Failed to delete document ${doc._id}: ${delError.message}`,
            );
          }
        }

        console.log(
          `\r   Batch ${batchNumber} complete: ${documents.length} documents deleted`,
        );
      } catch (batchError: any) {
        console.error(
          `\n   ⚠️  Batch ${batchNumber} failed: ${batchError.message}`,
        );

        // If we can't find documents, collection might be empty or inaccessible
        if (
          batchError.message?.includes("not found") ||
          batchError.message?.includes("Not Found")
        ) {
          console.log(`   ℹ️  Collection may be empty or doesn't exist yet`);
          hasMore = false;
        } else {
          // Continue to next batch on other errors
          console.log(`   Continuing to next batch...`);
        }
      }
    }

    console.log(`\n\n✅ Database cleared successfully!`);
    console.log(`   Total documents deleted: ${totalDeleted}`);
    console.log("\n💡 You can now run: npm run load-db");
  } catch (error: any) {
    console.error("\n❌ Error clearing database:");
    console.error(`   ${error.message || error}`);

    if (error.errors && Array.isArray(error.errors)) {
      console.error("\n📋 Detailed errors:");
      error.errors.forEach((err: any, idx: number) => {
        console.error(`   ${idx + 1}. ${err.message || JSON.stringify(err)}`);
      });
    }

    if (error.code === "ENOTFOUND" || error.code === "ETIMEDOUT") {
      console.error("\n🔍 Network Error Troubleshooting:");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify your Astra DB instance is running");
      console.error(
        "   3. Check if your IP is allowed in Astra DB security settings",
      );
      console.error("   4. Verify the ENDPOINT in your .env file is correct");
    }

    if (
      error.message?.includes("permission") ||
      error.message?.includes("Permission")
    ) {
      console.error("\n🔑 Permission Error Troubleshooting:");
      console.error("   1. Verify your token has sufficient permissions");
      console.error("   2. Token should have 'Database Administrator' role");
      console.error("   3. You may need to regenerate your application token");
      console.error(
        "   4. Go to: https://astra.datastax.com > Settings > Tokens",
      );
    }

    if (totalDeleted > 0) {
      console.log(
        `\n📊 Progress: Deleted ${totalDeleted} documents before error occurred`,
      );
    }

    process.exit(1);
  }
}

// Run the clear operation
console.log("\n🧹 Starting database clear operation...\n");
clearDatabase();
