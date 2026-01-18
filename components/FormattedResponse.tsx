"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface FormattedResponseProps {
  content: string;
  className?: string;
}

/**
 * FormattedResponse Component
 * Renders markdown with professional styling and proper spacing
 * Handles headings, lists, code blocks, and more
 */
export default function FormattedResponse({ 
  content, 
  className = "" 
}: FormattedResponseProps) {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(code);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className={`formatted-response prose-base max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{

          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');

            // Inline code
            if (inline) {
              return (
                <code 
                  className="bg-muted text-primary dark:bg-slate-800 dark:text-blue-300 px-2 py-1 rounded text-sm font-mono border border-border/50" 
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Code block
            return (
              <div className="my-4 rounded-lg border border-border bg-muted/50 dark:bg-slate-900/50 overflow-hidden">
                {/* Header with language and copy button */}
                <div className="flex justify-between items-center px-4 py-3 bg-muted/80 dark:bg-slate-800 border-b border-border">
                  <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
                    {language || 'code'}
                  </span>
                  <button
                    onClick={() => handleCopyCode(code)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    title="Copy code"
                  >
                    {copiedBlock === code ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Code content */}
                <pre className="p-4 overflow-x-auto">
                  <code 
                    className={`text-sm font-mono text-foreground/90 leading-relaxed ${language ? `language-${language}` : ''}`}
                    {...props}
                  >
                    {code}
                  </code>
                </pre>
              </div>
            );
          },

          // Links - just add target blank
          a: ({ node, ...props }) => (
            <a 
              target="_blank"
              rel="noopener noreferrer"
              {...props} 
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
