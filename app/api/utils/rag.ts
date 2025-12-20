import { DataAPIClient } from "@datastax/astra-db-ts";
import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";
import { format } from "date-fns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { expandQuery, identifyLegalEntities, rankRelevance, hasKeywordMatches, extractSpecializedTerms } from "./semantic-search";
import { buildContext as buildContextUtil } from "../../utils/responseProcessor";

// Load environment variables - Next.js usually handles this, but we reinforce it for scripts
dotenv.config(); 

console.log(`📡 RAG Initialization: 
  NODE_ENV: ${process.env.NODE_ENV}
  HAS_HF_KEY: ${!!process.env.HUGGINGFACE_API_KEY}
  OLLAMA_URL: ${process.env.OLLAMA_BASE_URL || "default"}
`);

// ========================= CONFIG =========================
export const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").trim();
export const EMBED_MODEL = (process.env.EMBED_MODEL || "dengcao/Qwen3-Embedding-0.6B:Q8_0").trim();
export const CHAT_MODEL = (process.env.CHAT_MODEL || "qwen-ultra-fast:latest").trim();
export const COLLECTION_NAME = (process.env.COLLECTION_NAME || "docketdive").trim();
export const EXPECTED_DIMENSIONS = 1024;
export const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
export const GROQ_MODEL = "llama-3.3-70b-versatile";

// Cloud Embedding Configuration
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY?.trim();
export const HF_EMBED_MODEL = "intfloat/multilingual-e5-large"; 

// BALANCED: Speed + Accuracy optimized thresholds
export const TOP_K = 8;  // Reduced for faster analysis (was 12)
export const MIN_SIMILARITY_THRESHOLD = 0.22;  // Raised for better precision (was 0.18)
export const MAX_SOURCES_IN_CONTEXT = 4;  // Reduced to speed up LLM synthesis (was 6)
export const KEYWORD_GATE_ENABLED = false;

// ========================= CLIENTS =========================
export let db: any = null;
export let collection: any = null;

if (process.env.ASTRA_DB_APPLICATION_TOKEN) {
  try {
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN.trim());
    const dbEndpoint = (process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT)?.trim();
    
    if (dbEndpoint) {
      db = client.db(dbEndpoint);
      collection = db.collection(COLLECTION_NAME);
    } else {
      console.warn("⚠️ Astra DB ENDPOINT missing. Vectors will be disabled.");
    }
  } catch (err) {
    console.error("❌ Failed to initialize Astra DB client:", err);
  }
} else {
  console.warn("⚠️ ASTRA_DB_APPLICATION_TOKEN missing. Vectors will be disabled.");
}

// ========================= EMBEDDING =========================
// Embedding cache for repeated queries (in-memory, session-scoped)
const embeddingCache = new Map<string, { embedding: number[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cloud embedding via Hugging Face - Single or Batch
async function fetchCloudEmbeddings(inputs: string | string[]): Promise<number[][]> {
  if (!HUGGINGFACE_API_KEY) return [];
  
  const model = "intfloat/multilingual-e5-large";
  const isBatch = Array.isArray(inputs);
  const inputsToProcess = isBatch ? (inputs as string[]) : [inputs as string];
  
  try {
    console.log(`☁️ Sending embedding request to HF Router for ${model} (batch size: ${inputsToProcess.length})`);
    
    // E5 models require "query: " or "passage: " prefix
    const prefixedInputs = inputsToProcess.map(text => {
      const trimmed = text.trim();
      return trimmed.startsWith("query:") || trimmed.startsWith("passage:") 
        ? trimmed 
        : `query: ${trimmed}`;
    });

    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        inputs: isBatch ? prefixedInputs : prefixedInputs[0],
        options: { wait_for_model: true }
      }),
    });

    if (!response.ok) {
      const errType = await response.text();
      console.error(`❌ HF API Error (${response.status}):`, errType);
      throw new Error(`HF error: ${response.status} ${errType}`);
    }

    const result = await response.json();
    
    // Response can be [vector] or [[vector], [vector]] or [v1, v2, ...]
    // Standardize to number[][]
    let embeddings: number[][] = [];
    
    if (isBatch) {
      if (Array.isArray(result) && Array.isArray(result[0])) {
        embeddings = result;
      } else if (Array.isArray(result) && typeof result[0] === 'number') {
        // Some models return a single vector even for batch if batch size is 1
        embeddings = [result as number[]];
      }
    } else {
      const embedding = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
      embeddings = [embedding as number[]];
    }
    
    return embeddings;
  } catch (err: any) {
    console.error("❌ Hugging Face Embedding failed:", err.message);
    throw err;
  }
}

