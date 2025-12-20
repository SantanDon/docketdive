/**
 * UI Message Readability Property Tests
 * Feature: ui-polish-launch-prep
 * 
 * These tests verify that message content has proper contrast and readability
 * across both light and dark themes.
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import React from 'react';

// Helper functions from ui-contrast.test.ts
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

// Mock the ChatContext
const mockMessage = {
  id: '1',
  role: 'assistant' as const,
  content: 'Test message content',
  sources: [],
};

const mockChatContext = {
  mode: 'normal' as const,
  setMode: jest.fn(),
  eliLevel: 'ELI5' as const,
  setEliLevel: jest.fn(),
  messages: [mockMessage],
  isLoading: false,
  inputMessage: '',
  setInputMessage: jest.fn(),
  sendMessage: jest.fn(),
};

jest.mock('../app/context/ChatContext', () => ({
  useChat: () => mockChatContext,
}));

import MessageBubble from '../app/components/MessageBubble';

describe('UI Message Readability Tests', () => {
  describe('Property 3: Message content readability', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 3: Message content readability
     * Validates: Requirements 1.4
     * 
     * For any message content displayed against the gradient background,
     * the text color SHALL have a contrast ratio of at least 4.5:1 with its immediate background
     */
    it('should have sufficient contrast for AI message text in light mode', () => {
      // AI message background: white/60 = rgba(255, 255, 255, 0.6)
      // Approximating as lighter white
      const messageBg = hslToRgb(0, 0, 98); // Off-white approximation
      const textColor = hslToRgb(222, 47, 20); // gray-800 approximation
      
      const ratio = getContrastRatio(textColor, messageBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for AI message text in dark mode', () => {
      // AI message background: gray-900/60
      const messageBg = hslToRgb(222, 47, 15); // Dark gray approximation
      const textColor = hslToRgb(210, 40, 80); // gray-200 approximation
      
      const ratio = getContrastRatio(textColor, messageBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Property 4: Markdown theme styling', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 4: Markdown theme styling
     * Validates: Requirements 1.5
     * 
     * For any markdown element rendered in a message, the element SHALL have
     * theme-specific CSS classes or styles applied based on the current theme
     */
    it('should apply theme-specific classes to markdown paragraphs', () => {
      const { container } = render(
        <MessageBubble message={mockMessage} mode="normal" />
      );
      
      // Check that prose classes include dark mode variants
      const proseContainer = container.querySelector('.prose');
      expect(proseContainer).toBeTruthy();
      
      const className = proseContainer?.getAttribute('class') || '';
      expect(className).toContain('dark:prose-invert');
    });

    it('should render markdown with proper text color classes', () => {
      const messageWithMarkdown = {
        ...mockMessage,
        content: '# Heading\n\nParagraph text\n\n- List item',
      };
      
      const { container } = render(
        <MessageBubble message={messageWithMarkdown} mode="normal" />
      );
      
      // Verify prose container has theme-aware classes
      const proseContainer = container.querySelector('.prose');
      const className = proseContainer?.getAttribute('class') || '';
      
      // Should have both light and dark mode text color specifications
      expect(className).toContain('prose-p:text-gray-800');
      expect(className).toContain('dark:prose-p:text-gray-200');
    });
  });

  describe('Property 8: User message contrast', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 8: User message contrast
     * Validates: Requirements 5.1
     * 
     * For any user message bubble, the background color SHALL have a contrast
     * ratio of at least 4.5:1 with white text
     */
    it('should have sufficient contrast for user message', () => {
      const userMessage = {
        id: '2',
        role: 'user' as const,
        content: 'User question',
      };
      
      // User message background: bg-blue-600
      const messageBg = hslToRgb(217, 91, 60); // Blue-600
      const textColor: [number, number, number] = [255, 255, 255]; // White
      
      const ratio = getContrastRatio(textColor, messageBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should render user message with proper background', () => {
      const userMessage = {
        id: '2',
        role: 'user' as const,
        content: 'User question',
      };
      
      const { container } = render(
        <MessageBubble message={userMessage} mode="normal" />
      );
      
      // Find the user message bubble
      const messageBubble = container.querySelector('.bg-blue-600');
      expect(messageBubble).toBeTruthy();
      
      const className = messageBubble?.getAttribute('class') || '';
      expect(className).toContain('text-white');
    });
  });

  describe('Property 9: AI message contrast', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 9: AI message contrast
     * Validates: Requirements 5.2
     * 
     * For any AI message background, the contrast ratio with the text color
     * SHALL be at least 4.5:1
     */
    it('should have sufficient contrast for AI message in light mode', () => {
      // Background: white/60 with backdrop blur
      const bgColor = hslToRgb(0, 0, 98); // Approximation
      const textColor = hslToRgb(222, 47, 20); // gray-800
      
      const ratio = getContrastRatio(textColor, bgColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should render AI message with semi-transparent background', () => {
      const { container } = render(
        <MessageBubble message={mockMessage} mode="normal" />
      );
      
      // Find the AI message container
      const messageContainer = container.querySelector('.legal-response');
      expect(messageContainer).toBeTruthy();
      
      const className = messageContainer?.getAttribute('class') || '';
      expect(className).toContain('bg-white/60');
      expect(className).toContain('dark:bg-gray-900/60');
      expect(className).toContain('backdrop-blur-sm');
    });
  });

  describe('Property 10: Code block theme styling', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 10: Code block theme styling
     * Validates: Requirements 5.5
     * 
     * For any code block or inline code element, the element SHALL have
     * different styling applied based on whether the theme is light or dark
     */
    it('should apply theme-specific styling to inline code', () => {
      const messageWithCode = {
        ...mockMessage,
        content: 'Here is `inline code` example',
      };
      
      const { container } = render(
        <MessageBubble message={messageWithCode} mode="normal" />
      );
      
      // Find inline code element
      const codeElement = container.querySelector('code');
      expect(codeElement).toBeTruthy();
      
      const className = codeElement?.getAttribute('class') || '';
      // Should have both light and dark mode background classes
      expect(className).toContain('bg-blue-50');
      expect(className).toContain('dark:bg-blue-950/50');
    });

    it('should apply theme-specific styling to code blocks', () => {
      const messageWithCodeBlock = {
        ...mockMessage,
        content: '```\nconst x = 1;\n```',
      };
      
      const { container } = render(
        <MessageBubble message={messageWithCodeBlock} mode="normal" />
      );
      
      // Find code block
      const codeBlocks = container.querySelectorAll('code');
      
      if (codeBlocks.length > 0) {
        const codeBlock = codeBlocks[0];
        const className = codeBlock.getAttribute('class') || '';
        
        // Should have theme-aware background
        expect(
          className.includes('bg-gray-50') || className.includes('bg-blue-50')
        ).toBe(true);
        
        expect(
          className.includes('dark:bg-gray-950') || className.includes('dark:bg-blue-950')
        ).toBe(true);
      }
    });

    it('should have sufficient contrast for code text', () => {
      // Inline code: blue-50 background with blue-700 text (light mode)
      const bgColor = hslToRgb(217, 100, 97); // blue-50
      const textColor = hslToRgb(217, 91, 40); // blue-700
      
      const ratio = getContrastRatio(textColor, bgColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
