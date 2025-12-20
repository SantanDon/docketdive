# Design Document

## Overview

This design document outlines the UI/UX improvements for DocketDive's pre-launch polish. The focus is on enhancing visual appeal, readability, and professional appearance across light and dark themes. The design maintains the existing architecture while refining CSS variables, component styling, and replacing emoji with professional icons.

## Architecture

The application uses a component-based architecture with Next.js 16, React 19, and Tailwind CSS. Theme management is handled by `next-themes`, with CSS custom properties defined in `global.css` for theme-specific values. The improvements will:

1. **Enhance CSS Variables**: Refine color palettes in `:root` and `.dark` selectors
2. **Update Component Styles**: Modify Tailwind classes and inline styles for better contrast
3. **Replace Emoji with Icons**: Integrate professional SVG icons from Flaticon or Lucide React
4. **Add Visual Effects**: Implement glow effects and smooth transitions

No architectural changes are required - all improvements are styling and asset updates.

## Components and Interfaces

### 1. Theme System (`global.css`)

**Current State:**
- CSS variables defined for light/dark modes
- Background gradient colors configured
- Basic color palette established

**Improvements:**
```css
:root {
  /* Enhanced Light Mode Colors */
  --background: 0 0% 100%;           /* Pure white */
  --foreground: 222 47% 11%;         /* Dark navy text */
  --card: 0 0% 98%;                  /* Off-white cards */
  --card-foreground: 222 47% 11%;    /* Dark text on cards */
  --muted: 210 40% 96%;              /* Light gray backgrounds */
  --muted-foreground: 215 16% 47%;   /* Medium gray text */
  
  /* Improved gradient for light mode - softer, more professional */
  --bg-gradient-start: rgb(250, 252, 255);
  --bg-gradient-end: rgb(240, 245, 255);
  --bg-gradient-1: 230, 240, 255;    /* Soft blue */
  --bg-gradient-2: 245, 248, 255;    /* Very light blue */
  --bg-gradient-3: 255, 252, 245;    /* Warm white */
  --bg-gradient-4: 240, 245, 250;    /* Cool white */
  --bg-gradient-5: 250, 250, 255;    /* Neutral white */
}

.dark {
  /* Keep existing dark mode colors - they work well */
  /* No changes needed for dark mode palette */
}
```

**Transition Configuration:**
```css
* {
  transition: background-color 300ms ease-in-out,
              color 300ms ease-in-out,
              border-color 300ms ease-in-out,
              box-shadow 300ms ease-in-out;
}
```

### 2. Student Mode Toggle Component

**Current State:**
- Basic button with conditional styling
- Uses `variant` prop for active/inactive states
- No glow effect

**Enhanced Design:**
```tsx
<Button
  variant={mode === "student" ? "default" : "outline"}
  size="sm"
  className={cn(
    "rounded-full shadow-lg transition-all duration-300",
    "text-gray-900 dark:text-white",
    "border-2",
    mode === "student" 
      ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 dark:border-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] dark:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
      : "bg-white/90 dark:bg-gray-900/90 border-gray-300 dark:border-gray-700 backdrop-blur-md hover:border-blue-400 dark:hover:border-cyan-400"
  )}
>
  <GraduationCapIcon className="mr-2 h-4 w-4" />
  {mode === "student" ? `Student (${eliLevel})` : "Student Mode"}
</Button>
```

**Glow Effect Specifications:**
- Active state: `box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)` (light mode)
- Active state: `box-shadow: 0 0 20px rgba(34, 211, 238, 0.5)` (dark mode)
- Transition: `300ms ease-in-out`
- Gradient background when active: `from-blue-500 to-cyan-500`

### 3. Message Bubble Component

**Current State:**
- User messages: Blue background with white text
- AI messages: Transparent background with markdown rendering
- Source citations: Collapsible section

**Improvements:**

**User Messages:**
```tsx
<div className="bg-blue-600 dark:bg-blue-500 text-white rounded-2xl px-5 py-3 shadow-md">
  <p className="text-[15px] leading-relaxed">{message.content}</p>
</div>
```

**AI Messages Container:**
```tsx
<div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
  {/* Content */}
</div>
```

**Markdown Text Colors:**
```tsx
components={{
  p: ({ children }) => (
    <p className="mb-4 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
      {children}
    </p>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-serif font-semibold mt-5 mb-3 text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">
      {children}
    </strong>
  ),
  // ... other components with improved contrast
}}
```

### 4. Welcome Screen Component

**Current State:**
- Uses emoji in feature pills (✨, ⚖️, 🛡️)
- Uses emoji in info card (💡)
- Lucide icons for prompt cards (good)

**Icon Replacement Strategy:**

**Feature Pills:**
```tsx
<span className="inline-flex items-center gap-2 ...">
  <SparklesIcon className="h-3.5 w-3.5" />
  AI-Powered Analysis
</span>
<span className="inline-flex items-center gap-2 ...">
  <ScaleIcon className="h-3.5 w-3.5" />
  SA Legal Database
</span>
<span className="inline-flex items-center gap-2 ...">
  <ShieldCheckIcon className="h-3.5 w-3.5" />
  Verified Sources
</span>
```