async function getCloudEmbedding(text: string): Promise<number[]> {
  const results = await fetchCloudEmbeddings(text);
  return results[0] || [];
}

export async function getEmbedding(text: string, retries = 2): Promise<number[]> {
  console.time(`⏱️ Embedding [${text.substring(0, 20)}...]`);
  const textToEmbed = text.trim();
  
  // Check cache first
  const cacheKey = textToEmbed.toLowerCase();
  const cached = embeddingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Cache hit for embedding`);
    console.timeEnd(`⏱️ Embedding [${text.substring(0, 20)}...]`);
    return cached.embedding;
  }
  
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  
  // Use the constant or the direct env var, trimmed
  const hfKey = (HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || "").trim();
  const useCloud = isProduction || hfKey.length > 0 || !OLLAMA_BASE_URL.includes("localhost");

  for (let i = 0; i < retries; i++) {
    try {
      let embedding: number[];

      if (useCloud) {
        if (hfKey) {
          console.log(`☁️ Using Cloud Embedding (HF) - Key: ${hfKey.substring(0, 5)}...`);
          embedding = await getCloudEmbedding(textToEmbed);
        } else if (isProduction) {
          console.warn("⚠️ HUGGINGFACE_API_KEY missing in production. Retrieval will be empty.");
          console.timeEnd(`⏱️ Embedding [${text.substring(0, 20)}...]`);
          return [];
        } else {
          console.warn(`☁️ Cloud embedding requested (isProd=${isProduction}, hfKeyLen=${hfKey.length}) but key is missing. Falling back to local.`);
          // Don't throw here, just fall through to local
          throw new Error("Skipping to local");
        }
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for local

        const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: EMBED_MODEL, prompt: textToEmbed }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        const data = await response.json();
        embedding = data.embedding;
      }

      if (!embedding || embedding.length === 0) throw new Error("Empty embedding received");
      
      // Cache the result
      embeddingCache.set(cacheKey, { embedding, timestamp: Date.now() });
      
      console.timeEnd(`⏱️ Embedding [${text.substring(0, 20)}...]`);
      return embedding;
    } catch (err) {
      console.error(`Embedding attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        if (isProduction) {
          console.error("❌ Critical: Embedding failed in production.", err);
          console.timeEnd(`⏱️ Embedding [${text.substring(0, 20)}...]`);
          return []; // Graceful failure for production
        }
        console.timeEnd(`⏱️ Embedding [${text.substring(0, 20)}...]`);
        throw err;
      }
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  console.timeEnd(`⏱️ Embedding [${text.substring(0, 20)}...]`);
  return []; // Fallback
}

/**
 * Batch embedding generation for multiple texts
 */
