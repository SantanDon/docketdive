/**
 * Context Compressor for DocketDive
 * Implements context compression and distillation techniques to reduce LLM input size
 */

export interface CompressionResult {
  compressedContext: string;
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
  retainedInformation: number; // Estimate of how much important information was retained
  removedSections: number;
}

export interface ContextCompressionConfig {
  targetCompressionRatio: number; // Target compression ratio (0.1 = 10% of original size)
  minRetainedRatio: number;      // Minimum amount to retain (0.3 = retain at least 30%)
  similarityThreshold: number;   // Threshold for removing similar/redundant content
  prioritizeSources: boolean;    // Whether to prioritize higher-ranked sources
  maxOutputSize: number;         // Maximum size of compressed output
}

export class ContextCompressor {
  private config: ContextCompressionConfig;

  constructor(config?: Partial<ContextCompressionConfig>) {
    this.config = {
      targetCompressionRatio: config?.targetCompressionRatio ?? 0.5,
      minRetainedRatio: config?.minRetainedRatio ?? 0.2,
      similarityThreshold: config?.similarityThreshold ?? 0.8,
      prioritizeSources: config?.prioritizeSources ?? true,
      maxOutputSize: config?.maxOutputSize ?? 3000,
    };
  }

  /**
   * Compresses context by removing redundant information and prioritizing important content
   */
  compressContext(context: string, sources: any[] = []): CompressionResult {
    const originalLength = context.length;

    // First, break down the context into sections
    const sections = this.extractSections(context);
    
    // Remove redundant or similar sections
    const deduplicatedSections = this.removeSimilarSections(sections);
    
    // Prioritize sections based on source rankings if available
    let prioritizedSections = this.prioritizeSections(deduplicatedSections, sources);
    
    // Further compress if needed based on target ratio
    const finalSections = this.applyCompressionRatio(prioritizedSections, originalLength);
    
    // Combine sections back into context
    const compressedContext = this.combineSections(finalSections);
    
    // Cap the output size if needed
    const finalContext = compressedContext.length > this.config.maxOutputSize
      ? this.capContextBySize(compressedContext, this.config.maxOutputSize)
      : compressedContext;

    const compressedLength = finalContext.length;
    const compressionRatio = originalLength > 0 ? compressedLength / originalLength : 0;

    return {
      compressedContext: finalContext,
      originalLength,
      compressedLength,
      compressionRatio,
      retainedInformation: this.estimateRetainedInformation(sections, finalSections),
      removedSections: sections.length - finalSections.length
    };
  }

  /**
   * Extracts sections from context (by source or by content blocks)
   */
  private extractSections(context: string): string[] {
    // Split the context by source markers or section breaks
    // This matches the format from buildContext in responseProcessor.ts
    return context
      .split(/(?=Source \d+: )|(?=\*\*\* )|(?==== )/)  // Split at source markers
      .filter(section => section.trim().length > 0)
      .map(section => section.trim());
  }

  /**
   * Removes sections that are similar to each other
   */
  private removeSimilarSections(sections: string[]): string[] {
    const uniqueSections: string[] = [];
    
    for (const section of sections) {
      const isSimilar = uniqueSections.some(uniqueSection => 
        this.calculateTextSimilarity(section, uniqueSection) >= this.config.similarityThreshold
      );
      
      if (!isSimilar) {
        uniqueSections.push(section);
      }
    }
    
    return uniqueSections;
  }

  /**
   * Calculates text similarity using a simple approach (could be enhanced with embeddings)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity on words
    const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);
    
    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Prioritizes sections based on source rankings
   */
  private prioritizeSections(sections: string[], sources: any[]): string[] {
    if (!this.config.prioritizeSources || !sources || sources.length === 0) {
      return sections;
    }

    // Create a map of section content to its source rank
    const sectionRankMap = new Map<string, number>();
    
    for (const section of sections) {
      // Extract source identifier from section (e.g., "Source 1: ...")
      const sourceMatch = section.match(/Source (\d+):/);
      if (sourceMatch) {
        const sourceIndex = parseInt(sourceMatch[1], 10) - 1;
        if (sourceIndex >= 0 && sourceIndex < sources.length) {
          // Use similarity score as rank (higher is better)
          sectionRankMap.set(section, sources[sourceIndex].similarity || 0);
        } else {
          // Default rank for sections that don't match a source
          sectionRankMap.set(section, 0);
        }
      } else {
        // Default rank for sections without source markers
        sectionRankMap.set(section, 0);
      }
    }

    // Sort sections by rank (highest first)
    return sections.sort((a, b) => {
      const rankA = sectionRankMap.get(a) || 0;
      const rankB = sectionRankMap.get(b) || 0;
      return rankB - rankA;
    });
  }

