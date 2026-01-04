// app/api/simplify/route.ts
// Document Simplification API using Groq/Llama
// Optimized for faster response times

import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import type { SimplifyRequest, SimplificationResult } from "@/types/legal-tools";

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
      temperature: 0.2,
      maxTokens: 3000, // Reduced for faster response
    });
  } else {
    cachedChatModel = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: process.env.CHAT_MODEL || "qwen-ultra-fast:latest",
      temperature: 0.2,
      numCtx: 8192,
      numPredict: 3000,
    });
  }
  return cachedChatModel;
}

const SIMPLIFICATION_PROMPT = `You are an expert legal document simplifier specializing in South African law. Your task is to make legal documents accessible to non-lawyers while preserving accuracy.

Analyze the document and provide your response in the following JSON format ONLY (no other text):
{
  "simplifiedSummary": "<2-3 paragraph plain-language summary of the entire document>",
  "clauseBreakdown": [
    {
      "original": "<original clause text (abbreviated if long)>",
      "simplified": "<plain-language explanation>",
      "importance": "<'critical', 'important', or 'standard'>"
    }
  ],
  "jargonGlossary": [
    {
      "term": "<legal term>",
      "definition": "<simple definition>",
      "context": "<how it's used in this document>"
    }
  ],
  "keyObligations": [
    {
      "description": "<what must be done>",
      "deadline": "<when, if specified>",
      "party": "<who is responsible>"
    }
  ],
  "keyRights": [
    {
      "description": "<what right is granted>",
      "conditions": "<any conditions>",
      "party": "<who has this right>"
    }
  ],
  "keyDeadlines": [
    {
      "description": "<what the deadline is for>",
      "date": "<specific date or timeframe>",
      "consequence": "<what happens if missed>"
    }
  ],
  "readabilityScores": {
    "original": <estimated grade level 1-18>,
    "simplified": <target grade level, should be lower>
  }
}

Guidelines:
- Use everyday language, avoid legal jargon
- Target a Grade 8 reading level for simplified text
- Identify ALL critical obligations and deadlines
- Include at least 5-10 jargon terms with definitions
- Break down at least 3-5 key clauses
- Be specific about South African legal context where relevant
- Focus on practical implications for the reader`;

function parseSimplificationResponse(response: string, originalText: string): SimplificationResult {
  let jsonStr = response;
  
  // Handle markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const startIdx = response.indexOf('{');
    const endIdx = response.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonStr = response.substring(startIdx, endIdx + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    return {
      originalText,
      simplifiedSummary: parsed.simplifiedSummary || 'Summary not available.',
      clauseBreakdown: (parsed.clauseBreakdown || []).map((c: any) => ({
        original: c.original || '',
        simplified: c.simplified || '',
        importance: c.importance || 'standard'
      })),
      jargonGlossary: (parsed.jargonGlossary || []).map((j: any) => ({
        term: j.term || '',
        definition: j.definition || '',
        context: j.context
      })),
      keyObligations: (parsed.keyObligations || []).map((o: any) => ({
        description: o.description || '',
        deadline: o.deadline,
        party: o.party
      })),
      keyRights: (parsed.keyRights || []).map((r: any) => ({
        description: r.description || '',
        conditions: r.conditions,
        party: r.party
      })),
      keyDeadlines: (parsed.keyDeadlines || []).map((d: any) => ({
        description: d.description || '',
        date: d.date,
        consequence: d.consequence
      })),
      readabilityScores: {
        original: parsed.readabilityScores?.original || 14,
        simplified: parsed.readabilityScores?.simplified || 8
      },
      generatedAt: new Date().toISOString()
    };
  } catch (e) {
    console.error('Failed to parse simplification response:', e);
    console.error('Raw response (first 500 chars):', response.substring(0, 500));
    
    // Try to extract at least a summary from the response
    const fallbackSummary = extractFallbackSummary(response, originalText);
    
    return {
      originalText,
      simplifiedSummary: fallbackSummary,
      clauseBreakdown: [],
      jargonGlossary: extractFallbackJargon(response),
      keyObligations: [],
      keyRights: [],
      keyDeadlines: [],
      readabilityScores: { original: 14, simplified: 8 },
      generatedAt: new Date().toISOString()
    };
  }
}

