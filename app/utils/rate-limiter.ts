/**
 * Rate Limiter with Model Fallback & GROQ Key Rotation
 * Prevents abuse, tracks usage per user/IP, switches to fallback model on limits
 * Rotates between multiple GROQ API keys when one hits rate limit
 */

interface RateLimitConfig {
  maxRequestsPerHour: number;
  maxTokensPerHour: number;
  maxConcurrentRequests: number;
  groqKeys?: string[];
}

interface UserQuota {
  requestCount: number;
  tokenCount: number;
  lastReset: number;
  concurrentRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerHour: 30,        // Max 30 requests per hour
  maxTokensPerHour: 100000,      // Max 100k tokens per hour
  maxConcurrentRequests: 3,      // Max 3 simultaneous requests
  groqKeys: [
    process.env.GROQ_API_KEY || '',
    process.env.GROQ_API_KEY_2 || '',
    process.env.GROQ_API_KEY_3 || '',
  ].filter(Boolean),  // Only include keys that are set
};

// In-memory store for user quotas (in production, use Redis)
const userQuotas = new Map<string, UserQuota>();

// Track which model should be used
const userModelPreference = new Map<string, 'groq' | 'ollama'>();

// Track which GROQ key to use for each user
const userGroqKeyIndex = new Map<string, number>();

// Track disabled GROQ keys (hit rate limit)
const disabledGroqKeys = new Set<string>();

