/**
 * NLP Service using Compromise
 * Extracts legal entities from document text
 */

import nlp from 'compromise';
import type {
  ExtractedEntities,
  CaseCitation,
  StatuteReference,
  PartyEntity,
  DateEntity,
  LegalTerm,
  TextPosition,
} from '@/types/document-processing';
import {
  SA_CITATION_PATTERNS,
  STATUTE_PATTERNS,
  PARTY_ROLE_KEYWORDS,
  SA_COURTS,
  SA_LEGAL_TERMS,
} from '@/data/legal-glossary';

/**
 * Extract all legal entities from text
 */
export function extractEntities(text: string): ExtractedEntities {
  return {
    caseCitations: extractCaseCitations(text),
    statuteReferences: extractStatuteReferences(text),
    parties: extractParties(text),
    dates: extractDates(text),
    legalTerms: extractLegalTerms(text),
  };
}

/**
 * Extract SA case citations using regex patterns
 */
export function extractCaseCitations(text: string): CaseCitation[] {
  const citations: CaseCitation[] = [];
  const seen = new Set<string>();

  for (const pattern of SA_CITATION_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const citationText = match[0];
      
      // Skip duplicates
      if (seen.has(citationText)) continue;
      seen.add(citationText);

      const citation = parseCitation(citationText, match.index);
      if (citation) {
        citations.push(citation);
      }
    }
  }

  return citations;
}

/**
 * Parse a citation string into structured data
 */
function parseCitation(text: string, startIndex: number): CaseCitation | null {
  const position: TextPosition = {
    start: startIndex,
    end: startIndex + text.length,
  };

  // Try to extract year
  const yearMatch = text.match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  // Try to extract volume (number in parentheses after year)
  const volumeMatch = text.match(/\((\d+)\)/);
  const volume = volumeMatch ? volumeMatch[1] : undefined;

  // Try to extract page number (number after SA/BCLR/SACR)
  const pageMatch = text.match(/(?:SA|BCLR|SACR|All\s*SA)\s*(\d+)/i);
  const page = pageMatch ? pageMatch[1] : undefined;

  // Try to extract court abbreviation (last parentheses)
  const courtMatch = text.match(/\(([A-Z]+)\)\s*$/);
  const courtAbbr = courtMatch ? courtMatch[1] : undefined;
  const court = courtAbbr ? SA_COURTS[courtAbbr] || courtAbbr : undefined;

  return {
    text,
    year,
    volume,
    page,
    court,
    position,
  };
}

/**
 * Extract statute references using regex patterns
 */
export function extractStatuteReferences(text: string): StatuteReference[] {
  const references: StatuteReference[] = [];
  const seen = new Set<string>();

  for (const pattern of STATUTE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const refText = match[0];
      
      if (seen.has(refText)) continue;
      seen.add(refText);

      const reference = parseStatuteReference(refText, match.index);
      if (reference) {
        references.push(reference);
      }
    }
  }

  return references;
}

/**
 * Parse a statute reference into structured data
 */
function parseStatuteReference(text: string, startIndex: number): StatuteReference | null {
  const position: TextPosition = {
    start: startIndex,
    end: startIndex + text.length,
  };

  // Extract section number
  const sectionMatch = text.match(/[Ss](?:ection)?\s*(\d+[A-Za-z]?)/);
  const section = sectionMatch ? sectionMatch[1] : undefined;

  // Extract subsection (numbers in parentheses)
  const subsectionMatch = text.match(/\((\d+)\)/);
  const subsection = subsectionMatch ? subsectionMatch[1] : undefined;

  // Extract act name
  let actName = '';
  const actMatch = text.match(/(?:of\s+(?:the\s+)?)([\w\s]+Act)/i);
  if (actMatch && actMatch[1]) {
    actName = actMatch[1].trim();
  } else if (text.includes('Constitution')) {
    actName = 'Constitution';
  } else {
    // Try to get Act No. X of Year format
    const actNoMatch = text.match(/Act\s+(?:No\.?\s*)?(\d+)\s+of\s+(\d{4})/i);
    if (actNoMatch) {
      actName = `Act ${actNoMatch[1]} of ${actNoMatch[2]}`;
    }
  }

  return {
    text,
    actName,
    section,
    subsection,
    position,
  };
}


/**
 * Extract party names using Compromise NLP and role keywords
 */
