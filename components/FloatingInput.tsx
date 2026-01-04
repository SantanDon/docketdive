"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Square, Sparkles, Upload } from "lucide-react";
import { useChat } from "@/app/context/ChatContext";
import { cn } from "@/lib/utils";

interface FloatingInputProps {
  placeholder?: string;
  onUpload?: () => void;
}

export default function FloatingInput({ 
  placeholder = "Ask a legal question...",
  onUpload
}: FloatingInputProps) {
  const {
    inputMessage,
    setInputMessage,
    sendMessage,
    isLoading,
    stopGeneration,
    mode,
    eliLevel
  } = useChat();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea (max 4 lines)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const lineHeight = 24; // Approximate line height
      const maxHeight = lineHeight * 4; // 4 lines max
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isLoading) {
        sendMessage();
      }
    }
  };

  const handleSubmit = () => {
    if (inputMessage.trim() && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="sticky bottom-0 z-40 pb-safe-bottom">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <div className="bg-background/80 backdrop-blur-md border-t border-border/50 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {/* Student Mode Indicator */}
          {mode === "student" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Student Mode ({eliLevel})
              </span>
            </motion.div>
          )}

          {/* Input Container */}
          <motion.div
            animate={{
              boxShadow: isFocused 
                ? "0 0 0 2px hsl(var(--ring) / 0.2), var(--shadow-lg)" 
                : "var(--shadow-md)"
            }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative flex items-end gap-2",
              "bg-card rounded-2xl border",
              "transition-colors duration-fast",
              isFocused ? "border-ring/50" : "border-border"
            )}
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent",
                "px-4 py-3 text-base leading-6",
                "placeholder:text-muted-foreground/60",
                "focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[48px] max-h-[96px]" // 1-4 lines
              )}
              aria-label="Message input"
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-1 pr-2 pb-2">
              {/* Upload Button */}
              {onUpload && !isLoading && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onUpload}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-ring"
                  aria-label="Upload document"
                >
                  <Upload className="h-5 w-5" />
                </motion.button>
              )}

              {isLoading ? (
                <motion.button
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  onClick={stopGeneration}
                  className={cn(
                    "h-10 w-10 min-h-touch min-w-touch rounded-xl",
                    "flex items-center justify-center",
                    "bg-destructive text-destructive-foreground",
                    "hover:bg-destructive/90 transition-colors",
                    "focus-ring"
                  )}
                  aria-label="Stop generation"
                >
                  <Square className="h-4 w-4 fill-current" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!inputMessage.trim()}
                  className={cn(
                    "h-10 w-10 min-h-touch min-w-touch rounded-xl",
                    "flex items-center justify-center",
                    "transition-all duration-fast",
                    "focus-ring",
                    inputMessage.trim()
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>AI can make mistakes. Verify important legal information.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
