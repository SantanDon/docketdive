"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Premium ChatBubble Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Clean, minimal message bubbles
 * - User messages on right with colored background
 * - Assistant messages on left with white/dark background
 * - Hover actions: copy, thumbs up/down, regenerate
 * - Smooth fade-in animation
 * - Avatar icons for both user and assistant
 * 
 * Claude:
 * - Similar layout to ChatGPT
 * - Slightly more rounded corners
 * - Subtle shadows on messages
 * - Copy button appears on hover
 * - Timestamp below messages
 * 
 * DocketDive Premium ChatBubble:
 * - Combines best of both with legal-focused design
 * - Gradient avatar for assistant (brand identity)
 * - Slide-up + fade-in animation for new messages
 * - Enhanced skeleton loading with shimmer effect
 * - Copy confirmation with checkmark animation
 * - Source citations with relevance indicators
 * - Feedback buttons (thumbs up/down) for assistant messages
 */

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string | undefined;
  isLoading?: boolean | undefined;
  sources?: Array<{ title: string; relevance?: number | string }> | undefined;
  onFeedback?: (type: "positive" | "negative") => void;
  onRegenerate?: () => void;
  messageId?: string;
}

export default function ChatBubble({ 
  role, 
  content, 
  timestamp,
  isLoading = false,
  sources,
  onFeedback,
  onRegenerate,
  messageId: _messageId // Reserved for future use (analytics, persistence)
}: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);
  const isUser = role === "user";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [content]);

  const handleFeedback = useCallback((type: "positive" | "negative") => {
    setFeedback(type);
    onFeedback?.(type);
  }, [onFeedback]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1] // Custom easing for smooth feel
      }}
      className={cn(
        "flex gap-3 w-full group/message",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant Avatar - Premium gradient */}
      {!isUser && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-md ring-2 ring-background"
        >
          <span className="text-primary-foreground font-bold text-sm">D</span>
        </motion.div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "relative",
          isUser ? "order-first max-w-[85%] md:max-w-[75%] lg:max-w-[70%]" : "w-full min-w-0"
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            "relative overflow-hidden",
            isUser
              ? [
                  "px-4 py-3 text-[15px] leading-relaxed",
                  "bg-gradient-to-br from-primary to-primary/90",
                  "text-primary-foreground",
                  "rounded-2xl rounded-br-md",
                  "shadow-md",
                  "max-w-[85%] md:max-w-[75%]" // User bubble constraint
                ].join(" ")
              : [
                  "px-0 py-2 text-base leading-relaxed", // No padding, larger text
                  "bg-transparent", // Transparent
                  "text-foreground", 
                  "w-full", // Full width
                ].join(" ")
          )}
        >
          {isLoading ? (
            <MessageSkeleton />
          ) : (
            <div className={cn(
              "w-full", // Ensure full width for prose container
              !isUser && "formatted-response"
            )}>
              {isUser ? (
                <div className="whitespace-pre-wrap break-words">{content}</div>
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-border/50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Assistant only */}
        {!isUser && !isLoading && content && (
          <motion.div 
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "flex items-center gap-1 mt-2",
              "opacity-0 group-hover/message:opacity-100 transition-opacity duration-200"
            )}
          >
            {/* Copy Button */}
            <ActionButton
              onClick={handleCopy}
              active={copied}
              activeIcon={<Check className="h-3.5 w-3.5 text-green-500" />}
              icon={<Copy className="h-3.5 w-3.5" />}
              label={copied ? "Copied!" : "Copy"}
            />

            {/* Feedback Buttons */}
            {onFeedback && (
              <>
                <ActionButton
                  onClick={() => handleFeedback("positive")}
                  active={feedback === "positive"}
                  activeIcon={<ThumbsUp className="h-3.5 w-3.5 fill-current text-green-500" />}
                  icon={<ThumbsUp className="h-3.5 w-3.5" />}
                  label="Good response"
                />
                <ActionButton
                  onClick={() => handleFeedback("negative")}
                  active={feedback === "negative"}
                  activeIcon={<ThumbsDown className="h-3.5 w-3.5 fill-current text-red-500" />}
                  icon={<ThumbsDown className="h-3.5 w-3.5" />}
                  label="Bad response"
                />
              </>
            )}

            {/* Regenerate Button */}
            {onRegenerate && (
              <ActionButton
                onClick={onRegenerate}
                icon={<RotateCcw className="h-3.5 w-3.5" />}
                label="Regenerate"
              />
            )}
          </motion.div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <p className={cn(
            "text-[10px] text-muted-foreground mt-1.5 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {timestamp}
          </p>
        )}

        {/* Sources - Assistant only */}
        <AnimatePresence>
          {!isUser && sources && sources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-wrap gap-1.5"
            >
              {sources.slice(0, 3).map((source, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]",
                    "bg-primary/10 text-primary border border-primary/20",
                    "hover:bg-primary/15 transition-colors cursor-pointer"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {source.title.length > 25 
                    ? source.title.substring(0, 25) + "..." 
                    : source.title}
                </motion.span>
              ))}
              {sources.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 text-[11px] text-muted-foreground">
                  +{sources.length - 3} more
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Avatar */}
      {isUser && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-background"
        >
          <User className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Action Button Component for message actions
 */
interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  active?: boolean;
  label: string;
}

function ActionButton({ onClick, icon, activeIcon, active, label }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-all duration-150",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-muted-foreground hover:text-foreground",
        active && "text-foreground"
      )}
      aria-label={label}
      title={label}
    >
      {active && activeIcon ? activeIcon : icon}
    </button>
  );
}

/**
 * Premium Message Skeleton with shimmer effect
 */
function MessageSkeleton() {
  return (
    <div className="space-y-3 min-w-[200px]">
      <div className="flex items-center gap-2">
        <div className="h-4 bg-muted-foreground/10 rounded-md w-3/4 animate-pulse" />
      </div>
      <div className="h-4 bg-muted-foreground/10 rounded-md w-full animate-pulse" />
      <div className="h-4 bg-muted-foreground/10 rounded-md w-5/6 animate-pulse" />
      <div className="h-4 bg-muted-foreground/10 rounded-md w-4/5 animate-pulse" />
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export { MessageSkeleton };
