"use client";

import { useState, useCallback, useMemo } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface HoverLiftConfig {
  /** Y-axis lift in pixels (negative = up) */
  lift?: number;
  /** Scale factor on hover */
  scale?: number;
  /** Shadow intensity multiplier */
  shadowIntensity?: number;
  /** Transition duration in ms */
  duration?: number;
}

interface HoverLiftState {
  isHovered: boolean;
  transform: string;
  boxShadow: string;
  transition: string;
}

/**
 * Hook for premium hover lift effects on cards and interactive elements.
 * 
 * Critical comparison to ChatGPT/Claude:
 * - ChatGPT: Subtle background color changes on hover
 * - Claude: Minimal hover states, mostly color-based
 * - DocketDive: Premium lift + shadow for depth perception
 * 
 * This creates a more tactile, premium feel while maintaining
 * accessibility through reduced motion support.
 * 
 * @param config - Configuration options
 * @returns Hover state and event handlers
 */
export function useHoverLift(config: HoverLiftConfig = {}) {
  const {
    lift = -4,
    scale = 1.02,
    shadowIntensity = 1.5,
    duration = 200,
  } = config;

  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const onMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const state = useMemo<HoverLiftState>(() => {
    // If reduced motion, only change shadow (no transform)
    if (prefersReducedMotion) {
      return {
        isHovered,
        transform: "none",
        boxShadow: isHovered
          ? `0 8px 25px -5px rgba(0, 0, 0, ${0.1 * shadowIntensity})`
          : "var(--shadow-md)",
        transition: "box-shadow 0ms",
      };
    }

    if (isHovered) {
      return {
        isHovered,
        transform: `translateY(${lift}px) scale(${scale})`,
        boxShadow: `0 ${Math.abs(lift) * 2}px ${Math.abs(lift) * 4}px -${Math.abs(lift)}px rgba(0, 0, 0, ${0.1 * shadowIntensity})`,
        transition: `transform ${duration}ms ease-out, box-shadow ${duration}ms ease-out`,
      };
    }

    return {
      isHovered,
      transform: "translateY(0) scale(1)",
      boxShadow: "var(--shadow-md)",
      transition: `transform ${duration}ms ease-out, box-shadow ${duration}ms ease-out`,
    };
  }, [isHovered, lift, scale, shadowIntensity, duration, prefersReducedMotion]);

  // Framer Motion variants for use with motion components
  const motionVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    return {
      initial: {
        y: 0,
        scale: 1,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.07)",
      },
      hover: {
        y: lift,
        scale,
        boxShadow: `0 ${Math.abs(lift) * 2}px ${Math.abs(lift) * 4}px -${Math.abs(lift)}px rgba(0, 0, 0, ${0.1 * shadowIntensity})`,
        transition: {
          duration: duration / 1000,
          ease: [0.25, 0.1, 0.25, 1] as const, // Custom cubic bezier
        },
      },
    };
  }, [lift, scale, shadowIntensity, duration, prefersReducedMotion]);

  return {
    ...state,
    onMouseEnter,
    onMouseLeave,
    handlers: {
      onMouseEnter,
      onMouseLeave,
    },
    motionVariants,
    /** Style object for non-Framer Motion usage */
    style: {
      transform: state.transform,
      boxShadow: state.boxShadow,
      transition: state.transition,
    },
  };
}

export default useHoverLift;
