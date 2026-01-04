/**
 * RAG Diagnostic Tool
 * Quick diagnosis of knowledge base issues without heavy dependencies
 */

import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";

dotenv.config();

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN || "");
const db = client.db(process.env.ENDPOINT || "");

interface DiagnosticResult {
  stage: string;
  status: "✅" | "❌" | "⚠️";
  details: string;
  recommendation?: string;
}

const results: DiagnosticResult[] = [];

async function diagnose(): Promise<void> {
  console.log("\n🔍 DOCKETDIVE RAG DIAGNOSTIC TOOL\n");
  console.log("=".repeat(80));

  // Check 1: Connection
  console.log("\n1️⃣  Checking Astra DB Connection...");
  try {
    const collections = await db.listCollections();
    const hasCollection = collections.some(
      (c) => c.name === (process.env.COLLECTION_NAME || "docketdive")
    );

    if (hasCollection) {
      results.push({
        stage: "Astra DB Connection",
        status: "✅",
        details: `Connected. Found collection: ${process.env.COLLECTION_NAME || "docketdive"}`,
      });
      console.log("✅ Connection successful");
    } else {
      results.push({
        stage: "Astra DB Connection",
        status: "❌",
        details: `Collection not found: ${process.env.COLLECTION_NAME || "docketdive"}`,
        recommendation: "Run ingestion script to create collection",
      });
      console.log("❌ Collection not found");
    }
  } catch (err: any) {
    results.push({
      stage: "Astra DB Connection",
      status: "❌",
      details: err.message,
      recommendation: "Check ASTRA credentials and network",
    });
    console.log(`❌ Connection failed: ${err.message}`);
    return;
  }

  // Check 2: Document Count
  console.log("\n2️⃣  Checking Document Count...");
  try {
    const collection = db.collection(process.env.COLLECTION_NAME || "docketdive");
    const countResult = await collection.countDocuments();

    if (countResult > 0) {
      results.push({
        stage: "Document Count",
        status: "✅",
        details: `Found ${countResult} documents in collection`,
      });
      console.log(`✅ Documents found: ${countResult}`);
    } else {
      results.push({
        stage: "Document Count",
        status: "❌",
        details: "No documents in collection",
        recommendation: "Run document ingestion pipeline",
      });
      console.log("❌ No documents found");
    }
  } catch (err: any) {
    results.push({
      stage: "Document Count",
      status: "❌",
      details: err.message,
    });
    console.log(`❌ Check failed: ${err.message}`);
  }

  // Check 3: Vector Dimension Check
  console.log("\n3️⃣  Checking Vector Dimensions...");
  try {
    const collection = db.collection(process.env.COLLECTION_NAME || "docketdive");
    
    // Get one document to check dimensions
    const sample = await collection.findOne({});
    
    if (sample && sample.$vector) {
      const dims = sample.$vector.length;
      const expectedDims = 768; // For nomic-embed-text

      if (dims === expectedDims) {
        results.push({
          stage: "Vector Dimensions",
          status: "✅",
          details: `Correct dimensions: ${dims}`,
        });
        console.log(`✅ Vector dimensions correct: ${dims}`);
      } else {
        results.push({
          stage: "Vector Dimensions",
          status: "⚠️",
          details: `Found ${dims} dimensions, expected ${expectedDims}`,
          recommendation: `Mismatch detected. Check embedding model configuration`,
        });
        console.log(`⚠️  Dimension mismatch: ${dims} found, ${expectedDims} expected`);
      }
    } else {
      results.push({
        stage: "Vector Dimensions",
        status: "❌",
        details: "No vectors found in documents",
        recommendation: "Run embedding generation",
      });
      console.log("❌ No vectors in documents");
    }
  } catch (err: any) {
    results.push({
      stage: "Vector Dimensions",
      status: "❌",
      details: err.message,
    });
    console.log(`❌ Check failed: ${err.message}`);
  }

  // Check 4: Keyword Search - "witness age 14"
  console.log("\n4️⃣  Testing Witness Age Query...");
  try {
    const collection = db.collection(process.env.COLLECTION_NAME || "docketdive");

    const searchTerms = ["witness", "age", "14", "will", "testament"];
    const foundTerms: { term: string; count: number }[] = [];

    for (const term of searchTerms) {
      try {
        // Try text search
        const results = await collection
          .find({ content: { $regex: term, $options: "i" } })
          .limit(1)
          .toArray();

        if (results.length > 0) {
          foundTerms.push({ term, count: results.length });
        }
      } catch {
        // Text search may not be supported
      }
    }

    if (foundTerms.length > 0) {
      results.push({
        stage: "Keyword Search",
        status: "✅",
        details: `Found ${foundTerms.length}/${searchTerms.length} keywords: ${foundTerms.map((t) => t.term).join(", ")}`,
      });
      console.log(
        `✅ Keywords found: ${foundTerms.map((t) => t.term).join(", ")}`
      );
    } else {
      results.push({
        stage: "Keyword Search",
        status: "❌",
        details: `Could not find witness age-related keywords`,
        recommendation: "Check if documents are properly ingested and chunked",
      });
      console.log("❌ Witness age keywords not found in collection");
    }
  } catch (err: any) {
    results.push({
      stage: "Keyword Search",
      status: "⚠️",
      details: `Keyword search not available: ${err.message}`,
    });
    console.log(`⚠️  Keyword search unavailable`);
  }

  // Check 5: Document Metadata
  console.log("\n5️⃣  Checking Document Metadata...");
  try {
    const collection = db.collection(process.env.COLLECTION_NAME || "docketdive");

    const sample = await collection.findOne({});

    if (sample) {
      const metadata = sample.metadata || {};
      const hasRequired = ["source", "category", "fileName"].some(
        (key) => key in metadata
      );

      if (hasRequired) {
        results.push({
          stage: "Document Metadata",
          status: "✅",
          details: `Metadata present: ${Object.keys(metadata).join(", ")}`,
        });
        console.log(`✅ Metadata found: ${Object.keys(metadata).join(", ")}`);
      } else {
        results.push({
          stage: "Document Metadata",
          status: "⚠️",
          details: "Metadata present but incomplete",
          recommendation: "Ensure ingestion includes proper metadata tagging",
        });
        console.log("⚠️  Metadata incomplete");
      }
    }
  } catch (err: any) {
    results.push({
      stage: "Document Metadata",
      status: "⚠️",
      details: err.message,
    });
    console.log(`⚠️  Metadata check unavailable`);
  }

  // Print Summary
  console.log("\n" + "=".repeat(80));
  console.log("\n📋 DIAGNOSTIC SUMMARY\n");

  const statusGroups = {
    "✅": results.filter((r) => r.status === "✅"),
    "⚠️": results.filter((r) => r.status === "⚠️"),
    "❌": results.filter((r) => r.status === "❌"),
  };

  results.forEach((result) => {
    console.log(`${result.status} ${result.stage}`);
    console.log(`   ${result.details}`);
    if (result.recommendation) {
      console.log(`   💡 ${result.recommendation}`);
    }
    console.log();
  });

  // Overall health
  const healthScore =
    ((statusGroups["✅"].length / results.length) * 100).toFixed(0);
  console.log(`\n🏥 Overall Health: ${healthScore}%`);

  if (statusGroups["❌"].length > 0) {
    console.log(`\n❌ CRITICAL ISSUES: ${statusGroups["❌"].map((r) => r.stage).join(", ")}`);
  }

  if (statusGroups["⚠️"].length > 0) {
    console.log(`⚠️  WARNINGS: ${statusGroups["⚠️"].map((r) => r.stage).join(", ")}`);
  }

  // Recommendations
  console.log("\n" + "=".repeat(80));
  console.log("\n💡 RECOMMENDATIONS\n");

  const issues = results.filter((r) => r.recommendation);
  if (issues.length > 0) {
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.stage}: ${issue.recommendation}`);
    });
  } else {
    console.log("✅ No immediate issues detected. System appears healthy.");
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

diagnose().catch((err) => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
