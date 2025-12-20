import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatGroq } from "@langchain/groq";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Latin legal terms that should NEVER be replaced during expansion
const LATIN_LEGAL_PATTERNS = [
  /\bactio\s+\w+/i,           // actio de pauperie, actio legis aquiliae, etc.
  /\blex\s+\w+/i,             // lex aquilia, lex commissoria
  /\bcondictio\s+\w+/i,       // condictio indebiti, condictio sine causa
  /\bdolus\b/i,               // dolus directus, dolus eventualis
  /\bculpa\b/i,               // culpa, culpa lata
  /\banimus\s+\w+/i,          // animus injuriandi, animus contrahendi
  /\bres\s+\w+/i,             // res nullius, res ipsa loquitur
  /\bpacta\s+\w+/i,           // pacta sunt servanda
  /\bstare\s+decisis\b/i,     // stare decisis
  /\bobiter\s+dictum\b/i,     // obiter dictum
  /\bratio\s+decidendi\b/i,   // ratio decidendi
  /\binter\s+vivos\b/i,       // inter vivos
  /\bmortis\s+causa\b/i,      // mortis causa
  /\bprima\s+facie\b/i,       // prima facie
  /\bex\s+parte\b/i,          // ex parte
  /\bin\s+personam\b/i,       // in personam
  /\bin\s+rem\b/i,            // in rem
  /\bvindicatio\b/i,          // rei vindicatio
  /\binterdict\w*\b/i,        // interdict, interdictum
];

// Case name pattern (e.g., "Smith v Jones", "Minister v Applicant")
const CASE_NAME_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+v\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/;

// Section/statute pattern (e.g., "section 21 of the Act", "s 21")
const STATUTE_PATTERN = /\b(?:section|s)\s*\d+\b/i;

/**
 * Detects if query contains specialized legal terms that should not be expanded
 */
function containsSpecializedTerms(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for Latin legal terms
  for (const pattern of LATIN_LEGAL_PATTERNS) {
    if (pattern.test(query)) {
      return true;
    }
  }
  
  // Check for case names
  if (CASE_NAME_PATTERN.test(query)) {
    return true;
  }
  
  // Check for section references
  if (STATUTE_PATTERN.test(query)) {
    return true;
  }
  
  return false;
}

/**
 * Extract the specialized term from query for exact matching
 */
export function extractSpecializedTerms(query: string): string[] {
  const terms: string[] = [];
  
  for (const pattern of LATIN_LEGAL_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      terms.push(match[0].toLowerCase());
    }
  }
  
  const caseMatch = query.match(CASE_NAME_PATTERN);
  if (caseMatch) {
    terms.push(caseMatch[0]);
  }
  
  return terms;
}

const expansionCache = new Map<string, string[]>();

/**
 * LLM-based Query Correction & Expansion
 * IMPROVED: Always preserves original query, conservative with legal terms
 */
export async function expandQuery(query: string): Promise<string[]> {
  const original = query.trim();
  
  // Check cache
  if (expansionCache.has(original.toLowerCase())) {
    console.log(`📦 Cache hit for expansion: "${original}"`);
    return expansionCache.get(original.toLowerCase()) || [original];
  }
  
  // CRITICAL: If query contains Latin legal terms, case names, or statutes,
  // DO NOT expand - return original only to prevent semantic drift
  if (containsSpecializedTerms(original)) {
    console.log(`🔒 Specialized term detected, skipping expansion for: "${original}"`);
    return [original];
  }

  console.time(`⏱️ Expansion [${original.substring(0, 15)}...]`);
  try {
    if (GROQ_API_KEY) {
      const llm = new ChatGroq({
        apiKey: GROQ_API_KEY,
        model: GROQ_MODEL,
        temperature: 0,
      });

      const prompt = `You are a South African legal search assistant.

User Query: "${original}"

TASK:
1. Correct obvious spelling errors ONLY (e.g., "crimnal" → "criminal").
2. Generate up to 1-2 search variations that use different but EQUIVALENT legal terminology.
   - Each variation MUST preserve the core legal meaning.
   - DO NOT generalize (e.g., "contract breach" should NOT become "general obligations").
   - DO NOT replace specific terms with broader categories.
3. Return ONLY a JSON array of strings. No markdown, no explanation.

RULES:
- NEVER change Latin legal terms (actio, lex, condictio, dolus, etc.)
- NEVER paraphrase case names (X v Y)
- NEVER replace specific section/act references
- Keep all variations closely related to the original query

Example:
Query: "elements of delictual liability"
Output: ["elements of delictual liability", "delict elements South Africa"]

Output:`;

      const response = await llm.invoke(prompt);
      const content = response.content.toString();
      
      // Clean and parse JSON
      const jsonStr = content.replace(/```json|```/g, "").trim();
      
      try {
        const expanded = JSON.parse(jsonStr);
        
        if (Array.isArray(expanded) && expanded.length > 0) {
          // ALWAYS include original query as FIRST element
          const allQueries = [original, ...expanded.map((s: string) => s.trim())];
          
          // Deduplicate while preserving order
          const unique = Array.from(new Set(allQueries.filter(Boolean)));
          
          console.log(`📝 Query expansion: "${original}" → ${JSON.stringify(unique.slice(0, 2))}`);
          console.timeEnd(`⏱️ Expansion [${original.substring(0, 15)}...]`);
          
          // Set cache
          expansionCache.set(original.toLowerCase(), unique.slice(0, 2));
          
          return unique.slice(0, 2);
        }
      } catch (parseError) {
        console.error("Failed to parse LLM expansion response:", parseError);
      }
    }
  } catch (error) {
    console.error("LLM Query Expansion failed:", error);
  }

  // Fallback: Return original query only
  console.log(`⚠️ Expansion failed, using original: "${original}"`);
  console.timeEnd(`⏱️ Expansion [${original.substring(0, 15)}...]`);
  return [original];
}

