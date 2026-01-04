"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader2,
  X,
  FileText,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DocumentChatProps {
  documentContent: string;
  documentName?: string | undefined;
  onClose?: () => void;
  className?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

// ============================================
// Message Bubble Component
// ============================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  
  return (
    <motion.div
      variants={messageVariants}
      layout
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={cn(
        "px-4 py-3 rounded-2xl text-sm",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "glass-card rounded-tl-sm"
      )}>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={cn(
          "text-[10px] mt-1.5",
          isUser ? "text-primary-foreground/60" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// Suggested Questions
// ============================================

const suggestedQuestions = [
  "What are the main points of this document?",
  "Are there any risks I should be aware of?",
  "What are my obligations under this document?",
  "Explain the key terms in simple language",
  "What deadlines are mentioned?",
];

// ============================================
// Main Component
// ============================================

export default function DocumentChat({
  documentContent,
  documentName,
  onClose,
  className,
}: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    setShowSuggestions(false);
    setError(null);
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/document-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          documentContent,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get response");
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card overflow-hidden flex flex-col h-[500px]", className)}
    >
      {/* Header */}
      <div className="relative p-4 border-b border-border overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
            >
              <MessageSquare size={20} className="text-white" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Document Chat
                <Sparkles size={14} className="text-primary" />
              </h3>
              {documentName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText size={10} />
                  {documentName}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showSuggestions && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4"
              >
                <MessageSquare size={28} className="text-primary" />
              </motion.div>
              <h4 className="font-medium text-foreground mb-1">Ask about your document</h4>
              <p className="text-sm text-muted-foreground">
                Your conversation stays private and isn't stored
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-1">Suggested questions:</p>
              {suggestedQuestions.map((question, idx) => (
                <motion.button
                  key={idx}
                  variants={messageVariants}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => sendMessage(question)}
                  className="w-full text-left px-4 py-3 rounded-xl glass-card hover:border-primary/30 transition-colors text-sm text-foreground"
                >
                  {question}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mr-auto max-w-[85%]"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm glass-card">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing document...</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-destructive/10 text-destructive rounded-xl flex items-center gap-2 text-sm border border-destructive/20"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the document..."
              rows={1}
              disabled={loading}
              className={cn(
                "w-full px-4 py-3 pr-12 rounded-xl resize-none",
                "bg-muted/50 border border-border",
                "text-foreground placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                "transition-all duration-200 text-sm",
                "max-h-[120px]"
              )}
            />
            <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">Enter</kbd>
            </div>
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-lg p-0"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          🔒 Private chat - not stored or shared
        </p>
      </div>
    </motion.div>
  );
}
