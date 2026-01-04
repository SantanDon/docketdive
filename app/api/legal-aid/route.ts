/**
 * Legal Aid Mode API
 * 
 * GET /api/legal-aid - Get legal aid resources and information
 * GET /api/legal-aid/offices?province=gauteng - Get offices by province
 * GET /api/legal-aid/eligibility - Get eligibility criteria
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ============================================
// Types
// ============================================

interface LegalAidOffice {
  province: string;
  mainOffice: string;
  phone: string;
}

interface LegalResource {
  name: string;
  description: string;
  website?: string;
  phone?: string;
  focus?: string[];
}

// ============================================
// Load Data
// ============================================

let resourcesCache: any = null;

function loadResources() {
  if (resourcesCache) return resourcesCache;
  
  try {
    const dataPath = path.join(process.cwd(), 'data/legal-aid/resources.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    resourcesCache = JSON.parse(data);
    return resourcesCache;
  } catch (error) {
    console.error('Failed to load legal aid resources:', error);
    return {};
  }
}

// ============================================
// Plain Language System Prompt (internal function)
// ============================================

function getLegalAidSystemPrompt(): string {
  const resources = loadResources();
  const plainLanguage = resources.plainLanguageGuidance || {};
  const termsSimplified = plainLanguage.commonTermsSimplified || {};
  
  const termsGuide = Object.entries(termsSimplified)
    .map(([term, simple]) => `- ${term}: ${simple}`)
    .join('\n');

  return `You are DocketDive in LEGAL AID MODE - designed to help people who cannot afford lawyers.

CRITICAL INSTRUCTIONS FOR LEGAL AID MODE:
1. Use PLAIN, SIMPLE language - avoid legal jargon
2. Write short sentences (under 20 words each)
3. Use numbered steps for any process
4. Always mention FREE resources available
5. Be warm, supportive, and encouraging
6. Explain what each legal term means when you use it

PLAIN LANGUAGE GUIDE:
${termsGuide}

ALWAYS INCLUDE AT END OF RESPONSE:
---
📞 FREE HELP AVAILABLE:
- Legal Aid SA: 0800 110 110 (toll-free)
- Website: legal-aid.co.za
- You may qualify for FREE legal help if you earn less than R8,000/month
---

RESPONSE FORMAT:
1. Start with a simple, direct answer
2. Explain step-by-step what to do
3. Mention any deadlines or time limits
4. List free resources that can help
5. End with the Legal Aid contact information

Remember: The person reading this may be stressed, scared, or unfamiliar with the legal system. Be kind and clear.`;
}

// ============================================
// GET /api/legal-aid - Get resources
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const province = searchParams.get('province');

    const resources = loadResources();

    // Get offices by province
    if (type === 'offices' || province) {
      const offices = resources.legalAidOffices?.provinces || [];
      
      if (province) {
        const filtered = offices.filter((o: LegalAidOffice) => 
          o.province.toLowerCase().includes(province.toLowerCase())
        );
        return NextResponse.json({
          offices: filtered,
          mainContact: {
            tollFree: resources.legalAidSA?.tollFree,
            website: resources.legalAidSA?.website,
          },
        });
      }
      
      return NextResponse.json({
        offices,
        mainContact: {
          tollFree: resources.legalAidSA?.tollFree,
          website: resources.legalAidSA?.website,
        },
      });
    }

    // Get eligibility criteria
    if (type === 'eligibility') {
      return NextResponse.json({
        eligibility: resources.legalAidSA?.eligibility,
        howToApply: resources.legalAidSA?.howToApply,
        servicesProvided: resources.legalAidSA?.servicesProvided,
      });
    }

    // Get NGO resources
    if (type === 'ngo') {
      return NextResponse.json({
        ngoServices: resources.otherResources?.ngoLegalServices,
        lawClinics: resources.otherResources?.lawClinics,
      });
    }

    // Get emergency contacts
    if (type === 'emergency') {
      return NextResponse.json({
        emergencyContacts: resources.emergencyContacts,
      });
    }

    // Get plain language guidance
    if (type === 'plain-language') {
      return NextResponse.json({
        guidance: resources.plainLanguageGuidance,
      });
    }

    // Get system prompt for Legal Aid Mode
    if (type === 'system-prompt') {
      return NextResponse.json({
        systemPrompt: getLegalAidSystemPrompt(),
      });
    }

    // Return all resources
    return NextResponse.json({
      legalAidSA: resources.legalAidSA,
      offices: resources.legalAidOffices,
      otherResources: resources.otherResources,
      feeWaivers: resources.feeWaivers,
      selfHelpResources: resources.selfHelpResources,
      emergencyContacts: resources.emergencyContacts,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load resources' },
      { status: 500 }
    );
  }
}
