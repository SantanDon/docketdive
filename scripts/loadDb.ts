// Top-of-file: Imports
import { DataAPIClient } from "@datastax/astra-db-ts";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// Single createRequire (for CommonJS libraries)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Path helpers (for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

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
console.log(
  `   OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`,
);
console.log(
  `   EMBED_MODEL: ${process.env.EMBED_MODEL || "dengcao/Qwen3-Embedding-0.6B:Q8_0"}`,
);

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL =
  process.env.EMBED_MODEL || "dengcao/Qwen3-Embedding-0.6B:Q8_0";
const CHUNK_SIZE = Math.min(
  Math.max(parseInt(process.env.CHUNK_SIZE || "800", 10), 200),
  2000,
);
const CHUNK_OVERLAP = Math.min(
  Math.max(parseInt(process.env.CHUNK_OVERLAP || "150", 10), 50),
  Math.floor(CHUNK_SIZE / 2),
);
const MIN_CHUNK_LENGTH = Math.max(
  parseInt(process.env.MIN_CHUNK_LENGTH || "30", 10),
  10,
);
const BATCH_SIZE = 10; // Smaller batches for better error handling
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const MAX_FILES = parseInt(process.env.MAX_FILES || "0", 10) || undefined;
const WRITE_SUMMARY =
  (process.env.WRITE_SUMMARY || "false").toLowerCase() === "true";
const SUMMARY_PATH =
  process.env.SUMMARY_PATH ||
  path.join(process.cwd(), "loadDb-summary.json");

// Initialize Astra DB connection
const token = process.env.ASTRA_DB_APPLICATION_TOKEN!;
const endpoint = process.env.ENDPOINT!;
const collectionName = process.env.COLLECTION_NAME || "docketdive";

if (!token || !endpoint) {
  console.error(`❌ Missing Astra DB credentials in .env file!`);
  console.error(
    `Required: ASTRA_DB_APPLICATION_TOKEN, ENDPOINT. Found: Token=${token ? "********" + token.slice(-4) : "null"}, Endpoint=${endpoint || "null"}`,
  );
  process.exit(1);
}

const client = new DataAPIClient(token);
const db = client.db(endpoint);
const collection = db.collection(collectionName);

// Statistics tracking
const stats = {
  filesProcessed: 0,
  totalChunks: 0,
  chunksInserted: 0,
  chunksFailed: 0,
  embeddingsGenerated: 0,
  errors: [] as string[],
};

