import type { Message } from "@/app/types";
import { Bot, User, BookOpen, ExternalLink, ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isStudentMode?: boolean;
  eliLevel?: string;
}

export default function MessageBubble({
  message,
  isStudentMode = false,
  eliLevel
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(null);

  const handleFeedback = (type: 'helpful' | 'unhelpful') => {
    if (feedback === type) {
      setFeedback(null); // Toggle off
    } else {
      setFeedback(type);
      // Here you would typically send this to your backend
      console.log(`User marked message as ${type}`);
    }
  };

  return (
    <div className={cn(
      "mb-6 flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm mt-1",
          isUser
            ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            : "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md"
        )}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : isStudentMode ? (
            <GraduationCap className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className={cn(
            "flex items-center mb-1 px-1",
            isUser ? "justify-end" : "justify-start"
          )}>
            <span className="text-xs font-medium text-muted-foreground">
              {isUser ? "You" : "Legal Assistant"}
            </span>
            <span className="text-[10px] text-muted-foreground/60 ml-2">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className={cn(
            "rounded-2xl p-4 shadow-sm relative group",
            isUser
              ? "bg-legal-blue-600 text-white rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}>
            {isStudentMode && !isUser && (
              <Badge variant="secondary" className="mb-3 bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800">
                <GraduationCap className="h-3 w-3 mr-1" />
                Student Mode: {eliLevel}
              </Badge>
            )}

            <div className={cn(
              "prose prose-sm dark:prose-invert max-w-none break-words text-sm md:text-base leading-relaxed",
              isUser ? "prose-invert" : "prose-gray dark:prose-invert"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                  a: ({ node, ...props }) => <a className="text-legal-blue-500 hover:underline font-medium" {...props} target="_blank" rel="noopener noreferrer" />,
                  code: ({ node, ...props }) => <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-legal-blue-300 pl-4 italic my-3 text-muted-foreground" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {!isUser && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm rounded-md"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </div>

          {!isUser && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-2 text-xs gap-1",
                  feedback === 'helpful' 
                    ? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleFeedback('helpful')}
              >
                <ThumbsUp className={cn("h-3 w-3", feedback === 'helpful' && "fill-current")} />
                Helpful
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-2 text-xs gap-1",
                  feedback === 'unhelpful' 
                    ? "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleFeedback('unhelpful')}
              >
                <ThumbsDown className={cn("h-3 w-3", feedback === 'unhelpful' && "fill-current")} />
              </Button>

              {message.sources && message.sources.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 ml-auto border-legal-blue-200 text-legal-blue-700 hover:bg-legal-blue-50 dark:border-legal-blue-800 dark:text-legal-blue-300 dark:hover:bg-legal-blue-900/30"
                  onClick={() => setShowSources(!showSources)}
                >
                  <BookOpen className="h-3 w-3" />
                  {message.sources.length} Sources
                  {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              )}
            </div>
          )}

          {showSources && message.sources && (
            <div className="mt-3 border rounded-xl overflow-hidden bg-card animate-in slide-in-from-top-2 duration-200">
              <div className="bg-muted/50 px-4 py-2 border-b text-xs font-medium text-muted-foreground flex items-center">
                <BookOpen className="h-3 w-3 mr-2" />
                Cited Sources
              </div>
              <div className="divide-y">
                {message.sources.map((source, i) => (
                  <div key={i} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="font-medium text-sm text-foreground mb-1">{source.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                      {source.category && (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium">
                          {source.category}
                        </span>
                      )}
                      {source.relevance && (
                        <span className="text-green-600 dark:text-green-400 flex items-center">
                          {source.relevance}% match
                        </span>
                      )}
                    </div>
                    {source.citation && (
                      <div className="text-xs text-muted-foreground mb-2 italic">
                        "{source.citation}"
                      </div>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-legal-blue-600 dark:text-legal-blue-400 hover:underline text-xs inline-flex items-center font-medium"
                      >
                        View Document
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}