# Design Document: DocketDive UI Makeover

## Overview

This design document outlines a complete UI transformation for DocketDive, creating a minimalist, professional legal AI assistant interface. The design philosophy centers on "less is more" - removing visual clutter while enhancing usability and aesthetic appeal. We leverage existing installed packages (Framer Motion, Radix UI, Lucide Icons, Tailwind CSS) combined with carefully selected component patterns from community sources.

## Architecture

### Design System Foundation

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN TOKENS                             │
├─────────────────────────────────────────────────────────────┤
│  Colors    │  Typography  │  Spacing   │  Shadows  │ Radius │
│  (HSL)     │  (Inter/IBM) │  (4px base)│  (subtle) │ (12px) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT LIBRARY                         │
├─────────────────────────────────────────────────────────────┤
│  Primitives  │  Composites   │  Layouts    │  Animations    │
│  (Button,    │  (Header,     │  (Container,│  (Framer       │
│   Input)     │   Card)       │   Grid)     │   Motion)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PAGE COMPOSITIONS                         │
├─────────────────────────────────────────────────────────────┤
│  MainPage  │  WelcomeScreen  │  ChatView  │  ToolsPages    │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

```typescript
const breakpoints = {
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large screens
};
```

## Components and Interfaces

### 1. Minimal Header Component

**Source Pattern**: Inspired by 21st.dev minimal navigation patterns

```tsx
// components/MinimalHeader.tsx
interface MinimalHeaderProps {
  onMenuToggle?: () => void;
  showSearch?: boolean;
}

// Structure:
// ┌──────────────────────────────────────────────────────────┐
// │ [Logo]                              [Theme] [Menu/User]  │
// └──────────────────────────────────────────────────────────┘
```

**Styling Approach**:
- Height: 56px desktop, 48px mobile
- Background: `bg-white/80 dark:bg-slate-950/80 backdrop-blur-md`
- Border: `border-b border-slate-200/50 dark:border-slate-800/50`
- No floating dock - simplified to essential icons only

### 2. Chat Message Bubble

**Source Pattern**: UIverse.io chat bubble patterns + custom refinements

```tsx
// components/ChatBubble.tsx
interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isLoading?: boolean;
}

// User message: Right-aligned, blue gradient
// Assistant message: Left-aligned, subtle gray
```

**Styling**:
```css
/* User bubble */
.user-bubble {
  @apply bg-gradient-to-br from-blue-500 to-blue-600 text-white;
  @apply rounded-2xl rounded-br-md;
  @apply max-w-[85%] md:max-w-[70%];
}

/* Assistant bubble */
.assistant-bubble {
  @apply bg-slate-100 dark:bg-slate-800/50;
  @apply rounded-2xl rounded-bl-md;
  @apply max-w-[85%] md:max-w-[70%];
}
```

### 3. Floating Input Area

**Source Pattern**: Modern chat input from 21st.dev + UIverse enhancements

```tsx
// components/FloatingInput.tsx
interface FloatingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
}
```

**Design Specifications**:
- Container: Floating with `shadow-lg` and `rounded-2xl`
- Background: `bg-white dark:bg-slate-900`
- Border: `border border-slate-200 dark:border-slate-700`
- Focus state: `ring-2 ring-blue-500/20`
- Send button: Gradient `from-blue-500 to-cyan-500`

### 4. Welcome Card Grid

**Source Pattern**: Bento grid from 21st.dev community

```tsx
// components/WelcomeGrid.tsx
interface PromptCard {
  icon: LucideIcon;
  title: string;
  description: string;
  prompt: string;
}

// Layout: 2x2 grid on desktop, single column on mobile
// Card style: Subtle hover lift with gradient border on hover
```

### 5. Mobile Bottom Sheet

**Source Pattern**: iOS-style bottom sheet with Framer Motion

```tsx
// components/BottomSheet.tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Animation: Spring physics slide-up
// Backdrop: Semi-transparent with blur
// Handle: Centered pill indicator
```

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    primary: string;      // #2563eb (blue-600)
    secondary: string;    // #64748b (slate-500)
    background: string;   // #ffffff / #0f172a
    foreground: string;   // #0f172a / #f8fafc
    accent: string;       // #06b6d4 (cyan-500)
    muted: string;        // #f1f5f9 / #1e293b
    border: string;       // #e2e8f0 / #334155
  };
  radius: {
    sm: '8px';
    md: '12px';
    lg: '16px';
    full: '9999px';
  };
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)';
    md: '0 4px 6px rgba(0,0,0,0.07)';
    lg: '0 10px 15px rgba(0,0,0,0.1)';
  };
}
```

### Animation Variants

```typescript
// Framer Motion variants for consistent animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const slideUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Responsive Layout Integrity
*For any* screen width between 320px and 2560px, the UI layout SHALL render without horizontal overflow or content clipping.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Animation Performance
*For any* animation triggered in the UI, the frame rate SHALL remain at or above 60fps on devices with 4GB+ RAM.
**Validates: Requirements 6.1, 8.2**

