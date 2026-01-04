"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string | undefined;
  isLoading?: boolean | undefined;
  sources?: Array<{ title: string; relevance?: number | string }> | undefined;
}

export default function ChatBubble({ 
  role, 
  content, 
  timestamp,
  isLoading = false,
  sources
}: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-4 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "relative group max-w-[85%] md:max-w-[70%]",
          isUser ? "order-first" : ""
        )}
      >
        <div
          className={cn(
            isUser
              ? "px-4 py-3 text-[15px] leading-relaxed bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md"
              : "px-6 py-5 text-[15px] leading-relaxed bg-card text-foreground rounded-2xl rounded-bl-md border border-border shadow-sm"
          )}
        >
          {isLoading ? (
            <MessageSkeleton />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="chat-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Copy Button - Assistant only */}
        {!isUser && !isLoading && content && (
          <button
            onClick={handleCopy}
            className={cn(
              "absolute -bottom-2 right-2 p-1.5 rounded-md",
              "bg-background border border-border shadow-sm",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-muted focus-ring"
            )}
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Timestamp */}
        {timestamp && (
          <p className={cn(
            "text-[10px] text-muted-foreground mt-1",
            isUser ? "text-right" : "text-left"
          )}>
            {timestamp}
          </p>
        )}

        {/* Sources - Assistant only */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {sources.slice(0, 3).map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary"
              >
                {source.title.length > 20 
                  ? source.title.substring(0, 20) + "..." 
                  : source.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </motion.div>
    </>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted-foreground/15 rounded-md w-3/4" />
      <div className="h-4 bg-muted-foreground/15 rounded-md w-full" />
      <div className="h-4 bg-muted-foreground/15 rounded-md w-5/6" />
      <div className="h-4 bg-muted-foreground/15 rounded-md w-4/5" />
    </div>
  );
}

export { MessageSkeleton };
