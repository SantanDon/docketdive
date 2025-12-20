/**
 * Astra DB Optimizer for DocketDive
 * Optimizes vector search performance in Astra DB
 */

import { DataAPIClient } from "@datastax/astra-db-ts";

export interface AstraSearchConfig {
  topK: number;                    // Number of results to retrieve
  similarityThreshold: number;     // Minimum similarity threshold
  searchType: 'vector' | 'hybrid' | 'filtered'; // Type of search to perform
  filterEnabled: boolean;          // Whether to use metadata filtering
  maxRetries: number;              // Number of retries for failed searches
  timeoutMs: number;               // Timeout for each search operation
  useIndexing: boolean;           // Whether to leverage Astra DB indexing
}

export class AstraDBOptimizer {
  private client: DataAPIClient;
  private db: any;
  private collection: any;
  private config: AstraSearchConfig;
  private queryCache: Map<string, any> = new Map();

  constructor(config?: Partial<AstraSearchConfig>) {
    this.config = {
      topK: config?.topK ?? 8,
      similarityThreshold: config?.similarityThreshold ?? 0.68,
      searchType: config?.searchType ?? 'vector',
      filterEnabled: config?.filterEnabled ?? true,
      maxRetries: config?.maxRetries ?? 3,
      timeoutMs: config?.timeoutMs ?? 15000,
      useIndexing: config?.useIndexing ?? true,
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
   * Performs optimized vector search with caching and retries
   */
  async optimizedVectorSearch(
    queryEmbedding: number[],
    filters?: Record<string, any>,
    limitOverride?: number
  ): Promise<any[]> {
    // Create a cache key based on the embedding and filters
    const cacheKey = this.generateCacheKey(queryEmbedding, filters, limitOverride);
    
    // Check if we have a cached result
    const cachedResult = this.queryCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Perform the search with retries
      const results = await this.executeSearchWithRetries(
        queryEmbedding, 
        filters, 
        limitOverride
      );

      // Cache the result (with a size limit to prevent memory issues)
      if (this.queryCache.size < 1000) { // Limit cache size
        this.queryCache.set(cacheKey, results);
      }

      return results;
    } catch (error) {
      console.error("Astra DB search error:", error);
      return [];
    }
  }

  /**
   * Executes search with retries and error handling
   */
  private async executeSearchWithRetries(
    queryEmbedding: number[],
    filters?: Record<string, any>,
    limitOverride?: number
  ): Promise<any[]> {
    let lastError: any;

    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        // Add timeout to the search operation
        const result = await Promise.race([
          this.performVectorSearch(queryEmbedding, filters, limitOverride),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Astra DB search timeout")), this.config.timeoutMs)
          )
        ]);

        return result as any[];
      } catch (error) {
        lastError = error;
        console.warn(`Search attempt ${i + 1} failed:`, error);
        
        // Wait before retrying (exponential backoff)
        if (i < this.config.maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, i) * 1000) // 1s, 2s, 4s etc.
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Performs the actual vector search
   */
  private async performVectorSearch(
    queryEmbedding: number[],
    filters?: Record<string, any>,
    limitOverride?: number
  ): Promise<any[]> {
    const limit = limitOverride || this.config.topK;

    // Build the query
    let query = this.collection.find(filters || {}, {
      sort: { $vector: queryEmbedding },
      limit: limit,
      includeSimilarity: true,
      projection: { content: 1, metadata: 1 }, // Only retrieve necessary fields
    });

    // Execute the query
    const results = await query.toArray();

    // Filter by similarity threshold if specified
    if (this.config.similarityThreshold > 0) {
      return results.filter((doc: any) => 
        (doc.$similarity || 0) >= this.config.similarityThreshold
      );
    }

    return results;
  }

