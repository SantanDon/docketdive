export interface MessageSource {
  title: string;
  citation?: string;
  category?: string;
  relevance?: string;
  url?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  status: "sending" | "sent";
  sources?: MessageSource[];
  metadata?: {
    responseTime?: number;
    memoryUsage?: {
      historySize: number;
      relevantMemories: number;
    };
    localSources?: number;
    internetSources?: number;
    mode?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  summary?: string;
}

export interface ConversationMemory {
  id: string;
  conversationId: string;
  userId: string;
  messageId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  $vector?: number[];
  summary?: string;
  metadata?: {
    hasContext?: boolean;
    sourcesUsed?: number;
    mode?: string;
  };
}

export interface MemoryContext {
  recentMessages: Message[];
  relevantHistory: ConversationMemory[];
  conversationSummary?: string;
}

export type ELILevel = "ELI5" | "ELI15" | "ELI25";
export type Mode = "normal" | "student";
