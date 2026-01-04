# Implementation Plan: Competitive Advantage Features

## Overview

This implementation plan focuses on P1 features first (Multi-Perspective Contract Analysis, Document Simplification, Enhanced Clause Extraction, Mobile Responsiveness), followed by P2 features (Case Management, Task Management, Document Templates). Each task builds incrementally on previous work.

## Tasks

- [x] 1. Set up shared infrastructure and types
  - [x] 1.1 Create shared TypeScript interfaces for all features
    - Create `types/legal-tools.ts` with interfaces for ContractAnalysis, SimplificationResult, ClauseExtractionResult, Case, Task
    - _Requirements: 1.1-1.6, 2.1-2.7, 3.1-3.6, 4.1-4.6, 5.1-5.6_
  - [x] 1.2 Set up IndexedDB with Dexie.js for local storage
    - Install dexie package
    - Create `lib/db.ts` with database schema for cases, tasks, documents
    - _Requirements: 2.1, 3.1_
  - [ ]* 1.3 Write property test for database round-trip persistence
    - **Property 3: Case Data Round-Trip Persistence**
    - **Validates: Requirements 2.1, 2.2**

- [-] 2. Implement Multi-Perspective Contract Analysis (P1)
  - [x] 2.1 Create contract analysis API endpoint
    - Create `app/api/contract-analysis/route.ts`
    - Implement Groq/Llama prompt for perspective-based analysis (reuse existing RAG utils)
    - Return structured ContractAnalysis response
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 2.2 Create ContractPerspectiveAnalyzer component
    - Create `components/ContractPerspectiveAnalyzer.tsx`
    - Add perspective selector (Party A, Party B, Neutral)
    - Display risk score, favorable/risky clauses, suggestions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 2.3 Create contract analysis tool page
    - Create `app/tools/contract-analysis/page.tsx`
    - Integrate ContractPerspectiveAnalyzer component
    - _Requirements: 1.1_
  - [x] 2.4 Add contract analysis to ToolsMenu
    - Update `components/ToolsMenu.tsx` to include new tool
    - Update `app/tools/page.tsx` to list new tool
    - _Requirements: 1.1_
  - [ ]* 2.5 Write property tests for contract analysis
    - **Property 1: Perspective Analysis Output Structure**
    - **Property 2: Risk Score Range Validity**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

- [x] 3. Checkpoint - Contract Analysis Complete
  - All P1 AI features implemented (Contract Analysis, Document Simplification, Enhanced Clause Extraction)

- [x] 4. Implement Document Simplification Tool (P1)
  - [x] 4.1 Create document simplification API endpoint
    - Create `app/api/simplify/route.ts`
    - Implement Groq/Llama prompt for plain-language conversion (reuse existing RAG utils)
    - Include jargon extraction and readability scoring
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_
  - [x] 4.2 Create DocumentSimplifier component
    - Create `components/DocumentSimplifier.tsx`
    - Display simplified summary, clause breakdown, jargon glossary
    - Show key obligations, rights, deadlines
    - Display readability scores comparison
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_
  - [x] 4.3 Create document simplification tool page
    - Create `app/tools/simplify/page.tsx`
    - Integrate DocumentSimplifier component
    - _Requirements: 4.1_
  - [x] 4.4 Add simplification tool to ToolsMenu
    - Update `components/ToolsMenu.tsx` and `app/tools/page.tsx`
    - _Requirements: 4.1_
  - [ ]* 4.5 Write property tests for document simplification
    - **Property 12: Simplification Output Completeness**
    - **Property 13: Readability Score Improvement**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.6**

- [ ] 5. Enhance Clause Extraction (P1)
  - [x] 5.1 Enhance existing clause auditor API
    - Update `app/api/audit/route.ts` to include 15+ clause categories
    - Add confidence scores to each extracted clause
    - Add unusual language detection
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 5.2 Update ClauseAuditor component with enhanced features
    - Update `components/ClauseAuditor.tsx`
    - Display confidence scores per clause
    - Show suggested standard text for missing clauses
    - Highlight unusual clause language
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 5.3 Write property tests for clause extraction
    - **Property 14: Clause Extraction Non-Empty**
    - **Property 15: Clause Category and Confidence Validity**
    - **Property 16: Missing Clause Suggestions**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**

- [x] 6. Checkpoint - P1 AI Features Complete
  - Contract Analysis, Document Simplification, Enhanced Clause Extraction all implemented

- [x] 7. Implement Mobile Responsiveness (P1)
  - [x] 7.1 Audit and fix tool components for mobile
    - Review all tool components for mobile breakpoints
    - Add responsive classes (sm:, md:, lg:) where needed
    - Ensure touch-friendly button sizes (min 44px)
    - _Requirements: 12.1, 12.2, 12.4_
  - [x] 7.2 Implement responsive navigation
    - Tools layout already has responsive header
    - Dropdown menus work on touch devices
    - _Requirements: 12.3_
  - [x] 7.3 Optimize forms for mobile input
    - Form inputs properly sized on mobile
    - Textarea heights appropriate for mobile
    - _Requirements: 12.2, 12.4_