/**
 * Identify legal entities in query for ranking boost
 */
export function identifyLegalEntities(query: string): {
  case_names: string[];
  legal_terms: string[];
  statutes: string[];
  latin_terms: string[];
  people: string[];
  places: string[];
} {
  const entities = {
    case_names: [] as string[],
    legal_terms: [] as string[],
    statutes: [] as string[],
    latin_terms: [] as string[],
    people: [] as string[],
    places: [] as string[],
  };

  // Extract case names (X v Y format)
  const caseNameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:v\.?|versus|and|&)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = caseNameRegex.exec(query)) !== null) {
    entities.case_names.push(match[0]);
  }

  // Extract Latin legal terms
  for (const pattern of LATIN_LEGAL_PATTERNS) {
    const latinMatch = query.match(pattern);
    if (latinMatch) {
      entities.latin_terms.push(latinMatch[0].toLowerCase());
    }
  }

  // Extract generic legal terms
  const legalTerms = [
    "contract", "agreement", "tort", "negligence", "liability", "damages",
    "constitut", "bill of rights", "discrimination", "freedom", "right",
    "evidence", "procedure", "due process", "hearing", "trial", "appeal",
    "statute", "legislation", "act", "regulation", "bylaw", "ordinance",
    "court", "judge", "magistrate", "tribunal", "justice", "lawyer", "advocate",
    "crime", "offense", "sentence", "conviction", "acquittal", "charges",
    "delict", "breach", "remedy", "specific performance", "restitution"
  ];

  for (const term of legalTerms) {
    if (query.toLowerCase().includes(term.toLowerCase())) {
      entities.legal_terms.push(term);
    }
  }

  // Extract statute/act references
  const statuteRegex = /\b[A-Z][a-z\s\-\(\)]*Act\b/g;
  while ((match = statuteRegex.exec(query)) !== null) {
    entities.statutes.push(match[0]);
  }

  return entities;
}

/**
 * STOPWORDS for keyword matching - common words to ignore
 */
const STOPWORDS = new Set([
  "what", "is", "the", "a", "an", "and", "or", "in", "of", "for", "to", "on",
  "under", "south", "africa", "african", "explain", "meaning", "definition",
  "how", "why", "when", "where", "can", "does", "do", "are", "was", "were",
  "will", "would", "could", "should", "have", "has", "had", "been", "being",
  "this", "that", "these", "those", "with", "from", "about", "into", "through",
  "during", "before", "after", "above", "below", "between", "such", "each",
  "which", "who", "whom", "whose", "than", "then", "there", "here", "law",
  "legal", "south african", "tell", "me", "please", "help", "know", "need"
]);

/**
 * Compute keyword-based boost score for a document
 * This provides lexical matching alongside semantic similarity
 */
