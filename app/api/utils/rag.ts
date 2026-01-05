import { DataAPIClient } from "@datastax/astra-db-ts";
import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";
import { format } from "date-fns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { expandQuery, identifyLegalEntities, rankRelevance, hasKeywordMatches, extractSpecializedTerms } from "./semantic-search";
import { buildContext as buildContextUtil } from "../../utils/responseProcessor";

// Load environment variables.
// In Next.js this is handled automatically, but local scripts / dev runs can differ.
// We explicitly try .env.local first (common in Next.js), then fall back to .env.
// This prevents silent DB-disable scenarios.
if (!process.env.ASTRA_DB_APPLICATION_TOKEN || !process.env.ASTRA_DB_API_ENDPOINT) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}
if (!process.env.ASTRA_DB_APPLICATION_TOKEN || !process.env.ASTRA_DB_API_ENDPOINT) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
} 

console.log(`📡 RAG Initialization: 
  NODE_ENV: ${process.env.NODE_ENV}
  HAS_HF_KEY: ${!!process.env.HUGGINGFACE_API_KEY}
  OLLAMA_URL: ${process.env.OLLAMA_BASE_URL || "default"}
`);

// ========================= CONFIG =========================
// Detect production environment early for config decisions
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").trim();
export const EMBED_MODEL = (process.env.EMBED_MODEL || "dengcao/Qwen3-Embedding-0.6B:Q8_0").trim();
export const CHAT_MODEL = (process.env.CHAT_MODEL || "qwen-ultra-fast:latest").trim();
export const COLLECTION_NAME = (process.env.COLLECTION_NAME || "docketdive").trim();
export const EXPECTED_DIMENSIONS = 1024;
export const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
// Use faster model in production for lower latency
export const GROQ_MODEL = IS_PRODUCTION ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

// Cloud Embedding Configuration
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY?.trim();
export const HF_EMBED_MODEL = "intfloat/multilingual-e5-large";

// PRODUCTION OPTIMIZED: Speed-focused thresholds
// Retrieval defaults:
// - In production we still want decent recall; too-aggressive thresholds cause "no sources" for common topics.
// - Keep TOP_K moderate but allow env override.
export const TOP_K = parseInt(process.env.TOP_K || (IS_PRODUCTION ? '10' : '12'), 10);

// Similarity threshold:
// 0.25 is too strict for sparse/heterogeneous legal corpora and simple-embedding setups.
// Use a safer default, overrideable via env.
export const MIN_SIMILARITY_THRESHOLD = parseFloat(process.env.MIN_SIMILARITY_THRESHOLD || '0.12');

// Keep context lean for latency, but not so small that answers lose grounding.
export const MAX_SOURCES_IN_CONTEXT = IS_PRODUCTION ? 4 : 5;

export const KEYWORD_GATE_ENABLED = false;

// Query expansion is important for recall (especially for POPIA/CPA/etc.).
// Keep it on in production, but the semantic-search implementation already limits expansions.
export const SKIP_QUERY_EXPANSION_IN_PROD = false;

// ========================= CLIENTS =========================
export let db: any = null;
export let collection: any = null;

function initAstra() {
  const token = (process.env.ASTRA_DB_APPLICATION_TOKEN || '').trim();
  const endpoint = (process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT || '').trim();

  if (!token) {
    console.error('❌ CRITICAL: ASTRA_DB_APPLICATION_TOKEN missing. Database retrieval disabled.');
    return;
  }
  if (!endpoint) {
    console.error('❌ CRITICAL: ASTRA_DB_API_ENDPOINT/ENDPOINT missing. Database retrieval disabled.');
    return;
  }

  try {
    const client = new DataAPIClient(token);
    db = client.db(endpoint);
    collection = db.collection(COLLECTION_NAME);
    console.log(`✅ Astra initialized: collection="${COLLECTION_NAME}" endpoint="${endpoint.substring(0, 35)}..."`);
    
    // Test connectivity immediately
    collection.countDocuments({}, { limit: 1 })
      .then((count: number) => console.log(`📊 Astra collection has ${count} documents`))
      .catch((err: any) => console.error('⚠️ Astra connectivity test failed:', err.message));
  } catch (err) {
    console.error('❌ Failed to initialize Astra DB client:', err);
  }
}

initAstra();

