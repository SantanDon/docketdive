# Implementation Plan

- [x] 1. Enhance CSS theme variables and global styles


  - Update `:root` CSS variables in `global.css` for improved light mode colors
  - Add smooth transition properties for theme switching
  - Refine gradient background color values for better visual comfort
  - Test color contrast ratios meet WCAG AA standards
  - _Requirements: 1.1, 1.2, 4.1, 4.2_



- [ ] 1.1 Write property test for text contrast in light mode
  - **Property 1: Text contrast in light mode**

  - **Validates: Requirements 1.1**



- [ ] 1.2 Write property test for text contrast in dark mode
  - **Property 2: Text contrast in dark mode**
  - **Validates: Requirements 1.2**

- [ ] 2. Improve Student Mode Toggle component styling
  - Add gradient background for active state


  - Implement glow effect using box-shadow
  - Enhance border styling and transitions
  - Update hover states for better feedback
  - Ensure ELI level text is clearly displayed
  - _Requirements: 2.2, 2.3, 2.5_



- [ ] 3. Replace emoji with professional icons in WelcomeScreen
  - Replace emoji in feature pills with Lucide React icons (Sparkles, Scale, ShieldCheck)

  - Replace emoji in info card with Lightbulb icon
  - Ensure all icons have consistent sizing
  - Test icon visibility in both themes

  - _Requirements: 3.1, 3.2, 3.3, 3.4_



- [ ] 3.1 Write property test for welcome screen icons are SVG
  - **Property 5: Welcome screen icons are SVG**
  - **Validates: Requirements 3.1**

- [ ] 3.2 Write property test for feature pills use icon components
  - **Property 6: Feature pills use icon components**
  - **Validates: Requirements 3.2**



- [x] 3.3 Write property test for icon consistency

  - **Property 7: Icon consistency**
  - **Validates: Requirements 3.4**


- [ ] 4. Enhance MessageBubble component readability
  - Add semi-transparent background to AI message containers
  - Improve text color contrast for markdown elements

  - Update paragraph, heading, and list text colors
  - Enhance code block styling for both themes
  - Improve source citation card backgrounds

  - _Requirements: 1.4, 1.5, 5.1, 5.2, 5.5_



- [ ] 4.1 Write property test for message content readability
  - **Property 3: Message content readability**
  - **Validates: Requirements 1.4**

- [ ] 4.2 Write property test for markdown theme styling
  - **Property 4: Markdown theme styling**
  - **Validates: Requirements 1.5**





- [ ] 4.3 Write property test for user message contrast
  - **Property 8: User message contrast**
  - **Validates: Requirements 5.1**

- [ ] 4.4 Write property test for AI message contrast
  - **Property 9: AI message contrast**


  - **Validates: Requirements 5.2**



- [ ] 4.5 Write property test for code block theme styling
  - **Property 10: Code block theme styling**
  - **Validates: Requirements 5.5**

- [x] 5. Improve InputArea component visibility

  - Add semi-transparent background with backdrop blur
  - Implement focus state with border color change
  - Enhance send button active state with gradient

  - Improve disabled button styling
  - Ensure input text has proper contrast


  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 5.1 Write property test for input text contrast
  - **Property 11: Input text contrast**
  - **Validates: Requirements 6.2**


- [ ] 6. Polish Header component styling
  - Add ring border to logo container
  - Ensure title gradient works in both themes
  - Verify floating dock icon contrast
  - Test theme toggle icon switching
  - _Requirements: 7.1, 7.2, 7.4_



- [ ] 6.1 Write property test for navigation icon contrast
  - **Property 12: Navigation icon contrast**
  - **Validates: Requirements 7.2**

- [ ] 7. Create centralized icon management system
  - Create `app/components/icons/index.ts` for icon exports
  - Document icon usage patterns
  - Ensure all icons support theme-aware coloring
  - Verify consistent sizing across application
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 7.1 Write property test for icon sizing consistency
  - **Property 13: Icon sizing consistency**
  - **Validates: Requirements 8.3**

- [ ] 7.2 Write property test for icon theme awareness
  - **Property 14: Icon theme awareness**
  - **Validates: Requirements 8.4**

- [ ] 8. Checkpoint - Ensure all visual improvements are working
  - Ensure all tests pass, ask the user if questions arise
  - Manually test theme switching in browser
  - Verify all emoji have been replaced with icons
  - Check Student Mode toggle glow effect
  - Test readability in both light and dark modes
  - Verify on different screen sizes

- [ ] 9. Comprehensive visual regression testing
  - Test all components in light mode
  - Test all components in dark mode
  - Test theme switching transitions
  - Test on different screen sizes (mobile, tablet, desktop)
  - Test with browser zoom at 100%, 125%, 150%
  - Verify accessibility with axe-core

- [ ] 10. Performance and accessibility audit
  - Run Lighthouse audit for accessibility scores
  - Verify WCAG AA compliance for color contrast
  - Test keyboard navigation in both themes
  - Ensure focus indicators are visible
  - Check screen reader compatibility
  - Measure bundle size impact of changes
