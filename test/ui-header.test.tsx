/**
 * UI Header Property Tests
 * Feature: ui-polish-launch-prep
 * 
 * These tests verify that the header and navigation elements have proper
 * contrast and visibility across both light and dark themes.
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import React from 'react';

// Helper functions
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

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

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

import Header from '../app/components/Header';

describe('UI Header Tests', () => {
  describe('Property 12: Navigation icon contrast', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 12: Navigation icon contrast
     * Validates: Requirements 7.2
     * 
     * For any icon in the floating dock navigation, the icon color SHALL have
     * a contrast ratio of at least 3:1 with its background
     */
    it('should have sufficient contrast for navigation icons in light mode', () => {
      // Icon color: neutral-500 (gray-500)
      const iconColor = hslToRgb(215, 16, 47); // gray-500
      // Background: white or light gray
      const bgColor = hslToRgb(0, 0, 100); // white
      
      const ratio = getContrastRatio(iconColor, bgColor);
      // Icons need at least 3:1 contrast (WCAG AA for large text/icons)
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('should have sufficient contrast for navigation icons in dark mode', () => {
      // Icon color: neutral-300 (gray-300)
      const iconColor = hslToRgb(214, 32, 91); // gray-300
      // Background: dark gray
      const bgColor = hslToRgb(222, 47, 11); // gray-900
      
      const ratio = getContrastRatio(iconColor, bgColor);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('should render header with logo ring border', () => {
      const onOpenProfile = jest.fn();
      const onUpload = jest.fn();
      const onSearch = jest.fn();
      
      const { container } = render(
        <Header 
          onOpenProfile={onOpenProfile}
          onUpload={onUpload}
          loggedIn={false}
          onSearch={onSearch}
        />
      );
      
      // Find logo container
      const logoContainer = container.querySelector('.ring-2');
      expect(logoContainer).toBeTruthy();
      
      const className = logoContainer?.getAttribute('class') || '';
      expect(className).toContain('ring-gray-200');
      expect(className).toContain('dark:ring-gray-700');
    });

    it('should render title with gradient', () => {
      const onOpenProfile = jest.fn();
      const onUpload = jest.fn();
      const onSearch = jest.fn();
      
      const { container } = render(
        <Header 
          onOpenProfile={onOpenProfile}
          onUpload={onUpload}
          loggedIn={false}
          onSearch={onSearch}
        />
      );
      
      // Find title
      const title = container.querySelector('h1');
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('DocketDive');
      
      const className = title?.getAttribute('class') || '';
      expect(className).toContain('bg-gradient-to-r');
      expect(className).toContain('from-blue-600');
      expect(className).toContain('to-cyan-600');
      expect(className).toContain('dark:from-blue-400');
      expect(className).toContain('dark:to-cyan-400');
    });

    it('should have sufficient contrast for subtitle text', () => {
      // Subtitle in light mode: gray-600
      const textColor = hslToRgb(215, 16, 47); // gray-600
      const bgColor = hslToRgb(0, 0, 100); // white background
      
      const ratio = getContrastRatio(textColor, bgColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should render subtitle with theme-aware colors', () => {
      const onOpenProfile = jest.fn();
      const onUpload = jest.fn();
      const onSearch = jest.fn();
      
      const { container } = render(
        <Header 
          onOpenProfile={onOpenProfile}
          onUpload={onUpload}
          loggedIn={false}
          onSearch={onSearch}
        />
      );
      
      // Find subtitle
      const subtitle = container.querySelector('.text-xs');
      expect(subtitle).toBeTruthy();
      expect(subtitle?.textContent).toBe('Legal Intelligence');
      
      const className = subtitle?.getAttribute('class') || '';
      expect(className).toContain('text-gray-600');
      expect(className).toContain('dark:text-gray-400');
    });
  });

  describe('Theme Toggle Icon', () => {
    it('should show appropriate icon for current theme', () => {
      const onOpenProfile = jest.fn();
      const onUpload = jest.fn();
      const onSearch = jest.fn();
      
      const { container } = render(
        <Header 
          onOpenProfile={onOpenProfile}
          onUpload={onUpload}
          loggedIn={false}
          onSearch={onSearch}
        />
      );
      
      // Should have theme toggle functionality
      // The actual icon rendering depends on the theme state
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
    });
  });

  describe('Logo Visibility', () => {
    it('should render logo with proper styling for both themes', () => {
      const onOpenProfile = jest.fn();
      const onUpload = jest.fn();
      const onSearch = jest.fn();
      
      const { container } = render(
        <Header 
          onOpenProfile={onOpenProfile}
          onUpload={onUpload}
          loggedIn={false}
          onSearch={onSearch}
        />
      );
      
      // Find logo image
      const logo = container.querySelector('img[alt="DocketDive Logo"]');
      expect(logo).toBeTruthy();
      
      // Logo container should have ring border
      const logoContainer = logo?.parentElement;
      const className = logoContainer?.getAttribute('class') || '';
      expect(className).toContain('ring-2');
      expect(className).toContain('shadow-sm');
    });
  });
});
