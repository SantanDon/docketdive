import { DataAPIClient } from "@datastax/astra-db-ts";
import type { Message, ConversationMemory, MemoryContext } from "../../types";
import Groq from "groq-sdk";
import { getEmbedding } from "./rag";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Astra DB client for conversation memory
const MEMORY_COLLECTION = "conversation_memory";
const MAX_RECENT_MESSAGES = 15; // Balanced for speed vs context (reduced from 20)
const MAX_RELEVANT_HISTORY = 5; // Reduced from 8 for faster retrieval
const SUMMARIZATION_THRESHOLD = 20; // Increased to avoid slow summarization

let db: any = null;

try {
  if (process.env.ASTRA_DB_APPLICATION_TOKEN && process.env.ASTRA_DB_API_ENDPOINT) {
    const astraClient = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    db = astraClient.db(process.env.ASTRA_DB_API_ENDPOINT);
  } else {
    console.warn("Astra DB credentials missing. Conversation memory will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize Astra DB client:", error);
}

export function formatConversationHistory(messages: Message[]): string {
  if (messages.length === 0) return "";

  const formatted = messages
    .slice(-MAX_RECENT_MESSAGES)
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      const sources = msg.sources && msg.sources.length > 0 
        ? `\n[Sources: ${msg.sources.map(s => s.title).join(", ")}]` 
        : "";
      return `${role}: ${msg.content}${sources}`;
    })
    .join("\n\n");

  return formatted;
}

export async function summarizeConversation(messages: Message[]): Promise<string> {
  try {
    // Limit history to last 10 messages for faster summarization
    const recentMessages = messages.slice(-10);
    const history = formatConversationHistory(recentMessages);
    
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Summarize key legal topics in 2-3 sentences. Be concise.`
        },
        {
          role: "user",
          content: `Summarize:\n\n${history}`
        }
      ],
      temperature: 0.2, // Reduced for faster generation
      max_tokens: 200, // Reduced from 500 for speed
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Summarization error:", error);
    return "";
  }
}

export async function generateMessageEmbedding(content: string): Promise<number[]> {
  try {
    return await getEmbedding(content);
  } catch (error) {
    console.error("Embedding generation error:", error);
    return [];
  }
}

export async function storeConversationMemory(
  conversationId: string,
  userId: string,
  message: Message,
  embedding: number[]
): Promise<void> {
  if (!db) return;
  
  try {
    const collection = await db.collection(MEMORY_COLLECTION);
    
    const memory: ConversationMemory = {
      id: message.id,
      conversationId,
      userId,
      messageId: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.timestamp,
      $vector: embedding,
    };

    await collection.insertOne(memory);
  } catch (error) {
    console.error("Failed to store conversation memory:", error);
  }
}

export async function retrieveRelevantMemory(
  query: string,
  userId: string,
  currentConversationId: string,
  embedding: number[]
): Promise<ConversationMemory[]> {
  if (!db) return [];

  try {
    const collection = await db.collection(MEMORY_COLLECTION);
    
    const results = await collection
      .find(
        {
          userId,
          conversationId: { $ne: currentConversationId }
        },
        {
          sort: { $vector: embedding },
          limit: MAX_RELEVANT_HISTORY,
          includeSimilarity: true,
        }
      )
      .toArray();

    return results.filter((r: any) => r.$similarity > 0.75).map((r: any) => r as unknown as ConversationMemory);
  } catch (error) {
    console.error("Failed to retrieve relevant memory:", error);
    return [];
  }
}

export async function buildMemoryContext(
  messages: Message[],
  currentQuery: string,
  userId: string,
  conversationId: string
): Promise<MemoryContext> {
  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);
  
  // FIXED: Always include recent messages for context continuity
  // Only skip expensive vector memory retrieval for simple queries
  const shouldRetrieveVectorMemory = currentQuery.length > 50 && messages.length > 5;
  
  let relevantHistory: ConversationMemory[] = [];
  
  // Only do expensive vector memory retrieval for complex queries
  if (shouldRetrieveVectorMemory && db) {
    try {
      const queryEmbedding = await generateMessageEmbedding(currentQuery);
      relevantHistory = await retrieveRelevantMemory(
        currentQuery,
        userId,
        conversationId,
        queryEmbedding
      );
    } catch (error) {
      console.error("Memory retrieval error:", error);
      relevantHistory = [];
    }
  }

  // Generate summary for very long conversations
  let conversationSummary: string | undefined = undefined;
  if (messages.length > SUMMARIZATION_THRESHOLD) {
    try {
      const summary = await summarizeConversation(messages);
      if (summary) {
        conversationSummary = summary;
      }
    } catch (error) {
      console.error("Summarization error:", error);
    }
  }

  const result: MemoryContext = {
    recentMessages,
    relevantHistory,
  };
  
  if (conversationSummary) {
    result.conversationSummary = conversationSummary;
  }

  return result;
}

export function formatMemoryContextForPrompt(memoryContext: MemoryContext): string {
  let contextStr = "";

  if (memoryContext.conversationSummary) {
    contextStr += `## Conversation Summary:\n${memoryContext.conversationSummary}\n\n`;
  }

  if (memoryContext.recentMessages.length > 0) {
    contextStr += `## Recent Conversation:\n${formatConversationHistory(memoryContext.recentMessages)}\n\n`;
  }

  if (memoryContext.relevantHistory.length > 0) {
    contextStr += `## Relevant Past Discussions:\n`;
    memoryContext.relevantHistory.forEach((mem, idx) => {
      contextStr += `${idx + 1}. ${mem.role === "user" ? "User asked" : "You answered"}: ${mem.content.substring(0, 200)}...\n`;
    });
    contextStr += "\n";
  }

  return contextStr;
}

