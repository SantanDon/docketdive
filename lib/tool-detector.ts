/**
 * Tool Detection and Invocation System
 * Detects when users want to use legal tools from chat messages
 */

export type ToolId = 
  | "contract-analysis"
  | "simplify"
  | "drafting"
  | "audit"
  | "popia"
  | "compare";

export interface ToolInvocation {
  toolId: ToolId;
  confidence: number;
  parameters?: Record<string, any>;
  message: string;
}

export interface ToolDefinition {
  id: ToolId;
  name: string;
  aliases: string[];
  description: string;
  keywords: string[];
  requiresDocument?: boolean;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: "contract-analysis",
    name: "Contract Analyzer",
    aliases: ["contract analyzer", "analyze contract", "contract analysis", "perspective analyzer"],
    description: "Analyze contracts from different party perspectives",
    keywords: ["contract", "agreement", "analyze", "perspective", "risk", "party a", "party b", "review", "break down", "understand", "deal"],
    requiresDocument: true,
  },
  {
    id: "simplify",
    name: "Document Simplifier",
    aliases: ["simplify", "simplifier", "simplify document", "plain language", "jargon"],
    description: "Convert legal jargon to plain language",
    keywords: ["simplify", "plain language", "jargon", "explain", "simpler", "easier", "simple terms", "dumb down", "translate", "meaning", "understand"],
    requiresDocument: true,
  },
  {
    id: "drafting",
    name: "Drafting Assistant",
    aliases: ["draft", "drafting", "create document", "generate", "write contract"],
    description: "Generate legal documents with AI",
    keywords: ["draft", "create", "generate", "write", "make", "contract", "document", "agreement", "lease", "letter of intent", "nda"],
    requiresDocument: false,
  },
  {
    id: "audit",
    name: "Clause Auditor",
    aliases: ["audit", "clause auditor", "check clauses", "missing clauses", "audit contract"],
    description: "Check contracts for missing or risky clauses",
    keywords: ["audit", "clause", "missing", "check", "review", "clauses", "gaps", "provisions", "anything", "problems", "risks"],
    requiresDocument: true,
  },
  {
    id: "popia",
    name: "POPIA Checker",
    aliases: ["popia", "popia checker", "data protection", "privacy", "compliance"],
    description: "Check POPIA compliance",
    keywords: ["popia", "data protection", "privacy", "compliance", "gdpr"],
    requiresDocument: true,
  },
  {
    id: "compare",
    name: "Document Compare",
    aliases: ["compare", "compare documents", "diff", "difference", "version"],
    description: "Compare two document versions",
    keywords: ["compare", "diff", "difference", "version", "changes", "changed", "new", "different"],
    requiresDocument: true,
  },
];

/**
 * Detect if a message contains a tool invocation
 */
export function detectToolInvocation(message: string): ToolInvocation | null {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for explicit tool mentions with higher priority
  for (const tool of TOOLS) {
    // Check aliases (exact matches get highest confidence)
    for (const alias of tool.aliases) {
      // Check for exact phrase match (higher confidence)
      const exactMatch = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (exactMatch.test(message)) {
        const params = extractToolParameters(tool.id, message);
        return {
          toolId: tool.id,
          confidence: 0.95,
          parameters: params,
          message,
        };
      }
      
      // Check for partial match (lower confidence)
      if (lowerMessage.includes(alias)) {
        const params = extractToolParameters(tool.id, message);
        return {
          toolId: tool.id,
          confidence: 0.85,
          parameters: params,
          message,
        };
      }
    }
  }
  
  // Check keywords (lower confidence, requires multiple matches or single strong match)
  for (const tool of TOOLS) {
    const keywordMatches = tool.keywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length;
    
    // For "simplify" tool, be more lenient (single keyword match is enough)
    const minMatches = tool.id === "simplify" ? 1 : 2;
    
    if (keywordMatches >= minMatches) {
      const params = extractToolParameters(tool.id, message);
      return {
        toolId: tool.id,
        confidence: Math.min(0.6 + (keywordMatches * 0.1), 0.8),
        parameters: params,
        message,
      };
    }
  }
  
  return null;
}

/**
 * Extract parameters from message for tool invocation
 */
export function extractToolParameters(
  toolId: ToolId,
  message: string
): Record<string, any> {
  const params: Record<string, any> = {};
  const lowerMessage = message.toLowerCase();
  
  switch (toolId) {
    case "contract-analysis":
      // Detect perspective
      if (lowerMessage.includes("party a") || lowerMessage.includes("employer") || lowerMessage.includes("seller")) {
        params.perspective = "party_a";
      } else if (lowerMessage.includes("party b") || lowerMessage.includes("employee") || lowerMessage.includes("buyer")) {
        params.perspective = "party_b";
      } else {
        params.perspective = "neutral";
      }
      break;
      
    case "simplify":
      // Detect reading level
      if (lowerMessage.includes("grade") || lowerMessage.includes("level")) {
        const gradeMatch = message.match(/grade\s*(\d+)|level\s*(\d+)/i);
        if (gradeMatch) {
          params.targetReadingLevel = parseInt(gradeMatch[1] || gradeMatch[2] || "8");
        }
      }
      break;
      
    case "drafting":
      // Detect document type
      const docTypes = ["contract", "letter", "pleading", "motion", "opinion"];
      for (const type of docTypes) {
        if (lowerMessage.includes(type)) {
          params.documentType = type;
          break;
        }
      }
      break;
  }
  
  return params;
}

/**
 * Check if message contains document content or reference
 */
export function hasDocumentContent(message: string): boolean {
  // Check for long text (likely document content)
  if (message.length > 500) return true;
  
  // Check for document indicators
  const docIndicators = [
    "here is the",
    "here's the",
    "document:",
    "contract:",
    "agreement:",
    "below is",
    "attached",
    "see below",
  ];
  
  return docIndicators.some(indicator => 
    message.toLowerCase().includes(indicator)
  );
}

