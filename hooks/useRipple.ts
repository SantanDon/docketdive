"use client";

import { useState, useCallback, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

export interface Ripple {
  id: string;
  x: number;
  y: number;
  size: number;
}

interface UseRippleOptions {
  /** Duration of ripple animation in ms */
  duration?: number;
  /** Color of ripple (CSS color value) */
  color?: string;
}

/**
 * Hook to create Material Design-style ripple effects on click.
 * 
 * Critical comparison to ChatGPT/Claude:
 * - ChatGPT uses subtle hover states, no ripple
 * - Claude uses minimal feedback
 * - DocketDive adds premium ripple for tactile feedback
 * 
 * This creates a more premium, responsive feel while respecting
 * reduced motion preferences.
 * 
 * @param options - Configuration options
 * @returns Ripple state and handlers
 */
export function useRipple(options: UseRippleOptions = {}) {
  const { duration = 600 } = options;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const nextId = useRef(0);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      // Skip ripple if user prefers reduced motion
      if (prefersReducedMotion) return;

      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      
      // Calculate ripple position relative to element
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Calculate ripple size (should cover entire element)
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple: Ripple = {
        id: `ripple-${nextId.current++}`,
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, ripple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, duration);
    },
    [duration, prefersReducedMotion]
  );

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  return {
    ripples,
    createRipple,
    clearRipples,
    /** CSS for ripple container - add to parent element */
    containerStyle: {
      position: "relative" as const,
      overflow: "hidden" as const,
    },
  };
}

/**
 * Ripple component styles for use with Framer Motion or CSS
 */
export const rippleStyles = {
  base: `
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    pointer-events: none;
    background: currentColor;
    opacity: 0.2;
  `,
  animation: `
    @keyframes ripple-expand {
      to {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
      }
    }
  `,
};

export default useRipple;
