# Requirements Document

## Introduction

This document outlines requirements for integrating open-source libraries to enhance DocketDive's legal tools. Based on analysis of recommended projects (Tesseract.js, pdf.js, Compromise NLP), this spec focuses on practical, high-impact integrations that improve document processing, text extraction, and legal term detection.

## Analysis Summary

| Project | Purpose | Integration Benefit | Priority |
|---------|---------|---------------------|----------|
| Tesseract.js | OCR | Better text extraction from scanned PDFs | P1 |
| pdf.js | PDF rendering | Preview documents in-browser | P1 |
| Compromise | NLP | Entity extraction, legal term detection | P2 |
| Mammoth.js | DOCX conversion | Already using - enhance integration | P3 |

## Glossary

- **OCR_Engine**: Optical Character Recognition system that extracts text from images and scanned documents
- **PDF_Viewer**: In-browser component for rendering and navigating PDF documents
- **NLP_Processor**: Natural Language Processing module for entity extraction and term detection
- **Document_Processor**: Unified service handling document upload, text extraction, and preprocessing
- **Legal_Entity**: Named entities specific to legal documents (case citations, statute references, party names)
- **Scanned_PDF**: PDF document containing images of text rather than selectable text

## Requirements

### Requirement 1: OCR for Scanned Documents

**User Story:** As a user uploading scanned legal documents, I want the system to extract text from images, so that I can analyze documents that don't have selectable text.

#### Acceptance Criteria

1. WHEN a user uploads a PDF, THE Document_Processor SHALL detect if the PDF contains scanned images
2. WHEN a scanned PDF is detected, THE OCR_Engine SHALL extract text from the images
3. THE OCR_Engine SHALL support English and Afrikaans text recognition
4. WHEN OCR processing completes, THE Document_Processor SHALL display extraction confidence score
5. IF OCR confidence is below 70%, THEN THE Document_Processor SHALL warn the user about potential accuracy issues
6. THE OCR_Engine SHALL process documents within 30 seconds for files under 10 pages

### Requirement 2: In-Browser PDF Preview

**User Story:** As a user reviewing legal documents, I want to preview PDFs directly in the browser, so that I can reference the original document while viewing analysis results.

#### Acceptance Criteria

1. WHEN a PDF is uploaded, THE PDF_Viewer SHALL render the document in a preview panel
2. THE PDF_Viewer SHALL support page navigation (next, previous, go to page)
3. THE PDF_Viewer SHALL support zoom controls (zoom in, zoom out, fit to width)
4. THE PDF_Viewer SHALL highlight text when corresponding analysis results are selected
5. THE PDF_Viewer SHALL work on mobile devices with touch gestures
6. THE PDF_Viewer SHALL load the first page within 2 seconds for files under 5MB

### Requirement 3: Legal Entity Extraction

**User Story:** As a legal professional, I want the system to automatically identify legal entities in documents, so that I can quickly find case citations, statute references, and party names.

#### Acceptance Criteria

1. WHEN a document is processed, THE NLP_Processor SHALL extract South African case citations (e.g., "2023 (1) SA 123 (CC)")
2. THE NLP_Processor SHALL extract statute references (e.g., "Section 25 of the Constitution")
3. THE NLP_Processor SHALL identify party names and roles (Plaintiff, Defendant, Applicant, Respondent)
4. THE NLP_Processor SHALL extract dates and deadlines mentioned in the document
5. THE NLP_Processor SHALL provide entity type labels for each extracted entity
6. WHEN entities are extracted, THE Document_Processor SHALL display them in a categorized sidebar

### Requirement 4: Enhanced Document Upload Experience

**User Story:** As a user, I want a unified document upload experience across all tools, so that I can easily upload and process documents regardless of format.

#### Acceptance Criteria

1. THE Document_Processor SHALL accept PDF, DOCX, TXT, and image files (PNG, JPG)
2. WHEN an image file is uploaded, THE Document_Processor SHALL automatically apply OCR
3. THE Document_Processor SHALL show real-time processing progress with stage indicators
4. THE Document_Processor SHALL display document metadata (pages, words, file size) after processing
5. IF processing fails, THEN THE Document_Processor SHALL provide specific error messages and recovery suggestions
6. THE Document_Processor SHALL allow drag-and-drop upload across all legal tools

### Requirement 5: Legal Term Highlighting

**User Story:** As a user reading simplified documents, I want legal terms automatically highlighted and linked to definitions, so that I can understand terminology in context.

#### Acceptance Criteria

1. WHEN displaying document text, THE NLP_Processor SHALL identify legal terminology
2. THE NLP_Processor SHALL highlight identified legal terms with visual distinction
3. WHEN a user hovers over a highlighted term, THE System SHALL display a tooltip with the definition
4. THE NLP_Processor SHALL maintain a glossary of South African legal terms
5. THE NLP_Processor SHALL detect Latin legal phrases (e.g., "prima facie", "res judicata")
6. THE System SHALL allow users to add custom terms to their personal glossary

## Priority Matrix

| Requirement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| OCR for Scanned Documents | High | Medium | P1 |
| In-Browser PDF Preview | High | Medium | P1 |
| Enhanced Document Upload | High | Low | P1 |
| Legal Entity Extraction | Medium | Medium | P2 |
| Legal Term Highlighting | Medium | Medium | P2 |

## Implementation Notes

- Tesseract.js runs entirely in-browser (no server required for OCR)
- pdf.js is Mozilla's PDF renderer, well-maintained and performant
- Compromise NLP is lightweight (~200KB) and runs client-side
- All integrations should gracefully degrade if libraries fail to load
- Consider lazy-loading heavy libraries (Tesseract ~15MB worker)