export function computeKeywordBoost(doc: any, originalQuery: string): number {
  const text = (
    (doc.content || "") + " " +
    (doc.metadata?.title || "") + " " +
    (doc.metadata?.citation || "") +
    (doc.metadata?.source || "")
  ).toLowerCase();

  const queryLower = originalQuery.toLowerCase();
  let boost = 0;

  // 1. STRONG BOOST for Latin legal phrase matches
  for (const pattern of LATIN_LEGAL_PATTERNS) {
    const match = queryLower.match(pattern);
    if (match) {
      const phrase = match[0].toLowerCase();
      if (text.includes(phrase)) {
        boost += 0.5; // Strong boost for exact Latin phrase match
        console.log(`  ✓ Latin phrase match: "${phrase}" (+0.5)`);
      }
    }
  }

  // 2. MEDIUM BOOST for multi-word legal phrases (2+ words together)
  const phrasePatterns = [
    /strict liability/gi,
    /animal owner/gi,
    /bill of rights/gi,
    /constitutional court/gi,
    /specific performance/gi,
    /breach of contract/gi,
    /delictual liability/gi,
    /unjustified enrichment/gi,
    /wrongful conduct/gi,
    /legal capacity/gi,
  ];
  
  for (const pattern of phrasePatterns) {
    if (pattern.test(queryLower) && pattern.test(text)) {
      boost += 0.15;
    }
  }

  // 3. SMALL BOOST for individual significant keywords
  const tokens = queryLower
    .split(/\W+/)
    .map(t => t.trim())
    .filter(t => t.length >= 4 && !STOPWORDS.has(t));

  const uniqueTokens = Array.from(new Set(tokens));
  let keywordMatches = 0;

  for (const token of uniqueTokens) {
    // Skip very common legal words that appear everywhere
    if (["court", "case", "rights", "person", "property"].includes(token)) {
      continue;
    }
    
    if (text.includes(token)) {
      boost += 0.03;
      keywordMatches++;
    }
  }

  // 4. BONUS for matching multiple keywords (indicates topic relevance)
  if (keywordMatches >= 3) {
    boost += 0.1;
  }

  // 5. TITLE MATCH BOOST - keywords in title are more significant
  const title = (doc.metadata?.title || "").toLowerCase();
  for (const token of uniqueTokens) {
    if (title.includes(token) && token.length >= 5) {
      boost += 0.05;
    }
  }

  // Cap total boost to prevent runaway scores
  return Math.min(boost, 0.7);
}

/**
 * Enhanced relevance ranking with hybrid semantic + keyword scoring
 */
export function rankRelevance(
  documents: any[],
  originalQuery: string,
  entities: ReturnType<typeof identifyLegalEntities>
): any[] {
  console.log(`\n🔄 Ranking ${documents.length} documents for query: "${originalQuery}"`);
  
  return documents.map(doc => {
    let score = doc.similarity || doc.$similarity || 0;
    const title = doc.metadata?.title || doc.metadata?.source || "Unknown";

    // Boost for identified case names
    if (entities.case_names.length > 0) {
      for (const caseName of entities.case_names) {
        if (doc.content.toLowerCase().includes(caseName.toLowerCase())) {
          score += 0.1;
        }
      }
    }

    // Boost for identified statutes
    if (entities.statutes.length > 0) {
      for (const statute of entities.statutes) {
        if (doc.content.toLowerCase().includes(statute.toLowerCase())) {
          score += 0.1;
        }
      }
    }

    // NEW: Strong boost for Latin legal terms
    if (entities.latin_terms.length > 0) {
      for (const latinTerm of entities.latin_terms) {
        if (doc.content.toLowerCase().includes(latinTerm)) {
          score += 0.4; // Strong boost for Latin term presence
          console.log(`  📜 Latin term "${latinTerm}" found in: ${title.substring(0, 40)}... (+0.4)`);
        }
      }
    }

    // Boost for generic legal terms
    if (entities.legal_terms.length > 0) {
      let termBoost = 0;
      for (const term of entities.legal_terms) {
        if (doc.content.toLowerCase().includes(term.toLowerCase())) {
          termBoost += 0.02;
        }
      }
      score += Math.min(termBoost, 0.1);
    }

    // NEW: Keyword-based boosting (hybrid search)
    const keywordBoost = computeKeywordBoost(doc, originalQuery);
    score += keywordBoost;

    // Boost if title/citation matches query terms
    const citation = doc.metadata?.citation || doc.metadata?.case_number || "";
    const combinedMeta = (title + " " + citation).toLowerCase();
    const queryTerms = originalQuery.toLowerCase().split(/\s+/).filter(t => t.length > 3);

    for (const term of queryTerms) {
      if (combinedMeta.includes(term)) {
        score += 0.03;
      }
    }

    // Normalize score (cap at 1.0)
    score = Math.min(1.0, score);

    return { ...doc, relevanceScore: score };
  })
  .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

/**
 * Check if any document contains significant keywords from the query
 * Used to detect "no relevant results" scenarios
 */
export function hasKeywordMatches(documents: any[], query: string): boolean {
  const queryLower = query.toLowerCase();
  
  // Extract significant tokens (5+ chars, not stopwords)
  const tokens = queryLower
    .split(/\W+/)
    .filter(t => t.length >= 5 && !STOPWORDS.has(t));
  
  // Also extract any Latin terms
  const latinTerms: string[] = [];
  for (const pattern of LATIN_LEGAL_PATTERNS) {
    const match = queryLower.match(pattern);
    if (match) {
      latinTerms.push(match[0].toLowerCase());
    }
  }
  
  const allTerms = [...tokens, ...latinTerms];
  
  if (allTerms.length === 0) {
    return true; // No specific terms to match, allow semantic-only results
  }
  
  // Check if any document contains at least one significant term
  for (const doc of documents) {
    const text = (doc.content || "").toLowerCase();
    for (const term of allTerms) {
      if (text.includes(term)) {
        return true;
      }
    }
  }
  
  return false;
}
