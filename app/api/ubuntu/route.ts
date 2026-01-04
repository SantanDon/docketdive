/**
 * Ubuntu & Constitutional Analyzer API
 * 
 * POST /api/ubuntu - Analyze query for Ubuntu/Constitutional relevance
 * GET /api/ubuntu/principles - Get Ubuntu principles and landmark cases
 * GET /api/ubuntu/rights - Get Bill of Rights information
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ============================================
// Types
// ============================================

interface UbuntuPrinciple {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  constitutionalSection: string;
}

interface LandmarkCase {
  name: string;
  citation: string;
  year: number;
  significance: string;
  ubuntuQuote: string;
  judge: string;
}

interface ConstitutionalRight {
  section: string;
  name: string;
}

interface QueryAnalysis {
  isUbuntuRelevant: boolean;
  isConstitutionalRelevant: boolean;
  relevantPrinciples: UbuntuPrinciple[];
  relevantRights: string[];
  relevantCases: LandmarkCase[];
  courtWeighting: { court: string; weight: number }[];
  suggestedContext: string;
}

// ============================================
// Load Data
// ============================================

let dataCache: any = null;

function loadData() {
  if (dataCache) return dataCache;
  
  try {
    const dataPath = path.join(process.cwd(), 'data/ubuntu/principles.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    dataCache = JSON.parse(data);
    return dataCache;
  } catch (error) {
    console.error('Failed to load Ubuntu principles:', error);
    return { ubuntuPrinciples: {}, constitutionalPrinciples: {}, courtHierarchy: {}, queryDetection: {} };
  }
}

// ============================================
// Query Analysis
// ============================================

function analyzeQuery(query: string): QueryAnalysis {
  const data = loadData();
  const lowerQuery = query.toLowerCase();
  
  const { ubuntuPrinciples, constitutionalPrinciples, courtHierarchy, queryDetection } = data;
  
  // Check for Ubuntu relevance
  let ubuntuScore = 0;
  const relevantPrinciples: UbuntuPrinciple[] = [];
  
  for (const keyword of queryDetection.ubuntuKeywords || []) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      ubuntuScore += 2;
    }
  }
  
  // Check which Ubuntu principles are relevant
  for (const principle of ubuntuPrinciples.coreValues || []) {
    for (const keyword of principle.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        if (!relevantPrinciples.find(p => p.id === principle.id)) {
          relevantPrinciples.push(principle);
        }
        ubuntuScore += 1;
        break;
      }
    }
  }
  
  // Check for Constitutional relevance
  let constitutionalScore = 0;
  const relevantRights: string[] = [];
  
  for (const keyword of queryDetection.constitutionalKeywords || []) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      constitutionalScore += 2;
    }
  }
  
  // Check which rights are relevant
  for (const [rightKey, keywords] of Object.entries(queryDetection.rightsKeywords || {})) {
    for (const keyword of keywords as string[]) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        if (!relevantRights.includes(rightKey)) {
          relevantRights.push(rightKey);
        }
        constitutionalScore += 1;
        break;
      }
    }
  }
  
  // Get relevant landmark cases
  const relevantCases: LandmarkCase[] = [];
  if (ubuntuScore > 0) {
    // Include Ubuntu landmark cases
    relevantCases.push(...(ubuntuPrinciples.landmarkCases || []).slice(0, 3));
  }
  
  // Determine court weighting
  const courtWeighting = (courtHierarchy.courts || [])
    .map((court: any) => ({ court: court.name, weight: court.weight }))
    .sort((a: any, b: any) => b.weight - a.weight);
  
  // Build suggested context enhancement
  let suggestedContext = '';
  
  if (ubuntuScore > 3) {
    suggestedContext += 'This query relates to Ubuntu jurisprudence. Prioritize Constitutional Court cases that discuss Ubuntu principles. ';
  }
  
  if (constitutionalScore > 3) {
    suggestedContext += 'This query involves constitutional rights. Prioritize Constitutional Court judgments and consider the limitation clause (Section 36). ';
  }
  
  if (relevantRights.length > 0) {
    const rightsStr = relevantRights.join(', ');
    suggestedContext += `Relevant constitutional rights: ${rightsStr}. `;
  }
  
  return {
    isUbuntuRelevant: ubuntuScore > 2,
    isConstitutionalRelevant: constitutionalScore > 2,
    relevantPrinciples,
    relevantRights,
    relevantCases,
    courtWeighting,
    suggestedContext: suggestedContext.trim(),
  };
}

// ============================================
// POST /api/ubuntu - Analyze query
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const analysis = analyzeQuery(query);

    return NextResponse.json({
      query,
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Ubuntu analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/ubuntu - Get principles and cases
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const data = loadData();

    if (type === 'principles') {
      return NextResponse.json({
        coreValues: data.ubuntuPrinciples?.coreValues || [],
        landmarkCases: data.ubuntuPrinciples?.landmarkCases || [],
        description: data.ubuntuPrinciples?.description || '',
      });
    }

    if (type === 'rights') {
      return NextResponse.json({
        foundingValues: data.constitutionalPrinciples?.foundingValues || [],
        billOfRights: data.constitutionalPrinciples?.billOfRights || {},
      });
    }

    if (type === 'courts') {
      return NextResponse.json({
        hierarchy: data.courtHierarchy?.courts || [],
        description: data.courtHierarchy?.description || '',
      });
    }

    // Return all data
    return NextResponse.json({
      ubuntu: {
        description: data.ubuntuPrinciples?.description,
        coreValues: data.ubuntuPrinciples?.coreValues,
        landmarkCases: data.ubuntuPrinciples?.landmarkCases,
      },
      constitutional: {
        foundingValues: data.constitutionalPrinciples?.foundingValues,
        billOfRights: data.constitutionalPrinciples?.billOfRights,
      },
      courtHierarchy: data.courtHierarchy,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load data' },
      { status: 500 }
    );
  }
}
