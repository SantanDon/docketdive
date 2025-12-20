/**
 * Hybrid Search for DocketDive
 * Combines keyword search with vector similarity for improved retrieval
 */

import { DataAPIClient } from "@datastax/astra-db-ts";

export interface SearchResult {
  content: string;
  metadata: any;
  similarity: number;
  keywordScore?: number;
  hybridScore: number;
}

export interface HybridSearchConfig {
  vectorWeight: number;      // Weight for vector similarity (0-1)
  keywordWeight: number;     // Weight for keyword matching (0-1)
  topK: number;              // Number of results to retrieve
  minKeywordScore: number;   // Minimum keyword score threshold
  normalizeScores: boolean;  // Whether to normalize scores to 0-1 range
}

export class HybridSearch {
  private config: HybridSearchConfig;
  private client: DataAPIClient;
  private db: any;
  private collection: any;

  constructor(config?: Partial<HybridSearchConfig>) {
    this.config = {
      vectorWeight: config?.vectorWeight ?? 0.7,
      keywordWeight: config?.keywordWeight ?? 0.3,
      topK: config?.topK ?? 10,
      minKeywordScore: config?.minKeywordScore ?? 0.1,
      normalizeScores: config?.normalizeScores ?? true,
    };

    // Initialize Astra DB connection
    if (process.env.ASTRA_DB_APPLICATION_TOKEN && process.env.ENDPOINT) {
      this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
      this.db = this.client.db(process.env.ENDPOINT);
      this.collection = this.db.collection(process.env.COLLECTION_NAME || 'docketdive');
    } else {
      throw new Error("Astra DB credentials not found in environment variables");
    }
  }