  /**
   * Performs filtered search with metadata constraints
   */
  async filteredSearch(
    queryEmbedding: number[],
    metadataFilters: Record<string, any>,
    limitOverride?: number
  ): Promise<any[]> {
    if (!this.config.filterEnabled) {
      return this.optimizedVectorSearch(queryEmbedding, undefined, limitOverride);
    }

    // Combine vector search with metadata filtering
    return this.optimizedVectorSearch(queryEmbedding, metadataFilters, limitOverride);
  }

  /**
   * Generates a cache key for a search query
   */
  private generateCacheKey(
    embedding: number[],
    filters?: Record<string, any>,
    limit?: number
  ): string {
    const embeddingKey = embedding.slice(0, 10).join(','); // Use first 10 dims as identifier
    const filterKey = filters ? JSON.stringify(filters) : '';
    const limitKey = limit || this.config.topK;
    
    return `${embeddingKey}_${filterKey}_${limitKey}`;
  }

  /**
   * Pre-warms the collection by ensuring indexes are ready
   */
  async warmupCollection(): Promise<void> {
    try {
      // Execute a lightweight query to warm up the connection and indexes
      const result = await Promise.race([
        this.collection.findOne({}, { projection: { _id: 1 } }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Astra DB warmup timeout")), 5000)
        )
      ]);
      
      console.log("Astra DB collection warmed up successfully");
    } catch (error) {
      console.error("Error warming up Astra DB collection:", error);
      throw error;
    }
  }

  /**
   * Optimizes search by category with specialized parameters
   */
  async searchByCategory(
    queryEmbedding: number[],
    category: string,
    limitOverride?: number
  ): Promise<any[]> {
    // Adjust search parameters based on category
    const categoryFilters = this.getCategoryFilters(category);
    return this.filteredSearch(queryEmbedding, categoryFilters, limitOverride);
  }

  /**
   * Gets category-specific filters
   */
  private getCategoryFilters(category: string): Record<string, any> {
    switch (category.toLowerCase()) {
      case 'contract':
      case 'agreement':
        return { 'metadata.category': { $in: ['Contract Law', 'General Law'] } };
      case 'constitutional':
      case 'rights':
        return { 'metadata.category': { $in: ['Constitutional Law', 'General Law'] } };
      case 'criminal':
        return { 'metadata.category': { $in: ['Criminal Law', 'General Law'] } };
      case 'employment':
      case 'labor':
        return { 'metadata.category': { $in: ['Employment Law', 'Labor Law', 'General Law'] } };
      default:
        return {};
    }
  }

  /**
   * Performs bulk search operations efficiently
   */
  async bulkSearch(queryEmbeddings: number[][]): Promise<any[][]> {
    // For now, execute each search individually
    // In a more sophisticated implementation, you might batch these differently
    const results = await Promise.all(
      queryEmbeddings.map(embedding => this.optimizedVectorSearch(embedding))
    );
    
    return results;
  }

  /**
   * Gets collection statistics
   */
  async getCollectionStats(): Promise<{
    documentCount: number;
    avgDocumentSize: number;
    lastUpdate: Date;
  }> {
    try {
      // Note: Astra DB doesn't have direct count() or stats() methods like other DBs
      // This is a simplified approach - in practice, you might need to implement this differently
      const sample = await this.collection.find({}, { limit: 100 }).toArray();
      
      const totalSize = sample.reduce((sum: number, doc: any) => {
        return sum + JSON.stringify(doc).length;
      }, 0);
      
      return {
        documentCount: -1, // This would need to be retrieved differently in Astra
        avgDocumentSize: sample.length > 0 ? totalSize / sample.length : 0,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error("Error getting collection stats:", error);
      return {
        documentCount: -1,
        avgDocumentSize: 0,
        lastUpdate: new Date()
      };
    }
  }

  /**
   * Clears the query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<AstraSearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): AstraSearchConfig {
    return { ...this.config };
  }
}

// Export a singleton instance with default configuration
export const astraDBOptimizer = new AstraDBOptimizer();