// app/api/contract-analysis/route.ts
// Multi-Perspective Contract Analysis API using Groq/Llama
// Optimized for faster response times

import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import type { 
  ContractAnalysisRequest, 
  ContractAnalysis, 
  AnalysisPerspective
} from "@/types/legal-tools";

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").trim();
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
// Use faster model for quicker responses
const GROQ_MODEL = IS_PRODUCTION ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

// Cache the chat model instance for reuse
let cachedChatModel: any = null;

function getChatModel() {
  if (cachedChatModel) return cachedChatModel;
  
  if (GROQ_API_KEY) {
    cachedChatModel = new ChatGroq({
      apiKey: GROQ_API_KEY,
      model: GROQ_MODEL,
      temperature: 0.1,
      maxTokens: 3000, // Reduced for faster response
    });
  } else {
    cachedChatModel = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: process.env.CHAT_MODEL || "qwen-ultra-fast:latest",
      temperature: 0.1,
      numCtx: 8192,
      numPredict: 3000,
    });
  }
  return cachedChatModel;
}

function getAnalysisPrompt(perspective: AnalysisPerspective): string {
  const perspectiveInstructions = {
    party_a: `You are analyzing this contract from PARTY A's perspective (the first party mentioned, typically the service provider, seller, or employer).
Focus on:
- Clauses that protect Party A's interests
- Risks and liabilities Party A is exposed to
- Obligations that may be burdensome for Party A
- Suggest modifications that would better protect Party A`,
    
    party_b: `You are analyzing this contract from PARTY B's perspective (the second party mentioned, typically the client, buyer, or employee).
Focus on:
- Clauses that protect Party B's interests
- Risks and liabilities Party B is exposed to
- Obligations that may be burdensome for Party B
- Suggest modifications that would better protect Party B`,
    
    neutral: `You are providing a NEUTRAL analysis of this contract, examining fairness for both parties.
Focus on:
- Balance of rights and obligations between parties
- Clauses that may be one-sided or unfair
- Industry standard practices vs unusual terms
- Suggest modifications that would make the contract more balanced`
  };

  return `You are an expert South African legal contract analyst. ${perspectiveInstructions[perspective]}

Analyze the contract and provide your response in the following JSON format ONLY (no other text):
{
  "riskScore": <number 0-100, where 0 is very risky and 100 is very safe for the analyzed party>,
  "contractType": "<detected contract type, e.g., 'Employment Agreement', 'Service Agreement', 'Lease Agreement'>",
  "summary": "<2-3 sentence summary of the overall contract position>",
  "favorableClauses": [
    {
      "clauseNumber": "<clause number or section>",
      "clauseText": "<relevant excerpt>",
      "category": "<category like 'termination', 'payment_terms', 'liability', etc>",
      "riskLevel": "low",
      "explanation": "<why this clause is favorable>"
    }
  ],
  "riskyClauses": [
    {
      "clauseNumber": "<clause number or section>",
      "clauseText": "<relevant excerpt>",
      "category": "<category>",
      "riskLevel": "<'medium' or 'high'>",
      "explanation": "<why this clause is risky>",
      "suggestedModification": "<how to improve this clause>"
    }
  ],
  "modificationSuggestions": [
    {
      "clauseReference": "<clause number>",
      "currentText": "<current problematic text>",
      "suggestedText": "<improved text>",
      "rationale": "<why this change is recommended>",
      "priority": "<'critical', 'recommended', or 'optional'>"
    }
  ]
}

Important:
- Provide at least 2-3 favorable clauses and 2-3 risky clauses if they exist
- Risk score should reflect the overall position: 0-30 = high risk, 31-60 = moderate risk, 61-100 = low risk
- Be specific about South African law implications where relevant
- Focus on practical, actionable insights`;
}

function parseAnalysisResponse(response: string, perspective: AnalysisPerspective): ContractAnalysis {
  // Try to extract JSON from the response
  let jsonStr = response;
  
  // Handle markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonStr = jsonMatch[1].trim();
  } else {
    // Try to find JSON object directly
    const startIdx = response.indexOf('{');
    const endIdx = response.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonStr = response.substring(startIdx, endIdx + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    return {
      perspective,
      riskScore: Math.max(0, Math.min(100, parsed.riskScore || 50)),
      contractType: parsed.contractType || 'Unknown',
      summary: parsed.summary || 'Analysis completed.',
      favorableClauses: (parsed.favorableClauses || []).map((c: any) => ({
        clauseNumber: c.clauseNumber || 'N/A',
        clauseText: c.clauseText || '',
        category: c.category || 'other',
        riskLevel: c.riskLevel || 'low',
        explanation: c.explanation || '',
        suggestedModification: c.suggestedModification
      })),
      riskyClauses: (parsed.riskyClauses || []).map((c: any) => ({
        clauseNumber: c.clauseNumber || 'N/A',
        clauseText: c.clauseText || '',
        category: c.category || 'other',
        riskLevel: c.riskLevel || 'medium',
        explanation: c.explanation || '',
        suggestedModification: c.suggestedModification
      })),
      modificationSuggestions: (parsed.modificationSuggestions || []).map((s: any) => ({
        clauseReference: s.clauseReference || 'N/A',
        currentText: s.currentText || '',
        suggestedText: s.suggestedText || '',
        rationale: s.rationale || '',
        priority: s.priority || 'recommended'
      })),
      generatedAt: new Date().toISOString()
    };
  } catch (e) {
    console.error('Failed to parse analysis response:', e);
    // Return a default structure if parsing fails
    return {
      perspective,
      riskScore: 50,
      contractType: 'Unknown',
      summary: 'Analysis could not be fully parsed. Please try again.',
      favorableClauses: [],
      riskyClauses: [],
      modificationSuggestions: [],
      generatedAt: new Date().toISOString()
    };
  }
}

export async function POST(request: Request) {
  const start = Date.now();
  
  try {
    const body: ContractAnalysisRequest = await request.json();
    const { content, perspective, contractType } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json({ error: 'Contract content is required' }, { status: 400 });
    }

    if (!perspective || !['party_a', 'party_b', 'neutral'].includes(perspective)) {
      return Response.json({ error: 'Valid perspective is required (party_a, party_b, or neutral)' }, { status: 400 });
    }

    // Truncate very long contracts to avoid token limits - reduced for speed
    const maxLength = 12000;
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '\n\n[Contract truncated for analysis...]'
      : content;

    const systemPrompt = getAnalysisPrompt(perspective);
    const userPrompt = contractType 
      ? `Analyze this ${contractType}:\n\n${truncatedContent}`
      : `Analyze this contract:\n\n${truncatedContent}`;

    // Use cached chat model
    const chatModel = getChatModel();

    const response = await Promise.race([
      chatModel.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Analysis timeout")), 60000)) // Reduced timeout
    ]) as any;

    const rawResponse = typeof response.content === "string"
      ? response.content
      : response.content?.map((c: any) => c.text || "").join("");

    const analysis = parseAnalysisResponse(rawResponse, perspective);
    const processingTime = Date.now() - start;

    return Response.json({
      analysis,
      processingTime,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Contract analysis error:', error);
    return Response.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    service: 'Contract Analysis API',
    perspectives: ['party_a', 'party_b', 'neutral'],
    description: 'Analyze contracts from different party perspectives',
    usage: {
      method: 'POST',
      body: {
        content: 'string (required) - The contract text to analyze',
        perspective: 'string (required) - party_a, party_b, or neutral',
        contractType: 'string (optional) - Type of contract for better analysis'
      }
    }
  });
}
