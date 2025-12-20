/**
 * UI Contrast Property Tests
 * Feature: ui-polish-launch-prep
 * 
 * These tests verify that text elements meet WCAG AA contrast requirements
 * across both light and dark themes.
 */

import { describe, it, expect } from '@jest/globals';

/**
 * Calculate relative luminance of an RGB color
 * Based on WCAG 2.1 specification
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4))
  ];
}

describe('UI Contrast Tests', () => {
  describe('Property 1: Text contrast in light mode', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 1: Text contrast in light mode
     * Validates: Requirements 1.1
     * 
     * For any text element rendered in light mode, the contrast ratio between
     * the text color and its background SHALL be at least 4.5:1
     */
    it('should have sufficient contrast for foreground text on background', () => {
      // Light mode colors from global.css
      const background = hslToRgb(0, 0, 100); // Pure white
      const foreground = hslToRgb(222, 47, 11); // Dark navy
      
      const ratio = getContrastRatio(foreground, background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for card text', () => {
      const cardBg = hslToRgb(0, 0, 98); // Off-white
      const cardFg = hslToRgb(222, 47, 11); // Dark navy
      
      const ratio = getContrastRatio(cardFg, cardBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for muted text', () => {
      const mutedBg = hslToRgb(210, 40, 96); // Light gray
      const mutedFg = hslToRgb(215, 16, 47); // Medium gray
      
      const ratio = getContrastRatio(mutedFg, mutedBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for primary button text', () => {
      const primaryBg = hslToRgb(217, 91, 60); // Electric indigo
      const primaryFg = hslToRgb(0, 0, 100); // White
      
      const ratio = getContrastRatio(primaryFg, primaryBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Property 2: Text contrast in dark mode', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 2: Text contrast in dark mode
     * Validates: Requirements 1.2
     * 
     * For any text element rendered in dark mode, the contrast ratio between
     * the text color and its background SHALL be at least 4.5:1
     */
    it('should have sufficient contrast for foreground text on background', () => {
      // Dark mode colors from global.css
      const background = hslToRgb(224, 71, 4); // Deep navy
      const foreground = hslToRgb(210, 40, 98); // Light text
      
      const ratio = getContrastRatio(foreground, background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for card text', () => {
      const cardBg = hslToRgb(222, 47, 11); // Dark card
      const cardFg = hslToRgb(210, 40, 98); // Light text
      
      const ratio = getContrastRatio(cardFg, cardBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for muted text', () => {
      const mutedBg = hslToRgb(217, 33, 17); // Dark muted bg
      const mutedFg = hslToRgb(215, 20, 65); // Muted text
      
      const ratio = getContrastRatio(mutedFg, mutedBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for primary button text', () => {
      const primaryBg = hslToRgb(217, 91, 60); // Electric indigo
      const primaryFg = hslToRgb(222, 47, 11); // Dark text
      
      const ratio = getContrastRatio(primaryFg, primaryBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle pure black on pure white', () => {
      const black: [number, number, number] = [0, 0, 0];
      const white: [number, number, number] = [255, 255, 255];
      
      const ratio = getContrastRatio(black, white);
      expect(ratio).toBe(21); // Maximum contrast
    });

    it('should handle identical colors', () => {
      const color: [number, number, number] = [128, 128, 128];
      
      const ratio = getContrastRatio(color, color);
      expect(ratio).toBe(1); // No contrast
    });
  });
});
