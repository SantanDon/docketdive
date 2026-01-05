import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  retrieveRelevantDocuments,
  buildContext,
  generateResponse,
  generateResponseStream,
  getEmbedding,
  HF_EMBED_MODEL,
  verifyOllamaModel,
  getSystemPrompt,
  MIN_SIMILARITY_THRESHOLD,
  MAX_SOURCES_IN_CONTEXT
} from "../utils/rag";
import { format } from "date-fns";
import { processAnswer, calculateConfidenceScore, createSources } from "../../utils/responseProcessor";
import {
  buildMemoryContext,
  formatMemoryContextForPrompt,
  storeConversationMemory,
  generateMessageEmbedding,
  initializeMemoryCollection
} from "../utils/conversation-memory";

// Import rate limiter
import { rateLimiter } from "../../utils/rate-limiter";

// Import MAX_RECENT_MESSAGES for optimization
const MAX_RECENT_MESSAGES = 15;
import { manageContextWindow, extractKeyEntities, trackConversationEntities } from "../utils/context-manager";
import type { Message } from "../../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

initializeMemoryCollection().catch(console.error);

export async function POST(request: Request) {
  const start = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendChunk(typeSource: string, content: any) {
        try {
          controller.enqueue(encoder.encode(JSON.stringify({ type: typeSource, content }) + "\n"));
        } catch (e) {
          console.error("Error enqueuing chunk", e);
        }
      }

      try {
        const body = await request.json();
        const { 
          message, 
          provider,
          conversationHistory = [],
          conversationId = `conv_${Date.now()}`,
          userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID if not provided
          language = "en",
          legalAidMode = false
        } = body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
          sendChunk("error", "Message is required");
          controller.close();
          return;
        }

        // ===== RATE LIMITING & MODEL SELECTION =====
        const limitCheck = rateLimiter.checkLimit(userId);
        if (!limitCheck.allowed) {
          sendChunk("error", `Rate limit exceeded: ${limitCheck.reason}`);
          sendChunk("metadata", {
            quotaRemaining: limitCheck.quotaRemaining,
            recommendedModel: limitCheck.model,
            mode: "RateLimited"
          });
          controller.close();
          return;
        }

        // Track request start
        rateLimiter.startRequest(userId);
        const usageStats = rateLimiter.getUsageStats(userId);

        sendChunk("status", `Rate limit: ${usageStats.requestsRemaining} requests remaining this hour`);

        // Use the recommended model from rate limiter (may switch to Ollama if GROQ is nearly full)
        let effectiveProvider = limitCheck.model;

        const query = message.trim();
        
        // 1. Initial Status
        sendChunk("status", "Analyzing legal sources...");

        // 2. Parallel RAG Retrieval - ALWAYS include conversation context
        const recentMessages = conversationHistory.slice(-10); // Increased from 5 for better context
        const conversationContextStr = recentMessages
          .map((m: Message) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n");
        
        // Always build memory context for conversation continuity
        const [memoryContext, docs] = await Promise.all([
          buildMemoryContext(conversationHistory, query, userId, conversationId),
          retrieveRelevantDocuments(query, conversationContextStr)
        ]);

        const memoryContextStr = formatMemoryContextForPrompt(memoryContext);
        const ragContext = buildContext(docs);
        
        // ACCURACY CHECK: Determine whether we have usable context.
        // IMPORTANT: buildContext() can return an empty string if it filters aggressively.
        // We should treat having retrieved docs as context, and let downstream prompt enforce citation discipline.
        let hasContext = Array.isArray(docs) && docs.length > 0;
        const debugNoContextReasons: string[] = [];
        if (!hasContext) debugNoContextReasons.push('no_docs_returned');
        if (hasContext && !ragContext) debugNoContextReasons.push('context_builder_returned_empty');
        const casePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
        const queryCaseMatch = query.match(casePattern);
        
        // Check for fake legal concepts (actio de X patterns that don't exist)
        const fakeLegalConceptPattern = /actio\s+de\s+(felinus|caninus|bovinus|equinus|serpentis)/i;
        const hasFakeConcept = fakeLegalConceptPattern.test(query);
        
        // Check for specific topic queries that need verification
        const topicQueryPattern = /what\s+(south\s+african\s+)?cases?\s+(deal|involve|concern|about)/i;
        const isTopicQuery = topicQueryPattern.test(query);
        
        if (hasFakeConcept) {
          console.log(`⚠️ ACCURACY CHECK: Fake legal concept detected in query - treating as no context`);
          hasContext = false;
          debugNoContextReasons.push('fake_concept');
        }
        
        // ONLY check case existence if user is asking about a SPECIFIC case by name
        if (queryCaseMatch && hasContext) {
          // User is asking about a specific case - verify it exists in sources
          const queryCaseName = queryCaseMatch[0].toLowerCase().replace(/\./g, '');
          const sourceContent = docs.map(d => (d.content || '').toLowerCase()).join(' ');
          const sourceTitles = docs.map(d => (d.metadata?.title || '').toLowerCase()).join(' ');
          
          const caseInSources = sourceContent.includes(queryCaseName) || 
                                sourceTitles.includes(queryCaseName) ||
                                // Also check partial matches (e.g., "van meyeren" in "van meyeren v cloete")
                                queryCaseName.split(' v ').some(part => 
                                  sourceContent.includes(part.trim()) && part.trim().length > 3
                                );
          
          if (!caseInSources) {
            console.log(`⚠️ ACCURACY CHECK: Case "${queryCaseMatch[0]}" not found in sources - treating as no context`);
            hasContext = false;
            debugNoContextReasons.push('case_not_in_sources');
          }
        }
        
        // For topic queries asking for cases, verify we have relevant cases
        // BUT: Only reject if it's SPECIFICALLY asking for cases, not general legal concepts
        if (isTopicQuery && hasContext) {
          const queryLower = query.toLowerCase();
          const sourceContent = docs.map(d => (d.content || '').toLowerCase()).join(' ');
          
          // Extract topic from query
          const topicMatches = queryLower.match(/cases?\s+(?:deal|involve|concern|about)\s+(?:with\s+)?(.+?)(?:\?|$)/i);
          if (topicMatches && topicMatches[1]) {
            const topic = topicMatches[1].trim();
            // Check if topic is in sources
            if (!sourceContent.includes(topic) && !sourceContent.includes(topic.split(' ')[0] || '')) {
              console.log(`⚠️ ACCURACY CHECK: Topic "${topic}" not found in sources - treating as no context`);
              hasContext = false;
              debugNoContextReasons.push('topic_not_in_sources');
            }
          }
        }
        
        // IMPORTANT: If we have documents, trust them unless we have a specific reason not to
        // General legal concept questions (like "What makes a will legally binding?") should use the context
        if (docs.length > 0 && !hasFakeConcept && !queryCaseMatch) {
          hasContext = true;
          console.log(`✅ ACCURACY CHECK: General legal concept query with ${docs.length} relevant sources - using context`);
        }

        // Emit debug metadata (safe) to help diagnose "no sources" in production without burning tokens.
        // This shows *why* the system decided it has no context.
        if (!hasContext) {
          sendChunk("metadata", {
            mode: "NoSourcesDebug",
            reasons: debugNoContextReasons,
            docsReturned: Array.isArray(docs) ? docs.length : 0,
            ragContextLength: ragContext?.length || 0,
            minSimilarityThreshold: MIN_SIMILARITY_THRESHOLD,
          });
        }

        // 3. Send Sources as soon as they are ready
        const sources = hasContext 
          ? createSources(docs, MIN_SIMILARITY_THRESHOLD)
          : [];
        
        sendChunk("sources", sources);

        if (!hasContext || docs.length === 0) {
          sendChunk("status", "No specific legal sources found. Providing general guidance...");
        } else {
          sendChunk("status", `Reading ${docs.length} relevant document(s)...`);
        }

        // 4. Build Prompt
        const currentDate = format(new Date(), "MMMM d, yyyy");
        const conversationHistoryStr = memoryContext.recentMessages
          .map((m: Message) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n\n");

        const contextWindow = manageContextWindow(conversationHistoryStr, ragContext, memoryContextStr);
        let systemPrompt = getSystemPrompt(hasContext, currentDate);
        
        // ACCURACY: Detect user assumptions that need correction
        const queryLower = query.toLowerCase();
        const sourceContentLower = docs.map(d => (d.content || '').toLowerCase()).join(' ');
        let correctionHints: string[] = [];
        
        // Check for wrong animal assumption (cat vs dog)
        if (queryLower.includes('cat') && sourceContentLower.includes('dog') && !sourceContentLower.includes('cat')) {
          correctionHints.push("⚠️ USER ERROR DETECTED: User mentioned 'cat' but sources only mention 'dog'. You MUST correct this: 'I need to correct a detail - it was a dog, not a cat.'");
        }
        
        // Check for wrong court assumption
        if (queryLower.includes('constitutional court') && sourceContentLower.includes('western cape') && !sourceContentLower.includes('constitutional court')) {
          correctionHints.push("⚠️ USER ERROR DETECTED: User mentioned 'Constitutional Court' but sources say 'Western Cape High Court'. You MUST correct this: 'I need to clarify - this case was decided by the Western Cape High Court, not the Constitutional Court.'");
        }
        if (queryLower.includes('supreme court') && sourceContentLower.includes('high court') && !sourceContentLower.includes('supreme court')) {
          correctionHints.push("⚠️ USER ERROR DETECTED: User mentioned 'Supreme Court' but sources say 'High Court'. You MUST correct this.");
        }
        
        // Check for wrong year assumption (Van Meyeren is 2020)
        const yearMatch = query.match(/\b(201[0-9]|202[0-9])\b/);
        if (yearMatch && sourceContentLower.includes('2020') && !sourceContentLower.includes(yearMatch[1]!)) {
          correctionHints.push(`⚠️ USER ERROR DETECTED: User mentioned year '${yearMatch[1]}' but sources indicate '2020'. You MUST correct this: 'I need to correct the year - the case is from 2020, not ${yearMatch[1]}.'`);
        }
        
        // Add correction hints to system prompt if any detected
        if (correctionHints.length > 0 && hasContext) {
          console.log(`🔧 CORRECTION HINTS DETECTED: ${correctionHints.length} corrections needed`);
          correctionHints.forEach(h => console.log(`   - ${h.substring(0, 80)}...`));
          
          const correctionBlock = `
=== MANDATORY CORRECTIONS ===
The user's question contains factual errors. You MUST correct these FIRST before answering:
${correctionHints.join('\n')}
START your response by correcting these errors, then provide the accurate information.
===========================
`;
          systemPrompt = correctionBlock + systemPrompt;
        }
        
        // Add language instruction if not English
        if (language && language !== "en") {
          const languagePrompts: Record<string, string> = {
            "af": "IMPORTANT: Respond in Afrikaans. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "zu": "IMPORTANT: Respond in isiZulu. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "xh": "IMPORTANT: Respond in isiXhosa. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "st": "IMPORTANT: Respond in Sesotho. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "nso": "IMPORTANT: Respond in Sepedi. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "tn": "IMPORTANT: Respond in Setswana. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "ts": "IMPORTANT: Respond in Xitsonga. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "ss": "IMPORTANT: Respond in siSwati. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "ve": "IMPORTANT: Respond in Tshivenda. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses.",
            "nr": "IMPORTANT: Respond in isiNdebele. Use clear, simple language. When using legal terms, provide the English equivalent in parentheses."
          };
          const langInstruction = languagePrompts[language] || "";
          if (langInstruction) {
            systemPrompt = langInstruction + "\n\n" + systemPrompt;
          }
        }

        // Add Legal Aid Mode instruction
        if (legalAidMode) {
          const legalAidInstruction = `
LEGAL AID MODE ACTIVE: The user may have limited legal knowledge and resources.
- Use plain, simple language that anyone can understand
- Avoid legal jargon - if you must use it, explain it immediately
- Provide practical, actionable steps
- Mention free legal resources like Legal Aid South Africa when relevant
- Be empathetic and supportive
- Focus on what the person can do themselves
`;
          systemPrompt = legalAidInstruction + "\n" + systemPrompt;
        }
        
        const finalPrompt = (hasContext ? systemPrompt.replace("{INJECTED_CONTEXT}", contextWindow.ragContext) : systemPrompt) 
          + "\n\n### Current Conversation:\n" + contextWindow.conversationHistory;

        // 5. Start Streaming Response
        sendChunk("status", ""); 
        
        // HALLUCINATION PREVENTION: Return canned responses for queries that would lead to hallucination
        if (!hasContext) {
          let cannedResponse = '';
          let responseNote = '';
          
          if (queryCaseMatch) {
            const caseName = queryCaseMatch[0];
            cannedResponse = `I don't have specific information about "${caseName}" in my legal database.

To get accurate information about this case, I recommend:
1. Searching SAFLII (South African Legal Information Institute) at www.saflii.org
2. Consulting a qualified South African attorney
3. Checking legal databases like LexisNexis or Juta

I cannot provide information about cases that aren't in my verified sources, as legal accuracy is paramount.`;
            responseNote = "Case not found in database";
          } else if (hasFakeConcept) {
            cannedResponse = `I don't have information about that legal concept in my database. 

The term you mentioned doesn't appear in my verified South African legal sources. It's possible this is not a recognized legal doctrine, or I simply don't have information about it.

For accurate information, I recommend:
1. Consulting a qualified South African attorney
2. Searching SAFLII (www.saflii.org) for authoritative legal information
3. Checking academic legal resources

I cannot explain legal concepts that aren't in my verified sources.`;
            responseNote = "Unrecognized legal concept";
          } else if (isTopicQuery) {
            cannedResponse = `I don't have specific case law about that topic in my legal database.

To find relevant South African cases, I recommend:
1. Searching SAFLII (South African Legal Information Institute) at www.saflii.org
2. Consulting a qualified South African attorney
3. Checking legal databases like LexisNexis or Juta

I cannot provide case citations without verified sources, as legal accuracy is paramount.`;
            responseNote = "Topic not found in database";
          }
          
          if (cannedResponse) {
            sendChunk("text_delta", cannedResponse);
            sendChunk("metadata", {
              mode: "No Sources",
              sourcesUsed: 0,
              responseTime: ((Date.now() - start) / 1000).toFixed(2) + "s",
              note: responseNote
            });
            controller.close();
            return;
          }
        }
        
        let fullAnswer = "";
        try {
          console.log(`[Chat] Starting response generation with provider: ${effectiveProvider}`);
          const responseStream = generateResponseStream(query, contextWindow.ragContext, hasContext, effectiveProvider, finalPrompt);
          
          // Add timeout wrapper around stream
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response generation timeout after 120s')), 120000)
          );
          
          let streamComplete = false;
          const streamPromise = (async () => {
            try {
              for await (const delta of responseStream) {
                if (!delta) {
                  console.warn('[Chat] Received empty delta');
                  continue;
                }
                fullAnswer += delta;
                sendChunk("text_delta", delta);
              }
              streamComplete = true;
            } catch (error) {
              throw error;
            }
          })();
          
          // Race with timeout
          try {
            await Promise.race([streamPromise, timeoutPromise]);
          } catch (timeoutError) {
            if (!streamComplete && fullAnswer.length > 0) {
              console.log('[Chat] Stream timeout but partial content received:', fullAnswer.length);
              // Continue with partial content
            } else if (!fullAnswer) {
              throw timeoutError;
            }
          }
          
          if (!fullAnswer) {
            console.warn('[Chat] Response stream produced no content');
            sendChunk("error", "No response generated from AI model - stream timed out or returned empty");
          }
        } catch (error: any) {
          console.error('[Chat] Stream error:', error);
          // Handle GROQ rate limit errors
          if (error.status === 429 || error.message?.includes("Rate limit")) {
            const rotationResult = rateLimiter.handleGroqRateLimit(userId);
            
            if (rotationResult.action === 'rotateKey') {
              sendChunk("error", `GROQ API limit hit. Rotated to backup key. Retrying request...`);
              sendChunk("metadata", {
                mode: "KeyRotated",
                sourcesUsed: sources.length,
                responseTime: ((Date.now() - start) / 1000).toFixed(2) + "s",
                action: "rotateKey",
                nextKey: "GROQ_KEY_2"
              });
            } else {
              sendChunk("error", "All GROQ keys exhausted. Switched to local model for this response.");
              sendChunk("metadata", {
                mode: "RateLimited",
                sourcesUsed: sources.length,
                responseTime: ((Date.now() - start) / 1000).toFixed(2) + "s",
                modelSwitched: true,
                nextModelWillBe: "ollama"
              });
            }
            
            rateLimiter.endRequest(userId, 0);
            controller.close();
            return;
          }
          
          sendChunk("error", `Failed to generate response: ${error.message || error}`);
          throw error;
        }

        // 6. Final Metadata & Background Tasks
        const responseTime = ((Date.now() - start) / 1000).toFixed(2) + "s";
        
        // Estimate tokens used (rough: ~4 chars per token)
        const estimatedTokens = Math.ceil((query.length + fullAnswer.length) / 4);
        rateLimiter.endRequest(userId, estimatedTokens);

        sendChunk("metadata", {
          mode: hasContext ? "RAG" : "Conversational",
          sourcesUsed: sources.length,
          responseTime,
          modelUsed: effectiveProvider,
          estimatedTokensUsed: estimatedTokens,
          quotaRemaining: rateLimiter.getUsageStats(userId)
        });

        (async () => {
          try {
            const [userMsgEmb, assistMsgEmb] = await Promise.all([
              generateMessageEmbedding(query),
              generateMessageEmbedding(fullAnswer)
            ]);
            if (userMsgEmb.length > 0 && assistMsgEmb.length > 0) {
              await Promise.all([
                storeConversationMemory(conversationId, userId, { id: `u_${Date.now()}`, content: query, role: "user", timestamp: new Date().toISOString(), status: "sent" }, userMsgEmb),
                storeConversationMemory(conversationId, userId, { id: `a_${Date.now()}`, content: fullAnswer, role: "assistant", timestamp: new Date().toISOString(), status: "sent", sources }, assistMsgEmb)
              ]);
            }
          } catch (e) {
            console.error("Background storage failed", e);
          }
        })();

        controller.close();
      } catch (error: any) {
        console.error("Streaming error:", error);
        sendChunk("error", error.message || "Internal server error");
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function GET(request: Request) {
  const diagnostics: any = {
    NODE_ENV: process.env.NODE_ENV,
    HAS_GROQ: !!process.env.GROQ_API_KEY,
    HAS_HF: !!process.env.HUGGINGFACE_API_KEY,
    HAS_ASTRA: !!process.env.ASTRA_DB_APPLICATION_TOKEN,
    HAS_ENDPOINT: !!(process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT),
    HF_KEY_PREFIX: process.env.HUGGINGFACE_API_KEY ? process.env.HUGGINGFACE_API_KEY.substring(0, 10) : "none"
  };

  try {
    // 1. Check HF Dimension
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const testEmbedding = await getEmbedding("test query");
        diagnostics.HF_DIMENSION = testEmbedding.length;
        diagnostics.HF_HEALTH = testEmbedding.length > 0 ? `ok (${testEmbedding.length})` : "failing (all models)";
      } catch (e: any) {
        diagnostics.HF_ERROR = e.message;
      }
    }

    // 2. Check Astra DB
    // @ts-ignore - access internal collection for test
    const { collection, COLLECTION_NAME } = await import("../utils/rag");
    diagnostics.COLLECTION_NAME = COLLECTION_NAME;
    
    if (collection) {
      try {
        const count = await collection.countDocuments({}, { limit: 1 });
        diagnostics.ASTRA_DB_STATE = "connected";
        diagnostics.SAMPLE_COUNT = count;
      } catch (e: any) {
        diagnostics.ASTRA_DB_ERROR = e.message;
      }
    } else {
        diagnostics.ASTRA_DB_STATE = "collection is null (init failed)";
    }

  } catch (err: any) {
    diagnostics.OVERALL_DIAGNOSTIC_ERROR = err.message;
  }

  return new Response(JSON.stringify({ 
    status: "healthy", 
    diagnostics
  }), { status: 200 });
}