export async function getEmbeddings(texts: string[], retries = 2): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length === 1 && texts[0]) return [await getEmbedding(texts[0])];

  console.time(`⏱️ Batch Embedding [${texts.length} items]`);
  
  // 1. Separate cached vs non-cached
  const results: (number[] | null)[] = texts.map(t => {
    const cached = embeddingCache.get(t.trim().toLowerCase());
    return (cached && Date.now() - cached.timestamp < CACHE_TTL) ? cached.embedding : null;
  });

  const missingIndices: number[] = [];
  const missingTexts: string[] = [];
  
  results.forEach((res, idx) => {
    if (!res) {
      missingIndices.push(idx);
      missingTexts.push(texts[idx] as string);
    }
  });

  if (missingTexts.length === 0) {
    console.log(`📦 Cache hit for all ${texts.length} batch items`);
    console.timeEnd(`⏱️ Batch Embedding [${texts.length} items]`);
    return results as number[][];
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const hfKey = (HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || "").trim();
  const useCloud = isProduction || hfKey.length > 0 || !OLLAMA_BASE_URL.includes("localhost");

  // 2. Fetch missing embeddings
  let fetchedEmbeddings: number[][] = [];
  
  for (let i = 0; i < retries; i++) {
    try {
      if (useCloud && hfKey) {
        fetchedEmbeddings = await fetchCloudEmbeddings(missingTexts);
      } else {
        // Fallback to sequential for local/other
        fetchedEmbeddings = await Promise.all(missingTexts.map(t => getEmbedding(t, 1)));
      }
      break;
    } catch (err) {
      console.error(`Batch embedding attempt ${i + 1} failed:`, err);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }

  // 3. Merge results and cache
  fetchedEmbeddings.forEach((emb, idx) => {
    const originalIdx = missingIndices[idx] as number;
    results[originalIdx] = emb;
    embeddingCache.set(texts[originalIdx]!.trim().toLowerCase(), { 
      embedding: emb, 
      timestamp: Date.now() 
    });
  });

  console.timeEnd(`⏱️ Batch Embedding [${texts.length} items]`);
  return results as number[][];
}

// ========================= RETRIEVAL =========================
export async function retrieveRelevantDocuments(query: string, conversationContext?: string) {
  let results: any[] = [];
  const startTime = Date.now();

  try {
    console.log(`\n🔍 === RETRIEVAL START for: "${query}" ===`);
    
    // CONTEXT-AWARE QUERY ENHANCEMENT
    // If we have conversation context, enrich the query with it
    let enrichedQuery = query;
    if (conversationContext && conversationContext.length > 0) {
      // Extract key topics from recent conversation (last 800 chars for better context)
      const recentContext = conversationContext.slice(-800);
      
      // Detect follow-up questions more broadly
      const queryLower = query.toLowerCase().trim();
      const isShortQuery = query.length < 80;
      const startsWithQuestionWord = /^(what|how|when|where|who|why|which|can|could|should|would|is|are|does|do|did|please|expand|explain|tell|more)/i.test(queryLower);
      const lacksSpecificContext = !/(act|section|case|court|law|statute|constitution)/i.test(query);
      
      const isFollowUp = isShortQuery && (startsWithQuestionWord || lacksSpecificContext);
      
      if (isFollowUp) {
        console.log(`🔄 Detected follow-up question: "${query}"`);
        
        // Extract main topics from recent context (more comprehensive list)
        const topicPatterns = [
          /\b(will|wills|testament|testamentary|testate|intestate)\b/gi,
          /\b(contract|contracts|agreement|breach|remedy|remedies)\b/gi,
          /\b(marriage|divorce|matrimonial|spouse|marital)\b/gi,
          /\b(property|estate|inheritance|heir|beneficiary)\b/gi,
          /\b(witness|witnesses|testator|executor|commissioner)\b/gi,
          /\b(tenant|landlord|lease|rental|housing)\b/gi,
          /\b(delict|negligence|liability|damages)\b/gi,
          /\b(criminal|crime|offense|sentence|conviction)\b/gi,
        ];
        
        const topics: string[] = [];
        for (const pattern of topicPatterns) {
          const matches = recentContext.match(pattern);
          if (matches && matches.length > 0) {
            // Get the most frequent topic
            const topicCounts = new Map<string, number>();
            matches.forEach(m => {
              const topic = m.toLowerCase();
              topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
            });
            const mostFrequent = Array.from(topicCounts.entries())
              .sort((a, b) => b[1] - a[1])[0];
            if (mostFrequent) {
              topics.push(mostFrequent[0]);
            }
          }
        }
        
        if (topics.length > 0) {
          // Use the most prominent topic
          const mainTopic = topics[0];
          enrichedQuery = `${query} regarding ${mainTopic}`;
          console.log(`🔗 Context-enriched query: "${enrichedQuery}" (topic: ${mainTopic})`);
        } else {
          // Fallback: extract any legal terms from context
          const legalTerms = recentContext.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+Act\b/g);
          if (legalTerms && legalTerms.length > 0) {
            enrichedQuery = `${query} under ${legalTerms[0]}`;
            console.log(`🔗 Context-enriched query: "${enrichedQuery}" (act: ${legalTerms[0]})`);
          }
        }
      }
    }
    
    // BALANCED: Query expansion for better recall
    // Expand for most queries except very short ones
    const shouldExpand = enrichedQuery.length > 20;
    
    // Launch identification promise
    const entitiesPromise = Promise.resolve(identifyLegalEntities(enrichedQuery));

    // 2. Launch initial expansion and FIRST Parallel Search (Original Query)
    console.time("⏱️ Concurrent Retrieval");
    const expansionPromise = shouldExpand ? expandQuery(enrichedQuery) : Promise.resolve([enrichedQuery]);
    
    // We launch the search for the ORIGINAL query immediately without waiting for expansion
    const originalQueryEmbeddingPromise = getEmbedding(enrichedQuery);
    
    // Process search as soon as possible
    const [expandedQueries, originalVector, entities] = await Promise.all([
      expansionPromise,
      originalQueryEmbeddingPromise,
      entitiesPromise
    ]);
    
    console.log(`📝 Query expansion: ${shouldExpand ? 'enabled' : 'skipped'} (${expandedQueries.length} queries)`);
    console.log(`🏷️ Identified entities:`, entities);
    
    const allResults: any[] = [];
    
    if (!collection) {
      console.warn("⚠️ Retrieval skipped: Astra DB collection not initialized.");
      return [];
    }

    // 3. Batch generate embeddings for the REST (the expanded ones)
    const expansionQueries = expandedQueries.filter(q => q !== enrichedQuery);
    const expansionVectorsPromise = expansionQueries.length > 0 
      ? getEmbeddings(expansionQueries) 
      : Promise.resolve([]);

    // 4. Parallel search for expanded results
    const expansionVectors = await expansionVectorsPromise;
    
    const queryPromises = [
      // Original query results
      (async () => {
        if (!originalVector || originalVector.length === 0) return [];
        return await collection.find({}, {
          sort: { $vector: originalVector },
          limit: TOP_K,
          includeSimilarity: true,
          projection: { content: 1, metadata: 1 },
        }).toArray();
      })()
    ];

    // Add expansion search promises
    expansionQueries.forEach((q, idx) => {
      queryPromises.push((async () => {
        const vector = expansionVectors[idx];
        if (!vector || vector.length === 0) return [];
        const limit = Math.ceil(TOP_K * 0.5);
        return await collection.find({}, {
          sort: { $vector: vector },
          limit: limit,
          includeSimilarity: true,
          projection: { content: 1, metadata: 1 },
        }).toArray();
      })());
    });

    const queryResults = await Promise.all(queryPromises);
    console.timeEnd("⏱️ Concurrent Retrieval");
    
    for (const result of queryResults) {
      allResults.push(...result);
    }

    console.log(`📚 Total raw results: ${allResults.length}`);

    // Fast deduplication using Set
    const uniqueResultsMap = new Map();
    for (const result of allResults) {
      const id = String(result._id);
      const existing = uniqueResultsMap.get(id);
      if (!existing || existing.$similarity < result.$similarity) {
        uniqueResultsMap.set(id, result);
      }
    }

    const uniqueResults = Array.from(uniqueResultsMap.values());
    console.log(`📚 Unique results: ${uniqueResults.length}`);

    // Sort and limit early for efficiency
    results = uniqueResults
      .sort((a, b) => (b.$similarity || 0) - (a.$similarity || 0))
      .slice(0, TOP_K);

    // Apply semantic + keyword ranking
    results = rankRelevance(results, query, entities);

    // KEYWORD GATING
    if (KEYWORD_GATE_ENABLED && results.length > 0) {
      const hasMatches = hasKeywordMatches(results, query);
      if (!hasMatches) {
        console.log(`⚠️ KEYWORD GATE: No keyword matches, rejecting results`);
        results = [];
      }
    }

    // Apply similarity threshold
    results = results.filter(d => (d.relevanceScore || d.$similarity || 0) >= MIN_SIMILARITY_THRESHOLD);
    
    console.log(`✅ Final results: ${results.length} (threshold: ${MIN_SIMILARITY_THRESHOLD})`);
    
    // Log top 3 for debugging
    results.slice(0, 3).forEach((doc, idx) => {
      const title = doc.metadata?.title || "Unknown";
      const score = (doc.relevanceScore || doc.$similarity || 0).toFixed(3);
      console.log(`  [${idx + 1}] ${score} | ${title.substring(0, 40)}...`);
    });

  } catch (err) {
    console.error("Retrieval failed:", err);
  }

  const elapsed = Date.now() - startTime;
  console.log(`🔍 === RETRIEVAL END (${elapsed}ms) ===\n`);

  return results.map(d => ({
    content: d.content || "",
    metadata: d.metadata || {},
    similarity: d.relevanceScore || d.$similarity || 0,
  }));
}

