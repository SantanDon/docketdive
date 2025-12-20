/**
 * Performance Tracker for DocketDive RAG System
 * Measures response times and performance metrics at each stage of the pipeline
 */

export interface PerformanceMetrics {
  queryPreprocessingTime: number;
  embeddingGenerationTime: number;
  vectorSearchTime: number;
  queryExpansionTime: number;
  contextBuildingTime: number;
  llmResponseTime: number;
  postProcessingTime: number;
  totalTime: number;
  cacheHit: boolean;
  cacheType?: string;
  sourcesRetrieved: number;
  tokensGenerated: number;
}

export interface PerformanceLog {
  timestamp: string;
  query: string;
  metrics: PerformanceMetrics;
  status: 'success' | 'error';
  error?: string;
}

class PerformanceTracker {
  private logs: PerformanceLog[] = [];
  private readonly maxLogs: number = 1000; // Keep last 1000 logs

  /**
   * Measures execution time of a function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = process.hrtime.bigint();
    try {
      const result = await fn();
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
      return { result, duration };
    } catch (error) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
      throw { error, duration };
    }
  }

  /**
   * Logs performance data
   */
  log(log: PerformanceLog): void {
    this.logs.push(log);
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Gets performance statistics
   */
  getStats(): {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalRequests: number;
    cacheHitRate: number;
    avgSourcesRetrieved: number;
  } {
    if (this.logs.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        avgSourcesRetrieved: 0,
      };
    }

    const successfulLogs = this.logs.filter(log => log.status === 'success');
    const responseTimes = successfulLogs.map(log => log.metrics.totalTime);
    
    if (responseTimes.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: this.logs.length,
        cacheHitRate: 0,
        avgSourcesRetrieved: 0,
      };
    }

    // Calculate average
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // Calculate percentiles
    responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    // Calculate cache hit rate
    const cacheHitCount = successfulLogs.filter(log => log.metrics.cacheHit).length;
    const cacheHitRate = successfulLogs.length > 0 ? cacheHitCount / successfulLogs.length : 0;

    // Calculate average sources retrieved
    const avgSourcesRetrieved = successfulLogs.reduce((sum, log) => sum + log.metrics.sourcesRetrieved, 0) / successfulLogs.length;

    return {
      averageResponseTime: avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      totalRequests: this.logs.length,
      cacheHitRate,
      avgSourcesRetrieved,
    };
  }

  /**
   * Resets all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Gets recent performance logs
   */
  getRecentLogs(count: number = 10): PerformanceLog[] {
    return this.logs.slice(-count);
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * Utility function to measure and log a complete RAG operation
 */
export async function measureRAGOperation(
  query: string,
  operation: () => Promise<{
    response: string;
    sources: any[];
    tokens: number;
  }>
): Promise<{
  response: string;
  sources: any[];
  tokens: number;
  metrics: PerformanceMetrics;
}> {
  const start = process.hrtime.bigint();
  
  // Initialize metrics
  const metrics: PerformanceMetrics = {
    queryPreprocessingTime: 0,
    embeddingGenerationTime: 0,
    vectorSearchTime: 0,
    queryExpansionTime: 0,
    contextBuildingTime: 0,
    llmResponseTime: 0,
    postProcessingTime: 0,
    totalTime: 0,
    cacheHit: false,
    sourcesRetrieved: 0,
    tokensGenerated: 0,
  };

  try {
    // Perform the RAG operation with measurements
    const result = await operation();
    
    // Calculate total time
    const end = process.hrtime.bigint();
    metrics.totalTime = Number(end - start) / 1_000_000; // Convert to milliseconds
    
    // Update metrics with actual values
    metrics.sourcesRetrieved = result.sources.length;
    metrics.tokensGenerated = result.tokens || 0;
    
    // Log the successful operation
    performanceTracker.log({
      timestamp: new Date().toISOString(),
      query,
      metrics,
      status: 'success'
    });

    return {
      ...result,
      metrics
    };
  } catch (error) {
    const end = process.hrtime.bigint();
    metrics.totalTime = Number(end - start) / 1_000_000; // Convert to milliseconds

    // Log the error
    performanceTracker.log({
      timestamp: new Date().toISOString(),
      query,
      metrics,
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
}