export async function initializeMemoryCollection(): Promise<void> {
  if (!db) {
    console.warn("⚠️ Database not initialized - memory features disabled");
    return;
  }

  try {
    const collections = await db.listCollections();
    const exists = collections.some((c: any) => c.name === MEMORY_COLLECTION);

    if (!exists) {
      await db.createCollection(MEMORY_COLLECTION, {
        vector: {
          dimension: 1024,  // Match EXPECTED_DIMENSIONS from rag.ts
          metric: "cosine",
        },
      });
      console.log(`✅ Created ${MEMORY_COLLECTION} collection with 1024 dimensions`);
    } else {
      // Check if existing collection has correct dimensions
      console.log(`✅ Memory collection exists - verifying dimensions...`);
      
      // If collection exists with wrong dimensions, we need to recreate it
      // This is a one-time migration fix
      try {
        // Test insert to check dimensions - use upsert pattern to avoid duplicate errors
        const testId = 'dimension-test-' + Date.now();
        const testEmbedding = new Array(1024).fill(0);
        await db.collection(MEMORY_COLLECTION).insertOne({
          _id: testId,
          $vector: testEmbedding,
          _test: true
        });
        // Clean up test document
        await db.collection(MEMORY_COLLECTION).deleteOne({ _id: testId });
        console.log(`✅ Memory collection dimensions verified (1024)`);
      } catch (dimError: any) {
        if (dimError.message?.includes('dimension') || dimError.message?.includes('vector')) {
          console.warn(`⚠️ Memory collection has wrong dimensions - recreating...`);
          await db.dropCollection(MEMORY_COLLECTION);
          await db.createCollection(MEMORY_COLLECTION, {
            vector: {
              dimension: 1024,
              metric: "cosine",
            },
          });
          console.log(`✅ Recreated ${MEMORY_COLLECTION} collection with correct 1024 dimensions`);
        } else {
          throw dimError;
        }
      }
    }
  } catch (error) {
    console.error("❌ CRITICAL: Failed to initialize memory collection:", error);
    throw new Error(`Memory initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

