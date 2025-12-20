import { DataAPIClient } from "@datastax/astra-db-ts";
import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";
import { format } from "date-fns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { expandQuery, identifyLegalEntities, rankRelevance, hasKeywordMatches, extractSpecializedTerms } from "./semantic-search";
import { buildContext as buildContextUtil } from "../../utils/responseProcessor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

// ========================= CONFIG =========================
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
export const EMBED_MODEL = process.env.EMBED_MODEL || "dengcao/Qwen3-Embedding-0.6B:Q8_0";
export const CHAT_MODEL = process.env.CHAT_MODEL || "qwen-ultra-fast:latest";
export const COLLECTION_NAME = process.env.COLLECTION_NAME || "docketdive";
export const EXPECTED_DIMENSIONS = 1024;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const GROQ_MODEL = "llama-3.3-70b-versatile";

// Cloud Embedding Configuration
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
export const HF_EMBED_MODEL = "intfloat/multilingual-e5-large"; // Good replacement for Qwen-Embedding

// BALANCED: Speed + Accuracy optimized thresholds
export const TOP_K = 12;  // Balanced retrieval (was 15, tried 10, now 12)
export const MIN_SIMILARITY_THRESHOLD = 0.18;  // Lowered for better recall (was 0.22)
export const MAX_SOURCES_IN_CONTEXT = 6;  // Restored for better context
export const KEYWORD_GATE_ENABLED = false;  // Disabled - was too restrictive

// ========================= CLIENTS =========================
let db: any = null;
let collection: any = null;

if (process.env.ASTRA_DB_APPLICATION_TOKEN) {
  try {
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    const dbEndpoint = process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT;
    
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

// Cloud embedding via Hugging Face
async function getCloudEmbedding(text: string): Promise<number[]> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set for cloud embeddings");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout for cloud

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_EMBED_MODEL}`,
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
        method: "POST",
        body: JSON.stringify({ inputs: [text], options: { wait_for_model: true } }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HF API Error (${response.status}):`, errorText);
      throw new Error(`HF error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Invalid response format from Hugging Face");
    }
    return result[0];
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Hugging Face API timed out after 15s");
    }
    throw err;
  }
}

export async function getEmbedding(text: string, retries = 2): Promise<number[]> {
  const textToEmbed = text.trim();
  
  // Check cache first
  const cacheKey = textToEmbed.toLowerCase();
  const cached = embeddingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Cache hit for embedding`);
    return cached.embedding;
  }
  
  // Try cloud embedding first if in production/no local Ollama
  // IMPROVEMENT: More robust check for "non-local" environment
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const useCloud = isProduction || !OLLAMA_BASE_URL.includes("localhost");

  for (let i = 0; i < retries; i++) {
    try {
      let embedding: number[];

      if (useCloud) {
        if (HUGGINGFACE_API_KEY) {
          console.log(`☁️ Using Cloud Embedding (HF)`);
          embedding = await getCloudEmbedding(textToEmbed);
        } else if (isProduction) {
          console.warn("⚠️ HUGGINGFACE_API_KEY missing in production. Retrieval will be empty.");
          return []; // Fail gracefully in production rather than trying localhost
        } else {
          // Fallback to local if possible, but we already established useCloud
          throw new Error("Cloud embedding requested but HUGGINGFACE_API_KEY is missing");
        }
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: EMBED_MODEL, prompt: textToEmbed }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);

        const data = await res.json();
        embedding = data.embedding;
      }

      if (!embedding || (embedding.length !== EXPECTED_DIMENSIONS && !useCloud))
        throw new Error("Invalid embedding dimensions");

      // Cache the result
      embeddingCache.set(cacheKey, { embedding, timestamp: Date.now() });
      
      return embedding;
    } catch (err) {
      console.error(`Embedding attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        if (isProduction) {
          console.error("❌ Critical: Embedding failed in production.", err);
          return []; // Graceful failure for production
        }
        throw err;
      }
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  return []; // Fallback
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
    
    const [expandedQueries, entities] = await Promise.all([
      shouldExpand ? expandQuery(enrichedQuery) : Promise.resolve([enrichedQuery]),
      Promise.resolve(identifyLegalEntities(enrichedQuery))
    ]);
    
    console.log(`📝 Query expansion: ${shouldExpand ? 'enabled' : 'skipped'} (${expandedQueries.length} queries)`);
    console.log(`🏷️ Identified entities:`, entities);
    
    const allResults: any[] = [];
    
    if (!collection) {
      console.warn("⚠️ Retrieval skipped: Astra DB collection not initialized.");
      return [];
    }

    // Use up to 3 queries for better coverage (original + 2 expansions)
    const limitedQueries = expandedQueries.slice(0, 3);

    // Parallel embedding generation and retrieval
    const queryPromises = limitedQueries.map(async (q, idx) => {
      try {
        const vector = await getEmbedding(q);
        
        // Original query gets full TOP_K, expansions get slightly less
        const limit = idx === 0 ? TOP_K : Math.ceil(TOP_K * 0.75);

        const results = await collection
          .find({}, {
            sort: { $vector: vector },
            limit: limit,
            includeSimilarity: true,
            projection: { content: 1, metadata: 1 }, // Only fetch needed fields
          })
          .toArray();

        console.log(`  Query ${idx + 1} retrieved ${results.length} docs`);
        return results;
      } catch (err) {
        console.error(`Error processing query ${idx + 1}:`, err);
        return [];
      }
    });

    const queryResults = await Promise.all(queryPromises);
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

You are about to receive LEGAL SOURCES that have been retrieved specifically for this query.
Your job is to EXTRACT and PRESENT information FROM THESE SOURCES ONLY.

ABSOLUTE RULES:
1. Answer ONLY using information EXPLICITLY written in the sources below
2. If a Latin legal term is in the query (e.g., "actio de pauperie"), find and quote EXACTLY what the sources say about it
3. NEVER invent, assume, or add information not in the sources
4. NEVER confuse one legal concept with another
5. Every legal claim MUST have a citation: 「quote」 [Source Name]

PROHIBITED BEHAVIORS:
- Adding information about topics NOT in the sources (e.g., don't mention "children" if sources are about "animals")
- Guessing definitions of Latin terms instead of quoting the source
- Mixing concepts from different areas of law
- Providing general knowledge instead of source-specific content

CORRECT APPROACH:
- Read each source carefully
- Identify passages directly relevant to the query terms
- Quote relevant passages with citations
- If the query asks about "actio de pauperie", find and quote text containing those exact words
- If sources don't have the specific information, say "The sources don't contain specific information about [topic]"

QUALITY CHECK BEFORE RESPONDING:
- Does my answer quote directly from the sources?
- Am I answering the SPECIFIC question asked?
- Have I avoided adding information not in the sources?

Sources provided:

{INJECTED_CONTEXT}

Remember: Accuracy over completeness. If sources are limited, acknowledge it. This is information, not legal advice.`;
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
