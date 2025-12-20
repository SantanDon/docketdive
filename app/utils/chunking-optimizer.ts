/**
 * Optimized Document Chunking for DocketDive
 * Implements advanced chunking strategies for better retrieval
 */

export interface ChunkingConfig {
  maxChunkSize: number;        // Maximum characters per chunk
  minChunkSize: number;        // Minimum characters per chunk
  overlap: number;             // Overlap between chunks in characters
  sentenceAware: boolean;      // Whether to split at sentence boundaries
  paragraphAware: boolean;     // Whether to preserve paragraph boundaries
  maxLengthVariation: number;  // Allowed variation from maxChunkSize
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    originalLength: number;
    chunkLength: number;
    isParagraphBased: boolean;
    previousChunkId?: string | undefined;
    nextChunkId?: string | undefined;
  };
}

export class ChunkingOptimizer {
  private config: ChunkingConfig;

  constructor(config?: Partial<ChunkingConfig>) {
    this.config = {
      maxChunkSize: config?.maxChunkSize || 700,
      minChunkSize: config?.minChunkSize || 100,
      overlap: config?.overlap || 150,
      sentenceAware: config?.sentenceAware ?? true,
      paragraphAware: config?.paragraphAware ?? true,
      maxLengthVariation: config?.maxLengthVariation || 50,
    };
  }

  /**
   * Optimized chunking function that preserves semantic boundaries
   */
  chunkDocument(text: string, documentId?: string): DocumentChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    let chunks: string[] = [];

    if (this.config.paragraphAware) {
      // Try paragraph-based chunking first
      chunks = this.chunkByParagraphs(text);
      
      // If paragraph chunking doesn't work well (too few or too large chunks),
      // fall back to sentence-aware chunking
      if (chunks.length <= 1 || chunks.some(chunk => chunk.length > this.config.maxChunkSize * 2)) {
        chunks = this.chunkBySentences(text);
      }
    } else if (this.config.sentenceAware) {
      chunks = this.chunkBySentences(text);
    } else {
      // Fallback to simple character-based chunking
      chunks = this.chunkByCharacters(text);
    }

