"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect user's reduced motion preference.
 * Critical for accessibility - respects prefers-reduced-motion media query.
 * 
 * ChatGPT/Claude comparison: Both respect reduced motion for accessibility.
 * This hook ensures DocketDive matches that standard.
 * 
 * @returns boolean - true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    // Create media query
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation duration based on reduced motion preference.
 * Use this to conditionally apply animations.
 * 
 * @param normalDuration - Duration in ms when animations are enabled
 * @returns 0 if reduced motion preferred, otherwise normalDuration
 */
export function useAnimationDuration(normalDuration: number = 200): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : normalDuration;
}

export default useReducedMotion;
