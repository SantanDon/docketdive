# DocketDive Legal Tools UI Enhancement Plan

## Overview
Transform generic legal tools into specialized, visually distinctive interfaces with tool-specific themes, branding, and user experiences.

## Tool-Specific Themes
- **ClauseAuditor**: Red/amber theme (audit/compliance), shield icon, contract-focused messaging
- **DocumentSimplifier**: Blue theme (clarity/simplification), sparkles icon, readability-focused messaging
- **DraftingAssistant**: Purple/indigo theme (creation/drafting), document icon, drafting-focused messaging
- **POPIAChecker**: Rose/pink theme (privacy/compliance), shield icon, POPIA-specific messaging

## Implementation Steps

### Phase 1: Core Theme System
- [ ] Create tool theme configuration system
- [ ] Implement theme provider for tool-specific styling
- [ ] Add theme-aware color utilities
- [ ] Test theme switching in light/dark modes

### Phase 2: ClauseAuditor Enhancement
- [ ] Update header with red/amber theme and shield icon
- [ ] Customize document upload messaging for contracts
- [ ] Add contract-specific guidance and tooltips
- [ ] Enhance score visualization with theme colors
- [ ] Update clause cards with audit-focused styling

### Phase 3: DocumentSimplifier Enhancement
- [ ] Update header with blue theme and sparkles icon
- [ ] Customize upload messaging for complex documents
- [ ] Add readability-focused guidance
- [ ] Enhance tabbed interface with theme colors
- [ ] Update simplification results display

### Phase 4: DraftingAssistant Enhancement
- [ ] Update header with purple/indigo theme and document icon
- [ ] Customize upload messaging for drafting context
- [ ] Add drafting-specific guidance and templates
- [ ] Enhance document type selection with theme colors
- [ ] Update preview area with drafting-focused styling

### Phase 5: POPIAChecker Enhancement
- [ ] Update header with rose/pink theme and shield icon
- [ ] Customize upload messaging for privacy documents
- [ ] Add POPIA-specific guidance and disclaimers
- [ ] Enhance compliance visualization with theme colors
- [ ] Update requirement cards with privacy-focused styling

### Phase 6: DocumentDropzone Customization
- [ ] Make DocumentDropzone theme-aware
- [ ] Add tool-specific upload messaging
- [ ] Customize visual feedback per tool
- [ ] Test OCR integration with themes

### Phase 7: Testing & Polish
- [ ] Run builds between each phase to catch errors
- [ ] Test all tools in light and dark modes
- [ ] Verify visual consistency across tools
- [ ] Optimize performance and animations
- [ ] Final visual review and adjustments

## Quality Checks
- [ ] All components compile without errors
- [ ] Visual appeal maintained across all tools
- [ ] Dark/light mode compatibility verified
- [ ] Tool-specific branding clearly distinguishable
- [ ] User experience enhanced with contextual guidance
