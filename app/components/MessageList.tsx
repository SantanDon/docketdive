"use client";

import { Bot, Loader2 } from "lucide-react";
import type { Message, Mode } from "../types";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  mode: Mode;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Modern Message List - Clean and Professional
 * - Uses new MessageBubble component for each message
 * - Elegant loading indicator
 * - Smooth animations
 */
export default function MessageList({ messages, isLoading, mode, messagesEndRef }: MessageListProps) {
  return (
    <div 
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4" 
      role="log" 
      aria-live="polite" 
      aria-label="Chat messages"
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} mode={mode} />
        ))}

        {isLoading && (
          <div className="flex gap-4 mb-6 animate-in">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing legal sources...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    </div>
  );
}