    // Create chunk objects with metadata
    return chunks.map((content, index, array): DocumentChunk => ({
      id: `${documentId || 'doc'}_${index}`,
      content,
      metadata: {
        chunkIndex: index,
        totalChunks: array.length,
        originalLength: text.length,
        chunkLength: content.length,
        isParagraphBased: this.config.paragraphAware && this.isLikelyParagraphBased(content),
        previousChunkId: index > 0 ? `${documentId || 'doc'}_${index - 1}` : undefined,
        nextChunkId: index < array.length - 1 ? `${documentId || 'doc'}_${index + 1}` : undefined,
      }
    }));
  }

  /**
   * Chunks text by paragraphs while respecting max chunk size
   */
  private chunkByParagraphs(text: string): string[] {
    // Split by paragraphs (considering various paragraph separators)
    const paragraphs = text.split(/\n\s*\n|[\r\f\v]+/).filter(p => p.trim().length > 0);
    
    const chunks: string[] = [];
    let currentChunk = '';
    let currentChunkSize = 0;

    for (const paragraph of paragraphs) {
      const paragraphLength = paragraph.length;

      // If adding this paragraph would exceed the max size
      if (currentChunkSize + paragraphLength > this.config.maxChunkSize && currentChunkSize > 0) {
        // Finalize current chunk
        chunks.push(currentChunk.trim());
        
        // Start new chunk with this paragraph
        currentChunk = paragraph;
        currentChunkSize = paragraphLength;
      } else {
        // Add paragraph to current chunk
        if (currentChunkSize > 0) {
          currentChunk += '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
        }
        currentChunkSize += paragraphLength + 2; // +2 for the \n\n separator
      }

      // If current chunk is getting too large, force a split
      if (currentChunkSize > this.config.maxChunkSize + this.config.maxLengthVariation) {
        // Split this large chunk further
        const subChunks = this.chunkBySentences(currentChunk);
        // Add all but the first sub-chunk to our chunks array
        if (subChunks.length > 1) {
          chunks.push(subChunks[0]!);
          for (let i = 1; i < subChunks.length; i++) {
            chunks.push(subChunks[i]!);
          }
          currentChunk = '';
          currentChunkSize = 0;
        }
      }
    }

    // Add the final chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Chunks text by sentences while respecting max chunk size
   */
  private chunkBySentences(text: string): string[] {
    // Use a more sophisticated sentence detection pattern
    // This pattern considers abbreviations, decimal numbers, and common sentence endings
    const sentencePattern = /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\!|\?|\n)\s+(?=[A-Z])/g;
    
    // For simplicity, let's use a more basic approach that still considers common abbreviations
    let sentences: string[] = [];
    
    // First, try to split using common sentence endings, but avoid splitting on common abbreviations
    let processedText = text
      .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Co|Corp|St|Ave|Blvd|Rd)\./gi, (match) => match.replace('.', 'DOT_REPLACEMENT'))
      .replace(/([.!?])(\s+)([A-Z])/g, '$1|SPLIT|$3')
      .replace(/DOT_REPLACEMENT/g, '.');
    
    const splitText = processedText.split('|SPLIT|');
    sentences = splitText.map(s => s.trim());
    
    // If sentence splitting didn't work well, fall back to a simpler approach
    if (sentences.length === 1 || sentences.every(s => s.length > this.config.maxChunkSize)) {
      sentences = this.simpleSentenceSplit(text);
    }

    const chunks: string[] = [];
    let currentChunk = '';
    let currentChunkSize = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]!.trim();
      if (!sentence) continue;

      const sentenceLength = sentence.length;

      // If adding this sentence would exceed max size
      if (currentChunkSize + sentenceLength > this.config.maxChunkSize && currentChunkSize > 0) {
        // Finalize current chunk
        chunks.push(currentChunk.trim());
        
        // Start new chunk, but check if sentence is too large
        if (sentenceLength > this.config.maxChunkSize) {
          // Sentence is larger than max chunk size, need to split it
          const subChunks = this.chunkByCharacters(sentence);
          chunks.push(...subChunks);
          currentChunk = '';
          currentChunkSize = 0;
        } else {
          currentChunk = sentence;
          currentChunkSize = sentenceLength;
        }
      } else {
        // Add sentence to current chunk
        if (currentChunkSize > 0) {
          currentChunk += ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
        currentChunkSize += sentenceLength + 1; // +1 for the space
      }
    }

    // Add the final chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Simple sentence splitting approach
   */
  private simpleSentenceSplit(text: string): string[] {
    // Split on sentence boundaries
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Chunks text by characters with overlap
   */
  private chunkByCharacters(text: string): string[] {
    const chunks: string[] = [];
    const stepSize = this.config.maxChunkSize - this.config.overlap;
    
    for (let i = 0; i < text.length; i += stepSize) {
      const chunk = text.substring(i, i + this.config.maxChunkSize);
      chunks.push(chunk);
      
      // If this chunk doesn't reach the end of the text, there might be more chunks
      if (i + this.config.maxChunkSize >= text.length) {
        break;
      }
    }
    
    return chunks;
  }

  /**
   * Determines if content was likely chunked by paragraphs
   */
  private isLikelyParagraphBased(content: string): boolean {
    // Check for paragraph-like structure (multiple line breaks, indentation, etc.)
    const lineBreakCount = (content.match(/\n/g) || []).length;
    const hasParagraphStructure = lineBreakCount >= 2;
    
    // Check for common paragraph indicators
    const hasListItems = /(\d+\.|\* |- |\u2022 )/.test(content);
    const hasHeaders = /^(#{1,6}|[A-Z][A-Z ]+)$/.test(content.split('\n')[0] || '');
    
    return hasParagraphStructure || hasListItems || hasHeaders;
  }

  /**
   * Optimizes chunks to ensure minimum size requirements
   */
  optimizeChunkSizes(chunks: DocumentChunk[]): DocumentChunk[] {
    if (chunks.length <= 1) return chunks;

    const optimized: DocumentChunk[] = [];
    let i = 0;

    while (i < chunks.length) {
      let current = chunks[i]!;
      
      // If current chunk is too small and there's a next chunk, consider merging
      if (current.metadata.chunkLength < this.config.minChunkSize && i < chunks.length - 1) {
        const next = chunks[i + 1]!;
        
        // Merge with next chunk if it doesn't make it too large
        if (current.content.length + next.content.length <= this.config.maxChunkSize) {
          const mergedContent = current.content + ' ' + next.content;
          optimized.push({
            id: current.id,
            content: mergedContent,
            metadata: {
              chunkIndex: current.metadata.chunkIndex,
              totalChunks: current.metadata.totalChunks,
              originalLength: current.metadata.originalLength,
              chunkLength: mergedContent.length,
              isParagraphBased: current.metadata.isParagraphBased,
              previousChunkId: current.metadata.previousChunkId,
              nextChunkId: next.metadata.nextChunkId || current.metadata.nextChunkId,
            }
          });
          i += 2; // Skip both chunks since we merged them
        } else {
          optimized.push(current);
          i++;
        }
      } else {
        optimized.push(current);
        i++;
      }
    }

    return optimized;
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<ChunkingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): ChunkingConfig {
    return { ...this.config };
  }
}

// Export a singleton instance with default configuration
export const chunkingOptimizer = new ChunkingOptimizer();