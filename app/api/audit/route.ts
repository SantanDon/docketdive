/**
 * Contract Clause Auditor API (Enhanced)
 * 
 * POST /api/audit - Audit a contract for missing/risky clauses
 * GET /api/audit/clauses?type=employment - Get standard clauses for a contract type
 * 
 * Enhanced features:
 * - 15+ clause categories
 * - Confidence scores per clause
 * - Unusual language detection
 * - Suggested standard text for missing clauses
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateResponseStream } from '../utils/rag';
import type { ClauseCategory } from '@/types/legal-tools';

// ============================================
// Types
// ============================================

type ContractType = 'employment' | 'lease_residential' | 'service_agreement' | 'nda' | 'sale_agreement' | 'loan_agreement';

interface StandardClause {
  id: string;
  name: string;
  category: ClauseCategory;
  importance: 'critical' | 'recommended' | 'optional';
  description: string;
  keywords: string[];
  sampleText: string;
  unusualPatterns?: string[]; // Patterns that indicate unusual language
}

interface ClauseAuditResult {
  id: string;
  name: string;
  category: ClauseCategory;
  importance: 'critical' | 'recommended' | 'optional';
  status: 'present' | 'missing' | 'partial';
  confidence: number;
  location?: string;
  suggestion?: string;
  unusualLanguage?: string[]; // Detected unusual language
  isStandard: boolean;
}

interface RiskyClause {
  text: string;
  riskLevel: 'high' | 'medium' | 'low';
  explanation: string;
  suggestion: string;
}

interface AuditReport {
  documentId: string;
  contractType: ContractType;
  typeConfidence: number;
  clauses: ClauseAuditResult[];
  riskyClauseCount: number;
  overallScore: number;
  summary: {
    critical: { present: number; missing: number };
    recommended: { present: number; missing: number };
    optional: { present: number; missing: number };
  };
  recommendations: string[];
  unusualClausesCount: number;
  generatedAt: string;
}

// ============================================
// Enhanced Standard Clauses (15+ categories)
// ============================================

const ENHANCED_CLAUSES: Record<ClauseCategory, StandardClause> = {
  termination: {
    id: 'termination',
    name: 'Termination Clause',
    category: 'termination',
    importance: 'critical',
    description: 'Specifies how and when the agreement can be ended',
    keywords: ['termination', 'terminate', 'cancellation', 'cancel', 'end of agreement', 'notice period'],
    sampleText: 'Either party may terminate this Agreement by providing [30] days written notice to the other party.',
    unusualPatterns: ['immediate termination without cause', 'termination at sole discretion', 'no notice required'],
  },
  indemnity: {
    id: 'indemnity',
    name: 'Indemnification Clause',
    category: 'indemnity',
    importance: 'critical',
    description: 'Protects parties from third-party claims',
    keywords: ['indemnify', 'indemnification', 'hold harmless', 'defend', 'third party claims'],
    sampleText: 'Each party shall indemnify and hold harmless the other party from any claims arising from its breach of this Agreement.',
    unusualPatterns: ['unlimited indemnification', 'indemnify for all claims', 'sole indemnification'],
  },
  confidentiality: {
    id: 'confidentiality',
    name: 'Confidentiality Clause',
    category: 'confidentiality',
    importance: 'critical',
    description: 'Protects sensitive information',
    keywords: ['confidential', 'confidentiality', 'non-disclosure', 'proprietary', 'trade secret', 'sensitive information'],
    sampleText: 'Each party agrees to maintain the confidentiality of all Confidential Information disclosed by the other party.',
    unusualPatterns: ['perpetual confidentiality', 'no exceptions', 'absolute confidentiality'],
  },
  limitation_of_liability: {
    id: 'limitation_of_liability',
    name: 'Limitation of Liability',
    category: 'limitation_of_liability',
    importance: 'critical',
    description: 'Caps potential damages',
    keywords: ['limitation of liability', 'liability cap', 'maximum liability', 'damages limited', 'consequential damages'],
    sampleText: 'Neither party shall be liable for any indirect, incidental, or consequential damages. Total liability shall not exceed the fees paid under this Agreement.',
    unusualPatterns: ['unlimited liability', 'no limitation', 'waive all liability limits'],
  },
  force_majeure: {
    id: 'force_majeure',
    name: 'Force Majeure Clause',
    category: 'force_majeure',
    importance: 'recommended',
    description: 'Addresses unforeseeable circumstances',
    keywords: ['force majeure', 'act of god', 'unforeseeable', 'beyond control', 'natural disaster', 'pandemic'],
    sampleText: 'Neither party shall be liable for failure to perform due to circumstances beyond its reasonable control.',
    unusualPatterns: ['no force majeure protection', 'limited force majeure events'],
  },
  governing_law: {
    id: 'governing_law',
    name: 'Governing Law',
    category: 'governing_law',
    importance: 'critical',
    description: 'Specifies applicable law',
    keywords: ['governing law', 'applicable law', 'jurisdiction', 'laws of', 'governed by'],
    sampleText: 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of South Africa.',
    unusualPatterns: ['foreign jurisdiction', 'multiple jurisdictions'],
  },
  dispute_resolution: {
    id: 'dispute_resolution',
    name: 'Dispute Resolution',
    category: 'dispute_resolution',
    importance: 'recommended',
    description: 'Specifies how disputes will be resolved',
    keywords: ['dispute resolution', 'arbitration', 'mediation', 'litigation', 'court', 'resolve disputes'],
    sampleText: 'Any dispute arising from this Agreement shall first be submitted to mediation before either party may pursue litigation.',
    unusualPatterns: ['binding arbitration only', 'waive right to court', 'foreign arbitration'],
  },
  payment_terms: {
    id: 'payment_terms',
    name: 'Payment Terms',
    category: 'payment_terms',
    importance: 'critical',
    description: 'Specifies payment obligations',
    keywords: ['payment', 'fees', 'invoice', 'due date', 'remuneration', 'compensation', 'price'],
    sampleText: 'Payment shall be due within [30] days of invoice date. Late payments shall accrue interest at [2%] per month.',
    unusualPatterns: ['payment in advance only', 'non-refundable', 'immediate payment'],
  },
  warranties: {
    id: 'warranties',
    name: 'Warranties',
    category: 'warranties',
    importance: 'recommended',
    description: 'Guarantees about the subject matter',
    keywords: ['warranty', 'warranties', 'represents', 'warrants', 'guarantee', 'representation'],
    sampleText: 'Each party represents and warrants that it has the authority to enter into this Agreement.',
    unusualPatterns: ['no warranties', 'as is', 'disclaimer of all warranties'],
  },
  ip_rights: {
    id: 'ip_rights',
    name: 'Intellectual Property Rights',
    category: 'ip_rights',
    importance: 'recommended',
    description: 'Addresses ownership of intellectual property',
    keywords: ['intellectual property', 'ip rights', 'copyright', 'trademark', 'patent', 'ownership'],
    sampleText: 'All intellectual property created under this Agreement shall remain the property of the creating party unless otherwise agreed.',
    unusualPatterns: ['transfer all ip', 'work for hire', 'exclusive license'],
  },
  non_compete: {
    id: 'non_compete',
    name: 'Non-Compete Clause',
    category: 'non_compete',
    importance: 'optional',
    description: 'Restricts competitive activities',
    keywords: ['non-compete', 'non-competition', 'restraint of trade', 'competitive activities', 'compete'],
    sampleText: 'For a period of [12] months following termination, the Employee shall not engage in competitive activities within [geographic area].',
    unusualPatterns: ['perpetual non-compete', 'worldwide restriction', 'unlimited scope'],
  },
  assignment: {
    id: 'assignment',
    name: 'Assignment Clause',
    category: 'assignment',
    importance: 'recommended',
    description: 'Addresses transfer of rights',
    keywords: ['assignment', 'assign', 'transfer', 'delegate', 'successor'],
    sampleText: 'Neither party may assign this Agreement without the prior written consent of the other party.',
    unusualPatterns: ['free assignment', 'assignment without consent'],
  },
  amendment: {
    id: 'amendment',
    name: 'Amendment Clause',
    category: 'amendment',
    importance: 'recommended',
    description: 'Specifies how changes are made',
    keywords: ['amendment', 'modify', 'modification', 'change', 'variation', 'written agreement'],
    sampleText: 'This Agreement may only be amended by written agreement signed by both parties.',
    unusualPatterns: ['unilateral amendment', 'oral amendments'],
  },
  notices: {
    id: 'notices',
    name: 'Notices Clause',
    category: 'notices',
    importance: 'optional',
    description: 'Specifies how communications are sent',
    keywords: ['notice', 'notices', 'notification', 'written notice', 'address for service'],
    sampleText: 'All notices shall be in writing and delivered to the addresses specified in this Agreement.',
    unusualPatterns: ['oral notice sufficient', 'no notice required'],
  },
  entire_agreement: {
    id: 'entire_agreement',
    name: 'Entire Agreement Clause',
    category: 'entire_agreement',
    importance: 'recommended',
    description: 'Confirms this is the complete agreement',
    keywords: ['entire agreement', 'whole agreement', 'supersedes', 'prior agreements', 'complete agreement'],
    sampleText: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and agreements.',
    unusualPatterns: [],
  },
  data_protection: {
    id: 'data_protection',
    name: 'Data Protection / POPIA',
    category: 'data_protection',
    importance: 'critical',
    description: 'Addresses personal data handling',
    keywords: ['data protection', 'popia', 'personal information', 'privacy', 'data subject', 'processing'],
    sampleText: 'The parties shall comply with the Protection of Personal Information Act (POPIA) in processing any personal information under this Agreement.',
    unusualPatterns: ['no data protection', 'unlimited data use', 'waive privacy rights'],
  },
  insurance: {
    id: 'insurance',
    name: 'Insurance Requirements',
    category: 'insurance',
    importance: 'optional',
    description: 'Specifies insurance obligations',
    keywords: ['insurance', 'insured', 'coverage', 'policy', 'indemnity insurance'],
    sampleText: 'The Service Provider shall maintain professional indemnity insurance of not less than R[amount].',
    unusualPatterns: ['no insurance required', 'self-insured'],
  },
  audit_rights: {
    id: 'audit_rights',
    name: 'Audit Rights',
    category: 'audit_rights',
    importance: 'optional',
    description: 'Allows verification of compliance',
    keywords: ['audit', 'inspection', 'records', 'access', 'verify', 'compliance'],
    sampleText: 'Each party shall have the right to audit the other party\'s records to verify compliance with this Agreement.',
    unusualPatterns: ['unlimited audit rights', 'no audit rights'],
  },
  other: {
    id: 'other',
    name: 'Other Provisions',
    category: 'other',
    importance: 'optional',
    description: 'Miscellaneous provisions',
    keywords: [],
    sampleText: '',
    unusualPatterns: [],
  },
};

// ============================================
// Load Standard Clauses (from file + enhanced)
// ============================================

let clausesCache: any = null;

function loadClauses() {
  if (clausesCache) return clausesCache;
  
  try {
    const clausesPath = path.join(process.cwd(), 'data/clauses/standard-clauses.json');
    const data = fs.readFileSync(clausesPath, 'utf-8');
    clausesCache = JSON.parse(data);
    return clausesCache;
  } catch (error) {
    console.error('Failed to load clauses:', error);
    return { contractTypes: {} };
  }
}

function getStandardClauses(contractType: ContractType): StandardClause[] {
  const { contractTypes } = loadClauses();
  const fileBasedClauses = contractTypes[contractType]?.clauses || [];
  
  // Merge with enhanced clauses, adding category if missing
  return fileBasedClauses.map((clause: any) => ({
    ...clause,
    category: clause.category || mapClauseNameToCategory(clause.name),
    unusualPatterns: ENHANCED_CLAUSES[clause.category as ClauseCategory]?.unusualPatterns || [],
  }));
}

function mapClauseNameToCategory(name: string): ClauseCategory {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('termination') || lowerName.includes('cancellation')) return 'termination';
  if (lowerName.includes('indemnity') || lowerName.includes('indemnification')) return 'indemnity';
  if (lowerName.includes('confidential')) return 'confidentiality';
  if (lowerName.includes('liability')) return 'limitation_of_liability';
  if (lowerName.includes('force majeure')) return 'force_majeure';
  if (lowerName.includes('governing law') || lowerName.includes('jurisdiction')) return 'governing_law';
  if (lowerName.includes('dispute')) return 'dispute_resolution';
  if (lowerName.includes('payment') || lowerName.includes('fee') || lowerName.includes('remuneration')) return 'payment_terms';
  if (lowerName.includes('warrant')) return 'warranties';
  if (lowerName.includes('intellectual property') || lowerName.includes('ip')) return 'ip_rights';
  if (lowerName.includes('non-compete') || lowerName.includes('restraint')) return 'non_compete';
  if (lowerName.includes('assignment')) return 'assignment';
  if (lowerName.includes('amendment') || lowerName.includes('variation')) return 'amendment';
  if (lowerName.includes('notice')) return 'notices';
  if (lowerName.includes('entire agreement')) return 'entire_agreement';
  if (lowerName.includes('data') || lowerName.includes('popia') || lowerName.includes('privacy')) return 'data_protection';
  if (lowerName.includes('insurance')) return 'insurance';
  if (lowerName.includes('audit')) return 'audit_rights';
  return 'other';
}

function getContractTypeInfo(contractType: ContractType) {
  const { contractTypes } = loadClauses();
  return contractTypes[contractType] || null;
}

// Get all enhanced clauses for comprehensive audit
function getAllEnhancedClauses(): StandardClause[] {
  return Object.values(ENHANCED_CLAUSES).filter(c => c.category !== 'other');
}

// ============================================
// Contract Type Classification
// ============================================

async function classifyContractType(content: string): Promise<{ type: ContractType; confidence: number }> {
  const lowerContent = content.toLowerCase();
  
  // Simple keyword-based classification
  const typeScores: Record<ContractType, number> = {
    employment: 0,
    lease_residential: 0,
    service_agreement: 0,
    nda: 0,
    sale_agreement: 0,
    loan_agreement: 0,
  };

  // Employment keywords
  const employmentKeywords = ['employee', 'employer', 'employment', 'salary', 'remuneration', 'working hours', 'leave', 'probation', 'dismissal', 'ccma'];
  employmentKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.employment += 2;
  });

  // Lease keywords
  const leaseKeywords = ['landlord', 'tenant', 'lease', 'rental', 'premises', 'deposit', 'lessor', 'lessee', 'rent', 'property'];
  leaseKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.lease_residential += 2;
  });

  // Service agreement keywords
  const serviceKeywords = ['service provider', 'client', 'services', 'deliverables', 'scope of work', 'fees', 'invoice'];
  serviceKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.service_agreement += 2;
  });

  // NDA keywords
  const ndaKeywords = ['confidential', 'non-disclosure', 'nda', 'disclosing party', 'receiving party', 'proprietary', 'trade secret'];
  ndaKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.nda += 2;
  });

  // Sale agreement keywords
  const saleKeywords = ['purchase', 'sale', 'buyer', 'seller', 'purchase price', 'transfer', 'ownership'];
  saleKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.sale_agreement += 2;
  });

  // Loan agreement keywords
  const loanKeywords = ['loan', 'lender', 'borrower', 'principal', 'interest rate', 'repayment', 'security'];
  loanKeywords.forEach(kw => {
    if (lowerContent.includes(kw)) typeScores.loan_agreement += 2;
  });

  // Find highest score
  let maxType: ContractType = 'service_agreement';
  let maxScore = 0;
  let totalScore = 0;

  for (const [type, score] of Object.entries(typeScores)) {
    totalScore += score;
    if (score > maxScore) {
      maxScore = score;
      maxType = type as ContractType;
    }
  }

  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 0.95) : 0.3;

  return { type: maxType, confidence };
}

// ============================================
// Enhanced Clause Detection with Unusual Language
// ============================================

function detectClause(content: string, clause: StandardClause): ClauseAuditResult {
  const lowerContent = content.toLowerCase();
  
  let matchCount = 0;
  let matchedKeywords: string[] = [];

  for (const keyword of clause.keywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matchCount++;
      matchedKeywords.push(keyword);
    }
  }

  const matchRatio = matchCount / clause.keywords.length;
  
  let status: 'present' | 'missing' | 'partial';
  let confidence: number;

  if (matchRatio >= 0.5) {
    status = 'present';
    confidence = Math.min(0.5 + matchRatio * 0.5, 0.95);
  } else if (matchRatio > 0) {
    status = 'partial';
    confidence = 0.3 + matchRatio * 0.4;
  } else {
    status = 'missing';
    confidence = 0.8; // High confidence it's missing
  }

  // Detect unusual language
  const unusualLanguage: string[] = [];
  if (clause.unusualPatterns && status !== 'missing') {
    for (const pattern of clause.unusualPatterns) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        unusualLanguage.push(pattern);
      }
    }
  }

  // Determine if clause is standard (no unusual language detected)
  const isStandard = unusualLanguage.length === 0;

  const result: ClauseAuditResult = {
    id: clause.id,
    name: clause.name,
    category: clause.category,
    importance: clause.importance,
    status,
    confidence: Math.round(confidence * 100), // Convert to percentage
    isStandard,
  };

  if (status === 'missing') {
    result.suggestion = clause.sampleText;
  } else if (matchedKeywords.length > 0) {
    result.location = `Found keywords: ${matchedKeywords.join(', ')}`;
  }

  if (unusualLanguage.length > 0) {
    result.unusualLanguage = unusualLanguage;
  }

  return result;
}

// ============================================
// Risk Detection
// ============================================

const RISKY_PATTERNS = [
  {
    pattern: /waive[s]?\s+(all|any)\s+(rights?|claims?)/i,
    riskLevel: 'high' as const,
    explanation: 'Broad waiver of rights may be unenforceable or unfair',
    suggestion: 'Consider limiting the scope of waived rights to specific, defined matters',
  },
  {
    pattern: /unlimited\s+liability/i,
    riskLevel: 'high' as const,
    explanation: 'Unlimited liability exposure is extremely risky',
    suggestion: 'Include a reasonable cap on liability',
  },
  {
    pattern: /sole\s+discretion/i,
    riskLevel: 'medium' as const,
    explanation: 'Sole discretion clauses can be abused',
    suggestion: 'Consider adding objective criteria or good faith requirements',
  },
  {
    pattern: /automatic\s+renewal/i,
    riskLevel: 'medium' as const,
    explanation: 'Automatic renewal may lock parties in unexpectedly',
    suggestion: 'Ensure clear notice requirements before renewal',
  },
  {
    pattern: /indemnify.*all\s+(claims?|losses?|damages?)/i,
    riskLevel: 'medium' as const,
    explanation: 'Broad indemnification may be overly burdensome',
    suggestion: 'Limit indemnification to claims arising from specific breaches',
  },
  {
    pattern: /perpetual|in\s+perpetuity|forever/i,
    riskLevel: 'medium' as const,
    explanation: 'Perpetual obligations may be unreasonable',
    suggestion: 'Consider adding a reasonable time limit',
  },
];

function detectRiskyClause(content: string): RiskyClause[] {
  const risks: RiskyClause[] = [];

  for (const { pattern, riskLevel, explanation, suggestion } of RISKY_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      // Get surrounding context
      const index = content.indexOf(match[0]);
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + match[0].length + 50);
      const context = content.slice(start, end);

      risks.push({
        text: `...${context}...`,
        riskLevel,
        explanation,
        suggestion,
      });
    }
  }

  return risks;
}

// ============================================
// POST /api/audit - Audit contract
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, documentId = `doc_${Date.now()}`, contractType: specifiedType, comprehensiveAudit = false } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Contract content is required' },
        { status: 400 }
      );
    }

    // Classify contract type
    let contractType: ContractType;
    let typeConfidence: number;

    if (specifiedType && ['employment', 'lease_residential', 'service_agreement', 'nda', 'sale_agreement', 'loan_agreement'].includes(specifiedType)) {
      contractType = specifiedType as ContractType;
      typeConfidence = 1.0;
    } else {
      const classification = await classifyContractType(content);
      contractType = classification.type;
      typeConfidence = classification.confidence;
    }

    // Get standard clauses for this type + enhanced clauses for comprehensive audit
    let clausesToAudit: StandardClause[];
    if (comprehensiveAudit) {
      // Use all 18 enhanced clause categories
      clausesToAudit = getAllEnhancedClauses();
    } else {
      // Use type-specific clauses from file
      clausesToAudit = getStandardClauses(contractType);
      // If no file-based clauses, fall back to enhanced clauses
      if (clausesToAudit.length === 0) {
        clausesToAudit = getAllEnhancedClauses();
      }
    }

    // Audit each clause
    const clauseResults: ClauseAuditResult[] = clausesToAudit.map(clause => 
      detectClause(content, clause)
    );

    // Detect risky clauses
    const riskyClausesList = detectRiskyClause(content);

    // Count unusual clauses
    const unusualClausesCount = clauseResults.filter(c => c.unusualLanguage && c.unusualLanguage.length > 0).length;

    // Calculate summary
    const summary = {
      critical: { present: 0, missing: 0 },
      recommended: { present: 0, missing: 0 },
      optional: { present: 0, missing: 0 },
    };

    for (const result of clauseResults) {
      const category = result.importance;
      if (result.status === 'present') {
        summary[category].present++;
      } else {
        summary[category].missing++;
      }
    }

    // Calculate overall score
    const criticalWeight = 3;
    const recommendedWeight = 2;
    const optionalWeight = 1;

    const totalPossible = 
      (summary.critical.present + summary.critical.missing) * criticalWeight +
      (summary.recommended.present + summary.recommended.missing) * recommendedWeight +
      (summary.optional.present + summary.optional.missing) * optionalWeight;

    const achieved = 
      summary.critical.present * criticalWeight +
      summary.recommended.present * recommendedWeight +
      summary.optional.present * optionalWeight;

    const overallScore = totalPossible > 0 ? Math.round((achieved / totalPossible) * 100) : 0;

    // Generate recommendations
    const recommendations: string[] = [];

    if (summary.critical.missing > 0) {
      recommendations.push(`⚠️ ${summary.critical.missing} critical clause(s) missing - these should be added immediately`);
    }

    if (summary.recommended.missing > 0) {
      recommendations.push(`📝 ${summary.recommended.missing} recommended clause(s) missing - consider adding for better protection`);
    }

    if (riskyClausesList.length > 0) {
      const highRisk = riskyClausesList.filter(r => r.riskLevel === 'high').length;
      if (highRisk > 0) {
        recommendations.push(`🚨 ${highRisk} high-risk clause(s) detected - review carefully before signing`);
      }
    }

    if (unusualClausesCount > 0) {
      recommendations.push(`⚡ ${unusualClausesCount} clause(s) contain unusual language - review for potential issues`);
    }

    if (typeConfidence < 0.6) {
      recommendations.push(`❓ Contract type uncertain (${Math.round(typeConfidence * 100)}% confidence) - please verify the classification`);
    }

    const report: AuditReport = {
      documentId,
      contractType,
      typeConfidence,
      clauses: clauseResults,
      riskyClauseCount: riskyClausesList.length,
      overallScore,
      summary,
      recommendations,
      unusualClausesCount,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: error.message || 'Audit failed' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/audit/clauses - Get standard clauses
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ContractType | null;

    const { contractTypes } = loadClauses();

    if (type) {
      const typeInfo = contractTypes[type];
      if (!typeInfo) {
        return NextResponse.json(
          { error: `Unknown contract type: ${type}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        type,
        name: typeInfo.name,
        description: typeInfo.description,
        clauses: typeInfo.clauses,
      });
    }

    // Return all types
    return NextResponse.json({
      types: Object.entries(contractTypes).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.name,
        description: value.description,
        clauseCount: value.clauses.length,
      })),
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load clauses' },
      { status: 500 }
    );
  }
}
