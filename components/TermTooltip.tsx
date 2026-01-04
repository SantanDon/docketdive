'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { GlossaryTerm } from '@/types/document-processing';

interface TermTooltipProps {
  term: GlossaryTerm;
  children: React.ReactNode;
  className?: string;
}

export function TermTooltip({ term, children, className = '' }: TermTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Show tooltip below if not enough space above
      setPosition(spaceAbove < 150 ? 'bottom' : 'top');
    }
  }, [isVisible]);

  const categoryColors: Record<string, string> = {
    latin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    procedural: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    substantive: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    custom: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  };

  return (
    <span
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
    >
      <span className="border-b border-dotted border-blue-500 cursor-help">
        {children}
      </span>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-5px] border-r border-b'
                : 'top-[-5px] border-l border-t'
            }`}
          />
          
          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {term.term}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[term.category]}`}>
                {term.category}
              </span>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {term.definition}
            </p>
            
            {term.source && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                Source: {term.source}
              </p>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * Highlight legal terms in text with tooltips
 */
interface HighlightedTextProps {
  text: string;
  terms: Array<{
    term: GlossaryTerm;
    start: number;
    end: number;
  }>;
  className?: string;
}

export function HighlightedText({ text, terms, className = '' }: HighlightedTextProps) {
  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort terms by position
  const sortedTerms = [...terms].sort((a, b) => a.start - b.start);
  
  const segments: React.ReactNode[] = [];
  let lastEnd = 0;

  sortedTerms.forEach((match, idx) => {
    // Add text before this term
    if (match.start > lastEnd) {
      segments.push(
        <span key={`text-${idx}`}>
          {text.slice(lastEnd, match.start)}
        </span>
      );
    }

    // Add the highlighted term
    segments.push(
      <TermTooltip key={`term-${idx}`} term={match.term}>
        {text.slice(match.start, match.end)}
      </TermTooltip>
    );

    lastEnd = match.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    segments.push(
      <span key="text-end">
        {text.slice(lastEnd)}
      </span>
    );
  }

  return <span className={className}>{segments}</span>;
}

export default TermTooltip;
