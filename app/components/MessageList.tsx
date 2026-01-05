"use client";

import { Bot, Loader2 } from "lucide-react";
import type { Message, Mode } from "../types";
import ChatBubble, { MessageSkeleton } from "@/components/ChatBubble";
import { useChat } from "../context/ChatContext";
import { motion } from "framer-motion";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  mode: Mode;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Minimal Message List Component
 * - Clean, centered layout
 * - Smooth scroll behavior
 * - Responsive design
 */
export default function MessageList({ 
  messages, 
  isLoading, 
  mode, 
  messagesEndRef 
}: MessageListProps) {
  const { streamingStatus } = useChat();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto scroll-smooth" 
      role="log" 
      aria-live="polite" 
      aria-label="Chat messages"
    >
      {/* Centered container with max-width */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {messages.map((message) => {
          // Skip empty assistant messages during loading
          if (message.role === "assistant" && !message.content && isLoading) {
            return null;
          }
          
          return (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : undefined}
              sources={message.sources}
            />
          );
        })}

        {/* Loading State */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            {/* Bot Avatar */}
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>

            {/* Loading Content */}
            <div className="flex-1 max-w-[70%]">
              <div className="px-6 py-4 bg-card rounded-2xl rounded-bl-md border border-border shadow-sm">
                {streamingStatus ? (
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-4 w-4 text-primary" />
                    </motion.div>
                    <span className="text-sm font-medium text-muted-foreground">{streamingStatus}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4"
                      >
                        <Loader2 className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span className="text-xs font-medium text-muted-foreground">Analyzing legal sources...</span>
                    </div>
                    <MessageSkeleton />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-px" aria-hidden="true" />
      </div>
    </motion.div>
  );
}
