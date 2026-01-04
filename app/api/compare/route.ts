/**
 * Document Comparison API
 * 
 * POST /api/compare - Compare two documents
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Types
// ============================================

interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  lineNumber: { doc1?: number; doc2?: number };
  content: string;
  originalContent?: string | undefined; // For modified segments
}

interface ClauseDiff {
  clauseNumber: string;
  clauseTitle?: string | undefined;
  status: 'unchanged' | 'added' | 'removed' | 'modified';
  doc1Content?: string | undefined;
  doc2Content?: string | undefined;
  changes?: string[] | undefined;
}

interface ComparisonReport {
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    similarityScore: number;
  };
  lineDiffs: DiffSegment[];
  clauseDiffs?: ClauseDiff[] | undefined;
  keyDifferences: string[];
  generatedAt: string;
}

// ============================================
// Text Diff Algorithm (Simple LCS-based)
// ============================================

function computeLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const prevRow = dp[i - 1];
      const currRow = dp[i];
      if (prevRow && currRow && arr1[i - 1] === arr2[j - 1]) {
        currRow[j] = (prevRow[j - 1] ?? 0) + 1;
      } else if (prevRow && currRow) {
        currRow[j] = Math.max(prevRow[j] ?? 0, currRow[j - 1] ?? 0);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    const prevRow = dp[i - 1];
    const currRow = dp[i];
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1] ?? '');
      i--;
      j--;
    } else if (prevRow && currRow && (prevRow[j] ?? 0) > (currRow[j - 1] ?? 0)) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

function computeLineDiff(doc1Lines: string[], doc2Lines: string[]): DiffSegment[] {
  const lcs = computeLCS(doc1Lines, doc2Lines);
  const diffs: DiffSegment[] = [];
  
  let i = 0, j = 0, k = 0;
  let lineNum1 = 1, lineNum2 = 1;

  while (i < doc1Lines.length || j < doc2Lines.length) {
    const doc1Line = doc1Lines[i];
    const doc2Line = doc2Lines[j];
    const lcsLine = lcs[k];
    
    if (k < lcs.length && i < doc1Lines.length && doc1Line === lcsLine) {
      if (j < doc2Lines.length && doc2Line === lcsLine) {
        // Unchanged line
        diffs.push({
          type: 'unchanged',
          lineNumber: { doc1: lineNum1, doc2: lineNum2 },
          content: doc1Line ?? '',
        });
        i++;
        j++;
        k++;
        lineNum1++;
        lineNum2++;
      } else {
        // Line added in doc2
        diffs.push({
          type: 'added',
          lineNumber: { doc2: lineNum2 },
          content: doc2Line ?? '',
        });
        j++;
        lineNum2++;
      }
    } else if (k < lcs.length && j < doc2Lines.length && doc2Line === lcsLine) {
      // Line removed from doc1
      diffs.push({
        type: 'removed',
        lineNumber: { doc1: lineNum1 },
        content: doc1Line ?? '',
      });
      i++;
      lineNum1++;
    } else if (i < doc1Lines.length && j < doc2Lines.length) {
      // Modified line (both different from LCS)
      diffs.push({
        type: 'modified',
        lineNumber: { doc1: lineNum1, doc2: lineNum2 },
        content: doc2Line ?? '',
        originalContent: doc1Line ?? '',
      });
      i++;
      j++;
      lineNum1++;
      lineNum2++;
    } else if (i < doc1Lines.length) {
      // Remaining lines in doc1 (removed)
      diffs.push({
        type: 'removed',
        lineNumber: { doc1: lineNum1 },
        content: doc1Line ?? '',
      });
      i++;
      lineNum1++;
    } else if (j < doc2Lines.length) {
      // Remaining lines in doc2 (added)
      diffs.push({
        type: 'added',
        lineNumber: { doc2: lineNum2 },
        content: doc2Line ?? '',
      });
      j++;
      lineNum2++;
    }
  }

  return diffs;
}

// ============================================
// Clause Detection
// ============================================

interface ParsedClause {
  number: string;
  title?: string | undefined;
  content: string;
  startLine: number;
  endLine: number;
}

function parseClause(lines: string[]): ParsedClause[] {
  const clauses: ParsedClause[] = [];
  const clausePattern = /^(\d+(?:\.\d+)*)\s*[.:\-]?\s*(.*)$/;
  
  let currentClause: ParsedClause | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    if (!lineContent) continue;
    const line = lineContent.trim();
    const match = line.match(clausePattern);
    
    if (match && match[1]) {
      // Save previous clause
      if (currentClause) {
        currentClause.endLine = i - 1;
        clauses.push(currentClause);
      }
      
      // Start new clause
      currentClause = {
        number: match[1],
        title: match[2] || undefined,
        content: line,
        startLine: i,
        endLine: i,
      };
    } else if (currentClause && line) {
      // Add to current clause content
      currentClause.content += '\n' + line;
    }
  }
  
  // Save last clause
  if (currentClause) {
    currentClause.endLine = lines.length - 1;
    clauses.push(currentClause);
  }
  
  return clauses;
}

function compareClause(clauses1: ParsedClause[], clauses2: ParsedClause[]): ClauseDiff[] {
  const diffs: ClauseDiff[] = [];
  const clauses1Map = new Map(clauses1.map(c => [c.number, c]));
  const clauses2Map = new Map(clauses2.map(c => [c.number, c]));
  
  // Check clauses in doc1
  for (const [num, clause1] of clauses1Map) {
    const clause2 = clauses2Map.get(num);
    
    if (!clause2) {
      diffs.push({
        clauseNumber: num,
        clauseTitle: clause1.title,
        status: 'removed',
        doc1Content: clause1.content,
      });
    } else if (clause1.content.trim() !== clause2.content.trim()) {
      diffs.push({
        clauseNumber: num,
        clauseTitle: clause1.title || clause2.title,
        status: 'modified',
        doc1Content: clause1.content,
        doc2Content: clause2.content,
      });
    } else {
      diffs.push({
        clauseNumber: num,
        clauseTitle: clause1.title,
        status: 'unchanged',
        doc1Content: clause1.content,
      });
    }
  }
  
  // Check for new clauses in doc2
  for (const [num, clause2] of clauses2Map) {
    if (!clauses1Map.has(num)) {
      diffs.push({
        clauseNumber: num,
        clauseTitle: clause2.title,
        status: 'added',
        doc2Content: clause2.content,
      });
    }
  }
  
  // Sort by clause number
  return diffs.sort((a, b) => {
    const numA = a.clauseNumber.split('.').map(Number);
    const numB = b.clauseNumber.split('.').map(Number);
    for (let i = 0; i < Math.max(numA.length, numB.length); i++) {
      const diff = (numA[i] || 0) - (numB[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

// ============================================
// Similarity Score
// ============================================

function calculateSimilarity(doc1: string, doc2: string): number {
  const words1 = new Set(doc1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(doc2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// ============================================
// Key Differences Extraction
// ============================================

function extractKeyDifferences(lineDiffs: DiffSegment[], clauseDiffs?: ClauseDiff[]): string[] {
  const differences: string[] = [];
  
  // Count changes
  const additions = lineDiffs.filter(d => d.type === 'added').length;
  const deletions = lineDiffs.filter(d => d.type === 'removed').length;
  const modifications = lineDiffs.filter(d => d.type === 'modified').length;
  
  if (additions > 0) {
    differences.push(`${additions} line(s) added in the new document`);
  }
  if (deletions > 0) {
    differences.push(`${deletions} line(s) removed from the original document`);
  }
  if (modifications > 0) {
    differences.push(`${modifications} line(s) modified`);
  }
  
  // Clause-level differences
  if (clauseDiffs) {
    const addedClauses = clauseDiffs.filter(c => c.status === 'added');
    const removedClauses = clauseDiffs.filter(c => c.status === 'removed');
    const modifiedClauses = clauseDiffs.filter(c => c.status === 'modified');
    
    if (addedClauses.length > 0) {
      const nums = addedClauses.map(c => c.clauseNumber).join(', ');
      differences.push(`New clauses added: ${nums}`);
    }
    if (removedClauses.length > 0) {
      const nums = removedClauses.map(c => c.clauseNumber).join(', ');
      differences.push(`Clauses removed: ${nums}`);
    }
    if (modifiedClauses.length > 0) {
      const nums = modifiedClauses.map(c => c.clauseNumber).join(', ');
      differences.push(`Clauses modified: ${nums}`);
    }
  }
  
  return differences;
}

// ============================================
// POST /api/compare - Compare documents
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document1, document2, includeClauseAnalysis = true } = body;

    if (!document1 || !document2) {
      return NextResponse.json(
        { error: 'Both document1 and document2 are required' },
        { status: 400 }
      );
    }

    // Split into lines
    const doc1Lines = document1.split('\n');
    const doc2Lines = document2.split('\n');

    // Compute line-by-line diff
    const lineDiffs = computeLineDiff(doc1Lines, doc2Lines);

    // Compute clause-level diff if requested
    let clauseDiffs: ClauseDiff[] | undefined;
    if (includeClauseAnalysis) {
      const clauses1 = parseClause(doc1Lines);
      const clauses2 = parseClause(doc2Lines);
      if (clauses1.length > 0 || clauses2.length > 0) {
        clauseDiffs = compareClause(clauses1, clauses2);
      }
    }

    // Calculate summary
    const additions = lineDiffs.filter(d => d.type === 'added').length;
    const deletions = lineDiffs.filter(d => d.type === 'removed').length;
    const modifications = lineDiffs.filter(d => d.type === 'modified').length;
    const similarityScore = Math.round(calculateSimilarity(document1, document2));

    // Extract key differences
    const keyDifferences = extractKeyDifferences(lineDiffs, clauseDiffs);

    const report: ComparisonReport = {
      summary: {
        totalChanges: additions + deletions + modifications,
        additions,
        deletions,
        modifications,
        similarityScore,
      },
      lineDiffs,
      clauseDiffs,
      keyDifferences,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('Comparison error:', error);
    return NextResponse.json(
      { error: error.message || 'Comparison failed' },
      { status: 500 }
    );
  }
}