  /**
   * Calculates keyword matching score using TF-IDF style matching
   */
  private calculateKeywordScore(query: string, document: string): number {
    const queryTerms = this.tokenize(query.toLowerCase());
    const docTerms = this.tokenize(document.toLowerCase());
    
    // Count matching terms
    let matches = 0;
    const queryTermSet = new Set(queryTerms);
    
    for (const term of docTerms) {
      if (queryTermSet.has(term)) {
        matches++;
      }
    }
    
    // Calculate score as ratio of matches to total query terms (with a cap to prevent bias toward longer docs)
    const maxPossibleMatches = Math.min(queryTerms.length, docTerms.length);
    const score = maxPossibleMatches > 0 ? matches / maxPossibleMatches : 0;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Tokenizes text into terms
   */
  private tokenize(text: string): string[] {
    // Simple tokenization: split on whitespace and punctuation, remove empty strings
    return text
      .split(/[\s\-\.,;:!?"'(){}\[\]\\]+/)
      .filter(token => token.length > 0)
      .map(token => token.trim());
  }

  /**
   * Normalizes scores to 0-1 range
   */
  private normalizeScores(results: SearchResult[]): SearchResult[] {
    if (results.length === 0) return results;
    
    // Find min and max scores
    let minScore = Infinity;
    let maxScore = -Infinity;
    
    for (const result of results) {
      if (result.hybridScore < minScore) minScore = result.hybridScore;
      if (result.hybridScore > maxScore) maxScore = result.hybridScore;
    }
    
    // If all scores are the same, return as is
    if (minScore === maxScore) {
      return results;
    }
    
    // Normalize to 0-1 range
    const range = maxScore - minScore;
    return results.map(result => ({
      ...result,
      hybridScore: (result.hybridScore - minScore) / range
    }));
  }

  /**
   * Performs hybrid search combining vector and keyword matching
   */
  async search(query: string, embedding: number[]): Promise<SearchResult[]> {
    // Perform vector search
    const vectorResults = await this.vectorSearch(embedding);
    
    // Perform keyword search for the same query
    const keywordResults = await this.keywordSearch(query);
    
    // Combine results
    return this.combineResults(vectorResults, keywordResults, query);
  }

  /**
   * Performs vector similarity search
   */
  private async vectorSearch(embedding: number[]): Promise<SearchResult[]> {
    try {
      const results = await this.collection
        .find({}, {
          sort: { $vector: embedding },
          limit: this.config.topK,
          includeSimilarity: true,
          projection: { content: 1, metadata: 1 },
        })
        .toArray();

      return results.map((doc: any) => ({
        content: doc.content || "",
        metadata: doc.metadata || {},
        similarity: doc.$similarity || 0,
        keywordScore: 0, // Will be updated in combineResults if keyword search also finds this doc
        hybridScore: doc.$similarity || 0
      }));
    } catch (error) {
      console.error("Vector search error:", error);
      return [];
    }
  }

  /**
   * Performs keyword search
   */
  private async keywordSearch(query: string): Promise<SearchResult[]> {
    try {
      // For keyword search, we'll use a simple approach since Astra DB doesn't support
      // full-text search natively. In a production system, you might use a separate
      // search index (like Elasticsearch) or implement a more sophisticated approach.
      
      // For this implementation, we'll do a basic text search across all content
      // This is inefficient for large collections but works for demonstration
      const allDocs = await this.collection
        .find({}, {
          projection: { content: 1, metadata: 1 },
          limit: 1000 // Limit to prevent performance issues
        })
        .toArray();

      const keywordResults: SearchResult[] = allDocs
        .map((doc: any) => {
          const keywordScore = this.calculateKeywordScore(query, doc.content);
          return {
            content: doc.content || "",
            metadata: doc.metadata || {},
            similarity: 0, // Will be updated in combineResults if vector search also found this doc
            keywordScore,
            hybridScore: keywordScore
          };
        })
        .filter((result: SearchResult) => (result.keywordScore || 0) >= this.config.minKeywordScore)
        .sort((a: SearchResult, b: SearchResult) => (b.keywordScore || 0) - (a.keywordScore || 0))
        .slice(0, this.config.topK);

      return keywordResults;
    } catch (error) {
      console.error("Keyword search error:", error);
      return [];
    }
  }

  /**
   * Combines vector and keyword search results
   */
  private combineResults(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[],
    query: string
  ): SearchResult[] {
    // Create a map of document content to results for efficient lookup
    const resultMap = new Map<string, SearchResult>();
    
    // Add vector results to map
    for (const result of vectorResults) {
      resultMap.set(result.content, {
        ...result,
        keywordScore: 0, // Will be updated if keyword search also found this doc
        hybridScore: result.similarity * this.config.vectorWeight
      });
    }
    
    // Process keyword results and combine with vector results
    for (const keywordResult of keywordResults) {
      const existingResult = resultMap.get(keywordResult.content);
      
      if (existingResult) {
        // This document was found by both searches, combine scores
        resultMap.set(existingResult.content, {
          ...existingResult,
          keywordScore: keywordResult.keywordScore || 0,
          hybridScore: 
            (existingResult.similarity * this.config.vectorWeight) + 
            ((keywordResult.keywordScore || 0) * this.config.keywordWeight)
        });
      } else {
        // This document was only found by keyword search
        resultMap.set(keywordResult.content, {
          ...keywordResult,
          similarity: 0, // Will be updated if vector search also found this doc
          hybridScore: (keywordResult.keywordScore || 0) * this.config.keywordWeight
        });
      }
    }
    
    // Convert map back to array and sort by hybrid score
    const combinedResults = Array.from(resultMap.values())
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, this.config.topK);
    
    // Normalize scores if configured
    return this.config.normalizeScores 
      ? this.normalizeScores(combinedResults) 
      : combinedResults;
  }

  /**
   * Performs optimized hybrid search that only searches vector space for relevant results
   */
  async optimizedSearch(query: string, embedding: number[]): Promise<SearchResult[]> {
    // First, perform focused vector search
    const vectorResults = await this.vectorSearch(embedding);
    
    // If we have good vector matches (> 0.5 similarity), use those
    const highSimilarityResults = vectorResults.filter(r => r.similarity > 0.5);
    
    if (highSimilarityResults.length >= 3) {
      // If we have 3+ high similarity results, use them directly
      return highSimilarityResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.config.topK);
    }
    
    // Otherwise, perform hybrid search for broader results
    return this.search(query, embedding);
  }
}

// Export a singleton instance with default configuration
export const hybridSearch = new HybridSearch();