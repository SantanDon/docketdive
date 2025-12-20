/**
 * Embedding Cache for DocketDive
 * Caches document embeddings to avoid re-computation
 */

export interface CachedEmbedding {
  text: string;
  embedding: number[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface EmbeddingCacheConfig {
  maxSize: number;           // Maximum number of cached embeddings
  ttl: number;               // Time-to-live in milliseconds
  cleanupInterval: number;   // How often to clean up expired entries
  similarityThreshold: number; // Threshold for text similarity
}

export class EmbeddingCache {
  private cache: Map<string, CachedEmbedding> = new Map();
  private config: EmbeddingCacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<EmbeddingCacheConfig>) {
    this.config = {
      maxSize: config?.maxSize || 1000,           // Store up to 1000 embeddings
      ttl: config?.ttl || 2 * 24 * 60 * 60 * 1000, // 2 days default TTL
      cleanupInterval: config?.cleanupInterval || 60 * 60 * 1000, // Clean up every hour
      similarityThreshold: config?.similarityThreshold || 0.95, // 95% text similarity
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
   * Checks if text is similar enough to cached text
   */
  private isSimilar(text1: string, text2: string, threshold: number = this.config.similarityThreshold): boolean {
    // Simple character-level similarity check
    const maxLength = Math.max(text1.length, text2.length);
    if (maxLength === 0) return true;

    // Calculate similarity using a simple algorithm (could be enhanced)
    // For now, we'll use exact text match for caching purposes
    return text1.trim() === text2.trim();
  }

  /**
   * Tries to get a cached embedding for the given text
   */
  getCachedEmbedding(text: string): CachedEmbedding | null {
    for (const [key, cached] of this.cache) {
      // Check if entry has expired
      if (Date.now() - cached.timestamp > this.config.ttl) {
        continue;
      }

      if (this.isSimilar(text, cached.text)) {
        // Update access count and timestamp
        cached.accessCount++;
        cached.lastAccessed = Date.now();
        return cached;
      }
    }

    return null;
  }

  /**
   * Stores an embedding in the cache
   */
  storeEmbedding(text: string, embedding: number[]): void {
    // Clean up expired entries if cache is getting large
    if (this.cache.size > this.config.maxSize * 0.8) {
      this.cleanup();
    }

    const cachedEmbedding: CachedEmbedding = {
      text,
      embedding,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    // If cache is full, remove the least recently used item
    if (this.cache.size >= this.config.maxSize) {
      this.removeLeastRecentlyUsed();
    }

    // Use text hash as key for efficient lookup
    const cacheKey = this.generateCacheKey(text);
    this.cache.set(cacheKey, cachedEmbedding);
  }

  /**
   * Generates a cache key for the text
   */
  private generateCacheKey(text: string): string {
    // Create a hash-like key from the text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `embedding_${Math.abs(hash)}`;
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
    const totalAccesses = Array.from(this.cache.values()).reduce((sum, q) => sum + q.accessCount, 0);
    // This would require tracking hits vs misses in a real implementation
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, 
      totalAccesses
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
export const embeddingCache = new EmbeddingCache();