// ========================= EMBEDDING =========================
// Embedding cache for repeated queries (in-memory, session-scoped)
const embeddingCache = new Map<string, { embedding: number[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple embedding for 0-cost compatibility with stored data
function generateSimpleEmbedding(text: string): number[] {
  const VECTOR_DIM = 1024;
  const embedding = new Array(VECTOR_DIM).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word || word.length === 0) continue;
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const idx1 = (charCode * (i + 1) * (j + 1)) % VECTOR_DIM;
      const idx2 = (charCode * (i + 2) * (j + 3)) % VECTOR_DIM;
      embedding[idx1] += 1 / (1 + Math.log(words.length + 1));
      embedding[idx2] += 0.5 / (1 + Math.log(words.length + 1));
    }
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

// Cloud embedding via Hugging Face - Single or Batch (DISABLED for 0-cost)
async function fetchCloudEmbeddings(inputs: string | string[]): Promise<number[][]> {
  console.log('🔧 Using simple embeddings for 0-cost compatibility');
  // Return empty to fall back to simple
  return [];
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

      if (useCloud && hfKey) {
        console.log(`☁️ Using Cloud Embedding (HF) for queries`);
        const results = await fetchCloudEmbeddings(textToEmbed);
        embedding = results[0] || generateSimpleEmbedding(textToEmbed);
      } else {
        console.log('🔧 Using simple embeddings for queries');
        embedding = generateSimpleEmbedding(textToEmbed);
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

  // Hard guard: never attempt retrieval if Astra isn't initialized.
  // This prevents confusing UX where everything becomes "no sources" without explanation.
  if (!collection) {
    console.warn('⚠️ Retrieval skipped: Astra collection not initialized. Check env vars on this runtime.');
    return [];
  }

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
    
    // Query expansion should be enabled when it helps recall.
    // In production we still expand for medium/long queries; for very short queries we skip to reduce noise.
    const shouldExpand = !SKIP_QUERY_EXPANSION_IN_PROD && enrichedQuery.length > 20;
    
    // Launch identification promise
    const entitiesPromise = Promise.resolve(identifyLegalEntities(enrichedQuery));

    // 2. Launch initial expansion AND original query embedding in parallel
    console.time("⏱️ Pipelined Retrieval Start");
    const expansionPromise = shouldExpand ? expandQuery(enrichedQuery) : Promise.resolve([enrichedQuery]);
    const originalQueryEmbeddingPromise = getEmbedding(enrichedQuery);

    // Wait for ORIGINAL query embedding first (fastest)
    const originalVector = await originalQueryEmbeddingPromise;
    
    // Launch ORIGINAL database search IMMEDIATELY
    const originalSearchPromise = (async () => {
      if (!originalVector || originalVector.length === 0) return [];
      return await collection.find({}, {
        sort: { $vector: originalVector },
        limit: TOP_K,
        includeSimilarity: true,
        projection: { content: 1, metadata: 1 },
      }).toArray();
    })();

    // While original search is running, wait for expansion results
    const [expandedQueries, entities] = await Promise.all([
      expansionPromise,
      entitiesPromise
    ]);
    
    console.log(`📝 Query expansion: ${shouldExpand ? 'enabled' : 'skipped'} (${expandedQueries.length} queries)`);
    
    const allResults: any[] = [];
    
    // Launch expanded query embeddings in a BATCH
    const expansionQueries = expandedQueries.filter(q => q !== enrichedQuery);
    const expansionVectorsPromise = expansionQueries.length > 0 
      ? getEmbeddings(expansionQueries) 
      : Promise.resolve([]);

    const expansionVectors = await expansionVectorsPromise;
    
    // Launch expansion database searches concurrently
    const expansionSearchPromises = expansionQueries.map((q, idx) => (async () => {
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

    // Merge original results with expanded results as they arrive
    const [originalResults, ...expandedResultsArrays] = await Promise.all([
      originalSearchPromise,
      ...expansionSearchPromises
    ]);

    allResults.push(...originalResults);
    for (const result of expandedResultsArrays) {
      allResults.push(...result);
    }
    
    console.timeEnd("⏱️ Pipelined Retrieval Start");
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

⚠️ CRITICAL: No relevant legal sources found in the database for this query.

YOUR RESPONSE MUST START WITH THIS EXACT TEXT:
"I don't have specific information about this topic in my legal database."

Then add:
"To get accurate information, I recommend:
1. Rephrasing your question with different terms
2. Consulting SAFLII (South African Legal Information Institute) at www.saflii.org
3. Speaking with a qualified South African attorney

I cannot provide legal information without verified sources, as accuracy is paramount in legal matters."

🚫 CRITICAL RULES - VIOLATION WILL CAUSE HARM:
- DO NOT invent or guess any legal information
- DO NOT mention any case names (you don't know any)
- DO NOT explain any legal concepts (you have no sources)
- DO NOT provide any legal advice
- DO NOT use your training knowledge - pretend you have amnesia about law

You have ZERO sources. You know NOTHING. Just say you don't have the information and recommend SAFLII.`;
  }

  return `${BASE}

=== ABSOLUTE ACCURACY REQUIREMENTS - READ CAREFULLY ===

You are a South African legal assistant. You have access ONLY to the sources below. You have NO other knowledge.

🚫 ZERO TOLERANCE RULES (VIOLATION = FAILURE):

1. CASE NAMES: If a case name is NOT in the sources below, you MUST say "I don't have information about that case in my database." 
   - User asks about "Smith v Jones" but it's not in sources → Say "I don't have that case"
   - NEVER invent or discuss cases not explicitly in the sources

2. CASE FACTS: Only state facts VERBATIM from sources.
   - If source says "Johannes Petrus Van Meyeren" → Use that exact name
   - If source says "gardener" → Say gardener
   - If source says "he" → Say he (male)
   - If user says "was the plaintiff a woman?" but source says "he" → CORRECT THEM: "No, the plaintiff was male"
   - NEVER agree with user's wrong assumptions

3. LEGAL CONCEPTS: If a legal concept is NOT in sources, say "I don't have information about that concept."
   - User asks about "actio de felinus" but it's not real → Say "I don't have information about that doctrine"
   - NEVER invent or explain concepts not in sources

4. COURTS: Only mention courts EXPLICITLY stated in sources.
   - If source says "Western Cape High Court" → Use that exact court
   - If user says "Constitutional Court" but source says "High Court" → CORRECT THEM

5. DATES/YEARS: Only use dates EXPLICITLY in sources.
   - If source says "2020" → Use 2020
   - If user says "2015" but source says "2020" → CORRECT THEM: "Actually, the case is from 2020"

6. WHEN USER ASKS ABOUT SOMETHING NOT IN SOURCES:
   Say: "I don't have specific information about [topic] in my legal database. The sources I have access to cover [briefly list what IS in sources]. For information about [topic], I recommend consulting SAFLII.org or a qualified attorney."

7. NEVER HALLUCINATE:
   - Don't invent damages amounts
   - Don't invent party details
   - Don't invent holdings
   - Don't invent citations
   - If you're not 100% certain it's in the sources, DON'T SAY IT

⚠️ CRITICAL: ALWAYS CORRECT USER MISTAKES - EXAMPLES:

Example 1 - WRONG ANIMAL:
User: "What breed was the cat that attacked the plaintiff?"
Sources say: "Boerboel dog named Max"
CORRECT RESPONSE: "I need to correct a detail in your question - it was not a cat. According to my sources, the animal was a Boerboel dog named 'Max' that attacked the plaintiff."
WRONG RESPONSE: "The cat that attacked..." (NEVER accept wrong premises)

Example 2 - WRONG COURT:
User: "What did the Constitutional Court decide in Van Meyeren v Cloete?"
Sources say: "Western Cape High Court"
CORRECT RESPONSE: "I need to clarify - Van Meyeren v Cloete was decided by the Western Cape High Court, not the Constitutional Court. The court held that..."
WRONG RESPONSE: "The Constitutional Court decided..." (NEVER accept wrong court)

Example 3 - WRONG YEAR:
User: "Tell me about Van Meyeren v Cloete from 2015"
Sources say: "2020"
CORRECT RESPONSE: "I need to correct the year - Van Meyeren v Cloete is from 2020, not 2015. In this case..."
WRONG RESPONSE: "In 2015, the court..." (NEVER accept wrong dates)

RULE: If the user's question contains ANY factual error about a case in your sources, you MUST correct it FIRST before answering.

Sources provided (THIS IS YOUR ONLY KNOWLEDGE):
----------------
{INJECTED_CONTEXT}
----------------

REMEMBER: If it's not in the sources above, you don't know it. Say "I don't have that information" rather than guess.
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

// ========================= HALLUCINATION DETECTOR =========================
/**
 * Detects potential hallucinations by checking if case names in response exist in sources
 */
export function detectHallucinations(response: string, sources: any[], query: string): { 
  hasHallucination: boolean; 
  warnings: string[];
  cleanedResponse: string;
} {
  const warnings: string[] = [];
  let cleanedResponse = response;
  
  // Extract case names from sources
  const sourceCaseNames = new Set<string>();
  const sourceContent = sources.map(s => (s.content || '').toLowerCase()).join(' ');
  
  sources.forEach(s => {
    const title = s.metadata?.title || '';
    if (title && title.includes(' v ')) {
      sourceCaseNames.add(title.toLowerCase());
    }
  });
  
  // Find case citations in response (pattern: "Name v Name" or "Name v. Name")
  const casePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const responseCases = [...response.matchAll(casePattern)];
  
  for (const match of responseCases) {
    const caseName = match[0].toLowerCase().replace(/\./g, '');
    const caseNameNormalized = caseName.replace(/\s+v\s+/, ' v ');
    
    // Check if this case exists in sources
    let foundInSources = false;
    for (const sourceName of sourceCaseNames) {
      if (sourceName.includes(caseNameNormalized) || caseNameNormalized.includes(sourceName)) {
        foundInSources = true;
        break;
      }
    }
    
    // Also check if case name appears in source content
    if (!foundInSources && sourceContent.includes(caseNameNormalized)) {
      foundInSources = true;
    }
    
    if (!foundInSources) {
      warnings.push(`Potential hallucination: Case "${match[0]}" not found in sources`);
    }
  }
  
  // Check for fake legal concepts (common hallucination patterns)
  const fakeConcepts = [
    'actio de felinus',
    'actio de caninus', 
    'actio de bovinus',
    'actio de equinus',
  ];
  
  for (const concept of fakeConcepts) {
    if (response.toLowerCase().includes(concept)) {
      warnings.push(`Potential hallucination: Fake legal concept "${concept}" detected`);
    }
  }
  
  return {
    hasHallucination: warnings.length > 0,
    warnings,
    cleanedResponse
  };
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
export async function generateResponse(
  query: string,
  context: string,
  hasContext: boolean,
  provider: "ollama" | "groq" = "ollama",
  systemPromptOverride?: string
) {
  // Synchronous version for simple calls
  const currentDate = format(new Date(), "MMMM d, yyyy");
  const systemPrompt = getSystemPrompt(hasContext, currentDate);
  const finalPrompt = systemPromptOverride || (hasContext ? systemPrompt.replace("{INJECTED_CONTEXT}", context) : systemPrompt);

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const effectiveProvider = (GROQ_API_KEY) ? "groq" : provider;
  let chatModel;

  if (effectiveProvider === "groq" && GROQ_API_KEY) {
    chatModel = new ChatGroq({
      apiKey: GROQ_API_KEY,
      model: GROQ_MODEL,
      temperature: 0,  // Zero temperature for maximum accuracy - no creativity
      maxTokens: 3000,
    });
  } else {
    chatModel = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: CHAT_MODEL,
      temperature: 0.05,
      numCtx: 6144,
      numPredict: 3000,
    });
  }

  const response = await Promise.race([
    chatModel.invoke([
      { role: "system", content: finalPrompt },
      { role: "user", content: query },
    ]),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000))
  ]) as any;

  const rawResponse = typeof response.content === "string"
    ? response.content
    : response.content?.map((c: any) => c.text || "").join("");

  return cleanThinkingOutput(rawResponse);
}

/**
 * Streaming Response Generation
 */
export async function* generateResponseStream(
   query: string,
   context: string,
   hasContext: boolean,
   provider: "ollama" | "groq" = "ollama",
   systemPromptOverride?: string
) {
   const currentDate = format(new Date(), "MMMM d, yyyy");
   const systemPrompt = getSystemPrompt(hasContext, currentDate);
   const finalPrompt = systemPromptOverride || (hasContext ? systemPrompt.replace("{INJECTED_CONTEXT}", context) : systemPrompt);

   const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
   const effectiveProvider = (GROQ_API_KEY) ? "groq" : provider;
   let chatModel;

   if (effectiveProvider === "groq" && GROQ_API_KEY) {
     chatModel = new ChatGroq({
       apiKey: GROQ_API_KEY,
       model: GROQ_MODEL,
       temperature: 0,  // Zero temperature for maximum accuracy
       maxTokens: 3000,
       streaming: true,
     });
   } else {
     chatModel = new ChatOllama({
       baseUrl: OLLAMA_BASE_URL,
       model: CHAT_MODEL,
       temperature: 0.05,
       numCtx: 6144,
       numPredict: 3000,
     });
   }

   let stream;
   let chunkCount = 0;
   let totalTextLength = 0;

   try {
     console.log(`🔤 [generateResponseStream] Starting with provider: ${effectiveProvider}`);
     stream = await chatModel.stream([
       { role: "system", content: finalPrompt },
       { role: "user", content: query },
     ]);
   } catch (error: any) {
     console.error('[RAG] Stream initialization error:', error.message);
     throw error;
   }

   try {
     for await (const chunk of stream) {
       const text = typeof chunk.content === "string" 
         ? chunk.content 
         : chunk.content?.map((c: any) => c.text || "").join("") || "";
       
       if (text && text.length > 0) {
         chunkCount++;
         totalTextLength += text.length;
         console.log(`📊 [Stream Chunk ${chunkCount}] Length: ${text.length}, Total: ${totalTextLength}`);
         yield text;
       } else {
         console.warn(`⚠️ [Stream Chunk ${chunkCount + 1}] Empty chunk received`);
       }
     }
     console.log(`✅ [Stream Complete] Total chunks: ${chunkCount}, Total text: ${totalTextLength}c`);
   } catch (error: any) {
     console.error('[RAG] Stream reading error:', error.message);
     throw error;
   }
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