// ========================= CONTEXT BUILDING =========================
export function buildContext(docs: any[]): string {
  return buildContextUtil(docs, MIN_SIMILARITY_THRESHOLD, MAX_SOURCES_IN_CONTEXT);
}

// ========================= ENHANCED SYSTEM PROMPT =========================
export function getSystemPrompt(hasContext: boolean, currentDate: string): string {
  const BASE = `You are DocketDive, a South African legal assistant. Current date: ${currentDate}

For greetings: Respond briefly (1 sentence) and warmly.

For **substantive legal questions**, you MUST use this structured format (unless the user explicitly asks for a different format):

1. **Executive Summary** – 2–4 sentences giving the direct answer in plain language.
2. **Key Legal Principles** – numbered or bulleted list of the key elements / requirements / rules.
3. **Case Law** – bullet list of the most relevant South African cases with:
   - Case name in bold,
   - Year and citation where available,
   - One short sentence on why the case is relevant.
4. **Relevant Legislation** – bullet list of Acts / sections, with a one-line explanation of each.
5. **Practical Guidance** – 3–5 bullets on what a South African user should practically do / be aware of.
6. **Legal Disclaimer** – short paragraph making it clear the information is educational and not legal advice.

When quoting from a source, use the format: 「exact quote」 [Document / Case Name].

STYLE RULES:
- Write in clear, neutral, professional English.
- Prefer concise sentences and bullet points over long paragraphs.
- Always prefer South African authority (Constitution, SA statutes, SA case law).
- Never fabricate laws or cases; if unsure, say so plainly.
- If the question is not strictly legal, still try to keep a helpful, structured explanation.`;

  if (!hasContext) {
    return `${BASE}

CRITICAL: No relevant legal sources found in the database for this query.

You MUST respond:
"I apologize, but I don't have specific information about this topic in my legal database. To ensure accuracy, I recommend:

1. Rephrasing your question with different terms
2. Consulting SAFLII (South African Legal Information Institute) at www.saflii.org
3. Speaking with a qualified attorney for authoritative guidance

I cannot provide information without verified sources, as legal accuracy is paramount."

DO NOT fabricate or guess legal information. DO NOT provide answers without sources.`;
  }

  return `${BASE}

=== CRITICAL ACCURACY INSTRUCTIONS ===
You are a South African legal expert using ONLY the provided sources.

PROHIBITED: 
- NEVER provide ANY case law citations unless they are EXPLICITLY FOUND in the "Sources provided" section below.
- NEVER invent citations. If a case name or citation is not below, it DOES NOT EXIST for the purpose of this answer.
- NEVER use external knowledge to provide "examples" of cases.

STRICT SOURCE ADHERENCE:
1. Answer ONLY using information EXPLICITLY written in the sources below.
2. If the user asks for cases and NONE are in the sources, you MUST say: "The provided legal sources do not contain specific case law for this query."
3. Every claim MUST have a citation: 「quote」 [Source Name].

Sources provided:
----------------
{INJECTED_CONTEXT}
----------------

FINAL COMMAND: DO NOT MENTION ANY CASE PROUDLY OR OTHERWISE IF IT IS NOT IN THE SOURCES ABOVE. ACCURACY IS LIFE-OR-DEATH.
`;
}

