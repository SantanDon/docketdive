// types/index.ts

export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status: 'sending' | 'sent';
  sources?: any[];
};

export type Mode = 'normal' | 'student';
export type ELILevel = 'ELI5' | 'ELI15' | 'ELI25';

export type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
};

export type Source = {
  title: string;
  citation: string;
  category: string;
  relevance: string;
  url: string;
};