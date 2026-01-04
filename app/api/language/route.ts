/**
 * Multi-Language Support API
 * 
 * GET /api/language - Get available languages
 * GET /api/language/glossary - Get legal terminology glossary
 * POST /api/language/prompt - Get language-specific system prompt addition
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ============================================
// Types
// ============================================

interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  legalTerminology: boolean;
}

interface GlossaryTerm {
  english: string;
  afrikaans?: string;
  zulu?: string;
  xhosa?: string;
  [key: string]: string | undefined;
}

// ============================================
// Load Data
// ============================================

let languageCache: any = null;

function loadLanguageData() {
  if (languageCache) return languageCache;
  
  try {
    const dataPath = path.join(process.cwd(), 'data/languages/sa-languages.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    languageCache = JSON.parse(data);
    return languageCache;
  } catch (error) {
    console.error('Failed to load language data:', error);
    return { officialLanguages: [], legalGlossary: {}, responseLanguagePrompts: {} };
  }
}

// ============================================
// Language Prompt Builder (internal function)
// ============================================

function getLanguagePromptAddition(languageCode: string): string {
  const data = loadLanguageData();
  const prompts = data.responseLanguagePrompts || {};
  
  // Default to English if language not found
  const prompt = prompts[languageCode] || prompts['en'] || '';
  
  if (languageCode === 'en') {
    return ''; // No addition needed for English
  }
  
  const language = data.officialLanguages?.find((l: Language) => l.code === languageCode);
  const languageName = language?.name || languageCode;
  
  return `
LANGUAGE INSTRUCTION: ${prompt}

Important notes for ${languageName} responses:
- Use simple, clear language accessible to non-lawyers
- When using legal terms, provide the English equivalent in parentheses
- Maintain accuracy of legal concepts while translating
- If a legal term has no direct translation, explain it in simple terms
`;
}

// ============================================
// GET /api/language - Get languages
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const data = loadLanguageData();

    // Get glossary
    if (type === 'glossary') {
      return NextResponse.json({
        description: data.legalGlossary?.description,
        terms: data.legalGlossary?.terms || [],
      });
    }

    // Get specific language info
    const code = searchParams.get('code');
    if (code) {
      const language = data.officialLanguages?.find((l: Language) => l.code === code);
      if (!language) {
        return NextResponse.json(
          { error: `Language not found: ${code}` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        language,
        promptAddition: getLanguagePromptAddition(code),
      });
    }

    // Return all languages
    return NextResponse.json({
      languages: data.officialLanguages || [],
      defaultLanguage: data.officialLanguages?.find((l: Language) => l.isDefault)?.code || 'en',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load language data' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/language/prompt - Get prompt addition
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { languageCode } = body;

    if (!languageCode) {
      return NextResponse.json(
        { error: 'languageCode is required' },
        { status: 400 }
      );
    }

    const promptAddition = getLanguagePromptAddition(languageCode);
    
    return NextResponse.json({
      languageCode,
      promptAddition,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
