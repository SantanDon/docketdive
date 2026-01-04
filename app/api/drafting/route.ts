/**
 * Legal Drafting API
 * 
 * POST /api/drafting - Generate a legal document draft
 * GET /api/drafting/templates - Get available templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateResponseStream } from '../utils/rag';
import fs from 'fs';
import path from 'path';

// ============================================
// Types
// ============================================

type DocumentType = 'contract' | 'letter_of_demand' | 'pleading' | 'motion' | 'legal_opinion' | 'cease_and_desist';
type ToneProfile = 'formal' | 'aggressive' | 'conciliatory' | 'plain_language';

interface DraftRequest {
  documentType: DocumentType;
  tone: ToneProfile;
  context: string;
  fields?: Record<string, string>;
  jurisdiction?: string;
}

interface Template {
  id: string;
  name: string;
  documentType: DocumentType;
  description: string;
  structure: { section: string; label: string; required: boolean }[];
  requiredFields: string[];
  toneVariations: Record<ToneProfile, string>;
}

// ============================================
// Template Loading
// ============================================

let templatesCache: { templates: Template[]; toneProfiles: Record<string, any> } | null = null;

function loadTemplates() {
  if (templatesCache) return templatesCache;
  
  try {
    const templatePath = path.join(process.cwd(), 'data/templates/legal-templates.json');
    const data = fs.readFileSync(templatePath, 'utf-8');
    templatesCache = JSON.parse(data);
    return templatesCache;
  } catch (error) {
    console.error('Failed to load templates:', error);
    return { templates: [], toneProfiles: {} };
  }
}

function getTemplate(documentType: DocumentType): Template | null {
  const data = loadTemplates();
  if (!data || !data.templates) return null;
  return data.templates.find(t => t.documentType === documentType) || null;
}

// ============================================
// Prompt Building
// ============================================

function buildDraftingPrompt(
  template: Template,
  tone: ToneProfile,
  context: string,
  fields: Record<string, string>,
  jurisdiction: string
): string {
  const data = loadTemplates();
  const toneProfiles = data?.toneProfiles || {};
  const toneConfig = toneProfiles[tone];
  
  const structureGuide = template.structure
    .map(s => `- **${s.label}**${s.required ? ' (Required)' : ' (Optional)'}`)
    .join('\n');

  const fieldsList = Object.entries(fields)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  return `You are an expert South African legal drafter. Generate a professional ${template.name} document.

## Document Type
${template.name}: ${template.description}

## Tone Profile: ${toneConfig?.name || tone}
${toneConfig?.description || ''}
Characteristics:
${toneConfig?.characteristics?.map((c: string) => `- ${c}`).join('\n') || ''}

## Document Structure
Follow this structure:
${structureGuide}

## Provided Information
${fieldsList || 'No specific fields provided'}

## Context/Instructions from User
${context}

## Jurisdiction
${jurisdiction}

## Instructions
1. Generate a complete, professional ${template.name}
2. Use the ${tone} tone throughout
3. Include all required sections
4. Use proper South African legal formatting and terminology
5. Include appropriate legal citations where relevant
6. Ensure the document is ready for use (fill in placeholders with [PLACEHOLDER] where information is missing)
7. Format using proper legal document conventions

Generate the document now:`;
}

// ============================================
// POST /api/drafting - Generate draft
// ============================================

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendChunk(type: string, content: any) {
        try {
          controller.enqueue(encoder.encode(JSON.stringify({ type, content }) + '\n'));
        } catch (e) {
          console.error('Error sending chunk:', e);
        }
      }

      try {
        const body: DraftRequest = await request.json();
        const { documentType, tone, context, fields = {}, jurisdiction = 'South Africa' } = body;

        // Validate inputs
        if (!documentType || !context) {
          sendChunk('error', 'Document type and context are required');
          controller.close();
          return;
        }

        // Get template
        const template = getTemplate(documentType);
        if (!template) {
          sendChunk('error', `Unknown document type: ${documentType}`);
          controller.close();
          return;
        }

        sendChunk('status', `Preparing ${template.name} draft...`);
        sendChunk('template', {
          id: template.id,
          name: template.name,
          structure: template.structure,
        });

        // Build prompt
        const prompt = buildDraftingPrompt(template, tone || 'formal', context, fields, jurisdiction);

        sendChunk('status', 'Generating draft...');

        // Generate using LLM
        let fullDraft = '';
        const responseStream = generateResponseStream(
          context,
          '', // No RAG context for drafting
          false,
          'groq', // Use Groq for speed
          prompt
        );

        for await (const delta of responseStream) {
          fullDraft += delta;
          sendChunk('text_delta', delta);
        }

        // Send completion metadata
        sendChunk('metadata', {
          documentType,
          tone,
          wordCount: fullDraft.split(/\s+/).length,
          generatedAt: new Date().toISOString(),
        });

        sendChunk('status', '');
        controller.close();

      } catch (error: any) {
        console.error('Drafting error:', error);
        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: 'error', 
          content: error.message || 'Failed to generate draft' 
        }) + '\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ============================================
// GET /api/drafting/templates - Get templates
// ============================================

export async function GET(request: NextRequest) {
  try {
    const data = loadTemplates();
    const templates = data?.templates || [];
    const toneProfiles = data?.toneProfiles || {};
    
    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        documentType: t.documentType,
        description: t.description,
        requiredFields: t.requiredFields,
      })),
      toneProfiles: Object.entries(toneProfiles).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.name,
        description: value.description,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load templates' },
      { status: 500 }
    );
  }
}