**Info Card:**
```tsx
<div className="shrink-0 w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white">
  <LightbulbIcon className="h-5 w-5" />
</div>
```

**Icon Sources:**
- Primary: Lucide React (already installed, consistent with existing icons)
- Fallback: Heroicons (already installed)
- Custom: Flaticon SVGs for specialized legal icons if needed

### 5. Input Area Component

**Current State:**
- Transparent background
- Basic styling

**Improvements:**
```tsx
<div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg focus-within:border-blue-500 dark:focus-within:border-cyan-500 focus-within:shadow-xl transition-all duration-300">
  <textarea
    className="flex-1 min-h-[52px] max-h-[200px] px-4 py-3 bg-transparent resize-none outline-none text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
    // ... props
  />
  {/* Buttons */}
</div>
```

**Send Button Active State:**
```tsx
<button
  className={cn(
    "p-2 rounded-lg transition-all duration-200",
    inputMessage.trim() && !isLoading
      ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg"
      : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
  )}
>
  <Send size={18} />
</button>
```

### 6. Header Component

**Current State:**
- Logo visible in both modes
- Floating dock navigation
- Theme toggle

**Improvements:**

**Logo Container:**
```tsx
<div className="relative h-10 w-10 rounded-lg overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 shadow-sm">
  <Image 
    src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
    alt="DocketDive Logo" 
    fill 
    className="object-cover"
  />
</div>
```

**Title Gradient:**
```tsx
<h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
  DocketDive
</h1>
```

## Data Models

No data model changes required. All improvements are presentational.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Text contrast in light mode
*For any* text element rendered in light mode, the contrast ratio between the text color and its background SHALL be at least 4.5:1
**Validates: Requirements 1.1**

### Property 2: Text contrast in dark mode
*For any* text element rendered in dark mode, the contrast ratio between the text color and its background SHALL be at least 4.5:1
**Validates: Requirements 1.2**

### Property 3: Message content readability
*For any* message content displayed against the gradient background, the text color SHALL have a contrast ratio of at least 4.5:1 with its immediate background
**Validates: Requirements 1.4**

### Property 4: Markdown theme styling
*For any* markdown element (heading, paragraph, list, code block) rendered in a message, the element SHALL have theme-specific CSS classes or styles applied based on the current theme
**Validates: Requirements 1.5**

### Property 5: Welcome screen icons are SVG
*For any* icon displayed in the welcome screen prompts, the rendered output SHALL contain an SVG element or icon component, not emoji text characters
**Validates: Requirements 3.1**

### Property 6: Feature pills use icon components
*For any* feature pill on the welcome screen, the pill SHALL contain an icon component rather than emoji text
**Validates: Requirements 3.2**

### Property 7: Icon consistency
*For any* icon displayed in the Student Mode dropdown menu, all icons SHALL have consistent sizing (same className or size prop)
**Validates: Requirements 3.4**

### Property 8: User message contrast
*For any* user message bubble, the background color SHALL have a contrast ratio of at least 4.5:1 with white text
**Validates: Requirements 5.1**

### Property 9: AI message contrast
*For any* AI message background, the contrast ratio with the text color SHALL be at least 4.5:1
**Validates: Requirements 5.2**

### Property 10: Code block theme styling
*For any* code block or inline code element, the element SHALL have different styling applied based on whether the theme is light or dark
**Validates: Requirements 5.5**

### Property 11: Input text contrast
*For any* text entered in the input field, the text color SHALL have a contrast ratio of at least 4.5:1 with the input background
**Validates: Requirements 6.2**

### Property 12: Navigation icon contrast
*For any* icon in the floating dock navigation, the icon color SHALL have a contrast ratio of at least 3:1 with its background
**Validates: Requirements 7.2**

### Property 13: Icon sizing consistency
*For any* icon added to the application, the icon SHALL have consistent sizing with other icons in the same context (same size prop or className)
**Validates: Requirements 8.3**

### Property 14: Icon theme awareness
*For any* icon used in different theme contexts, the icon SHALL have theme-dependent classes or styles that change its color based on the current theme
**Validates: Requirements 8.4**

## Error Handling

### CSS Fallbacks

All color values should have fallbacks for browsers that don't support CSS custom properties:

```css
.element {
  background-color: #ffffff; /* Fallback */
  background-color: hsl(var(--background)); /* Modern */
}
```

### Icon Loading Failures

If an icon fails to load or render:
1. Display a fallback icon from the base icon set (Lucide React)
2. Log a warning to the console
3. Ensure the layout doesn't break

```tsx
<ErrorBoundary fallback={<CircleIcon />}>
  <CustomIcon />
</ErrorBoundary>
```

### Theme Transition Glitches

If theme transitions cause visual glitches:
1. Use `next-themes` `disableTransitionOnChange` prop as fallback
2. Ensure all elements have `transition` properties defined
3. Test on multiple browsers