  /**
   * Applies compression ratio by selecting top sections
   */
  private applyCompressionRatio(sections: string[], originalLength: number): string[] {
    if (sections.length <= 1) {
      return sections;
    }

    // Calculate target length
    const targetLength = Math.max(
      originalLength * this.config.minRetainedRatio,
      originalLength * this.config.targetCompressionRatio
    );

    // Calculate length of all sections
    const totalLength = sections.reduce((sum, section) => sum + section.length, 0);
    
    if (totalLength <= targetLength) {
      // No compression needed
      return sections;
    }

    // Start with the most important sections and keep adding until we reach the target
    let currentLength = 0;
    const compressedSections: string[] = [];

    for (const section of sections) {
      if (currentLength + section.length <= targetLength) {
        compressedSections.push(section);
        currentLength += section.length;
      } else if (compressedSections.length === 0) {
        // If even the first section is too large, we'll need to truncate it
        const truncatedSection = this.truncateToLength(section, targetLength);
        compressedSections.push(truncatedSection);
        currentLength = targetLength;
        break;
      } else {
        break; // We've reached our limit
      }
    }

    return compressedSections;
  }

  /**
   * Truncates a section to a specified length, preserving sentence boundaries when possible
   */
  private truncateToLength(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to find a sentence boundary near the limit
    const truncated = text.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('? '),
      truncated.lastIndexOf('! ')
    );

    if (lastSentenceEnd > maxLength * 0.7) { // Ensure we're not cutting too early
      return truncated.substring(0, lastSentenceEnd + 1) + '...';
    }

    // Otherwise, just truncate and add ellipsis
    return truncated.substring(0, maxLength - 3) + '...';
  }

  /**
   * Combines sections back into a single context string
   */
  private combineSections(sections: string[]): string {
    return sections.join('\n\n---\n\n');
  }

  /**
   * Caps the context at a specific size by removing content proportionally
   */
  private capContextBySize(context: string, maxSize: number): string {
    if (context.length <= maxSize) {
      return context;
    }

    // For legal documents, we prefer to preserve the beginning of each section
    // rather than just truncating from the end
    const sections = this.extractSections(context);
    
    if (sections.length === 1) {
      // If there's only one section, just truncate it
      return this.truncateToLength(sections[0], maxSize);
    }

    // Calculate how much we can take from each section proportionally
    const totalLength = sections.reduce((sum, s) => sum + s.length, 0);
    const perSectionSize = Math.floor(maxSize / sections.length);
    const remainingSize = maxSize - (perSectionSize * sections.length);

    let adjustedContext = '';
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const currentSize = i < remainingSize ? perSectionSize + 1 : perSectionSize;
      const processedSection = this.truncateToLength(section, currentSize);
      adjustedContext += processedSection;
      
      if (i < sections.length - 1) {
        adjustedContext += '\n\n---\n\n';
      }
    }

    return adjustedContext;
  }

  /**
   * Estimates how much important information was retained
   */
  private estimateRetainedInformation(originalSections: string[], finalSections: string[]): number {
    // Simple heuristic: if we kept the same number of sections, we retained 100% of the information
    // Otherwise, estimate based on the ratio of sections kept vs total
    if (originalSections.length === 0) return 0;
    if (originalSections.length === finalSections.length) return 1.0;
    
    // If we removed similar sections, that might not be information loss
    const retentionRatio = finalSections.length / originalSections.length;
    
    // But if we removed sections based on ranking, that's a loss
    return Math.min(1.0, retentionRatio * 1.2); // Slight bonus if we removed similar content
  }

  /**
   * Distills context by extracting key sentences or phrases
   */
  distillContext(context: string, summaryRatio: number = 0.3): string {
    const sections = this.extractSections(context);
    
    const distilledSections = sections.map(section => {
      // Extract key sentences (e.g., first and last sentences, or those with key legal terms)
      const sentences = this.splitIntoSentences(section);
      if (sentences.length <= 1) {
        return section;
      }

      // Calculate how many sentences to keep
      const numSentencesToKeep = Math.max(1, Math.ceil(sentences.length * summaryRatio));

      // For legal documents, often first and last sentences are important
      if (numSentencesToKeep >= sentences.length) {
        return section;
      }

      // Select sentences strategically
      const selectedSentences: string[] = [];
      const step = Math.max(1, Math.floor(sentences.length / numSentencesToKeep));

      for (let i = 0; i < sentences.length && selectedSentences.length < numSentencesToKeep; i += step) {
        selectedSentences.push(sentences[i]);
      }

      // Ensure we include the first and last if they're not already included
      if (!selectedSentences.includes(sentences[0])) {
        selectedSentences.unshift(sentences[0]);
      }

      if (!selectedSentences.includes(sentences[sentences.length - 1]) && 
          selectedSentences.length < numSentencesToKeep) {
        selectedSentences.push(sentences[sentences.length - 1]);
      }

      // Trim to exact number needed
      if (selectedSentences.length > numSentencesToKeep) {
        selectedSentences.splice(numSentencesToKeep);
      }

      return selectedSentences.join(' ');
    });

    return this.combineSections(distilledSections);
  }

  /**
   * Splits text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries, considering common abbreviations
    return text
      .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Co|Corp|St|Ave|Blvd|Rd)\./gi, (match) => match.replace('.', 'DOT_REPLACEMENT'))
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(s => s.trim().replace(/DOT_REPLACEMENT/g, '.'))
      .filter(s => s.length > 0);
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<ContextCompressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): ContextCompressionConfig {
    return { ...this.config };
  }
}

// Export a singleton instance with default configuration
export const contextCompressor = new ContextCompressor();