// Retry wrapper for API calls
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`  ⚠️  Retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Generate embeddings via Ollama with retry logic
async function getEmbedding(textChunk: string): Promise<number[]> {
  if (!textChunk || textChunk.trim().length === 0) {
    throw new Error("Empty text chunk provided for embedding");
  }

  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: EMBED_MODEL,
          prompt: textChunk.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Ollama API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.embedding || !Array.isArray(result.embedding)) {
        throw new Error("Invalid embedding response from Ollama");
      }

      if (result.embedding.length === 0) {
        throw new Error("Empty embedding returned");
      }

      // Warn on dimension mismatch (do not abort)
      const dims = result.embedding.length;
      if (dims !== 1024) {
        console.warn(
          `  ⚠️  Embedding dimension mismatch: expected 1024, got ${dims} from model '${EMBED_MODEL}'. Continuing with returned dimensions.`,
        );
      }

      stats.embeddingsGenerated++;
      return result.embedding as number[];
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`  ❌ Embedding error: ${errorMsg}`);
      throw error;
    }
  });
}

// Smart text chunking - preserves sentence boundaries and context
function chunkByLength(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP,
): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const slice = cleaned.slice(start, end).trim();
    if (slice.length > 0) {
      chunks.push(slice);
    }
    if (end >= cleaned.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return chunks;
}

function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP,
): { chunks: string[]; method: "sentence" | "length-fallback" } {
  if (!text || text.trim().length === 0) {
    return { chunks: [], method: "sentence" };
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return { chunks: [], method: "sentence" };

  const chunks: string[] = [];
  const sentenceEndings = /[.!?]+/g;
  const sentences = normalized
    .split(sentenceEndings)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  let method: "sentence" | "length-fallback" = "sentence";

  if (sentences.length > 0) {
    let currentChunk = "";
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i] || "";
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());

        const overlapText = currentChunk.slice(
          Math.max(0, currentChunk.length - overlap),
        );
        currentChunk = overlapText + " " + sentence;
        currentLength = currentChunk.length;
      } else {
        currentChunk += (currentLength > 0 ? " " : "") + sentence;
        currentLength = currentChunk.length;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  }

  const filteredChunks = chunks.filter(
    (chunk) => chunk.length >= MIN_CHUNK_LENGTH,
  );

  // If sentence-based chunking produced too few chunks, or none, fall back to length-based
  if (filteredChunks.length < 3) {
    const fallbackChunks = chunkByLength(normalized, chunkSize, overlap).filter(
      (chunk) => chunk.length >= MIN_CHUNK_LENGTH,
    );
    method = "length-fallback";
    return { chunks: fallbackChunks, method };
  }

  // Ensure no chunk exceeds chunkSize; further split if needed using length-based slicing
  const finalChunks = filteredChunks.flatMap((chunk) => {
    if (chunk.length > chunkSize) {
      return chunkByLength(chunk, chunkSize, overlap).filter(
        (c) => c.length >= MIN_CHUNK_LENGTH,
      );
    }
    return chunk;
  });

  return { chunks: finalChunks, method };
}

// Process a single PDF file
async function processPdf(filePath: string, fileName: string): Promise<void> {
  console.log(`\n📄 Processing: ${fileName}`);
  console.log(`   Path: ${filePath}`);

  try {
    // Validate PDF file
    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      console.log(`   ⚠️  File is empty (0 bytes), skipping...`);
      stats.errors.push(`${fileName}: File is empty`);
      return;
    }

    const fileSizeMB = fileStats.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      console.log(
        `   ⚠️  File too large (${fileSizeMB.toFixed(2)}MB, limit: 50MB), skipping...`,
      );
      stats.errors.push(
        `${fileName}: File too large (${fileSizeMB.toFixed(2)}MB)`,
      );
      return;
    }

    console.log(`   📏 File size: ${fileSizeMB.toFixed(2)}MB`);

    // Read and parse PDF
    const pdfData = fs.readFileSync(filePath);
    const pdfParsed = await pdfParse(pdfData);
    const pdfText = pdfParsed?.text || "";

    if (!pdfText || pdfText.trim().length === 0) {
      console.log(`   ⚠️  No text extracted from PDF, skipping...`);
      stats.errors.push(`${fileName}: No text extracted`);
      return;
    }

    console.log(`   📊 Extracted ${pdfText.length} characters from PDF`);

    // Create smart chunks
    const { chunks, method: chunkingMethod } = chunkText(
      pdfText,
      CHUNK_SIZE,
      CHUNK_OVERLAP,
    );
    console.log(
      `   ✂️  Created ${chunks.length} chunks (method: ${chunkingMethod})`,
    );

    if (chunks.length === 0) {
      console.log(`   ⚠️  No valid chunks created, skipping...`);
      stats.errors.push(`${fileName}: No chunks created`);
      return;
    }

    stats.totalChunks += chunks.length;

    // Extract document metadata
    const docTitle = fileName
      .replace(/\.pdf$/i, "")
      .replace(/\s*\(.*?\)/g, "")
      .trim();
    const docCategory = extractCategory(fileName);

    // Process chunks in batches
    for (let batchIdx = 0; batchIdx < chunks.length; batchIdx += BATCH_SIZE) {
      const batch = chunks.slice(batchIdx, batchIdx + BATCH_SIZE);
      const batchNumber = Math.floor(batchIdx / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      console.log(
        `   📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`,
      );

      const insertPromises = batch.map(async (chunk, chunkIdx) => {
        const globalChunkIdx = batchIdx + chunkIdx;
        const chunkId = randomUUID();

        try {
          // Generate embedding
          const embedding = await getEmbedding(chunk);

          // Create document with metadata
          const document = {
            _id: chunkId,
            content: chunk,
            $vector: embedding,
            metadata: {
              source: fileName,
              sourcePath: filePath,
              title: docTitle,
              category: docCategory,
              chunkIndex: globalChunkIdx,
              totalChunks: chunks.length,
              chunkLength: chunk.length,
              type: "pdf",
              chunkingMethod,
            },
          };

          // Insert into database with retry
          await retryWithBackoff(async () => collection.insertOne(document));
          stats.chunksInserted++;

          return { success: true, chunkIdx: globalChunkIdx };
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `      ❌ Failed to insert chunk ${globalChunkIdx + 1}: ${errorMsg}`,
          );
          stats.chunksFailed++;
          stats.errors.push(
            `${fileName} - Chunk ${globalChunkIdx + 1}: ${errorMsg}`,
          );
          return { success: false, chunkIdx: globalChunkIdx, error: errorMsg };
        }
      });

      const results = await Promise.all(insertPromises);
      const successCount = results.filter((r) => r.success).length;
      console.log(
        `      ✅ Successfully inserted ${successCount}/${batch.length} chunks`,
      );

      // Small jittered delay between batches to avoid overwhelming the API
      if (batchIdx + BATCH_SIZE < chunks.length) {
        const delay = 300 + Math.floor(Math.random() * 300);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    stats.filesProcessed++;
    console.log(`   ✅ Completed: ${fileName} (${chunks.length} chunks)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`   ❌ Error processing ${fileName}: ${errorMsg}`);
    stats.errors.push(`${fileName}: ${errorMsg}`);
  }
}