const HOUR = 60 * 60 * 1000;

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get user quota, resetting if hour has passed
   */
  private getOrCreateQuota(userId: string): UserQuota {
    let quota = userQuotas.get(userId);
    
    if (!quota) {
      quota = {
        requestCount: 0,
        tokenCount: 0,
        lastReset: Date.now(),
        concurrentRequests: 0,
      };
      userQuotas.set(userId, quota);
    }

    // Reset if over an hour has passed
    if (Date.now() - quota.lastReset > HOUR) {
      quota.requestCount = 0;
      quota.tokenCount = 0;
      quota.lastReset = Date.now();
      userModelPreference.delete(userId); // Reset model preference on new hour
    }

    return quota;
  }

  /**
   * Check if request is allowed; returns status and recommended model
   */
  checkLimit(userId: string): {
    allowed: boolean;
    model: 'groq' | 'ollama';
    reason?: string;
    quotaRemaining: {
      requests: number;
      tokens: number;
      concurrency: number;
    };
  } {
    const quota = this.getOrCreateQuota(userId);

    // Check concurrent requests
    if (quota.concurrentRequests >= this.config.maxConcurrentRequests) {
      return {
        allowed: false,
        model: 'ollama', // Fallback to faster Ollama
        reason: `Too many concurrent requests (${quota.concurrentRequests}/${this.config.maxConcurrentRequests})`,
        quotaRemaining: {
          requests: Math.max(0, this.config.maxRequestsPerHour - quota.requestCount),
          tokens: Math.max(0, this.config.maxTokensPerHour - quota.tokenCount),
          concurrency: this.config.maxConcurrentRequests - quota.concurrentRequests,
        },
      };
    }

    // Check requests per hour
    if (quota.requestCount >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        model: 'ollama',
        reason: `Request limit reached (${quota.requestCount}/${this.config.maxRequestsPerHour})`,
        quotaRemaining: {
          requests: 0,
          tokens: Math.max(0, this.config.maxTokensPerHour - quota.tokenCount),
          concurrency: this.config.maxConcurrentRequests - quota.concurrentRequests,
        },
      };
    }

    // Check tokens per hour
    if (quota.tokenCount >= this.config.maxTokensPerHour) {
      return {
        allowed: false,
        model: 'ollama',
        reason: `Token limit reached (${quota.tokenCount}/${this.config.maxTokensPerHour})`,
        quotaRemaining: {
          requests: Math.max(0, this.config.maxRequestsPerHour - quota.requestCount),
          tokens: 0,
          concurrency: this.config.maxConcurrentRequests - quota.concurrentRequests,
        },
      };
    }

    // Determine which model to use
    let preferredModel: 'groq' | 'ollama' = 'groq';

    // If user already switched due to GROQ limit, keep them on Ollama for this hour
    if (userModelPreference.has(userId)) {
      preferredModel = userModelPreference.get(userId)!;
    }

    // If approaching limits, switch to Ollama (faster, local, no rate limits)
    if (quota.requestCount > this.config.maxRequestsPerHour * 0.8) {
      preferredModel = 'ollama';
      userModelPreference.set(userId, 'ollama');
    }

    if (quota.tokenCount > this.config.maxTokensPerHour * 0.8) {
      preferredModel = 'ollama';
      userModelPreference.set(userId, 'ollama');
    }

    return {
      allowed: true,
      model: preferredModel,
      quotaRemaining: {
        requests: this.config.maxRequestsPerHour - quota.requestCount,
        tokens: this.config.maxTokensPerHour - quota.tokenCount,
        concurrency: this.config.maxConcurrentRequests - quota.concurrentRequests,
      },
    };
  }

  /**
   * Mark request as started
   */
  startRequest(userId: string): void {
    const quota = this.getOrCreateQuota(userId);
    quota.concurrentRequests++;
    quota.requestCount++;
  }

  /**
   * Mark request as finished and record token usage
   */
  endRequest(userId: string, tokensUsed: number = 0): void {
    const quota = this.getOrCreateQuota(userId);
    quota.concurrentRequests = Math.max(0, quota.concurrentRequests - 1);
    quota.tokenCount += tokensUsed;

    console.log(`📊 User ${userId}: ${quota.requestCount} requests, ${quota.tokenCount} tokens used this hour`);
  }

  /**
   * Handle GROQ rate limit error - rotate to next GROQ key or switch to Ollama
   */
  handleGroqRateLimit(userId: string): { action: 'rotateKey' | 'switchOllama'; key?: string } {
    const groqKeys = this.config.groqKeys || [];
    const currentKeyIndex = userGroqKeyIndex.get(userId) || 0;
    
    // Mark current key as disabled
    if (groqKeys[currentKeyIndex]) {
      disabledGroqKeys.add(groqKeys[currentKeyIndex]);
      console.warn(`🔴 GROQ Key ${currentKeyIndex + 1} disabled (rate limit hit)`);
    }

    // Try to rotate to next available key
    for (let i = 1; i < groqKeys.length; i++) {
      const nextKeyIndex = (currentKeyIndex + i) % groqKeys.length;
      const nextKey = groqKeys[nextKeyIndex];

      if (nextKey && !disabledGroqKeys.has(nextKey)) {
        userGroqKeyIndex.set(userId, nextKeyIndex);
        console.log(`✅ User ${userId} rotated to GROQ Key ${nextKeyIndex + 1}`);
        return { action: 'rotateKey', key: nextKey };
      }
    }

    // All keys disabled, switch to Ollama
    console.warn(`⚠️ All GROQ keys exhausted for user ${userId}, switching to Ollama`);
    userModelPreference.set(userId, 'ollama');
    return { action: 'switchOllama' };
  }

  /**
   * Get current GROQ key for user (rotates between available keys)
   */
  getGroqKeyForUser(userId: string): string | undefined {
    const groqKeys = this.config.groqKeys || [];
    if (groqKeys.length === 0) return undefined;
    
    const keyIndex = userGroqKeyIndex.get(userId) || 0;
    return groqKeys[keyIndex];
  }

  /**
   * Get current usage stats for user
   */
  getUsageStats(userId: string): {
    requestsUsed: number;
    requestsRemaining: number;
    tokensUsed: number;
    tokensRemaining: number;
    concurrentRequests: number;
    hourResetAt: Date;
  } {
    const quota = this.getOrCreateQuota(userId);
    const resetTime = new Date(quota.lastReset + HOUR);

    return {
      requestsUsed: quota.requestCount,
      requestsRemaining: Math.max(0, this.config.maxRequestsPerHour - quota.requestCount),
      tokensUsed: quota.tokenCount,
      tokensRemaining: Math.max(0, this.config.maxTokensPerHour - quota.tokenCount),
      concurrentRequests: quota.concurrentRequests,
      hourResetAt: resetTime,
    };
  }

  /**
   * Reset user quota (admin function)
   */
  resetUserQuota(userId: string): void {
    userQuotas.delete(userId);
    userModelPreference.delete(userId);
    console.log(`✅ Reset quota for user ${userId}`);
  }

  /**
   * Get all active users (for monitoring)
   */
  getActiveUsers(): Array<{
    userId: string;
    requestsUsed: number;
    tokensUsed: number;
    concurrentRequests: number;
  }> {
    return Array.from(userQuotas.entries())
      .filter(([_, quota]) => Date.now() - quota.lastReset < HOUR)
      .map(([userId, quota]) => ({
        userId,
        requestsUsed: quota.requestCount,
        tokensUsed: quota.tokenCount,
        concurrentRequests: quota.concurrentRequests,
      }));
  }

  /**
   * Clear all quotas (use sparingly)
   */
  clearAllQuotas(): void {
    userQuotas.clear();
    userModelPreference.clear();
    console.log("🗑️ All quotas cleared");
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
