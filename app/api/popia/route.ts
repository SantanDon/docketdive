/**
 * POPIA Compliance Checker API
 * 
 * POST /api/popia - Check document for POPIA compliance
 * GET /api/popia/requirements?type=privacy_policy - Get requirements for a document type
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ============================================
// Types
// ============================================

type DocumentType = 'privacy_policy' | 'data_processing_agreement' | 'consent_form';

interface POPIARequirement {
  id: string;
  section: string;
  name: string;
  description: string;
  importance: 'critical' | 'recommended';
  keywords: string[];
  checkText: string;
}

interface RequirementResult {
  id: string;
  section: string;
  name: string;
  description: string;
  importance: 'critical' | 'recommended';
  status: 'compliant' | 'non_compliant' | 'partial';
  confidence: number;
  matchedKeywords?: string[];
  recommendation?: string;
}

interface ComplianceReport {
  documentId: string;
  documentType: DocumentType;
  typeConfidence: number;
  requirements: RequirementResult[];
  complianceScore: number;
  summary: {
    critical: { compliant: number; nonCompliant: number };
    recommended: { compliant: number; nonCompliant: number };
  };
  gaps: string[];
  recommendations: string[];
  generatedAt: string;
}

// ============================================
// Load POPIA Requirements
// ============================================

let requirementsCache: any = null;

function loadRequirements() {
  if (requirementsCache) return requirementsCache;
  
  try {
    const reqPath = path.join(process.cwd(), 'data/popia/requirements.json');
    const data = fs.readFileSync(reqPath, 'utf-8');
    requirementsCache = JSON.parse(data);
    return requirementsCache;
  } catch (error) {
    console.error('Failed to load POPIA requirements:', error);
    return { popiaRequirements: {} };
  }
}

function getRequirements(docType: DocumentType): POPIARequirement[] {
  const { popiaRequirements } = loadRequirements();
  return popiaRequirements[docType]?.requirements || [];
}

function getDocTypeInfo(docType: DocumentType) {
  const { popiaRequirements } = loadRequirements();
  return popiaRequirements[docType] || null;
}

// ============================================
// Document Type Classification
// ============================================

function classifyDocumentType(content: string): { type: DocumentType; confidence: number } {
  const lowerContent = content.toLowerCase();
  
  const typeScores: Record<DocumentType, number> = {
    privacy_policy: 0,
    data_processing_agreement: 0,
    consent_form: 0,
  };

  // Privacy Policy keywords
  const privacyKeywords = ['privacy policy', 'privacy notice', 'how we collect', 'your information', 'personal information we collect', 'data protection'];
  privacyKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.privacy_policy += 3;
  });

  // DPA keywords
  const dpaKeywords = ['data processing agreement', 'operator agreement', 'processor', 'responsible party and operator', 'processing on behalf', 'sub-processor'];
  dpaKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.data_processing_agreement += 3;
  });

  // Consent Form keywords
  const consentKeywords = ['consent form', 'i consent', 'i agree', 'signature', 'by signing', 'hereby consent', 'give consent'];
  consentKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.consent_form += 3;
  });

  // Find highest score
  let maxType: DocumentType = 'privacy_policy';
  let maxScore = 0;
  let totalScore = 0;

  for (const [type, score] of Object.entries(typeScores)) {
    totalScore += score;
    if (score > maxScore) {
      maxScore = score;
      maxType = type as DocumentType;
    }
  }

  const confidence = totalScore > 0 ? Math.min(maxScore / Math.max(totalScore, 1), 0.95) : 0.3;

  return { type: maxType, confidence };
}

// ============================================
// Requirement Checking
// ============================================

function checkRequirement(content: string, requirement: POPIARequirement): RequirementResult {
  const lowerContent = content.toLowerCase();
  
  let matchCount = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of requirement.keywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matchCount++;
      matchedKeywords.push(keyword);
    }
  }

  const matchRatio = matchCount / requirement.keywords.length;
  
  let status: 'compliant' | 'non_compliant' | 'partial';
  let confidence: number;

  if (matchRatio >= 0.4) {
    status = 'compliant';
    confidence = Math.min(0.5 + matchRatio * 0.5, 0.95);
  } else if (matchRatio > 0) {
    status = 'partial';
    confidence = 0.4 + matchRatio * 0.3;
  } else {
    status = 'non_compliant';
    confidence = 0.85;
  }

  const result: RequirementResult = {
    id: requirement.id,
    section: requirement.section,
    name: requirement.name,
    description: requirement.description,
    importance: requirement.importance,
    status,
    confidence,
  };

  if (matchedKeywords.length > 0) {
    result.matchedKeywords = matchedKeywords;
  }

  if (status !== 'compliant') {
    result.recommendation = requirement.checkText;
  }

  return result;
}

// ============================================
// POST /api/popia - Check POPIA compliance
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, documentId = `doc_${Date.now()}`, documentType: specifiedType } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    // Classify document type
    let documentType: DocumentType;
    let typeConfidence: number;

    if (specifiedType && ['privacy_policy', 'data_processing_agreement', 'consent_form'].includes(specifiedType)) {
      documentType = specifiedType as DocumentType;
      typeConfidence = 1.0;
    } else {
      const classification = classifyDocumentType(content);
      documentType = classification.type;
      typeConfidence = classification.confidence;
    }

    // Get requirements for this document type
    const requirements = getRequirements(documentType);

    // Check each requirement
    const requirementResults: RequirementResult[] = requirements.map(req => 
      checkRequirement(content, req)
    );

    // Calculate summary
    const summary = {
      critical: { compliant: 0, nonCompliant: 0 },
      recommended: { compliant: 0, nonCompliant: 0 },
    };

    const gaps: string[] = [];

    for (const result of requirementResults) {
      const category = result.importance;
      if (result.status === 'compliant') {
        summary[category].compliant++;
      } else {
        summary[category].nonCompliant++;
        if (result.importance === 'critical') {
          gaps.push(`${result.section}: ${result.name} - ${result.description}`);
        }
      }
    }

    // Calculate compliance score
    const criticalWeight = 3;
    const recommendedWeight = 1;

    const totalPossible = 
      (summary.critical.compliant + summary.critical.nonCompliant) * criticalWeight +
      (summary.recommended.compliant + summary.recommended.nonCompliant) * recommendedWeight;

    const achieved = 
      summary.critical.compliant * criticalWeight +
      summary.recommended.compliant * recommendedWeight;

    const complianceScore = totalPossible > 0 ? Math.round((achieved / totalPossible) * 100) : 0;

    // Generate recommendations
    const recommendations: string[] = [];

    if (summary.critical.nonCompliant > 0) {
      recommendations.push(`🚨 ${summary.critical.nonCompliant} critical POPIA requirement(s) not met - address these immediately to avoid regulatory penalties`);
    }

    if (summary.recommended.nonCompliant > 0) {
      recommendations.push(`📝 ${summary.recommended.nonCompliant} recommended element(s) missing - consider adding for comprehensive compliance`);
    }

    if (complianceScore < 50) {
      recommendations.push(`⚠️ Low compliance score (${complianceScore}%) - this document may not meet POPIA requirements`);
    } else if (complianceScore >= 80) {
      recommendations.push(`✅ Good compliance score (${complianceScore}%) - document covers most POPIA requirements`);
    }

    if (typeConfidence < 0.6) {
      recommendations.push(`❓ Document type uncertain (${Math.round(typeConfidence * 100)}% confidence) - please verify the classification`);
    }

    // Add Information Regulator reminder
    if (documentType === 'privacy_policy') {
      const hasRegulatorInfo = requirementResults.find(r => r.id === 'pp_complaints')?.status === 'compliant';
      if (!hasRegulatorInfo) {
        recommendations.push(`📋 Remember to include Information Regulator contact details: complaints@inforegulator.org.za`);
      }
    }

    const report: ComplianceReport = {
      documentId,
      documentType,
      typeConfidence,
      requirements: requirementResults,
      complianceScore,
      summary,
      gaps,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('POPIA check error:', error);
    return NextResponse.json(
      { error: error.message || 'POPIA compliance check failed' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/popia/requirements - Get requirements
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as DocumentType | null;

    const { popiaRequirements, dataSubjectRights, lawfulProcessingConditions } = loadRequirements();

    if (type) {
      const typeInfo = popiaRequirements[type];
      if (!typeInfo) {
        return NextResponse.json(
          { error: `Unknown document type: ${type}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        type,
        name: typeInfo.name,
        description: typeInfo.description,
        requirements: typeInfo.requirements,
      });
    }

    // Return all types and reference data
    return NextResponse.json({
      documentTypes: Object.entries(popiaRequirements).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.name,
        description: value.description,
        requirementCount: value.requirements.length,
      })),
      dataSubjectRights,
      lawfulProcessingConditions,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load POPIA requirements' },
      { status: 500 }
    );
  }
}
