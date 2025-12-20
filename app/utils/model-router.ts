/**
 * Multi-Model Router for DocketDive
 * Routes queries to specialized models based on legal domain
 */

import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";

export interface ModelConfig {
  name: string;
  type: 'ollama' | 'groq';
  model: string;
  temperature?: number;
  maxTokens?: number;
  legalDomains: string[];
  priority: number; // Lower number = higher priority
}

export interface QueryClassification {
  domain: string;
  confidence: number;
  relevantModels: string[];
}

export interface ModelRouterConfig {
  defaultModel: string;
  enableDynamicRouting: boolean;
  routingThreshold: number; // Minimum confidence to use specialized model
  fallbackEnabled: boolean;
}

export class ModelRouter {
  private models: Map<string, any> = new Map();
  private config: ModelRouterConfig;
  private modelConfigs: ModelConfig[] = [];

  constructor(config?: Partial<ModelRouterConfig>) {
    this.config = {
      defaultModel: config?.defaultModel || "granite3.3:2b",
      enableDynamicRouting: config?.enableDynamicRouting ?? true,
      routingThreshold: config?.routingThreshold || 0.6,
      fallbackEnabled: config?.fallbackEnabled ?? true,
    };

    // Initialize default model configurations
    this.initializeDefaultModels();
  }

  /**
   * Initializes default model configurations
   */
  private initializeDefaultModels(): void {
    // Default Ollama model (fallback)
    this.modelConfigs.push({
      name: "default-ollama",
      type: "ollama",
      model: this.config.defaultModel,
      temperature: 0.1,
      legalDomains: ["general", "all"],
      priority: 10
    });

    // Specialized models for different legal domains
    this.modelConfigs.push({
      name: "contract-ollama",
      type: "ollama",
      model: "granite3.3:2b",
      temperature: 0.1,
      legalDomains: ["contract", "agreement", "offer", "acceptance", "consideration"],
      priority: 5
    });

    this.modelConfigs.push({
      name: "constitutional-ollama",
      type: "ollama",
      model: "granite3.3:2b",
      temperature: 0.1,
      legalDomains: ["constitutional", "bill of rights", "fundamental rights", "discrimination", "freedom"],
      priority: 5
    });

    this.modelConfigs.push({
      name: "criminal-ollama",
      type: "ollama",
      model: "granite3.3:2b",
      temperature: 0.1,
      legalDomains: ["criminal", "offense", "crime", "sentence", "conviction", "charges"],
      priority: 5
    });

    this.modelConfigs.push({
      name: "employment-ollama",
      type: "ollama",
      model: "granite3.3:2b",
      temperature: 0.1,
      legalDomains: ["employment", "dismissal", "unfair", "workplace", "labour", "strike"],
      priority: 5
    });

    // High-performance model for complex queries (if Groq is available)
    if (process.env.GROQ_API_KEY) {
      this.modelConfigs.push({
        name: "high-performance-groq",
        type: "groq",
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        legalDomains: ["complex", "multi-domain", "all"],
        priority: 1 // Highest priority for complex queries
      });
    }
  }

  /**
   * Initializes a model based on configuration
   */
  private initializeModel(modelConfig: ModelConfig): any {
    if (this.models.has(modelConfig.name)) {
      return this.models.get(modelConfig.name);
    }

    let model;
    const temperature = modelConfig.temperature || 0.1;

    if (modelConfig.type === "ollama") {
      model = new ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: modelConfig.model,
        temperature,
        topP: 0.95,
        topK: 40,
        repeatPenalty: 1.1,
        numCtx: 8192,
        numPredict: 2048,
      });
    } else if (modelConfig.type === "groq" && process.env.GROQ_API_KEY) {
      model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: modelConfig.model,
        temperature,
      });
    } else {
      // Fallback to default Ollama model
      model = new ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: this.config.defaultModel,
        temperature,
      });
    }

    this.models.set(modelConfig.name, model);
    return model;
  }

  /**
   * Classifies a query to determine the appropriate legal domain
   */
  classifyQuery(query: string): QueryClassification {
    const queryLower = query.toLowerCase();
    const domainScores: { [key: string]: number } = {};

    // Score each legal domain based on keyword matches
    for (const modelConfig of this.modelConfigs) {
      if (modelConfig.name === "default-ollama") continue; // Skip default model for classification

      let score = 0;
      for (const domain of modelConfig.legalDomains) {
        if (domain === "all") continue; // Skip generic domain

        const domainLower = domain.toLowerCase();
        if (queryLower.includes(domainLower)) {
          score += 1;
        }

        // Check for partial matches
        if (queryLower.includes(domainLower.substring(0, 3))) {
          score += 0.3;
        }
      }

      // Add domain to scores if it has a positive score
      if (score > 0 && modelConfig.legalDomains && modelConfig.legalDomains[0]) {
        domainScores[modelConfig.legalDomains[0]] = (domainScores[modelConfig.legalDomains[0]] || 0) + score;
      }
    }

    // Find the highest scoring domain
    let bestDomain = "general";
    let bestScore = 0;
    let totalScore = 0;

    for (const [domain, score] of Object.entries(domainScores)) {
      totalScore += score;
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }

    // Calculate confidence as a percentage of total keywords matched
    const confidence = totalScore > 0 ? bestScore / totalScore : 0;

    // Get relevant models for this domain
    const relevantModels = this.modelConfigs
      .filter(config => 
        config.legalDomains.includes(bestDomain) || 
        config.legalDomains.includes("all") ||
        config.legalDomains.includes("general")
      )
      .sort((a, b) => a.priority - b.priority)
      .map(config => config.name);

    return {
      domain: bestDomain,
      confidence,
      relevantModels
    };
  }

  /**
   * Routes a query to the appropriate model
   */
  routeQuery(query: string): { model: any; classification: QueryClassification } {
    if (!this.config.enableDynamicRouting) {
      return {
        model: this.initializeModel(this.modelConfigs.find(m => m.name === "default-ollama")!),
        classification: {
          domain: "general",
          confidence: 0,
          relevantModels: ["default-ollama"]
        }
      };
    }

    const classification = this.classifyQuery(query);
    
    // Select model based on classification and confidence
    let modelName: string;
    
    if (classification.confidence >= this.config.routingThreshold && classification.relevantModels.length > 0) {
      // Use the highest priority relevant model
      modelName = classification.relevantModels[0]!;
    } else {
      // Fall back to default model
      modelName = "default-ollama";
    }

    const modelConfig = this.modelConfigs.find(m => m.name === modelName) || 
                       this.modelConfigs.find(m => m.name === "default-ollama")!;
    
    const model = this.initializeModel(modelConfig);

    return { model, classification };
  }

  /**
   * Gets all available models
   */
  getAvailableModels(): ModelConfig[] {
    return this.modelConfigs;
  }

  /**
   * Updates model configurations
   */
  updateModels(models: ModelConfig[]): void {
    this.modelConfigs = models;
    this.models.clear(); // Clear existing models to reinitialize
  }

  /**
   * Gets routing statistics
   */
  getRoutingStats(): { totalRouted: number; byDomain: { [domain: string]: number } } {
    // In a real implementation, this would track actual routing decisions
    return {
      totalRouted: 0,
      byDomain: {}
    };
  }
}

// Export a singleton instance
export const modelRouter = new ModelRouter();