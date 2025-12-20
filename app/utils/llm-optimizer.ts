/**
 * LLM Optimizer for DocketDive
 * Optimizes LLM parameters for faster response generation
 */

import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";

export interface LLMConfig {
  model: string;
  provider: 'ollama' | 'groq';
  temperature: number;           // Lower = more focused, faster responses
  maxTokens: number;            // Limit response length for speed
  topP: number;                 // Nucleus sampling
  topK: number;                 // Top-K sampling
  repeatPenalty: number;        // Penalty for repeated tokens
  numCtx: number;               // Context window size
  numPredict: number;           // Maximum tokens to predict
  stop: string[];               // Stop sequences
  enableMirostat: boolean;      // Mirostat sampling
  mirostatTau: number;          // Mirostat target entropy
  mirostatEta: number;          // Mirostat learning rate
}

export interface ResponseOptimizationConfig {
  maxResponseLength: number;     // Maximum length of response
  minNewTokens: number;         // Minimum new tokens to generate
  earlyStopThreshold: number;   // Threshold for early stopping
  responseQualityBoost: boolean; // Whether to prioritize quality over speed
}

export class LLMOptimizer {
  private defaultConfig: LLMConfig;
  private responseConfig: ResponseOptimizationConfig;
  private modelCache: Map<string, any> = new Map();

  constructor(
    config?: Partial<LLMConfig>,
    responseConfig?: Partial<ResponseOptimizationConfig>
  ) {
    this.defaultConfig = {
      model: config?.model || "granite3.3:2b",
      provider: config?.provider || 'ollama',
      temperature: config?.temperature ?? 0.1, // Lower for more focused responses
      maxTokens: config?.maxTokens ?? 1024,
      topP: config?.topP ?? 0.9, // Slightly lower for more focused sampling
      topK: config?.topK ?? 40,  // Lower for faster processing
      repeatPenalty: config?.repeatPenalty ?? 1.1, // Standard penalty
      numCtx: config?.numCtx ?? 4096, // Reduced context for faster processing
      numPredict: config?.numPredict ?? 512, // Limited prediction length
      stop: config?.stop || ["\n\nQuestion:", "\n\nUser:", "\n\nSystem:"],
      enableMirostat: config?.enableMirostat ?? false,
      mirostatTau: config?.mirostatTau ?? 5.0,
      mirostatEta: config?.mirostatEta ?? 0.1,
    };

    this.responseConfig = {
      maxResponseLength: responseConfig?.maxResponseLength ?? 1500,
      minNewTokens: responseConfig?.minNewTokens ?? 50,
      earlyStopThreshold: responseConfig?.earlyStopThreshold ?? 0.8,
      responseQualityBoost: responseConfig?.responseQualityBoost ?? false,
    };
  }

