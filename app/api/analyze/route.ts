import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { withErrorHandling } from '../utils/route-handler';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const analyzePostHandler = async (request: Request) => {
  const { text, query, fileName } = await request.json();

  if (!text) {
    return NextResponse.json(
      { error: 'No text provided' },
      { status: 400 }
    );
  }

  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'Groq API key not configured' },
      { status: 500 }
    );
  }

  const chatModel = new ChatGroq({
    apiKey: GROQ_API_KEY,
    model: GROQ_MODEL,
    temperature: 0.1,
    maxTokens: 2000,
  });

  // Truncate text if too long (Groq has token limits)
  const maxChars = 50000;
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;

  const systemPrompt = `You are a South African legal assistant analyzing legal documents.

  Provide a comprehensive analysis including:
  1. Document type and purpose
  2. Key legal concepts and principles
  3. Important dates, parties, and references
  4. Main conclusions or findings
  5. Potential legal implications

  Be specific, cite relevant sections, and use South African legal terminology.`;

  const userPrompt = query
    ? `${query}\n\nDocument (${fileName}):\n${truncatedText}`
    : `Analyze and summarize the following legal document (${fileName}):\n\n${truncatedText}`;

  const startTime = Date.now();
  const response = await chatModel.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
  const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

  return NextResponse.json({
    success: true,
    analysis: response.content,
    metadata: {
      model: GROQ_MODEL,
      responseTime: `${responseTime}s`,
      textLength: truncatedText.length,
      truncated: text.length > maxChars,
      timestamp: new Date().toISOString(),
    },
  });
};

export const POST = withErrorHandling(analyzePostHandler);
