import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  retrieveRelevantDocuments,
  buildContext,
  generateResponse,
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

  try {
    const body = await request.json();
    const { 
      message, 
      provider,
      conversationHistory = [],
      conversationId = `conv_${Date.now()}`,
      userId = "default_user"
    } = body;

    // Diagnostic logging for Production debugging (safe snippets)
    console.log("🛠️ Environment Check:", {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      HAS_GROQ: !!process.env.GROQ_API_KEY,
      HAS_HF: !!process.env.HUGGINGFACE_API_KEY,
      HF_KEY_START: process.env.HUGGINGFACE_API_KEY?.substring(0, 5),
      HAS_ASTRA: !!process.env.ASTRA_DB_APPLICATION_TOKEN,
      ENDPOINT_PRESENT: !!(process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT)
    });

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const query = message.trim();
    if (query.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long (max 2000 chars)" }), { status: 400 });
    }

    // Skip model verification for speed - assume it's running
    // if (provider !== "groq") {
    //   const modelOk = await verifyOllamaModel();
    //   if (!modelOk) {
    //     return new Response(JSON.stringify({
    //       error: "Chat model not available",
    //       fix: `Run: ollama pull granite3.3:2b`
    //     }), { status: 503 });
    //   }
    // }

    // CONTEXT-AWARE RETRIEVAL: Always use recent conversation context
    // Build conversation context string for query enrichment
    const recentMessages = conversationHistory.slice(-5); // Last 5 messages for context
    const conversationContextStr = recentMessages
      .map((m: Message) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
    
    // Extract the LAST assistant message for explicit context
    const lastAssistantMessage = conversationHistory
      .slice()
      .reverse()
      .find((m: Message) => m.role === "assistant");
    const lastAssistantTopic = lastAssistantMessage?.content.substring(0, 500) || "";
    
    // SPEED OPTIMIZATION: Skip memory for most queries, only retrieve documents
    const isComplexConversation = conversationHistory.length > 10 && query.length > 100;
    
    const [memoryContext, docs] = await Promise.all([
      isComplexConversation 
        ? buildMemoryContext(conversationHistory, query, userId, conversationId)
        : Promise.resolve({ recentMessages: conversationHistory.slice(-MAX_RECENT_MESSAGES), relevantHistory: [] }),
      retrieveRelevantDocuments(query, conversationContextStr)
    ]);

    const memoryContextStr = formatMemoryContextForPrompt(memoryContext);
    const ragContext = buildContext(docs);
    const hasContext = ragContext.length > 0;

    const conversationHistoryStr = memoryContext.recentMessages
      .map((m: Message) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const contextWindow = manageContextWindow(
      conversationHistoryStr,
      ragContext,
      memoryContextStr
    );

    const currentDate = format(new Date(), "MMMM d, yyyy");
    
    // SPEED OPTIMIZATION: Skip entity tracking for most queries (adds 100-200ms)
    // Only track for long conversations
    let keyEntities: string[] = [];
    let entityContext = "";
    
    if (conversationHistory.length > 8) {
      keyEntities = extractKeyEntities(conversationHistory);
      const entityTracker = trackConversationEntities(conversationHistory);
      
      // Build entity context for better reference handling
      if (entityTracker.size > 0) {
        const recentEntities = Array.from(entityTracker.entries())
          .filter(([_, ref]) => ref.mentions.length > 0)
          .slice(0, 3); // Reduced from 5 to 3
        
        if (recentEntities.length > 0) {
          entityContext = "\n### Referenced: ";
          entityContext += recentEntities.map(([key]) => key).join(", ");
          entityContext += "\n";
        }
      }
    }
    
    const enhancedSystemPrompt = `${getSystemPrompt(hasContext, currentDate)}

${lastAssistantTopic ? `### IMMEDIATE CONTEXT - Last Response Was About:\n${lastAssistantTopic}\n\n` : ''}

${contextWindow.memoryContext ? `### Previous Discussions Context:\n${contextWindow.memoryContext}\n` : '\'\''}

${contextWindow.conversationHistory ? `### Current Conversation:\n${contextWindow.conversationHistory}\n` : '\'\''}

${keyEntities.length > 0 ? `### Key Legal Concepts Discussed: ${keyEntities.join(", ")}\n` : '\'\''}
${entityContext}

You have full access to the conversation history above. You MUST:
- **CRITICAL CONTEXT RULE**: When user asks a follow-up question WITHOUT repeating the full context:
  * Example 1: After discussing "wills", if user asks "what age must a witness be" → Answer about witness age FOR WILLS (14 years), NOT general witness age
  * Example 2: After discussing "Rental Housing Act", if user asks "please expand on this" → Expand on the Rental Housing Act, NOT something else
  * Example 3: After discussing "contracts", if user asks "what are the remedies" → Answer about contract remedies specifically
- **ALWAYS look at the last 2-3 messages** to understand what topic is being discussed
- **NEVER answer in isolation** - every response must consider the ongoing conversation
- Reference previous questions and answers when relevant
- Build upon earlier explanations without repeating everything
- When asked "summarize", "what did we discuss", "expand on this", "tell me more" - refer to the IMMEDIATE previous topic
- Maintain context across the entire conversation
- Recall specific details from previous messages
- When user says "the first one", "your previous example", "that case", "this", "it", "them" - identify what they're referring to from conversation history
- Use explicit turn markers to understand conversation flow
- **If unsure what user is referring to**, look at the LAST assistant message and continue from there

${hasContext ? `### Relevant Legal Documents:\n{INJECTED_CONTEXT}` : '\'\''}
`;

    const finalPrompt = hasContext 
      ? enhancedSystemPrompt.replace("{INJECTED_CONTEXT}", contextWindow.ragContext) 
      : enhancedSystemPrompt;

    const answer = await generateResponse(query, contextWindow.ragContext, hasContext, provider, finalPrompt);

    // ACCURACY CHECK: If no sources at all, ensure the response acknowledges this
    if (!hasContext || docs.length === 0) {
      const noSourcesResponse = `I apologize, but I don't have specific information about "${query}" in my legal database.

To ensure you receive accurate information:

1. **Rephrase your question** - Try using different legal terms
2. **Consult SAFLII** - Visit www.saflii.org for comprehensive South African case law
3. **Speak with an attorney** - For authoritative legal guidance

I prioritize accuracy over completeness, so I cannot provide information without verified sources.

**Disclaimer:** This response indicates a gap in available sources. Please consult with a qualified legal professional for advice tailored to your specific situation.`;
      
      return new Response(JSON.stringify({
        response: noSourcesResponse,
        sources: [],
        metadata: {
          mode: "No Sources Found",
          sourcesUsed: 0,
          responseTime: ((Date.now() - start) / 1000).toFixed(2) + "s",
          memoryUsed: {
            recentMessages: memoryContext.recentMessages.length,
            relevantHistory: memoryContext.relevantHistory.length,
            hasSummary: "conversationSummary" in memoryContext ? !!memoryContext.conversationSummary : false,
            contextTruncated: contextWindow.truncated
          }
        },
      }), { status: 200 });
    }

    const { processedAnswer, sources } = processAnswer(answer, docs, MIN_SIMILARITY_THRESHOLD, MAX_SOURCES_IN_CONTEXT);

    let finalAnswer = processedAnswer;

    // CONTEXT LIMIT WARNING: If context was truncated, warn the user
    if (contextWindow.truncated) {
      finalAnswer += "\n\n> ⚠️ **Note:** This conversation is getting long, and some earlier context has been summarized or removed to stay within limits. For best results with a new topic, please **start a new chat**.";
    }

    // Parallel embedding generation for speed
    const [userMessageEmbedding, assistantMessageEmbedding] = await Promise.all([
      generateMessageEmbedding(query),
      generateMessageEmbedding(finalAnswer)
    ]);

    // Store both messages in parallel (ONLY if embeddings are valid to avoid DB dimension errors)
    if (userMessageEmbedding.length > 0 && assistantMessageEmbedding.length > 0) {
      Promise.all([
        storeConversationMemory(
          conversationId,
          userId,
          {
            id: `msg_${Date.now()}_user`,
            content: query,
            role: "user",
            timestamp: new Date().toISOString(),
            status: "sent"
          },
          userMessageEmbedding
        ),
        storeConversationMemory(
          conversationId,
          userId,
          {
            id: `msg_${Date.now() + 1}_assistant`,
            content: finalAnswer,
            role: "assistant",
            timestamp: new Date().toISOString(),
            status: "sent",
            sources
          },
          assistantMessageEmbedding
        )
      ]).catch(err => console.error("Failed to store conversation memory:", err));
    } else {
      console.warn("⚠️ Skipping conversation memory storage due to missing embeddings");
    }

    return new Response(JSON.stringify({
      response: finalAnswer,
      sources: sources,
      metadata: {
        mode: hasContext ? "RAG" : "Conversational",
        sourcesUsed: sources.length,
        localSources: sources.length,
        responseTime: ((Date.now() - start) / 1000).toFixed(2) + "s",
        memoryUsed: {
          recentMessages: memoryContext.recentMessages.length,
          relevantHistory: memoryContext.relevantHistory.length,
          hasSummary: "conversationSummary" in memoryContext ? !!memoryContext.conversationSummary : false,
          contextTruncated: contextWindow.truncated
        }
      },
    }), { status: 200 });

  } catch (error: any) {
    console.error("POST error details:", error);
    console.error("POST error stack:", error.stack);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message || "Unknown error",
      details: error.toString()
    }), { status: 500 });
  }
}

export async function GET(request: Request) {
  return new Response(JSON.stringify({ 
    status: "healthy", 
    diagnostics: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_GROQ: !!process.env.GROQ_API_KEY,
      HAS_HF: !!process.env.HUGGINGFACE_API_KEY,
      HAS_ASTRA: !!process.env.ASTRA_DB_APPLICATION_TOKEN,
      HAS_ENDPOINT: !!(process.env.ASTRA_DB_API_ENDPOINT || process.env.ENDPOINT),
      HF_KEY_PREFIX: process.env.HUGGINGFACE_API_KEY ? process.env.HUGGINGFACE_API_KEY.substring(0, 10) : "none"
    }
  }), { status: 200 });
}