## Testing Strategy

### Visual Regression Testing

**Manual Testing Checklist:**
1. Test all components in light mode
2. Test all components in dark mode
3. Test theme switching transitions
4. Test on different screen sizes
5. Test with browser zoom at 100%, 125%, 150%
6. Test with high contrast mode enabled

**Automated Testing:**
- Use Playwright or Cypress for screenshot comparisons
- Test contrast ratios programmatically using color contrast libraries
- Verify CSS computed styles match expected values

### Unit Testing

**Component Tests:**
```typescript
describe('StudentModeToggle', () => {
  it('should apply glow effect when active', () => {
    const { container } = render(<StudentModeToggle mode="student" />);
    const button = container.querySelector('button');
    const styles = window.getComputedStyle(button);
    expect(styles.boxShadow).toContain('rgba');
  });
});
```

**Contrast Ratio Tests:**
```typescript
import { getContrast } from 'polished';

describe('Color Contrast', () => {
  it('should meet WCAG AA standards for text', () => {
    const textColor = '#1a202c';
    const bgColor = '#ffffff';
    const ratio = getContrast(textColor, bgColor);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
```

### Integration Testing

**Theme Switching:**
```typescript
test('theme switch updates all components', async () => {
  render(<App />);
  const themeToggle = screen.getByRole('button', { name: /theme/i });
  
  // Start in light mode
  expect(document.documentElement).toHaveClass('light');
  
  // Switch to dark
  await userEvent.click(themeToggle);
  expect(document.documentElement).toHaveClass('dark');
  
  // Verify components updated
  const messageText = screen.getByText(/legal/i);
  const styles = window.getComputedStyle(messageText);
  expect(styles.color).toBe('rgb(229, 231, 235)'); // gray-200
});
```

### Accessibility Testing

**Tools:**
- axe-core for automated accessibility testing
- WAVE browser extension for manual testing
- Lighthouse for performance and accessibility audits

**Key Checks:**
- Color contrast ratios (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation works in both themes
- Focus indicators are visible
- Screen reader compatibility

### Browser Compatibility

**Target Browsers:**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 10+)

**CSS Feature Support:**
- CSS Custom Properties (widely supported)
- CSS Grid (widely supported)
- Backdrop Filter (check for fallbacks)
- CSS Transitions (widely supported)

## Implementation Notes

### Icon Integration

**Recommended Approach:**
1. Use Lucide React as primary icon library (already installed)
2. Create a centralized icon mapping file:

```typescript
// app/components/icons/index.ts
export { 
  Sparkles as SparklesIcon,
  Scale as ScaleIcon,
  ShieldCheck as ShieldCheckIcon,
  Lightbulb as LightbulbIcon,
  GraduationCap as GraduationCapIcon
} from 'lucide-react';
```

3. For custom icons from Flaticon:
   - Download as SVG
   - Optimize with SVGO
   - Create React components
   - Store in `app/components/icons/custom/`

### CSS Organization

**File Structure:**
```
app/
  global.css          # Theme variables, base styles
  components/
    Header.tsx        # Component-specific styles via Tailwind
    MessageBubble.tsx # Component-specific styles via Tailwind
```

**Tailwind Configuration:**
- Extend theme in `tailwind.config.js` for custom colors
- Use CSS variables for dynamic theming
- Leverage Tailwind's dark mode variant

### Performance Considerations

**CSS:**
- Minimize use of `backdrop-filter` (can be expensive)
- Use `will-change` sparingly for animations
- Prefer `transform` and `opacity` for transitions

**Icons:**
- Tree-shake unused icons from Lucide React
- Lazy load custom SVG icons if large
- Use SVG sprites for repeated icons

**Theme Switching:**
- Debounce rapid theme changes
- Use CSS transitions instead of JavaScript animations
- Avoid layout shifts during theme changes

## Deployment Considerations

### Environment Variables

No new environment variables required.

### Build Process

1. Ensure all icon assets are included in the build
2. Verify CSS is properly minified
3. Test theme switching in production build
4. Check bundle size impact of icon libraries

### Rollback Plan

If visual issues are discovered post-deployment:
1. CSS changes can be reverted via Git
2. Icon changes can be rolled back individually
3. Theme system has no breaking changes
4. All changes are additive, not destructive

## Future Enhancements

### Potential Improvements

1. **Custom Theme Builder**: Allow users to customize color schemes
2. **High Contrast Mode**: Additional theme for accessibility
3. **Animation Preferences**: Respect `prefers-reduced-motion`
4. **Icon Customization**: Allow users to choose icon styles
5. **Color Blind Modes**: Specialized palettes for color blindness

### Monitoring

**Metrics to Track:**
- Theme preference distribution (light vs dark)
- Theme switch frequency
- Page load time impact
- User feedback on readability

**Analytics Events:**
```typescript
trackEvent('theme_changed', { from: 'light', to: 'dark' });
trackEvent('student_mode_activated', { level: 'ELI5' });
```
