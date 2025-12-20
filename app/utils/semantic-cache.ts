import { getEmbedding } from "../api/utils/rag";

export interface CachedQuery {
  query: string;
  queryEmbedding: number[];
  response: string;
  sources: any[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  queryComplexity: number; // Estimated complexity score
}

export interface CacheConfig {
  maxSize: number;           // Maximum number of cached entries
  similarityThreshold: number; // Minimum similarity to consider a match
  ttl: number;               // Time-to-live in milliseconds
  cleanupInterval: number;   // How often to clean up expired entries
}

export class SemanticCache {
  private cache: Map<string, CachedQuery> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize || 500,           // Store up to 500 entries
      similarityThreshold: config?.similarityThreshold || 0.85, // 85% similarity threshold
      ttl: config?.ttl || 24 * 60 * 60 * 1000,   // 24 hours default TTL
      cleanupInterval: config?.cleanupInterval || 30 * 60 * 1000, // Clean up every 30 minutes
    };

    // Start periodic cleanup
    this.startCleanupTimer();
  }

  /**
   * Starts the periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Calculates cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += Math.pow(vecA[i], 2);
      normB += Math.pow(vecB[i], 2);
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Estimates query complexity based on length and keywords
   */
  private estimateQueryComplexity(query: string): number {
    // Base complexity on query length
    let complexity = Math.min(query.length / 100, 1); // Scale 0-1 based on length

    // Increase complexity for legal terms that require deeper analysis
    const complexTerms = [
      'versus', 'v', 'constitutional court', 'bill of rights', 'unfair dismissal',
      'discrimination', 'evidence', 'procedure', 'due process', 'contract law',
      'property law', 'criminal law', 'civil procedure', 'customary law'
    ];

    for (const term of complexTerms) {
      if (query.toLowerCase().includes(term)) {
        complexity += 0.1;
      }
    }

    // Cap complexity at 1.0
    return Math.min(complexity, 1.0);
  }

  /**
   * Finds the most similar cached query to the input query
   */
  async findSimilarQuery(query: string): Promise<CachedQuery | null> {
    if (this.cache.size === 0) {
      return null;
    }

    // Generate embedding for the input query
    const queryEmbedding = await getEmbedding(query);

    let bestMatch: CachedQuery | null = null;
    let bestSimilarity = 0;

    for (const cached of this.cache.values()) {
      // Check if entry has expired
      if (Date.now() - cached.timestamp > this.config.ttl) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, cached.queryEmbedding);
      
      if (similarity > bestSimilarity && similarity >= this.config.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = cached;
      }
    }

    // Update access count and timestamp if we found a match
    if (bestMatch) {
      bestMatch.accessCount++;
      bestMatch.lastAccessed = Date.now();
    }

    return bestMatch;
  }

  /**
   * Adds a new query-response pair to the cache
   */
  async addQuery(query: string, response: string, sources: any[]): Promise<void> {
    // Clean up expired entries if cache is getting large
    if (this.cache.size > this.config.maxSize * 0.8) {
      this.cleanup();
    }

    // Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);

    const cachedQuery: CachedQuery = {
      query,
      queryEmbedding,
      response,
      sources,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      queryComplexity: this.estimateQueryComplexity(query),
    };

    // If cache is full, remove the least recently used item
    if (this.cache.size >= this.config.maxSize) {
      this.removeLeastRecentlyUsed();
    }

    // Use query embedding as a unique identifier (in a real implementation, 
    // you'd want a more sophisticated key system)
    const cacheKey = this.generateCacheKey(query);
    this.cache.set(cacheKey, cachedQuery);
  }

  /**
   * Generates a cache key for the query
   */
  private generateCacheKey(query: string): string {
    // Create a hash-like key from the query (simplified for this example)
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `query_${Math.abs(hash)}`;
  }

  /**
   * Removes the least recently used item from the cache
   */
  private removeLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, cached] of this.cache) {
      if (cached.lastAccessed < oldestTime) {
        oldestTime = cached.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Removes expired entries from the cache
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > this.config.ttl) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.cache.delete(key);
    }
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
  } {
    // In a real implementation, you'd track more detailed statistics
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // This would require tracking hits vs misses
      totalAccesses: Array.from(this.cache.values()).reduce((sum, q) => sum + q.accessCount, 0)
    };
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Stops the cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Export a singleton instance
export const semanticCache = new SemanticCache();