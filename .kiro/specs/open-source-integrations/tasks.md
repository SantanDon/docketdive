# Implementation Plan: Open-Source Integrations

## Overview

This implementation plan integrates Tesseract.js (OCR), pdf.js (PDF rendering), and Compromise (NLP) into DocketDive. Tasks are structured incrementally with test checkpoints to ensure stability. Each phase builds on the previous, with build verification between major features.

## Tasks

- [x] 1. Setup and Infrastructure
  - [x] 1.1 Install required dependencies
    - Install tesseract.js, pdfjs-dist, compromise packages
    - Add type definitions where needed
    - Verify build passes after installation
    - _Requirements: 1.1, 2.1, 3.1_
  - [x] 1.2 Create service type definitions
    - Create `types/document-processing.ts` with OCRResult, ExtractedEntities, ProcessedDocument interfaces
    - _Requirements: 1.1-1.6, 3.1-3.6, 4.1-4.6_
  - [x] 1.3 Create legal glossary data file
    - Create `data/legal-glossary.ts` with SA legal terms and Latin phrases
    - Include at least 50 common terms
    - _Requirements: 5.4, 5.5_

- [x] 2. Build Checkpoint - Infrastructure Complete
  - Run `npm run build` to verify no breaking changes
  - Ensure all existing tests pass

- [x] 3. Implement OCR Service (Tesseract.js)
  - [x] 3.1 Create OCR service module
    - Create `lib/ocr-service.ts`
    - Implement lazy worker loading
    - Add progress callback support
    - Support English and Afrikaans languages
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 3.2 Add scanned PDF detection
    - Create function to detect if PDF has text layer
    - Use pdf.js to check for text content
    - _Requirements: 1.1_
  - [x] 3.3 Implement confidence scoring and warnings
    - Calculate overall confidence from block confidences
    - Add warning flag when confidence < 70%
    - _Requirements: 1.4, 1.5_
  - [ ]* 3.4 Write property tests for OCR service
    - **Property 1: OCR Confidence Score Validity and Warning**
    - **Validates: Requirements 1.4, 1.5**

- [x] 4. Build Checkpoint - OCR Complete
  - Run `npm run build` to verify OCR integration
  - Test OCR with sample scanned PDF

- [x] 5. Implement PDF Viewer Component (pdf.js)
  - [x] 5.1 Create PDF viewer component
    - Create `components/PDFViewer.tsx`
    - Implement basic PDF rendering with pdf.js
    - Add loading state and error handling
    - _Requirements: 2.1, 2.6_
  - [x] 5.2 Add page navigation
    - Implement next/prev/goToPage functions
    - Add page bounds validation
    - Display current page / total pages
    - _Requirements: 2.2_
  - [x] 5.3 Add zoom controls
    - Implement zoom in/out/fit-to-width
    - Add scale bounds (25% - 400%)
    - _Requirements: 2.3_
  - [x] 5.4 Add text highlighting support
    - Implement text layer rendering
    - Add highlight overlay for selected text
    - _Requirements: 2.4_
  - [ ]* 5.5 Write property tests for PDF viewer
    - **Property 2: PDF Page Navigation Bounds**
    - **Property 3: Zoom Scale Bounds**
    - **Validates: Requirements 2.2, 2.3**

- [x] 6. Build Checkpoint - PDF Viewer Complete
  - Run `npm run build` to verify PDF viewer
  - Test viewer with sample PDF files

- [x] 7. Implement NLP Service (Compromise)
  - [x] 7.1 Create NLP service module
    - Create `lib/nlp-service.ts`
    - Initialize Compromise with legal plugins
    - _Requirements: 3.1-3.5_
  - [x] 7.2 Implement SA case citation extraction
    - Add regex patterns for SA citation formats
    - Extract year, volume, page, court
    - _Requirements: 3.1_
  - [x] 7.3 Implement statute reference extraction
    - Add patterns for "Section X of Act Y"
    - Extract act name, section, subsection
    - _Requirements: 3.2_
  - [x] 7.4 Implement party name extraction
    - Use Compromise for named entity recognition
    - Classify roles (plaintiff, defendant, etc.)
    - _Requirements: 3.3_
  - [x] 7.5 Implement date extraction
    - Extract dates in various formats
    - Classify as deadline, event, or reference
    - _Requirements: 3.4_
  - [ ]* 7.6 Write property tests for NLP service
    - **Property 4: Entity Extraction Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 8. Build Checkpoint - NLP Complete
  - Run `npm run build` to verify NLP integration
  - Test entity extraction with sample legal document

