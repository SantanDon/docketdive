# Legal Tools UI Overhaul - Checklist Plan

**Goal:** Transform legal tools from basic/robotic to user-centric, organized, and visually cohesive using best-in-class UI patterns.

**Reference Inspirations:**
- Linear.app - Clean step-by-step workflows
- Notion - Document-focused interfaces
- Figma - Tool organization and iconography
- Vercel - Minimal upload patterns
- Stripe Dashboard - Professional tool interfaces

---

## Phase 1: Icon & Visual Identity Audit

### Icons Standardization
- [x] **Contract Analyzer** - Replace generic Scale icon with custom rounded icon (balance scales in rounded square)
- [x] **Document Simplifier** - Replace generic Sparkles with custom rounded icon (document with sparkle)
- [x] **Drafting Assistant** - Replace generic FileText with custom rounded icon (pen writing on document)
- [x] **Clause Auditor** - Replace generic FileSearch with custom rounded icon (magnifying glass over document)
- [x] **POPIA Checker** - Replace generic Shield with custom rounded icon (shield with checkmark)
- [x] **Document Compare** - Replace generic GitCompare with custom rounded icon (two overlapping documents)

**Action:** ✅ Created `ToolIcon` component system with rounded icons and unified color gradients

---

## Phase 2: Color System Standardization

### Current Issues
- [ ] Mismatched color schemes across tools
- [ ] Inconsistent gradient usage
- [ ] Poor contrast in some areas

### Fixes Needed
- [ ] Define unified color palette per tool category
- [ ] Standardize gradient directions and stops
- [ ] Ensure WCAG AA contrast compliance
- [ ] Create color tokens for each tool

**Color Scheme:**
- Analysis Tools: Blue → Indigo gradient
- Simplification Tools: Purple → Indigo gradient  
- Drafting Tools: Violet → Purple gradient
- Compliance Tools: Purple → Indigo gradient
- Comparison Tools: Cyan → Blue gradient

---

## Phase 3: Upload Component Overhaul

### Current Issues
- [ ] Large, overwhelming dropzones
- [ ] "OR MANUAL ENTRY" text being crossed out
- [ ] Too much visual weight on upload area

### Fixes Needed
- [x] Fix "OR MANUAL ENTRY" styling (remove strikethrough) - ✅ Changed to "or paste text" with proper divider
- [ ] **Simplify upload to small button** (like Linear/Vercel style) - Created `SimpleUploadButton` component, needs integration
- [ ] Remove large bordered dropzone areas
- [ ] Make manual entry the primary method
- [ ] Upload button should be secondary, compact

**Reference:** Vercel's file upload pattern - small, unobtrusive button

---

## Phase 4: Contract Analyzer Flow Fix

### Current Issues
- [ ] User must go back to upload new document for different perspective
- [ ] No way to change perspective after analysis
- [ ] Feels robotic and disconnected

### Fixes Needed
- [x] **Allow perspective switching without re-upload** - ✅ Added perspective switcher buttons in results
- [x] Add "Change Perspective" button in results view - ✅ Added Party A/B/Neutral buttons
- [x] Keep document in memory during session - ✅ Document persists in state
- [x] Add quick perspective switcher in results - ✅ Implemented
- [x] Show current document name in results header - ✅ Added file name display

**Reference:** Linear's workflow where you can change parameters without restarting

---

## Phase 5: Tool Organization & Layout

### Current Issues
- [ ] Wildly disorganized layouts
- [ ] Inconsistent spacing
- [ ] No clear visual hierarchy
- [ ] Mismatched component styles

### Fixes Needed
- [ ] **Standardize layout structure** across all tools
- [ ] Use consistent spacing system (4px grid)
- [ ] Create unified header component
- [ ] Standardize card/container styles
- [ ] Implement consistent button styles
- [ ] Use same input field styles everywhere

**Layout Template:**
```
[Header with icon + title]
[Step indicator (if multi-step)]
[Main content area - consistent padding]
[Action buttons - consistent placement]
```

---

## Phase 6: Typography & Text Styling

### Current Issues
- [ ] Text being crossed out incorrectly
- [ ] Inconsistent font sizes
- [ ] Poor text hierarchy

### Fixes Needed
- [x] Fix "OR MANUAL ENTRY" - remove strikethrough, use proper divider - ✅ Fixed across all tools
- [ ] Standardize heading sizes (h1, h2, h3) - In progress
- [ ] Consistent body text sizing - In progress
- [ ] Proper label styling - In progress
- [ ] Fix placeholder text styling - In progress

---

## Phase 7: User-Centric Improvements

### Current Issues
- [ ] Feels basic and robotic
- [ ] Not user-focused
- [ ] Poor workflow continuity

### Fixes Needed
- [ ] **Add "Change Perspective" without re-upload** (Contract Analyzer)
- [ ] Add "Try Another Document" quick action
- [ ] Show document name persistently
- [ ] Add breadcrumb navigation
- [ ] Add "Back to Chat" quick link
- [ ] Improve error messages (user-friendly)
- [ ] Add helpful hints/tooltips

---

## Phase 8: Component Consistency

### Components to Standardize
- [ ] **Document Upload** - Small button style (all tools)
- [ ] **Text Areas** - Consistent styling (all tools)
- [ ] **Buttons** - Unified styles and sizes
- [ ] **Cards** - Same border radius, padding, shadows
- [ ] **Headers** - Consistent layout and spacing
- [ ] **Loading States** - Unified spinner and messages
- [ ] **Error States** - Consistent error display

---

## Phase 9: Responsive Design

### Mobile Optimizations
- [ ] Test all tools on mobile
- [ ] Fix any overflow issues
- [ ] Optimize touch targets
- [ ] Improve mobile upload experience
- [ ] Test step indicators on small screens

---

## Phase 10: Animation & Transitions

### Smooth Interactions
- [ ] Consistent page transitions
- [ ] Smooth state changes
- [ ] Loading state animations
- [ ] Button hover effects
- [ ] Form focus states

---

## Implementation Order

1. **Quick Wins (Do First):**
   - Fix "OR MANUAL ENTRY" strikethrough
   - Simplify upload buttons
   - Fix Contract Analyzer perspective switching

2. **Visual Identity:**
   - Create custom rounded icons
   - Standardize colors
   - Fix typography

3. **Layout & Organization:**
   - Standardize layouts
   - Fix spacing
   - Improve hierarchy

4. **User Experience:**
   - Add workflow improvements
   - Better error handling
   - Helpful hints

---

## Tools to Survey & Fix

1. [ ] Contract Analyzer (`components/ContractPerspectiveAnalyzer.tsx`)
2. [ ] Document Simplifier (`components/DocumentSimplifier.tsx`)
3. [ ] Drafting Assistant (`app/tools/drafting/page.tsx`)
4. [ ] Clause Auditor (`components/ClauseAuditor.tsx`)
5. [ ] POPIA Checker (`components/POPIAChecker.tsx`)
6. [ ] Document Compare (`components/DocumentComparison.tsx`)

---

## Success Criteria

- [ ] All tools use consistent visual language
- [ ] Upload is simple and unobtrusive
- [ ] No text styling issues (strikethrough, etc.)
- [ ] Users can change parameters without re-uploading
- [ ] Icons are custom and rounded
- [ ] Colors are unified and professional
- [ ] Layout is organized and user-centric
- [ ] Feels cohesive, not robotic

---

**Next Steps:** Start with Phase 1 & 2 (Icons & Colors), then move to upload simplification.