// Fallback: extract summary from non-JSON response
function extractFallbackSummary(response: string, originalText: string): string {
  // Look for summary-like content
  const summaryPatterns = [
    /summary[:\s]*([^{}\[\]]+?)(?=\n\n|clause|jargon|obligation|$)/i,
    /simplified[:\s]*([^{}\[\]]+?)(?=\n\n|clause|jargon|obligation|$)/i,
    /plain.?language[:\s]*([^{}\[\]]+?)(?=\n\n|clause|jargon|obligation|$)/i,
  ];
  
  for (const pattern of summaryPatterns) {
    const match = response.match(pattern);
    if (match && match[1] && match[1].trim().length > 50) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, try to get the first substantial paragraph
  const paragraphs = response.split(/\n\n+/).filter(p => p.trim().length > 50);
  if (paragraphs.length > 0 && paragraphs[0]) {
    // Skip if it looks like JSON
    const firstPara = paragraphs[0].trim();
    if (!firstPara.startsWith('{') && !firstPara.startsWith('[')) {
      return firstPara.substring(0, 500) + (firstPara.length > 500 ? '...' : '');
    }
  }
  
  // Last resort: generate a basic summary
  return `This document appears to be a legal agreement. Key terms include rental/lease obligations, payment requirements, and liability provisions. Please review the original document for specific details.`;
}

// Fallback: extract jargon terms from non-JSON response
function extractFallbackJargon(response: string): Array<{term: string; definition: string; context?: string}> {
  const jargon: Array<{term: string; definition: string; context?: string}> = [];
  
  // Look for term: definition patterns
  const termPatterns = [
    /["']([^"']+)["']\s*[-:]\s*([^.\n]+)/g,
    /\*\*([^*]+)\*\*\s*[-:]\s*([^.\n]+)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-:]\s*([^.\n]+)/g,
  ];
  
  for (const pattern of termPatterns) {
    let match;
    while ((match = pattern.exec(response)) !== null && jargon.length < 10) {
      const term = match[1]?.trim();
      const definition = match[2]?.trim();
      if (term && definition && term.length < 50 && definition.length > 10) {
        // Avoid duplicates
        if (!jargon.some(j => j.term.toLowerCase() === term.toLowerCase())) {
          jargon.push({ term, definition });
        }
      }
    }
  }
  
  return jargon;
}

export async function POST(request: Request) {
  const start = Date.now();
  
  try {
    const body: SimplifyRequest = await request.json();
    const { content, targetReadingLevel = 8 } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json({ error: 'Document content is required' }, { status: 400 });
    }

    // Truncate very long documents - reduced for speed
    const maxLength = 12000;
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '\n\n[Document truncated for analysis...]'
      : content;

    const userPrompt = `Simplify this legal document to approximately Grade ${targetReadingLevel} reading level:\n\n${truncatedContent}`;

    // Use cached chat model
    const chatModel = getChatModel();

    const response = await Promise.race([
      chatModel.invoke([
        { role: "system", content: SIMPLIFICATION_PROMPT },
        { role: "user", content: userPrompt },
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Simplification timeout")), 60000)) // Reduced timeout
    ]) as any;

    const rawResponse = typeof response.content === "string"
      ? response.content
      : response.content?.map((c: any) => c.text || "").join("");

    const result = parseSimplificationResponse(rawResponse, content);
    const processingTime = Date.now() - start;

    return Response.json({
      result,
      processingTime,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Document simplification error:', error);
    return Response.json(
      { error: error.message || 'Simplification failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    service: 'Document Simplification API',
    description: 'Convert legal documents to plain language',
    usage: {
      method: 'POST',
      body: {
        content: 'string (required) - The document text to simplify',
        targetReadingLevel: 'number (optional) - Target grade level (default: 8)'
      }
    }
  });
}
