"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Mic, StopCircle, Sparkles, GraduationCap } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useChat } from "@/app/context/ChatContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InputAreaProps {
  onAttachClick?: () => void;
}

export default function InputArea({ onAttachClick }: InputAreaProps) {
  const {
    inputMessage,
    setInputMessage,
    sendMessage,
    isLoading,
    mode,
    eliLevel,
    toggleStudentMode,
    stopGeneration
  } = useChat();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
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

  return (
    <div className="border-t bg-background/80 backdrop-blur-md p-4 pb-6 sticky bottom-0 z-10">
      <div className="max-w-3xl mx-auto relative">
        {mode === "student" && (
          <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 shadow-sm animate-in slide-in-from-bottom-2">
              Student Mode Active ({eliLevel})
            </Badge>
          </div>
        )}

        <div className={cn(
          "relative flex items-end gap-2 bg-card border rounded-2xl shadow-sm transition-all duration-200",
          isFocused ? "ring-2 ring-legal-blue-500/20 border-legal-blue-500/50" : "border-border"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 mb-1.5 ml-1.5 text-muted-foreground hover:text-foreground rounded-xl"
            title="Attach file for analysis"
            onClick={onAttachClick}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={mode === "student" ? "Ask a legal question..." : "Ask a legal question or describe your case..."}
            className="min-h-[52px] max-h-[200px] py-3.5 px-2 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent flex-1 text-base"
            disabled={isLoading}
          />

          <div className="flex items-center gap-1 mb-1.5 mr-1.5">
            {isLoading ? (
              <Button
                size="icon"
                variant="destructive"
                className="h-10 w-10 rounded-xl animate-in zoom-in duration-200"
                onClick={stopGeneration}
                title="Stop generation"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-200",
                  inputMessage.trim()
                    ? "bg-linear-to-br from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                onClick={() => inputMessage.trim() && sendMessage()}
                disabled={!inputMessage.trim()}
              >
                <Send className="h-5 w-5 ml-0.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3 text-legal-blue-500" />
          <span>AI can make mistakes. Verify important legal information.</span>
        </div>

      </div>
    </div>
  );
}