// ========================= CITATION ENFORCER =========================
export function enforceCitations(response: string, sources: any[]): string {
  let fixed = response.trim();

  const hasInlineCitation = /\[Source \d+\]/.test(fixed);
  const hasSourcesSection = fixed.includes("**Sources Used**");

  if (!hasInlineCitation || !hasSourcesSection) {
    const list = sources
      .filter(s => s.similarity >= MIN_SIMILARITY_THRESHOLD)
      .slice(0, MAX_SOURCES_IN_CONTEXT)
      .map((s, i) => {
        const title = s.metadata.title || s.metadata.source || "Unknown";
        const citation = s.metadata.citation ? ` — ${s.metadata.citation}` : "";
        const relevance = ` (${(s.similarity * 100).toFixed(1)}% relevance)`;
        return `- **${title}**${citation}${relevance}`;
      })
      .join("\n");

    if (!hasSourcesSection) {
      fixed += `\n\n**Sources Used**\n${list || "None explicitly cited"}`;
    }

    if (!hasInlineCitation && sources.length > 0) {
      fixed = `*Note: Response may lack specific source citations.*\n\n${fixed}`;
    }
  }

  return fixed;
}

// ========================= DISCLAIMER ADDER =========================
export function addDisclaimer(response: string): string {
  const disclaimer = "\n\n**Disclaimer:** This information is for educational purposes only and should not be considered legal advice. Consult with a qualified legal professional for advice tailored to your specific situation.";
  return response + disclaimer;
}