// Extract category from filename
function extractCategory(fileName: string): string {
  const name = fileName.toLowerCase();

  if (name.includes("constitutional") || name.includes("constitution"))
    return "Constitutional Law";
  if (name.includes("contract")) return "Contract Law";
  if (
    name.includes("succession") ||
    name.includes("will") ||
    name.includes("estate") ||
    name.includes("deceased")
  )
    return "Succession Law";
  if (
    name.includes("intellectual") ||
    name.includes("property") ||
    name.includes("ip")
  )
    return "Intellectual Property";
  if (name.includes("civil") || name.includes("procedure"))
    return "Civil Procedure";
  if (name.includes("customary")) return "Customary Law";
  if (name.includes("insolvency") || name.includes("business rescue"))
    return "Insolvency Law";
  if (name.includes("clinical")) return "Clinical Law";
  if (name.includes("cyber")) return "Cyber Law";
  if (
    name.includes("exam") ||
    name.includes("revision") ||
    name.includes("scope")
  )
    return "Exam Material";

  return "General Law";
}

// Main execution
(async () => {
  console.log("🚀 Starting DocketDive PDF Processing...\n");
  console.log("📋 Configuration:");
  console.log(`   - Collection: ${collectionName}`);
  console.log(`   - Chunk Size: ${CHUNK_SIZE} chars`);
  console.log(`   - Chunk Overlap: ${CHUNK_OVERLAP} chars`);
  console.log(`   - Batch Size: ${BATCH_SIZE}`);
  console.log(`   - Embedding Model: ${EMBED_MODEL}`);
  console.log(`   - Ollama URL: ${OLLAMA_BASE_URL}\n`);

  // Verify Ollama connection
  try {
    const testResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!testResponse.ok) {
      console.warn(
        `⚠️  Warning: Could not connect to Ollama at ${OLLAMA_BASE_URL}. Make sure Ollama is running and accessible. Response status: ${testResponse.status}`,
      );
    } else {
      console.log("✅ Ollama connection verified successfully.");
    }
  } catch (error: any) {
    console.warn(
      `⚠️  Warning: Ollama connection check failed. Make sure Ollama is running and accessible at ${OLLAMA_BASE_URL}. Error: ${error.message}`,
    );
  }

  // Test database connection
  try {
    // Attempt a simple query to test the connection and credentials
    console.log(
      `Attempting to connect to Astra DB at ${endpoint} with collection ${collectionName}...`,
    );
    await collection.findOne({});
    console.log("✅ Astra DB connection verified successfully.");
  } catch (error: any) {
    console.error(
      `❌ Failed to connect to Astra DB at endpoint ${endpoint}. Please check your ASTRA_DB_APPLICATION_TOKEN and ENDPOINT in .env. Error: ${error.message}`,
    );
    process.exit(1);
  }

  // Get all PDF files
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const smaterialPath = path.join(__dirname, "../smaterial");

  if (!fs.existsSync(smaterialPath)) {
    console.error(`❌ Directory not found: ${smaterialPath}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(smaterialPath)
    .filter((f: string) => f.toLowerCase().endsWith(".pdf"));
  const filesToProcess =
    typeof MAX_FILES === "number" && MAX_FILES > 0
      ? files.slice(0, MAX_FILES)
      : files;
  console.log(
    `📚 Found ${files.length} PDF file(s) | Processing: ${filesToProcess.length}\n`,
  );

  if (files.length === 0) {
    console.log("⚠️  No PDF files found in smaterial folder");
    process.exit(0);
  }

  // Process each file
  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    if (!file) continue;
    const filePath = path.join(smaterialPath, file);
    console.log(`\n[${i + 1}/${filesToProcess.length}] Processing file...`);
    await processPdf(filePath, file);
  }

  // Print final statistics
  console.log("\n" + "=".repeat(60));
  console.log("📊 PROCESSING COMPLETE - Statistics:");
  console.log("=".repeat(60));
  console.log(
    `✅ Files processed: ${stats.filesProcessed}/${filesToProcess.length}`,
  );
  console.log(`📄 Total chunks created: ${stats.totalChunks}`);
  console.log(`💾 Chunks inserted: ${stats.chunksInserted}`);
  console.log(`❌ Chunks failed: ${stats.chunksFailed}`);
  console.log(`🧠 Embeddings generated: ${stats.embeddingsGenerated}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more errors`);
    }
  }

  if (WRITE_SUMMARY) {
    try {
      const summary = {
        timestamp: new Date().toISOString(),
        filesPlanned: files.length,
        filesProcessed: stats.filesProcessed,
        chunksCreated: stats.totalChunks,
        chunksInserted: stats.chunksInserted,
        chunksFailed: stats.chunksFailed,
        embeddingsGenerated: stats.embeddingsGenerated,
        errors: stats.errors,
      };
      fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf-8");
      console.log(`\n📝 Summary written to ${SUMMARY_PATH}`);
    } catch (error: any) {
      console.warn(
        `⚠️  Failed to write summary to ${SUMMARY_PATH}: ${error.message}`,
      );
    }
  }

  console.log("\n✅ PDF processing complete!");
  console.log("=".repeat(60));
})();