### Property 3: Color Contrast Compliance
*For any* text element displayed against its background, the contrast ratio SHALL be at least 4.5:1.
**Validates: Requirements 5.4, 10.4**

### Property 4: Touch Target Sizing
*For any* interactive element on mobile devices, the touch target area SHALL be at least 44x44 pixels.
**Validates: Requirements 7.3**

### Property 5: Theme Transition Consistency
*For any* theme change (light to dark or vice versa), all visible elements SHALL transition within 300ms without flash of unstyled content.
**Validates: Requirements 5.5**

## Error Handling

### Graceful Degradation

1. **Animation Fallback**: If `prefers-reduced-motion` is set, disable all animations
2. **Image Fallback**: Use blur placeholder while images load
3. **Font Fallback**: System fonts as fallback for custom fonts
4. **JavaScript Disabled**: Core content remains accessible

### Loading States

```tsx
// Skeleton loading pattern
const MessageSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
  </div>
);
```

## Testing Strategy

### Visual Regression Testing
- Playwright screenshots at each breakpoint
- Compare against baseline images
- Flag any pixel differences > 0.1%

### Performance Testing
- Lighthouse CI on every PR
- Target scores: Performance 90+, Accessibility 100
- Bundle size monitoring

### Accessibility Testing
- axe-core automated testing
- Manual keyboard navigation testing
- Screen reader testing with NVDA/VoiceOver

### Cross-Browser Testing
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- iOS Safari, Chrome Android
- Test on actual devices when possible

## Component Source References

### From 21st.dev Community
- Minimal navigation patterns
- Bento grid layouts
- Floating action patterns
- Glass morphism cards

### From UIverse.io
- Chat bubble designs
- Button hover effects
- Input field animations
- Loading skeletons

### From Existing Codebase
- `floating-dock.tsx` - Adapt for mobile bottom nav
- `spotlight-card.tsx` - Use for prompt cards
- `enhanced-background.tsx` - Simplify for performance
- `text-type.tsx` - Keep for welcome animation

### Custom Implementations
- Minimal header (simplified from current)
- Responsive message list
- Mobile bottom sheet
- Simplified welcome screen


## Correctness Properties (Detailed)

Based on the acceptance criteria analysis, the following properties should be validated:

### Property 1: Responsive Layout Integrity
*For any* viewport width W where 320px ≤ W ≤ 2560px, the UI SHALL render without horizontal scrollbar and all content SHALL remain visible within the viewport bounds.
**Validates: Requirements 2.1, 2.2, 2.3, 3.3, 3.4**

### Property 2: Header Height Constraints
*For any* viewport width W, the header height H SHALL satisfy: H ≤ 48px when W < 768px, and H ≤ 56px when W ≥ 768px.
**Validates: Requirements 1.5**

### Property 3: Mobile Menu Visibility
*For any* viewport width W < 768px, the hamburger menu icon SHALL be visible and the desktop navigation items SHALL be hidden.
**Validates: Requirements 1.2**

### Property 4: Prompt Card Count
*For any* render of the Welcome Screen, the number of visible prompt cards SHALL be exactly 4.
**Validates: Requirements 3.2**

### Property 5: Input Auto-Resize Bounds
*For any* text input with N lines of content, the input height SHALL grow proportionally up to a maximum of 4 lines, then remain fixed.
**Validates: Requirements 4.3**

### Property 6: Color Contrast Compliance
*For any* text element with foreground color F and background color B, the contrast ratio CR(F, B) SHALL be ≥ 4.5:1.
**Validates: Requirements 5.4, 10.4**

### Property 7: Reduced Motion Respect
*For any* user with prefers-reduced-motion: reduce, all CSS animations and Framer Motion transitions SHALL be disabled or instant.
**Validates: Requirements 6.3**

### Property 8: Touch Target Minimum Size
*For any* interactive element E on viewport width W < 768px, the clickable area of E SHALL be at least 44px × 44px.
**Validates: Requirements 7.3**

### Property 9: GPU-Accelerated Animations Only
*For any* CSS animation or transition in the codebase, the animated properties SHALL be limited to: transform, opacity, filter.
**Validates: Requirements 8.2**

### Property 10: Typography Size Minimum
*For any* body text element, the computed font-size SHALL be ≥ 16px.
**Validates: Requirements 9.2**

### Property 11: Keyboard Navigation Coverage
*For any* interactive element E, pressing Tab SHALL eventually focus E, and E SHALL have a visible focus indicator.
**Validates: Requirements 10.1, 10.2**

### Property 12: ARIA Label Coverage
*For any* interactive element E without visible text label, E SHALL have an aria-label or aria-labelledby attribute.
**Validates: Requirements 10.3**

### Property 13: Text Scaling Resilience
*For any* browser text scale setting S where 100% ≤ S ≤ 200%, the layout SHALL not overflow or clip content.
**Validates: Requirements 10.5**