// ========================= RESPONSE CLEANER =========================
export function cleanThinkingOutput(response: string): string {
  let cleaned = response.trim();
  
  const thinkingParagraphPatterns = [
    /^The user is asking.*?(?=\n\n|\n[A-Z]|$)/g,
    /^I need to.*?(?=\n\n|\n[A-Z]|$)/g,
    /^I should.*?(?=\n\n|\n[A-Z]|$)/g,
    /^I'll.*?(?=\n\n|\n[A-Z]|$)/g,
    /^I won't.*?(?=\n\n|\n[A-Z]|$)/g,
    /^I will.*?(?=\n\n|\n[A-Z]|$)/g,
    /^Let me.*?(?=\n\n|\n[A-Z]|$)/g,
    /^Looking at the sources.*?(?=\n\n|\n[A-Z]|$)/g,
    /^The instructions.*?(?=\n\n|\n[A-Z]|$)/g,
    /^The source.*?(?=\n\n|\n[A-Z]|$)/g,
    /^Since the.*?(?=\n\n|\n[A-Z]|$)/g,
    /^Given that.*?(?=\n\n|\n[A-Z]|$)/g,
    /^Note that.*?(?=\n\n|\n[A-Z]|$)/g,
    /^However, the.*?(?=\n\n|\n[A-Z]|$)/g,
    /^But the.*?(?=\n\n|\n[A-Z]|$)/g,
    /^This means.*?(?=\n\n|\n[A-Z]|$)/g,
    /^Therefore, I.*?(?=\n\n|\n[A-Z]|$)/g,
    /^So I.*?(?=\n\n|\n[A-Z]|$)/g,
  ];
  
  thinkingParagraphPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  const thinkingSentencePatterns = [
    /The user is asking[^.!?]*[.!?]/gi,
    /I need to check[^.!?]*[.!?]/gi,
    /I should [^.!?]*[.!?]/gi,
    /I'll structure[^.!?]*[.!?]/gi,
    /I won't add[^.!?]*[.!?]/gi,
    /I will [^.!?]*[.!?]/gi,
    /Let me check[^.!?]*[.!?]/gi,
    /Let me read[^.!?]*[.!?]/gi,
    /Looking at [^.!?]*provided[^.!?]*[.!?]/gi,
    /The instructions state[^.!?]*[.!?]/gi,
    /The instructions clearly[^.!?]*[.!?]/gi,
    /Since these aren't mentioned[^.!?]*[.!?]/gi,
    /I'm supposed to[^.!?]*[.!?]/gi,
    /I'm a professional[^.!?]*[.!?]/gi,
    /Note that this summary[^.!?]*[.!?]/gi,
  ];
  
  thinkingSentencePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  const metaPhrases = [
    /\(not in source\)/gi,
    /⚠️[^⚠️]*⚠️/g,
    /based on the instructions/gi,
    /according to the instructions/gi,
  ];
  
  metaPhrases.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  const answerMarkers = [
    'According to',
    'In South African law',
    'The Constitution',
    'Under South African law',
    'South African law',
    'The law',
    'In terms of',
    'Executive Summary',
    'Legal Framework',
    'EXECUTIVE SUMMARY',
    'LEGAL FRAMEWORK',
  ];
  
  const startsWithThinking = /^(The user|I need|I should|I'll|Looking at|Let me)/i.test(cleaned);
  
  if (startsWithThinking) {
    for (const marker of answerMarkers) {
      const markerIndex = cleaned.indexOf(marker);
      if (markerIndex > 0 && markerIndex < 1000) {
        cleaned = cleaned.substring(markerIndex);
        break;
      }
    }
  }
  
  return cleaned.trim();
}

// ========================= RESPONSE GENERATION =========================
export async function generateResponse(query: string, context: string, hasContext: boolean, provider: "ollama" | "groq" = "ollama", systemPromptOverride?: string) {
  const currentDate = format(new Date(), "MMMM d, yyyy");
  const systemPrompt = getSystemPrompt(hasContext, currentDate);
  const finalPrompt = systemPromptOverride || (hasContext ? systemPrompt.replace("{INJECTED_CONTEXT}", context) : systemPrompt);

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  let chatModel;

  // In production, strictly prefer Groq if key is available
  const effectiveProvider = (isProduction && GROQ_API_KEY) ? "groq" : provider;

  if (effectiveProvider === "groq" && GROQ_API_KEY) {
    if (isProduction) console.log(`☁️ Using Production AI (Groq)`);
    chatModel = new ChatGroq({
      apiKey: GROQ_API_KEY,
      model: GROQ_MODEL,
      temperature: 0.05,
      maxTokens: 3000, // Balanced for quality
    });
  } else {
    if (isProduction) console.warn("⚠️ Falling back to local AI in production - this may fail (Ollama)");
    chatModel = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: CHAT_MODEL,
      temperature: 0.05,
      topP: 0.9, // Restored for better quality
      topK: 30, // Restored for better sampling
      repeatPenalty: 1.15, // Balanced
      numCtx: 6144, // Restored for better context
      numPredict: 3000, // Restored for complete answers
    });
  }

  const raw = await Promise.race([
    chatModel.invoke([
      { role: "system", content: finalPrompt },
      { role: "user", content: query },
    ]),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000)) // Reduced from 120s to 60s
  ]) as any;

  const rawResponse = typeof raw.content === "string"
    ? raw.content
    : raw.content?.map((c: any) => c.text || "").join("");

  return cleanThinkingOutput(rawResponse);
}

// ========================= HEALTH CHECK =========================
export async function verifyOllamaModel(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = await res.json();
    const models = data.models?.map((m: any) => m.name || m.model) || [];
    return models.includes(CHAT_MODEL);
  } catch {
    return false;
  }
}