- [x] 9. Implement Legal Glossary Service
  - [x] 9.1 Create glossary service
    - Create `lib/legal-glossary.ts`
    - Implement term lookup and search
    - _Requirements: 5.4_
  - [x] 9.2 Add custom term support
    - Implement localStorage persistence
    - Add/remove custom terms
    - _Requirements: 5.6_
  - [x] 9.3 Implement term detection in text
    - Scan text for glossary terms
    - Return positions for highlighting
    - _Requirements: 5.1, 5.5_
  - [ ]* 9.4 Write property tests for glossary
    - **Property 9: Custom Glossary Round-Trip**
    - **Validates: Requirements 5.6**

- [x] 10. Build Checkpoint - Glossary Complete
  - Run `npm run build` to verify glossary service
  - Test term detection with sample text

- [x] 11. Integrate Enhanced Document Processor
  - [x] 11.1 Create unified document processor
    - Create `lib/document-processor.ts`
    - Orchestrate OCR, NLP, and glossary services
    - Implement processing stages with progress
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 11.2 Add file type handling
    - Validate file types (PDF, DOCX, TXT, images)
    - Route to appropriate processor
    - Auto-trigger OCR for images
    - _Requirements: 4.1, 4.2_
  - [x] 11.3 Implement metadata extraction
    - Extract page count, word count, char count
    - Detect if document is scanned
    - _Requirements: 4.4_
  - [x] 11.4 Add error handling
    - Implement specific error types
    - Add recovery suggestions
    - _Requirements: 4.5_
  - [ ]* 11.5 Write property tests for document processor
    - **Property 5: File Type Handling**
    - **Property 6: Document Metadata Completeness**
    - **Property 7: Error Message Specificity**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**

- [x] 12. Build Checkpoint - Document Processor Complete
  - Run `npm run build` to verify full pipeline
  - Test end-to-end document processing

- [x] 13. Create Entity Sidebar Component
  - [x] 13.1 Create entity sidebar component
    - Create `components/EntitySidebar.tsx`
    - Display extracted entities by category
    - Add click-to-highlight functionality
    - _Requirements: 3.6_
  - [x] 13.2 Add term tooltip component
    - Create `components/TermTooltip.tsx`
    - Show definition on hover
    - _Requirements: 5.3_

- [x] 14. Integrate with Existing Tools
  - [x] 14.1 Update DocumentDropzone with OCR support
    - Add OCR processing for scanned PDFs
    - Show OCR confidence in metadata
    - _Requirements: 1.1, 1.4, 4.6_
  - [ ] 14.2 Add PDF preview to Document Simplifier
    - Integrate PDFViewer component
    - Add side-by-side view option
    - _Requirements: 2.1_
  - [ ] 14.3 Add entity extraction to Contract Analyzer
    - Show extracted entities in sidebar
    - Highlight entities in analysis
    - _Requirements: 3.6_
  - [ ] 14.4 Add term highlighting to all tools
    - Integrate glossary term detection
    - Add tooltips for legal terms
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 15. Final Build and Test Checkpoint
  - Run `npm run build` to verify all integrations
  - Test all legal tools with various document types
  - Verify mobile responsiveness
  - Check for any performance regressions

- [ ] 16. Write Integration Tests
  - [ ]* 16.1 Write E2E tests for document upload flow
    - Test drag-and-drop with different file types
    - Test OCR processing feedback
    - _Requirements: 4.1, 4.3, 4.6_
  - [ ]* 16.2 Write E2E tests for PDF viewer
    - Test navigation and zoom
    - Test text highlighting
    - _Requirements: 2.1-2.5_
  - [ ]* 16.3 Write property test for legal term detection
    - **Property 8: Legal Term Detection**
    - **Validates: Requirements 5.1, 5.5**

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Build checkpoints ensure incremental stability
- Each major feature (OCR, PDF, NLP, Glossary) is self-contained
- Libraries are loaded lazily to minimize initial bundle size
- All processing happens client-side for privacy and offline support
- Test with real SA legal documents at each checkpoint
