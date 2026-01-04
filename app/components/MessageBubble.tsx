"use client";

import { User, Bot, GraduationCap, BookOpen, ExternalLink, ChevronDown, ChevronUp, Info, Scale, Lightbulb } from "lucide-react";
import type { Message, Mode } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Premium Message Bubble Component
 * - Sophisticated design with elegant visual hierarchy
 * - Professional legal document styling
 * - Smooth animations and micro-interactions
 */
export default function MessageBubble({ message, mode }: { message: Message; mode: Mode }) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Remove duplicate sources based on title
  const uniqueSources = message.sources?.filter((source, index, self) =>
    index === self.findIndex((s) => s.title === source.title)
  ) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-4 mb-6 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
          isUser 
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
            : "bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white"
        }`}>
        {isUser ? (
          <User size={18} />
        ) : mode === "student" ? (
          <GraduationCap size={18} />
        ) : (
          <Bot size={18} />
        )}
      </motion.div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        <div className={`${
          isUser 
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl px-5 py-3 inline-block shadow-lg shadow-blue-500/25" 
            : "space-y-4"
        }`}>
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="legal-response glass-card rounded-2xl p-6"
            >
              {/* Mode Indicator */}
              {mode === "student" && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Student Mode Explanation
                  </span>
                </div>
              )}

              <div className="legal-content prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-p:leading-relaxed prose-p:text-slate-800 dark:prose-p:text-slate-200">
                <FormattedLegalResponse content={message.content} />
              </div>

              {/* Sources Section - Collapsible */}
              {uniqueSources.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
                >
                  <motion.button
                    onClick={() => setShowSources(!showSources)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-between w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Legal Sources
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {uniqueSources.length} verified sources
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showSources ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {showSources && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden" layout>
                        <div className="grid gap-3 mt-4">
                          {uniqueSources.map((source, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                                    {source.title}
                                  </h4>
                                  {source.citation && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                      <Scale size={12} className="text-blue-500" />
                                      {source.citation}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2">
                                    {source.category && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                        {source.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {source.url && (
                                  <motion.a
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="View source"
                                  >
                                    <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                  </motion.a>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Debug Info - Collapsible */}
              {message.metadata && (
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    <Info size={12} />
                    <span>Debug Info</span>
                    {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  
                  <AnimatePresence>
                    {showDebug && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden" layout>
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-700">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="text-slate-400">Mode:</span>
                            <span>{message.metadata.mode || "Standard"}</span>
                            
                            <span className="text-slate-400">Latency:</span>
                            <span>{message.metadata.responseTime ? `${message.metadata.responseTime}ms` : "N/A"}</span>
                            
                            <span className="text-slate-400">Local Docs:</span>
                            <span>{message.metadata.localSources || 0}</span>
                            
                            <span className="text-slate-400">Web Results:</span>
                            <span>{message.metadata.internetSources || 0}</span>
                            
                            {message.metadata.memoryUsage && (
                              <>
                                <span className="text-slate-400">Memory:</span>
                                <span>{message.metadata.memoryUsage.relevantMemories}/{message.metadata.memoryUsage.historySize} items</span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Formats legal responses with proper structure
 * - Professional legal document styling
 * - Proper typography and spacing
 * - Accessible markdown rendering
 */
function FormattedLegalResponse({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-serif font-bold mt-6 mb-4 text-slate-900 dark:text-slate-100 border-b-2 border-blue-500/20 pb-3">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-serif font-semibold mt-5 mb-3 text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
              {children}
            </span>
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-serif font-semibold mt-4 mb-2 text-slate-800 dark:text-slate-200">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-none pl-6 mb-4 space-y-3">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-3 marker:text-blue-500">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-[15px] leading-relaxed pl-2 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-900 dark:text-slate-100 bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-slate-700 dark:text-slate-300">
            {children}
          </em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 py-3 my-4 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg text-slate-700 dark:text-slate-300 italic">
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              {children}
            </div>
          </blockquote>
        ),
        code: ({ inline, children }: any) => 
          inline ? (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm font-mono text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700">
              {children}
            </code>
          ) : (
            <code className="block p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-mono overflow-x-auto text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {children}
            </code>
          ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            {children}
            <ExternalLink size={12} />
          </a>
        ),
        hr: () => (
          <hr className="my-6 border-slate-200 dark:border-slate-700" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
