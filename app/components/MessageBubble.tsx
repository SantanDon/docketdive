"use client";

import { User, Bot, GraduationCap, BookOpen, ExternalLink, ChevronDown, ChevronUp, Info } from "lucide-react";
import type { Message, Mode } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  mode: Mode;
}

/**
 * Professional Message Bubble Component
 * - Claude.com inspired design
 * - Proper legal formatting with headings and paragraphs
 * - Professional typography using IBM Plex Serif
 * - Clean source citations
 */
export default function MessageBubble({ message, mode }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Remove duplicate sources based on title
  const uniqueSources = message.sources?.filter((source, index, self) =>
    index === self.findIndex((s) => s.title === source.title)
  ) || [];

  return (
    <div className={`flex gap-4 mb-6 animate-in ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser 
          ? "bg-blue-600 text-white" 
          : "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
      }`}>
        {isUser ? (
          <User size={16} />
        ) : mode === "student" ? (
          <GraduationCap size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        <div className={`${
          isUser 
            ? "bg-blue-600 text-white rounded-2xl px-5 py-3 inline-block" 
            : "space-y-4"
        }`}>
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="legal-response bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="legal-content prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-p:leading-relaxed prose-p:text-gray-800 dark:prose-p:text-gray-200">
                <FormattedLegalResponse content={message.content} />
              </div>

              {/* Sources Section - Collapsible */}
              {uniqueSources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center justify-between w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Legal Sources ({uniqueSources.length})
                      </span>
                    </div>
                    {showSources ? (
                      <ChevronUp size={16} className="text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    )}
                  </button>

                  {showSources && (
                    <div className="grid gap-3 mt-3 animate-in slide-in-from-top-2 duration-200">
                      {uniqueSources.map((source, index) => (
                        <div 
                          key={index}
                          className="group p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                {source.title}
                              </h4>
                              {source.citation && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  {source.citation}
                                </p>
                              )}
                              {source.category && (
                                <span className="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                                  {source.category}
                                </span>
                              )}
                            </div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                                title="View source"
                              >
                                <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Debug Info - Collapsible */}
              {message.metadata && (
                <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <Info size={12} />
                    <span>Debug Info</span>
                    {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  
                  {showDebug && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs font-mono text-gray-500 dark:text-gray-400 space-y-1 border border-gray-100 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-gray-400">Mode:</span>
                        <span>{message.metadata.mode || "Standard"}</span>
                        
                        <span className="text-gray-400">Latency:</span>
                        <span>{message.metadata.responseTime ? `${message.metadata.responseTime}ms` : "N/A"}</span>
                        
                        <span className="text-gray-400">Local Docs:</span>
                        <span>{message.metadata.localSources || 0}</span>
                        
                        <span className="text-gray-400">Web Results:</span>
                        <span>{message.metadata.internetSources || 0}</span>
                        
                        {message.metadata.memoryUsage && (
                          <>
                            <span className="text-gray-400">Memory:</span>
                            <span>{message.metadata.memoryUsage.relevantMemories}/{message.metadata.memoryUsage.historySize} items</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formats legal responses with proper structure
 * - Detects and formats headings
 * - Handles numbered lists and paragraphs
 * - Maintains professional legal formatting
 */
function FormattedLegalResponse({ content }: { content: string }) {
  // Enhanced markdown rendering with legal formatting
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-serif font-semibold mt-6 mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-serif font-semibold mt-5 mb-3 text-gray-900 dark:text-gray-100">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-serif font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-800 dark:text-gray-200">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-800 dark:text-gray-200">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-[15px] leading-relaxed pl-1">
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-800 dark:text-gray-200">
            {children}
          </em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-950/30 rounded-r text-gray-800 dark:text-gray-200 italic">
            {children}
          </blockquote>
        ),
        code: ({ inline, children }: any) => 
          inline ? (
            <code className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-sm font-mono text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {children}
            </code>
          ) : (
            <code className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-950/50 text-sm font-mono overflow-x-auto text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800">
              {children}
            </code>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
