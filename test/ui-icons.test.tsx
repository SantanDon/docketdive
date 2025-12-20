/**
 * UI Icons Property Tests
 * Feature: ui-polish-launch-prep
 * 
 * These tests verify that professional icons are used instead of emoji
 * and that icons are consistent across the application.
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import React from 'react';

// Mock the ChatContext
const mockChatContext = {
  mode: 'normal' as const,
  setMode: jest.fn(),
  eliLevel: 'ELI5' as const,
  setEliLevel: jest.fn(),
  messages: [],
  isLoading: false,
  inputMessage: '',
  setInputMessage: jest.fn(),
  sendMessage: jest.fn(),
};

jest.mock('../app/context/ChatContext', () => ({
  useChat: () => mockChatContext,
  ChatProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Import components after mocking
import WelcomeScreen from '../app/components/WelcomeScreen';
import InputArea from '../app/components/InputArea';
import StudentModeToggle from '../app/components/StudentModeToggle';

describe('UI Icons Tests', () => {
  describe('Property 5: Welcome screen icons are SVG', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 5: Welcome screen icons are SVG
     * Validates: Requirements 3.1
     * 
     * For any icon displayed in the welcome screen prompts, the rendered output
     * SHALL contain an SVG element or icon component, not emoji text characters
     */
    it('should render SVG icons in feature pills, not emoji', () => {
      const setInputMessage = jest.fn();
      const textareaRef = { current: null };
      
      const { container } = render(
        <WelcomeScreen setInputMessage={setInputMessage} textareaRef={textareaRef} />
      );
      
      // Check that feature pills contain SVG elements
      const featurePills = container.querySelectorAll('.inline-flex.items-center.gap-2');
      expect(featurePills.length).toBeGreaterThan(0);
      
      // Each feature pill should have an SVG icon
      featurePills.forEach(pill => {
        const svg = pill.querySelector('svg');
        expect(svg).toBeTruthy();
      });
      
      // Verify no emoji characters in feature pills
      const pillTexts = Array.from(featurePills).map(pill => pill.textContent || '');
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
      pillTexts.forEach(text => {
        expect(emojiRegex.test(text)).toBe(false);
      });
    });

    it('should render SVG icon in info card, not emoji', () => {
      const setInputMessage = jest.fn();
      const textareaRef = { current: null };
      
      const { container } = render(
        <WelcomeScreen setInputMessage={setInputMessage} textareaRef={textareaRef} />
      );
      
      // Find the info card icon container
      const iconContainers = container.querySelectorAll('.w-10.h-10.rounded-lg');
      expect(iconContainers.length).toBeGreaterThan(0);
      
      // Check for SVG in icon containers
      iconContainers.forEach(iconContainer => {
        const svg = iconContainer.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });
  });

  describe('Property 6: Feature pills use icon components', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 6: Feature pills use icon components
     * Validates: Requirements 3.2
     * 
     * For any feature pill on the welcome screen, the pill SHALL contain
     * an icon component rather than emoji text
     */
    it('should use Lucide React icon components in feature pills', () => {
      const setInputMessage = jest.fn();
      const textareaRef = { current: null };
      
      const { container } = render(
        <WelcomeScreen setInputMessage={setInputMessage} textareaRef={textareaRef} />
      );
      
      // Find all SVG elements in feature pills
      const svgs = container.querySelectorAll('.inline-flex svg');
      expect(svgs.length).toBeGreaterThanOrEqual(3); // At least 3 feature pills
      
      // Verify SVG elements have proper attributes (Lucide icons have specific structure)
      svgs.forEach(svg => {
        expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
        expect(svg.hasAttribute('viewBox')).toBe(true);
      });
    });
  });

  describe('Property 7: Icon consistency', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 7: Icon consistency
     * Validates: Requirements 3.4
     * 
     * For any icon displayed in the Student Mode dropdown menu, all icons
     * SHALL have consistent sizing (same className or size prop)
     */
    it('should have consistent icon sizing in Student Mode dropdown', () => {
      const { container } = render(<StudentModeToggle />);
      
      // Find all icons in the component
      const icons = container.querySelectorAll('svg');
      
      if (icons.length > 0) {
        // Get the size of the first icon
        const firstIcon = icons[0];
        const firstWidth = firstIcon.getAttribute('width');
        const firstHeight = firstIcon.getAttribute('height');
        
        // All icons should have the same size
        icons.forEach(icon => {
          const width = icon.getAttribute('width');
          const height = icon.getAttribute('height');
          
          // Icons should either have same explicit size or same class
          if (firstWidth && firstHeight) {
            expect(width).toBe(firstWidth);
            expect(height).toBe(firstHeight);
          }
        });
      }
    });

    it('should have consistent icon sizing in InputArea', () => {
      const { container } = render(<InputArea />);
      
      // Find all icons in the input area footer
      const footerIcons = container.querySelectorAll('.text-center svg');
      
      if (footerIcons.length > 0) {
        // All footer icons should have consistent sizing
        const sizes = Array.from(footerIcons).map(icon => ({
          width: icon.getAttribute('width'),
          height: icon.getAttribute('height'),
          className: icon.getAttribute('class'),
        }));
        
        // Check that all icons have similar sizing
        const firstSize = sizes[0];
        sizes.forEach(size => {
          if (firstSize.width && firstSize.height) {
            expect(size.width).toBe(firstSize.width);
            expect(size.height).toBe(firstSize.height);
          }
        });
      }
    });
  });

  describe('Property 13: Icon sizing consistency', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 13: Icon sizing consistency
     * Validates: Requirements 8.3
     * 
     * For any icon added to the application, the icon SHALL have consistent
     * sizing with other icons in the same context
     */
    it('should maintain consistent icon sizes across welcome screen', () => {
      const setInputMessage = jest.fn();
      const textareaRef = { current: null };
      
      const { container } = render(
        <WelcomeScreen setInputMessage={setInputMessage} textareaRef={textareaRef} />
      );
      
      // Get all icons in feature pills
      const featurePillIcons = container.querySelectorAll('.inline-flex.items-center.gap-2 svg');
      
      // All feature pill icons should have the same size class
      const iconClasses = Array.from(featurePillIcons).map(icon => icon.getAttribute('class'));
      
      if (iconClasses.length > 1) {
        const firstClass = iconClasses[0];
        iconClasses.forEach(className => {
          // Should contain same size class (h-3.5 w-3.5)
          expect(className).toContain('h-3.5');
          expect(className).toContain('w-3.5');
        });
      }
    });
  });

  describe('Property 14: Icon theme awareness', () => {
    /**
     * Feature: ui-polish-launch-prep, Property 14: Icon theme awareness
     * Validates: Requirements 8.4
     * 
     * For any icon used in different theme contexts, the icon SHALL have
     * theme-dependent classes or styles that change its color based on the current theme
     */
    it('should apply theme-aware classes to icons', () => {
      const setInputMessage = jest.fn();
      const textareaRef = { current: null };
      
      const { container } = render(
        <WelcomeScreen setInputMessage={setInputMessage} textareaRef={textareaRef} />
      );
      
      // Check that icon containers have theme-aware color classes
      const iconContainers = container.querySelectorAll('.text-blue-700, .text-purple-700, .text-green-700');
      
      // These should have dark mode variants
      iconContainers.forEach(container => {
        const className = container.getAttribute('class') || '';
        // Should contain both light and dark mode color classes
        expect(
          className.includes('text-blue-700') || 
          className.includes('text-purple-700') || 
          className.includes('text-green-700')
        ).toBe(true);
        
        expect(
          className.includes('dark:text-blue-300') || 
          className.includes('dark:text-purple-300') || 
          className.includes('dark:text-green-300')
        ).toBe(true);
      });
    });
  });
});
