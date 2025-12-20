// utils/responseProcessor.ts

/**
 * Simple confidence assessment - internal use only
 */
export const calculateConfidenceScore = (sources: any[], response: string): number => {
  if (sources.length === 0) {
    return 0;
  }

  const avgSimilarity = sources.reduce((sum, source) => sum + source.similarity, 0) / sources.length;
  return Math.min(100, Math.round(avgSimilarity * 100));
};

/**
 * ENHANCED: Builds context from relevant documents with improved formatting
 */
export const buildContext = (docs: any[], minSimilarityThreshold: number, maxSources: number): string => {
  const relevant = docs
    .filter(d => d.similarity >= minSimilarityThreshold)
    .slice(0, maxSources);

  if (relevant.length === 0) return "";

  let context = "=== RELEVANT LEGAL SOURCES ===\n\n";

  for (let i = 0; i < relevant.length; i++) {
    const doc = relevant[i];
    const idx = i + 1;
    const title = doc.metadata.title || doc.metadata.source || "Untitled";
    const citation = doc.metadata.citation || doc.metadata.case_number || "";
    const date = doc.metadata.date ? ` (${doc.metadata.date})` : "";
    const category = doc.metadata.category || "Law";
    const url = doc.metadata.url || "";

    context += `Source ${idx}: ${title}${citation ? ` — ${citation}` : ""}${date}\n`;
    context += `Category: ${category} | Relevance: ${(doc.similarity * 100).toFixed(1)}%\n`;

    if (url) {
      context += `URL: ${url}\n`;
    }

    // ENHANCED: Provide more context per source
    const snippet = doc.content.trim();
    context += `\n**Contextual Snippet:**\n${snippet}\n`;
    context += `\n---\n\n`;
  }

  return context.trim();
};

/**
 * Creates sources array from documents with a single pass
 */
export const createSources = (
  docs: any[],
  minSimilarity: number
): { title: string; citation: string; category: string; url: string }[] => {
  const sources = docs
    .filter(d => d.similarity >= minSimilarity)
    .map(d => ({
      title: d.metadata.title || d.metadata.source || "Unknown",
      citation: d.metadata.citation || "",
      category: d.metadata.category || "Law",
      url: d.metadata.url || ""
    }));
  
  // Remove duplicates based on title
  const uniqueSources = sources.filter((source, index, self) =>
    index === self.findIndex((s) => s.title === source.title)
  );
  
  return uniqueSources;
};

/**
 * ENHANCED: Processes the raw answer with improved citation handling
 */
export const processAnswer = (answer: string, docs: any[], minSimilarityThreshold: number, maxSources: number): { processedAnswer: string; sources: any[] } => {
  const sources = docs
    .filter(d => d.similarity >= minSimilarityThreshold)
    .slice(0, maxSources)
    .map(d => ({
      title: d.metadata.title || d.metadata.source || "Unknown",
      citation: d.metadata.citation || "",
      category: d.metadata.category || "Law",
      url: d.metadata.url || ""
    }));

  // Remove duplicates based on title
  const uniqueSources = sources.filter((source, index, self) =>
    index === self.findIndex((s) => s.title === source.title)
  );

  let processedAnswer = enforceCitations(answer, docs, minSimilarityThreshold, maxSources);
  processedAnswer = addDisclaimer(processedAnswer);

  return { processedAnswer, sources: uniqueSources };
};

/**
 * ENHANCED: Improved citation enforcement with better document name handling
 */
export const enforceCitations = (response: string, sources: any[], minSimilarityThreshold: number, maxSources: number): string => {
  let fixed = response.trim();

  const relevantSources = sources
    .filter(s => s.similarity >= minSimilarityThreshold)
    .slice(0, maxSources);

  // Replace [Source N] with actual document names
  for (let i = 0; i < relevantSources.length; i++) {
    const source = relevantSources[i];
    const actualTitle = source.metadata.title || source.metadata.source || `Source ${i + 1}`;

    const sourceNumber = i + 1;
    const sourceRegex = new RegExp(`\\[Source\\s+${sourceNumber}\\]`, 'gi');
    fixed = fixed.replace(sourceRegex, `**${actualTitle}**`);

    const genericSourceRegex = new RegExp(`\\bSource\\s+${sourceNumber}\\b`, 'gi');
    fixed = fixed.replace(genericSourceRegex, `**${actualTitle}**`);
  }

  const hasActualTitleCitation = relevantSources.some(source => {
    const title = source.metadata.title || source.metadata.source;
    return title ? fixed.includes(title) : false;
  });

  const hasQuoteCitations = /「[^」]+」/.test(fixed);
  const hasSourcesSection = fixed.includes("**Sources Used**");

  const hasInlineCitation = hasActualTitleCitation || hasQuoteCitations;

  // Detect casual conversation
  const casualPatterns = /^(hi|hello|hey|thanks|thank you|goodbye|bye|ok|okay|sure|yes|no|great|awesome|cool)\b/i;
  const isCasualConversation = casualPatterns.test(fixed.trim()) || fixed.trim().length < 100;

  // ENHANCED: Better handling for professional legal responses
  // Don't add citation warnings if the response is well-structured with headers
  const hasStructuredFormat = /^(📋|⚖️|🔍|💼|⚠️|\*\*Executive Summary|\*\*Legal Framework)/m.test(fixed);

  if (!hasInlineCitation && relevantSources.length > 0 && !isCasualConversation && !hasStructuredFormat) {
    fixed = `*Note: Response may lack specific source citations.*\n\n${fixed}`;
  }

  return fixed;
};

/**
 * Adds disclaimer to the response
 */
const addDisclaimer = (response: string): string => {
  const disclaimer = "\n\n**Disclaimer:** This information is for educational purposes only and should not be considered legal advice. Consult with a qualified legal professional for advice tailored to your specific situation.";
  return response + disclaimer;
};