export function extractParties(text: string): PartyEntity[] {
  const parties: PartyEntity[] = [];
  const doc = nlp(text);
  const seen = new Set<string>();

  // Find people and organizations
  const people = doc.people().out('array') as string[];
  const orgs = doc.organizations().out('array') as string[];
  const allNames = [...people, ...orgs];

  // Look for party role patterns in text
  for (const [role, keywords] of Object.entries(PARTY_ROLE_KEYWORDS)) {
    for (const keyword of keywords) {
      // Pattern: "the plaintiff, John Smith" or "John Smith (plaintiff)"
      const patterns = [
        new RegExp(`(?:the\\s+)?${keyword}[,:]?\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'gi'),
        new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s*\\(${keyword}\\)`, 'gi'),
        new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+(?:as\\s+)?(?:the\\s+)?${keyword}`, 'gi'),
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const name = match[1]?.trim();
          if (name && name.length > 2 && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            parties.push({
              name,
              role: role as PartyEntity['role'],
              position: {
                start: match.index,
                end: match.index + match[0].length,
              },
            });
          }
        }
      }
    }
  }

  // Add any named entities not yet classified
  for (const name of allNames) {
    if (name.length > 2 && !seen.has(name.toLowerCase())) {
      // Find position in text
      const index = text.indexOf(name);
      if (index !== -1) {
        seen.add(name.toLowerCase());
        parties.push({
          name,
          role: 'other',
          position: {
            start: index,
            end: index + name.length,
          },
        });
      }
    }
  }

  return parties;
}

/**
 * Extract dates using Compromise NLP
 */
export function extractDates(text: string): DateEntity[] {
  const dates: DateEntity[] = [];
  const seen = new Set<string>();

  // Date patterns to look for
  const datePatterns = [
    // DD Month YYYY
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
    // Month DD, YYYY
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
    // YYYY-MM-DD
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    // DD/MM/YYYY or DD-MM-YYYY
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
  ];

  // Process regex patterns
  for (const pattern of datePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dateText = match[0];
      if (seen.has(dateText.toLowerCase())) continue;
      seen.add(dateText.toLowerCase());

      dates.push({
        text: dateText,
        date: parseDate(dateText),
        type: classifyDateType(text, match.index),
        position: {
          start: match.index,
          end: match.index + dateText.length,
        },
      });
    }
  }

  return dates;
}

/**
 * Parse a date string into a Date object
 */
function parseDate(dateText: string): Date | null {
  try {
    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Classify the type of date based on surrounding context
 */
function classifyDateType(text: string, dateIndex: number): DateEntity['type'] {
  // Get surrounding context (100 chars before and after)
  const start = Math.max(0, dateIndex - 100);
  const end = Math.min(text.length, dateIndex + 100);
  const context = text.slice(start, end).toLowerCase();

  // Check for deadline indicators
  const deadlineKeywords = ['deadline', 'due', 'by', 'before', 'no later than', 'must', 'shall'];
  if (deadlineKeywords.some(kw => context.includes(kw))) {
    return 'deadline';
  }

  // Check for event indicators
  const eventKeywords = ['hearing', 'trial', 'meeting', 'conference', 'appearance', 'filed', 'signed'];
  if (eventKeywords.some(kw => context.includes(kw))) {
    return 'event';
  }

  return 'reference';
}

/**
 * Extract legal terms from the glossary
 */
export function extractLegalTerms(text: string): LegalTerm[] {
  const terms: LegalTerm[] = [];
  const textLower = text.toLowerCase();
  const seen = new Set<string>();

  for (const glossaryTerm of SA_LEGAL_TERMS) {
    const termLower = glossaryTerm.term.toLowerCase();
    
    // Skip if already found
    if (seen.has(termLower)) continue;

    // Find all occurrences of the term
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
        // Only add first occurrence to avoid duplicates
        if (!seen.has(termLower)) {
          seen.add(termLower);
          terms.push({
            term: glossaryTerm.term,
            definition: glossaryTerm.definition,
            isLatin: glossaryTerm.category === 'latin',
            position: {
              start: index,
              end: index + termLower.length,
            },
          });
        }
        break; // Only record first occurrence
      }

      searchIndex = index + 1;
    }
  }

  return terms;
}

/**
 * Get entity count summary
 */
export function getEntitySummary(entities: ExtractedEntities): Record<string, number> {
  return {
    caseCitations: entities.caseCitations.length,
    statuteReferences: entities.statuteReferences.length,
    parties: entities.parties.length,
    dates: entities.dates.length,
    legalTerms: entities.legalTerms.length,
    total: 
      entities.caseCitations.length +
      entities.statuteReferences.length +
      entities.parties.length +
      entities.dates.length +
      entities.legalTerms.length,
  };
}

export default {
  extractEntities,
  extractCaseCitations,
  extractStatuteReferences,
  extractParties,
  extractDates,
  extractLegalTerms,
  getEntitySummary,
};
