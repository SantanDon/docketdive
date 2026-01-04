// ============================================
// OCR Types (Tesseract.js)
// ============================================

export interface OCRResult {
  text: string;
  confidence: number; // 0-100
  blocks: TextBlock[];
  processingTime: number;
  language: 'eng' | 'afr';
  showWarning: boolean; // true if confidence < 70
}

export interface TextBlock {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  pageNumber: number;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCROptions {
  language?: 'eng' | 'afr' | 'eng+afr' | undefined;
  pageNumbers?: number[] | undefined;
  onProgress?: ((progress: OCRProgress) => void) | undefined;
}

export interface OCRProgress {
  status: 'loading' | 'recognizing' | 'complete';
  progress: number; // 0-1
  currentPage?: number;
  totalPages?: number;
}

// ============================================
// PDF Viewer Types (pdf.js)
// ============================================

export interface PDFViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
}

export interface TextHighlight {
  id: string;
  text: string;
  page: number;
  color?: string;
  onClick?: () => void;
}

export interface PDFViewerRef {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setScale: (scale: number) => void;
  fitToWidth: () => void;
  highlightText: (text: string, page: number) => void;
}

// ============================================
// NLP Types (Compromise)
// ============================================

export interface ExtractedEntities {
  caseCitations: CaseCitation[];
  statuteReferences: StatuteReference[];
  parties: PartyEntity[];
  dates: DateEntity[];
  legalTerms: LegalTerm[];
}

export interface CaseCitation {
  text: string;
  year?: number | undefined;
  volume?: string | undefined;
  page?: string | undefined;
  court?: string | undefined;
  position: TextPosition;
}

export interface StatuteReference {
  text: string;
  actName: string;
  section?: string | undefined;
  subsection?: string | undefined;
  position: TextPosition;
}

export interface PartyEntity {
  name: string;
  role: 'plaintiff' | 'defendant' | 'applicant' | 'respondent' | 'appellant' | 'other';
  position: TextPosition;
}

export interface DateEntity {
  text: string;
  date: Date | null;
  type: 'deadline' | 'event' | 'reference';
  position: TextPosition;
}

export interface LegalTerm {
  term: string;
  definition: string;
  isLatin: boolean;
  position: TextPosition;
}

export interface TextPosition {
  start: number;
  end: number;
}

// ============================================
// Document Processor Types
// ============================================

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'image';
  text: string;
  metadata: DocumentMetadata;
  entities: ExtractedEntities;
  ocrResult?: OCRResult | undefined;
  processingStages: ProcessingStage[];
}

export interface DocumentMetadata {
  pageCount: number;
  wordCount: number;
  charCount: number;
  fileSize: number;
  isScanned: boolean;
  language: string;
}

export interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string | undefined;
}

export type ProcessingCallback = (stages: ProcessingStage[]) => void;

// ============================================
// Legal Glossary Types
// ============================================

export interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'latin' | 'procedural' | 'substantive' | 'custom';
  source?: string;
}

export interface StoredGlossary {
  version: number;
  terms: GlossaryTerm[];
  updatedAt: string;
}

// ============================================
// Error Types
// ============================================

export type DocumentProcessingError = 
  | { type: 'FILE_TOO_LARGE'; maxSize: number; actualSize: number }
  | { type: 'UNSUPPORTED_FORMAT'; format: string; supported: string[] }
  | { type: 'OCR_FAILED'; reason: string; suggestion: string }
  | { type: 'PDF_CORRUPTED'; suggestion: string }
  | { type: 'NLP_FAILED'; reason: string }
  | { type: 'NETWORK_ERROR'; suggestion: string };

export const ERROR_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: "File exceeds maximum size. Try compressing the PDF or splitting into smaller files.",
  UNSUPPORTED_FORMAT: "File format not supported. Please upload PDF, DOCX, TXT, or image files.",
  OCR_FAILED: "Text extraction failed. The document may be too blurry or damaged.",
  PDF_CORRUPTED: "PDF file appears corrupted. Try re-saving or re-scanning the document.",
  NLP_FAILED: "Entity extraction failed. The document will be processed without entity highlighting.",
  NETWORK_ERROR: "Network connection lost. Your document is saved locally and will process when reconnected.",
};
