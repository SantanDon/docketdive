/**
 * Legal Glossary Service
 * Provides term lookup, search, and custom term management
 */

import type { GlossaryTerm, StoredGlossary } from '@/types/document-processing';
import { SA_LEGAL_TERMS } from '@/data/legal-glossary';

const STORAGE_KEY = 'docketdive_custom_glossary';
const STORAGE_VERSION = 1;

/**
 * Get a term by exact match
 */
export function getTerm(term: string): GlossaryTerm | null {
  const termLower = term.toLowerCase();
  
  // Check built-in terms first
  const builtIn = SA_LEGAL_TERMS.find(t => t.term.toLowerCase() === termLower);
  if (builtIn) return builtIn;
  
  // Check custom terms
  const custom = getCustomTerms().find(t => t.term.toLowerCase() === termLower);
  return custom || null;
}

/**
 * Search terms by query (partial match)
 */
export function searchTerms(query: string): GlossaryTerm[] {
  const queryLower = query.toLowerCase();
  const allTerms = getAllTerms();
  
  return allTerms.filter(term => 
    term.term.toLowerCase().includes(queryLower) ||
    term.definition.toLowerCase().includes(queryLower)
  );
}

/**
 * Get all terms (built-in + custom)
 */
export function getAllTerms(): GlossaryTerm[] {
  const customTerms = getCustomTerms();
  return [...SA_LEGAL_TERMS, ...customTerms];
}

/**
 * Get only built-in terms
 */
export function getBuiltInTerms(): GlossaryTerm[] {
  return SA_LEGAL_TERMS;
}

/**
 * Get custom terms from localStorage
 */
export function getCustomTerms(): GlossaryTerm[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const glossary: StoredGlossary = JSON.parse(stored);
    return glossary.terms || [];
  } catch {
    return [];
  }
}

/**
 * Add a custom term
 */
export function addCustomTerm(term: GlossaryTerm): void {
  if (typeof window === 'undefined') return;
  
  const customTerms = getCustomTerms();
  
  // Check if term already exists
  const existingIndex = customTerms.findIndex(
    t => t.term.toLowerCase() === term.term.toLowerCase()
  );
  
  if (existingIndex !== -1) {
    // Update existing term
    customTerms[existingIndex] = { ...term, category: 'custom' };
  } else {
    // Add new term
    customTerms.push({ ...term, category: 'custom' });
  }
  
  saveCustomTerms(customTerms);
}

/**
 * Remove a custom term
 */
export function removeCustomTerm(term: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const customTerms = getCustomTerms();
  const termLower = term.toLowerCase();
  
  const filteredTerms = customTerms.filter(
    t => t.term.toLowerCase() !== termLower
  );
  
  if (filteredTerms.length === customTerms.length) {
    return false; // Term not found
  }
  
  saveCustomTerms(filteredTerms);
  return true;
}

/**
 * Save custom terms to localStorage
 */
function saveCustomTerms(terms: GlossaryTerm[]): void {
  if (typeof window === 'undefined') return;
  
  const glossary: StoredGlossary = {
    version: STORAGE_VERSION,
    terms,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(glossary));
}

/**
 * Clear all custom terms
 */
export function clearCustomTerms(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: GlossaryTerm['category']): GlossaryTerm[] {
  return getAllTerms().filter(term => term.category === category);
}

/**
 * Detect glossary terms in text and return their positions
 */
export interface TermMatch {
  term: GlossaryTerm;
  start: number;
  end: number;
}

export function detectTermsInText(text: string): TermMatch[] {
  const matches: TermMatch[] = [];
  const textLower = text.toLowerCase();
  const allTerms = getAllTerms();
  const seen = new Set<string>();
  
  for (const term of allTerms) {
    const termLower = term.term.toLowerCase();
    if (seen.has(termLower)) continue;
    
    let searchIndex = 0;
    while (true) {
      const index = textLower.indexOf(termLower, searchIndex);
      if (index === -1) break;
      
      // Check word boundaries
      const charBefore: string = index > 0 ? textLower[index - 1] ?? ' ' : ' ';
      const charAfter: string = index + termLower.length < textLower.length 
        ? textLower[index + termLower.length] ?? ' '
        : ' ';
      
      const isWordBoundaryBefore = /[\s.,;:!?()\[\]{}'"<>]/.test(charBefore);
      const isWordBoundaryAfter = /[\s.,;:!?()\[\]{}'"<>]/.test(charAfter);
      
      if (isWordBoundaryBefore && isWordBoundaryAfter) {
        matches.push({
          term,
          start: index,
          end: index + termLower.length,
        });
        seen.add(termLower);
        break; // Only first occurrence per term
      }
      
      searchIndex = index + 1;
    }
  }
  
  // Sort by position
  return matches.sort((a, b) => a.start - b.start);
}

/**
 * Export glossary service
 */
export const glossaryService = {
  getTerm,
  searchTerms,
  getAllTerms,
  getBuiltInTerms,
  getCustomTerms,
  addCustomTerm,
  removeCustomTerm,
  clearCustomTerms,
  getTermsByCategory,
  detectTermsInText,
};

export default glossaryService;
