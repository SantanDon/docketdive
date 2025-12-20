import type { Message } from "../../types";

const MAX_TOKENS_CONTEXT = 4000;
const AVG_CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_CHARS = MAX_TOKENS_CONTEXT * AVG_CHARS_PER_TOKEN;

export interface ContextWindow {
  conversationHistory: string;
  ragContext: string;
  memoryContext: string;
  totalChars: number;
  truncated: boolean;
}

export function manageContextWindow(
  conversationHistory: string,
  ragContext: string,
  memoryContext: string
): ContextWindow {
  const totalChars = conversationHistory.length + ragContext.length + memoryContext.length;

  if (totalChars <= MAX_CONTEXT_CHARS) {
    return {
      conversationHistory,
      ragContext,
      memoryContext,
      totalChars,
      truncated: false,
    };
  }

  const ragLimit = Math.floor(MAX_CONTEXT_CHARS * 0.5);
  const convLimit = Math.floor(MAX_CONTEXT_CHARS * 0.35);
  const memLimit = Math.floor(MAX_CONTEXT_CHARS * 0.15);

  const truncatedRag = truncateText(ragContext, ragLimit);
  const truncatedConv = truncateText(conversationHistory, convLimit);
  const truncatedMem = truncateText(memoryContext, memLimit);

  return {
    conversationHistory: truncatedConv,
    ragContext: truncatedRag,
    memoryContext: truncatedMem,
    totalChars: truncatedRag.length + truncatedConv.length + truncatedMem.length,
    truncated: true,
  };
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxChars * 0.8) {
    return truncated.substring(0, cutPoint + 1) + "\n[Context truncated for brevity...]";
  }

  return truncated + "\n[Context truncated for brevity...]";
}

export function extractKeyEntities(messages: Message[]): string[] {
  const entities = new Set<string>();
  const legalKeywords = /\b(Act|Section|Regulation|Case|Court|Constitution|Law|Statute|Amendment|Contract|Criminal|Civil|Legal|Rights|Obligations|Liability|Plaintiff|Defendant|Judgment|Appeal)\b/gi;
  
  messages.forEach(msg => {
    const matches = msg.content.match(legalKeywords);
    if (matches) {
      matches.forEach(m => entities.add(m.toLowerCase()));
    }
  });

  return Array.from(entities);
}

// New: Track referenced entities for better context handling
export interface EntityReference {
  type: string;
  mentions: string[];
  lastMentioned: number;
}

export function trackConversationEntities(messages: Message[]): Map<string, EntityReference> {
  const entityMap = new Map<string, EntityReference>();
  
  messages.forEach((msg, index) => {
    // Track numbered lists (first, second, third)
    const ordinalPattern = /\b(first|second|third|fourth|fifth)\s+(type|example|case|point|one|contract|law)\b/gi;
    const ordinalMatches = msg.content.matchAll(ordinalPattern);
    
    for (const match of ordinalMatches) {
      const key = `${match[1]}_${match[2]}`.toLowerCase();
      if (!entityMap.has(key)) {
        entityMap.set(key, { type: 'ordinal', mentions: [], lastMentioned: index });
      }
      const entity = entityMap.get(key)!;
      entity.mentions.push(msg.content.substring(Math.max(0, match.index! - 50), match.index! + 100));
      entity.lastMentioned = index;
    }
    
    // Track examples mentioned
    const examplePattern = /\b(example|instance|illustration)\b[^.!?]*?:\s*([^.!?]+)/gi;
    const exampleMatches = msg.content.matchAll(examplePattern);
    
    for (const match of exampleMatches) {
      const key = 'example_reference';
      if (!entityMap.has(key)) {
        entityMap.set(key, { type: 'example', mentions: [], lastMentioned: index });
      }
      const entity = entityMap.get(key)!;
      if (match[2]) {
        entity.mentions.push(match[2].trim());
      }
      entity.lastMentioned = index;
    }
    
    // Track specific legal terms and their context
    const legalTermPattern = /\b(void|voidable|valid|invalid|enforceable|breach|remedy|damages|specific performance)\b/gi;
    const legalMatches = msg.content.matchAll(legalTermPattern);
    
    for (const match of legalMatches) {
      const key = match[1].toLowerCase();
      if (!entityMap.has(key)) {
        entityMap.set(key, { type: 'legal_term', mentions: [], lastMentioned: index });
      }
      const entity = entityMap.get(key)!;
      entity.mentions.push(msg.content.substring(Math.max(0, match.index! - 30), match.index! + 80));
      entity.lastMentioned = index;
    }
  });
  
  return entityMap;
}