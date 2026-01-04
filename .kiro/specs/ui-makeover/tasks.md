# Implementation Plan: DocketDive UI Makeover

## Overview

This implementation plan transforms DocketDive's UI into a minimalist, professional, and responsive interface. Tasks are ordered to build foundational elements first, then compose them into the final pages. Each task uses existing installed packages (Framer Motion, Radix UI, Tailwind CSS) and adapts component patterns from community sources.

## Tasks

- [x] 1. Update Design Tokens and Global Styles
  - [x] 1.1 Simplify CSS variables in global.css
    - Remove unused gradient variables
    - Consolidate to essential colors only
    - Add new shadow and radius tokens
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 1.2 Update tailwind.config.js with new design tokens
    - Add simplified color palette
    - Update border-radius values
    - Add new shadow utilities
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 1.3 Add reduced-motion media query support
    - Create motion-safe and motion-reduce utilities
    - _Requirements: 6.3_

- [x] 2. Create Minimal Header Component
  - [x] 2.1 Create new MinimalHeader.tsx component
    - Logo on left, theme toggle and menu on right
    - Glass morphism background
    - 56px desktop, 48px mobile height
    - _Requirements: 1.1, 1.3, 1.5_
  - [x] 2.2 Add mobile hamburger menu with bottom sheet
    - Hamburger icon visible below 768px
    - Bottom sheet slides up with spring animation
    - _Requirements: 1.2, 7.1, 7.2_
  - [x] 2.3 Implement scroll behavior for header
    - Fixed position on scroll
    - Subtle shadow on scroll
    - _Requirements: 1.4_

- [x] 3. Checkpoint - Header Complete
  - Ensure header renders correctly at all breakpoints
  - Test theme toggle functionality
  - Verify mobile menu opens/closes properly

- [x] 4. Redesign Chat Message Components
  - [x] 4.1 Create new ChatBubble.tsx component
    - User messages: blue gradient, right-aligned, rounded-br-md
    - Assistant messages: gray background, left-aligned, rounded-bl-md
    - Max width 85% mobile, 70% desktop
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 4.2 Create MessageSkeleton.tsx loading component
    - Animated skeleton lines
    - Matches bubble dimensions
    - _Requirements: 6.5_
  - [x] 4.3 Update MessageList.tsx for responsive layout
    - Centered container with max-width 768px
    - Proper spacing between messages
    - Smooth scroll behavior
    - _Requirements: 2.1, 2.3_

- [x] 5. Redesign Input Area
  - [x] 5.1 Create new FloatingInput.tsx component
    - Floating design with shadow-lg
    - Rounded-2xl corners
    - Focus ring animation
    - _Requirements: 4.1, 4.2_
  - [x] 5.2 Implement auto-resize textarea
    - Grows with content up to 4 lines
    - Smooth height transition
    - _Requirements: 4.3_
  - [x] 5.3 Style send button with gradient
    - Blue to cyan gradient
    - Scale on hover (1.02)
    - Disabled state styling
    - _Requirements: 4.4_
  - [x] 5.4 Add safe area padding for mobile
    - Bottom padding for iOS safe area
    - Fixed positioning
    - _Requirements: 4.5_

- [x] 6. Checkpoint - Chat Interface Complete
  - Test message sending and receiving
  - Verify responsive layout at all breakpoints
  - Check loading states display correctly

- [x] 7. Simplify Welcome Screen
  - [x] 7.1 Create new MinimalWelcome.tsx component
    - Centered logo with subtle pulse animation
    - Simple greeting text
    - Remove excessive animations
    - _Requirements: 3.1_
  - [x] 7.2 Create PromptCard.tsx component
    - Clean card design with icon
    - Hover lift effect (translateY -2px)
    - Click to populate input
    - _Requirements: 3.2_
  - [x] 7.3 Implement responsive prompt grid
    - 2x2 grid on desktop (md+)
    - Single column on mobile
    - Maximum 4 cards
    - _Requirements: 3.3, 3.4_
  - [x] 7.4 Optimize welcome screen performance
    - Lazy load non-critical elements
    - Reduce animation complexity
    - _Requirements: 3.5_

- [x] 8. Checkpoint - Welcome Screen Complete
  - Verify prompt cards work correctly
  - Test responsive grid layout
  - Measure initial render time

- [x] 9. Implement Mobile Navigation
  - [x] 9.1 Create BottomSheet.tsx component
    - Slide up animation with spring physics
    - Backdrop blur overlay
    - Drag to close gesture
    - _Requirements: 7.1, 7.2_
  - [x] 9.2 Add swipe gesture support
    - Swipe down to close
    - Velocity-based animation
    - _Requirements: 7.4_
  - [x] 9.3 Ensure navigation doesn't obstruct input
    - Proper z-index layering
    - Input remains accessible
    - _Requirements: 7.5_

- [x] 10. Accessibility Improvements
  - [x] 10.1 Add keyboard navigation support
    - Tab order for all interactive elements
    - Enter/Space activation
    - Escape to close modals
    - _Requirements: 10.1_
  - [x] 10.2 Implement visible focus states
    - 2px ring with offset
    - High contrast focus indicator
    - _Requirements: 10.2_
  - [x] 10.3 Add ARIA labels and roles
    - Label all buttons and inputs
    - Announce dynamic content changes
    - _Requirements: 10.3_
  - [x] 10.4 Ensure touch targets are 44px minimum
    - Audit all buttons and links
    - Add padding where needed
    - _Requirements: 7.3_

- [x] 11. Performance Optimization
  - [x] 11.1 Audit and optimize animations
    - Use only transform and opacity
    - Remove layout-triggering animations
    - _Requirements: 8.2_
  - [x] 11.2 Optimize images with next/image
    - Add blur placeholders
    - Implement lazy loading
    - _Requirements: 8.3_
  - [x] 11.3 Simplify enhanced-background component
    - Reduce gradient complexity
    - Use CSS instead of JS where possible
    - _Requirements: 8.1_

- [x] 12. Update MainPage Integration
  - [x] 12.1 Replace Header with MinimalHeader
    - Update imports
    - Pass required props
    - _Requirements: 1.1_
  - [x] 12.2 Replace WelcomeScreen with MinimalWelcome
    - Update imports
    - Verify prompt functionality
    - _Requirements: 3.1_
  - [x] 12.3 Replace InputArea with FloatingInput
    - Update imports
    - Verify send functionality
    - _Requirements: 4.1_
  - [x] 12.4 Update message rendering with new ChatBubble
    - Update MessageList imports
    - Verify message display
    - _Requirements: 2.1_

- [x] 13. Final Checkpoint - Full Integration
  - Test complete user flow
  - Verify all features work together
  - Cross-browser testing

- [x] 14. Property-Based Testing
  - [x] 14.1 Write responsive layout tests
    - **Property 1: Responsive Layout Integrity**
    - **Validates: Requirements 2.1, 2.2, 2.3, 3.3, 3.4**
  - [x] 14.2 Write accessibility tests
    - **Property 11: Keyboard Navigation Coverage**
    - **Property 12: ARIA Label Coverage**
    - **Validates: Requirements 10.1, 10.2, 10.3**
  - [x] 14.3 Write touch target size tests
    - **Property 8: Touch Target Minimum Size**
    - **Validates: Requirements 7.3**

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Use existing Framer Motion, Radix UI, and Tailwind CSS - no new dependencies
- Adapt component patterns from 21st.dev and UIverse rather than copying directly
