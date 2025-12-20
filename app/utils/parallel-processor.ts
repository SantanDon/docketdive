/**
 * Parallel Processor for DocketDive
 * Implements parallel processing for query expansion and vector search
 */

export interface ParallelQueryResult {
  query: string;
  results: any[];
  similarity: number;
  executionTime: number;
}

export interface SwarmConfig {
  maxParallelQueries: number;  // Maximum number of parallel query expansions
  maxParallelSearches: number; // Maximum number of parallel vector searches
  timeoutMs: number;           // Timeout for each operation
}

export class ParallelProcessor {
  private config: SwarmConfig;

  constructor(config?: Partial<SwarmConfig>) {
    this.config = {
      maxParallelQueries: config?.maxParallelQueries || 3,
      maxParallelSearches: config?.maxParallelSearches || 5,
      timeoutMs: config?.timeoutMs || 30000, // 30 seconds default
    };
  }

  /**
   * Executes multiple query expansions in parallel
   */
  async executeParallelQueryExpansion(
    expansions: (() => Promise<any>)[]
  ): Promise<any[]> {
    // Limit the number of parallel expansions based on config
    const limitedExpansions = expansions.slice(0, this.config.maxParallelQueries);
    
    // Execute all expansions in parallel with timeout
    const promises = limitedExpansions.map(expansionFn => 
      Promise.race([
        expansionFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query expansion timeout')), this.config.timeoutMs)
        )
      ])
    );

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error in parallel query expansion:', error);
      // Fallback to sequential execution if parallel fails
      return await this.executeSequentialQueryExpansion(limitedExpansions);
    }
  }

  /**
   * Fallback to sequential execution if parallel fails
   */
  async executeSequentialQueryExpansion(expansions: (() => Promise<any>)[]): Promise<any[]> {
    const results: any[] = [];
    for (const expansion of expansions) {
      try {
        const result = await Promise.race([
          expansion(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query expansion timeout')), this.config.timeoutMs)
          )
        ]);
        results.push(result);
      } catch (error) {
        console.error('Sequential query expansion failed:', error);
        results.push(null); // Add null for failed expansions
      }
    }
    return results;
  }

  /**
   * Executes multiple vector searches in parallel
   */
  async executeParallelVectorSearch(
    searchFunctions: (() => Promise<any>)[]
  ): Promise<any[]> {
    // Limit the number of parallel searches based on config
    const limitedSearches = searchFunctions.slice(0, this.config.maxParallelSearches);
    
    // Execute all searches in parallel with timeout
    const promises = limitedSearches.map(searchFn => 
      Promise.race([
        searchFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Vector search timeout')), this.config.timeoutMs)
        )
      ])
    );

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error in parallel vector search:', error);
      // Fallback to sequential execution if parallel fails
      return await this.executeSequentialVectorSearch(limitedSearches);
    }
  }

  /**
   * Fallback to sequential execution if parallel fails
   */
  async executeSequentialVectorSearch(searches: (() => Promise<any>)[]): Promise<any[]> {
    const results: any[] = [];
    for (const search of searches) {
      try {
        const result = await Promise.race([
          search(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Vector search timeout')), this.config.timeoutMs)
          )
        ]);
        results.push(result);
      } catch (error) {
        console.error('Sequential vector search failed:', error);
        results.push(null); // Add null for failed searches
      }
    }
    return results;
  }

  /**
   * Executes swarm search - multiple searches with different strategies in parallel
   */
  async executeSwarmSearch(
    baseSearch: () => Promise<any>,
    variantSearches: (() => Promise<any>)[]
  ): Promise<{ baseResult: any; variantResults: any[] }> {
    // Execute base search and variants in parallel
    const allSearches = [baseSearch, ...variantSearches];
    
    const promises = allSearches.map((searchFn, index) =>
      Promise.race([
        searchFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Search ${index} timeout`)), this.config.timeoutMs)
        )
      ])
    );

    try {
      const results = await Promise.all(promises);
      return {
        baseResult: results[0],
        variantResults: results.slice(1)
      };
    } catch (error) {
      console.error('Error in swarm search:', error);
      // Fallback to sequential execution
      const baseResult = await baseSearch();
      const variantResults = await this.executeSequentialVectorSearch(variantSearches);
      return { baseResult, variantResults };
    }
  }
}

// Export a singleton instance with default configuration
export const parallelProcessor = new ParallelProcessor();

/**
 * Utility function to process query expansion in parallel
 */
export async function processParallelQueryExpansion(
  queries: string[],
  embeddingFn: (text: string) => Promise<number[]>
): Promise<{ query: string; embedding: number[] }[]> {
  // Create embedding functions for each query
  const embeddingFunctions = queries.map(query => () => embeddingFn(query));
  
  // Execute in parallel
  const embeddings = await parallelProcessor.executeParallelQueryExpansion(embeddingFunctions);
  
  // Format results
  return queries.map((query, index) => ({
    query,
    embedding: embeddings[index] || []
  }));
}