  /**
   * Creates an optimized LLM instance based on configuration
   */
  createOptimizedLLM(customConfig?: Partial<LLMConfig>): any {
    const config = { ...this.defaultConfig, ...customConfig };
    const cacheKey = this.generateCacheKey(config);

    // Check if we have a cached instance
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    let llm: any;

    if (config.provider === 'ollama') {
      const ollamaParams: any = {
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: config.model,
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        repeatPenalty: config.repeatPenalty,
        numCtx: config.numCtx,
        numPredict: config.numPredict,
      };

      // Add mirostat parameters if enabled
      if (config.enableMirostat) {
        ollamaParams.mirostat = 2;
        ollamaParams.mirostatTau = config.mirostatTau;
        ollamaParams.mirostatEta = config.mirostatEta;
      }

      llm = new ChatOllama(ollamaParams);
    } else if (config.provider === 'groq' && process.env.GROQ_API_KEY) {
      llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        // Groq doesn't support all the same parameters as Ollama
      });
    } else {
      throw new Error(`Unsupported provider: ${config.provider} or missing API key`);
    }

    // Cache the instance
    this.modelCache.set(cacheKey, llm);
    return llm;
  }

  /**
   * Generates a cache key for the LLM configuration
   */
  private generateCacheKey(config: LLMConfig): string {
    return `${config.provider}_${config.model}_${config.temperature}_${config.topP}_${config.topK}`;
  }

  /**
   * Optimizes parameters based on query complexity
   */
  getOptimizedConfigForQuery(query: string, isComplexQuery: boolean = false): LLMConfig {
    const baseConfig = { ...this.defaultConfig };

    if (isComplexQuery) {
      // For complex queries, slightly increase temperature for more nuanced responses
      // but keep other parameters optimized for speed
      return {
        ...baseConfig,
        temperature: this.responseConfig.responseQualityBoost ? 0.2 : 0.15,
        numPredict: Math.min(baseConfig.numPredict * 1.5, 1024), // Allow more tokens for complex responses
        maxTokens: Math.min(baseConfig.maxTokens * 1.5, 2048),
      };
    } else {
      // For simple queries, optimize heavily for speed
      return {
        ...baseConfig,
        temperature: 0.05, // Even lower for simple, factual responses
        topK: 20, // Even more focused sampling
        numPredict: Math.max(baseConfig.numPredict / 2, 256), // Shorter responses
        maxTokens: Math.max(baseConfig.maxTokens / 2, 512),
      };
    }
  }

  /**
   * Processes a query with optimized parameters
   */
  async processQuery(
    query: string,
    context: string,
    hasContext: boolean,
    customConfig?: Partial<LLMConfig>
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Determine if this is a complex query
      const isComplex = this.isComplexQuery(query);
      const effectiveConfig = customConfig || this.getOptimizedConfigForQuery(query, isComplex);
      
      // Create the optimized LLM
      const llm = this.createOptimizedLLM(effectiveConfig);
      
      // Prepare the prompt
      const messages = this.prepareMessages(query, context, hasContext);
      
      // Invoke the LLM with timeout
      const response = await Promise.race([
        llm.invoke(messages),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("LLM generation timeout")), 45000) // 45s timeout
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      
      // Post-process the response for length and quality
      const processedResponse = this.postProcessResponse(
        typeof response.content === "string" ? response.content : "",
        responseTime
      );
      
      console.log(`LLM processed in ${responseTime}ms for query complexity: ${isComplex ? 'complex' : 'simple'}`);
      
      return processedResponse;
    } catch (error) {
      console.error("LLM processing error:", error);
      throw error;
    }
  }

  /**
   * Determines if a query is complex based on various heuristics
   */
  private isComplexQuery(query: string): boolean {
    // Count the number of legal terms or complex concepts
    const legalTerms = [
      'versus', 'v', 'constitutional court', 'bill of rights', 'unfair dismissal',
      'discrimination', 'evidence', 'procedure', 'due process', 'contract law',
      'property law', 'criminal law', 'civil procedure', 'customary law',
      'and or', 'whereas', 'provided that', 'notwithstanding', 'pursuant to',
      'in accordance with', 'with respect to', 'as well as', 'other than'
    ];

    const queryLower = query.toLowerCase();
    let complexityScore = 0;

    // Add points for question complexity
    complexityScore += (query.match(/\?/g) || []).length * 2; // More questions = more complex
    complexityScore += query.split(' ').length > 20 ? 1 : 0; // Long queries
    complexityScore += (query.match(/\b(and|or|but|while|whereas)\b/gi) || []).length; // Logical connectors

    // Add points for legal terms
    for (const term of legalTerms) {
      if (queryLower.includes(term)) {
        complexityScore += 1;
      }
    }

    return complexityScore >= 3;
  }

  /**
   * Prepares messages for the LLM with optimized structure
   */
  private prepareMessages(query: string, context: string, hasContext: boolean): Array<{ role: string; content: string }> {
    if (!hasContext) {
      // For queries without context, use a simpler prompt
      return [
        {
          role: "system",
          content: "You are a South African legal assistant. If you don't know the answer, say so directly without speculation."
        },
        {
          role: "user",
          content: query
        }
      ];
    }

    // For queries with context, optimize the prompt structure
    return [
      {
        role: "system",
        content: `You are a South African legal assistant. Answer based only on the provided context. Be concise but comprehensive. Max response length: ${this.responseConfig.maxResponseLength} characters.`
      },
      {
        role: "user",
        content: `Context: ${context}\n\nQuestion: ${query}`
      }
    ];
  }

  /**
   * Post-processes the response for quality and length
   */
  private postProcessResponse(response: string, responseTime: number): string {
    if (!response) return "I couldn't generate a response. Please try again.";

    // Truncate if too long
    if (response.length > this.responseConfig.maxResponseLength) {
      response = response.substring(0, this.responseConfig.maxResponseLength);
      
      // Try to end at a sentence boundary
      const lastSentenceEnd = Math.max(
        response.lastIndexOf('. '),
        response.lastIndexOf('? '),
        response.lastIndexOf('! ')
      );
      
      if (lastSentenceEnd > this.responseConfig.maxResponseLength * 0.8) {
        response = response.substring(0, lastSentenceEnd + 1);
      }
      
      response += "\n\n[Response truncated for performance]";
    }

    // Clean up any obvious repetition (common with some LLMs when rushed)
    response = this.removeRepetitiveContent(response);

    return response;
  }

  /**
   * Removes repetitive content from the response
   */
  private removeRepetitiveContent(response: string): string {
    // Split by sentences and remove obvious repetitions
    const sentences = response.split(/(?<=[.!?])\s+/);
    const uniqueSentences: string[] = [];
    const seenSentences = new Set<string>();

    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().trim();
      
      // Skip if we've seen this sentence before (with some tolerance for minor variations)
      let isDuplicate = false;
      for (const seen of seenSentences) {
        if (this.calculateTextSimilarity(normalized, seen) > 0.8) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        seenSentences.add(normalized);
        uniqueSentences.push(sentence);
      }
    }

    return uniqueSentences.join(' ');
  }

  /**
   * Calculates text similarity using a simple approach
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);
    
    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Gets a fast LLM configuration for simple queries
   */
  getFastConfig(): LLMConfig {
    return {
      ...this.defaultConfig,
      temperature: 0.05,  // Very focused
      topK: 10,          // Very focused sampling
      numPredict: 256,   // Short responses
      maxTokens: 512,    // Limited output
    };
  }

  /**
   * Gets a balanced LLM configuration
   */
  getBalancedConfig(): LLMConfig {
    return {
      ...this.defaultConfig,
      temperature: 0.15,  // Balanced focus/creativity
      topK: 30,          // Balanced sampling
      numPredict: 512,   // Medium responses
      maxTokens: 1024,   // Medium output
    };
  }

  /**
   * Gets a quality-focused configuration
   */
  getQualityConfig(): LLMConfig {
    return {
      ...this.defaultConfig,
      temperature: 0.2,   // More creative for nuanced answers
      topK: 50,          // More diverse sampling
      numPredict: 768,   // Longer responses
      maxTokens: 1536,   // More output
    };
  }

  /**
   * Updates the default configuration
   */
  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
  }

  /**
   * Updates the response optimization configuration
   */
  updateResponseConfig(newConfig: Partial<ResponseOptimizationConfig>): void {
    this.responseConfig = { ...this.responseConfig, ...newConfig };
  }

  /**
   * Clears the model cache
   */
  clearModelCache(): void {
    this.modelCache.clear();
  }
}

// Export a singleton instance with default configuration
export const llmOptimizer = new LLMOptimizer();