- [-] 8. Implement Case Management (P2)
  - [x] 8.1 Create case management hooks and context
    - Create `app/hooks/useCases.ts` with CRUD operations
    - Create `app/context/CaseContext.tsx` for state management
    - Implement IndexedDB persistence
    - _Requirements: 2.1, 2.2_
  - [ ] 8.2 Create CaseManager component
    - Create `components/CaseManager.tsx`
    - Implement case list with status filtering
    - Add case creation/edit form
    - Display deadline warnings for cases within 7 days
    - Calculate and display case age
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_
  - [ ] 8.3 Create case management page
    - Create `app/cases/page.tsx`
    - Create `app/cases/layout.tsx` with navigation
    - Integrate CaseManager component
    - _Requirements: 2.1_
  - [ ] 8.4 Create case detail page
    - Create `app/cases/[id]/page.tsx`
    - Display full case details with linked documents
    - Show case deadlines in timeline view
    - _Requirements: 2.1, 2.5_
  - [ ]* 8.5 Write property tests for case management
    - **Property 4: Case Status Filtering Correctness**
    - **Property 5: Deadline Warning Threshold**
    - **Property 6: Case Age Calculation**
    - **Validates: Requirements 2.3, 2.4, 2.7**

- [ ] 9. Implement Task Management (P2)
  - [ ] 9.1 Create task management hooks
    - Create `app/hooks/useTasks.ts` with CRUD operations
    - Implement default priority logic
    - Implement overdue detection
    - _Requirements: 3.1, 3.2, 3.6_
  - [ ] 9.2 Create TaskManager component
    - Create `components/TaskManager.tsx`
    - Implement task list with sorting (due date, priority, case)
    - Add task creation form with case association
    - Display task statistics (total, completed, overdue)
    - Show overdue indicators
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ] 9.3 Create tasks page
    - Create `app/tasks/page.tsx`
    - Integrate TaskManager component
    - Add quick-add task functionality
    - _Requirements: 3.1_
  - [ ] 9.4 Integrate tasks with case detail page
    - Add task list to case detail page
    - Allow creating tasks linked to specific case
    - _Requirements: 3.1_
  - [ ]* 9.5 Write property tests for task management
    - **Property 7: Task Default Priority**
    - **Property 8: Task Sorting Correctness**
    - **Property 9: Task Completion Timestamp**
    - **Property 10: Task Statistics Accuracy**
    - **Property 11: Overdue Task Detection**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

- [ ] 10. Checkpoint - P2 Features Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Document Generation Templates (P2)
  - [ ] 11.1 Create document templates data
    - Create `data/document-templates.ts` with SA legal document templates
    - Include: Letter of Demand, Power of Attorney, Affidavit, Notice to Vacate, Acknowledgment of Debt
    - Define required fields for each template
    - _Requirements: 9.1, 9.2_
  - [ ] 11.2 Create document generation API
    - Create `app/api/generate-document/route.ts`
    - Implement template variable substitution
    - Add field validation
    - _Requirements: 9.2, 9.5_
  - [ ] 11.3 Create DocumentGenerator component
    - Create `components/DocumentGenerator.tsx`
    - Template selector with descriptions
    - Dynamic form based on template required fields
    - Preview generated document
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  - [ ] 11.4 Create document generation tool page
    - Create `app/tools/generate/page.tsx`
    - Integrate DocumentGenerator component
    - Add to ToolsMenu
    - _Requirements: 9.1_
  - [ ] 11.5 Implement DOCX export for generated documents
    - Use docx library to generate Word documents
    - Include proper formatting and legal disclaimers
    - _Requirements: 9.3, 9.6_
  - [ ]* 11.6 Write property tests for document generation
    - **Property 17: Document Generation Validation**
    - **Validates: Requirements 9.5**

- [ ] 12. Final Integration and Polish
  - [ ] 12.1 Add navigation between features
    - Add Cases and Tasks to main navigation
    - Ensure consistent navigation across all pages
    - _Requirements: 12.1_
  - [ ] 12.2 Add dashboard overview
    - Create dashboard showing recent cases, upcoming deadlines, task stats
    - Quick access to all tools
    - _Requirements: 2.3, 3.5_
  - [ ] 12.3 Final mobile responsiveness check
    - Test all new features on mobile viewports
    - Fix any remaining responsive issues
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 13. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- P1 features (tasks 1-7) should be completed first for competitive advantage
- P2 features (tasks 8-11) add case/task management capabilities
- IndexedDB provides offline-capable local storage without backend infrastructure
