import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import { withErrorHandling } from "../utils/route-handler";

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").trim();
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const GROQ_MODEL = IS_PRODUCTION ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

// Cache the chat model instance for reuse
let cachedChatModel: any = null;

function getChatModel() {
  if (cachedChatModel) return cachedChatModel;
  
  if (GROQ_API_KEY) {
    cachedChatModel = new ChatGroq({
      apiKey: GROQ_API_KEY,
      model: GROQ_MODEL,
      temperature: 0.3,
      maxTokens: 1500,
    });
  } else {
    cachedChatModel = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: process.env.CHAT_MODEL || "qwen-ultra-fast:latest",
      temperature: 0.3,
      numCtx: 8192,
      numPredict: 1500,
    });
  }
  return cachedChatModel;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const documentChatPostHandler = async (request: Request) => {
  const body = await request.json();
  const { question, documentContent, conversationHistory = [] } = body;

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    );
  }

  if (!documentContent || typeof documentContent !== "string") {
    return NextResponse.json(
      { error: "Document content is required" },
      { status: 400 }
    );
  }

  // Truncate document if too long (keep first ~15000 chars for context)
  const maxDocLength = 15000;
  const truncatedDoc = documentContent.length > maxDocLength
    ? documentContent.substring(0, maxDocLength) + "\n\n[Document truncated for processing...]"
    : documentContent;

  // Build conversation context from last 6 messages
  const recentHistory = conversationHistory.slice(-6);
  const conversationContext = recentHistory
    .map((msg: ConversationMessage) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  const systemPrompt = `You are a helpful legal document assistant. Your role is to help users understand and analyze legal documents they've uploaded.

IMPORTANT GUIDELINES:
1. Base your answers ONLY on the document content provided
2. If information isn't in the document, say so clearly
3. Use plain, accessible language - avoid unnecessary jargon
4. Be concise but thorough
5. Highlight important points, risks, or obligations when relevant
6. If asked about legal advice, remind users to consult a qualified attorney
7. Format responses clearly with bullet points or numbered lists when appropriate

DOCUMENT CONTENT:
---
${truncatedDoc}
---`;

  const userPrompt = conversationContext 
    ? `Previous conversation:\n${conversationContext}\n\nNew question: ${question}`
    : question;

  const chatModel = getChatModel();

  const response = await Promise.race([
    chatModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 45000))
  ]) as any;

  const answer = typeof response.content === "string"
    ? response.content
    : response.content?.map((c: any) => c.text || "").join("");

  return NextResponse.json({
    answer,
    success: true,
  });
};

export const POST = withErrorHandling(documentChatPostHandler);

export async function GET() {
  return NextResponse.json({
    service: "Document Chat API",
    description: "Private document Q&A - conversations are not stored",
    usage: {
      method: "POST",
      body: {
        question: "string (required) - The question to ask about the document",
        documentContent: "string (required) - The document text to analyze",
        conversationHistory: "array (optional) - Previous messages for context"
      }
    }
  });
}
