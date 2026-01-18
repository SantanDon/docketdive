"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Square, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="sticky bottom-0 z-40 pb-8 pt-4">
      {/* Subtle fade shadow for main content scroll underneath */}
      <div className="absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <div className="px-4 max-w-4xl mx-auto">
        <div className="relative group">
           {/* Student Mode / Model Indicator - Subtly positioned above */}
           <div className="absolute -top-7 left-4 flex items-center gap-3">
              {mode === "student" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide uppercase">
                  {eliLevel} Mode
                </span>
              )}
           </div>

          {/* Centered Pill Input Container */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "relative flex flex-col gap-2 p-1.5 bg-card border rounded-2xl shadow-lg transition-all duration-300",
              isFocused ? "border-foreground/20 ring-4 ring-foreground/5" : "border-border shadow-md"
            )}
          >
            {/* Textarea Area */}
            <div className="px-3 pt-2">
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
                  "w-full resize-none bg-transparent",
                  "text-[15px] leading-relaxed",
                  "placeholder:text-muted-foreground/40",
                  "focus:outline-none",
                  "disabled:opacity-50",
                  "min-h-[44px] max-h-[160px]"
                )}
                aria-label="Legal prompt input"
              />
            </div>

            {/* Bottom Action Bar within the pill */}
            <div className="flex items-center justify-between px-2 pb-1.5 pt-1 border-t border-border/10">
              <div className="flex items-center gap-1">
                {onUpload && (
                   <Button
                    variant="ghost"
                    size="icon"
                    onClick={onUpload}
                    className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest hover:text-foreground"
                >
                  Prompts
                </Button>
              </div>

              <div className="flex items-center gap-2">
                 {isLoading ? (
                  <Button
                    size="icon"
                    onClick={stopGeneration}
                    className="h-8 w-8 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105"
                  >
                    <Square className="h-3 w-3 fill-current" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!inputMessage.trim()}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      inputMessage.trim() 
                        ? "bg-foreground text-background hover:scale-105 active:scale-95" 
                        : "bg-muted text-muted-foreground/30 opacity-50"
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Pro Legal Footer Text */}
          <div className="mt-3 flex items-center justify-center gap-4">
             <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-[0.1em] flex items-center gap-1.5">
                <Sparkles className="h-2.5 w-2.5" />
                DOCKETDIVE PRO
             </span>
             <span className="h-2.5 w-px bg-border/40" />
             <span className="text-[10px] text-muted-foreground/30 font-medium">
                AI can make mistakes. Verify legal details.
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
