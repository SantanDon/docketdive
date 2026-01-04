/**
 * Enhanced Document Processor
 * Orchestrates OCR, NLP, and glossary services for document processing
 */

import type {
  ProcessedDocument,
  DocumentMetadata,
  ProcessingStage,
  ProcessingCallback,
  ExtractedEntities,
  OCRResult,
  DocumentProcessingError,
  OCROptions,
} from '@/types/document-processing';
import { performOCR } from './ocr-service';
import { extractEntities } from './nlp-service';
import { detectTermsInText } from './legal-glossary';
import { extractPDFText, isScannedPDF } from './pdf-utils';

// Supported file types
const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Process a document through the full pipeline
 */
export async function processDocument(
  file: File,
  onProgress?: ProcessingCallback
): Promise<ProcessedDocument> {
  const stages: ProcessingStage[] = [
    { name: 'Validation', status: 'pending', progress: 0 },
    { name: 'Text Extraction', status: 'pending', progress: 0 },
    { name: 'Entity Extraction', status: 'pending', progress: 0 },
    { name: 'Term Detection', status: 'pending', progress: 0 },
  ];

  const updateStage = (index: number, updates: Partial<ProcessingStage>) => {
    const current = stages[index];
    if (current) {
      stages[index] = {
        name: updates.name ?? current.name,
        status: updates.status ?? current.status,
        progress: updates.progress ?? current.progress,
        error: updates.error ?? current.error,
      };
    }
    onProgress?.(stages);
  };

  // Stage 1: Validation
  updateStage(0, { status: 'processing', progress: 0 });
  
  const validation = validateFile(file);
  if (!validation.valid) {
    updateStage(0, { status: 'error', error: validation.error });
    throw new Error(validation.error);
  }
  
  updateStage(0, { status: 'complete', progress: 100 });

  // Determine file type
  const fileType = getFileType(file.name);
  const isImage = IMAGE_EXTENSIONS.includes(fileType);
  
  // Stage 2: Text Extraction
  updateStage(1, { status: 'processing', progress: 0 });
  
  let text = '';
  let ocrResult: OCRResult | undefined;
  let isScanned = false;
  let pageCount = 1;

  try {
    if (isImage) {
      // Images always need OCR
      ocrResult = await performOCR(file, {
        onProgress: (p) => updateStage(1, { progress: p.progress * 100 }),
      });
      text = ocrResult.text;
      isScanned = true;
    } else if (fileType === 'pdf') {
      // Check if PDF is scanned
      const pdfContent = await extractPDFText(file);
      isScanned = await isScannedPDF(file);
      pageCount = pdfContent.pageCount;
      
      if (isScanned || pdfContent.text.trim().length < 100) {
        // Scanned PDF - use OCR
        ocrResult = await performOCR(file, {
          onProgress: (p) => updateStage(1, { progress: p.progress * 100 }),
        });
        text = ocrResult.text;
      } else {
        text = pdfContent.text;
      }
    } else if (fileType === 'txt') {
      text = await file.text();
    } else if (fileType === 'docx') {
      // For DOCX, we'd use mammoth.js - for now just read as text
      text = await file.text();
    }
    
    updateStage(1, { status: 'complete', progress: 100 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Text extraction failed';
    updateStage(1, { status: 'error', error: errorMsg });
    throw error;
  }

  // Stage 3: Entity Extraction
  updateStage(2, { status: 'processing', progress: 0 });
  
  let entities: ExtractedEntities;
  try {
    entities = extractEntities(text);
    updateStage(2, { status: 'complete', progress: 100 });
  } catch (error) {
    // NLP failure is non-fatal - continue with empty entities
    console.warn('NLP extraction failed:', error);
    entities = {
      caseCitations: [],
      statuteReferences: [],
      parties: [],
      dates: [],
      legalTerms: [],
    };
    updateStage(2, { status: 'complete', progress: 100, error: 'Entity extraction partially failed' });
  }

  // Stage 4: Term Detection
  updateStage(3, { status: 'processing', progress: 0 });
  
  try {
    const termMatches = detectTermsInText(text);
    // Add detected terms to entities if not already present
    for (const match of termMatches) {
      const exists = entities.legalTerms.some(
        t => t.term.toLowerCase() === match.term.term.toLowerCase()
      );
      if (!exists) {
        entities.legalTerms.push({
          term: match.term.term,
          definition: match.term.definition,
          isLatin: match.term.category === 'latin',
          position: { start: match.start, end: match.end },
        });
      }
    }
    updateStage(3, { status: 'complete', progress: 100 });
  } catch (error) {
    console.warn('Term detection failed:', error);
    updateStage(3, { status: 'complete', progress: 100, error: 'Term detection partially failed' });
  }

  // Build metadata
  const metadata: DocumentMetadata = {
    pageCount,
    wordCount: countWords(text),
    charCount: text.length,
    fileSize: file.size,
    isScanned,
    language: ocrResult?.language || 'eng',
  };

  // Build result
  const result: ProcessedDocument = {
    id: generateId(),
    fileName: file.name,
    fileType: fileType as ProcessedDocument['fileType'],
    text,
    metadata,
    entities,
    ocrResult,
    processingStages: stages,
  };

  return result;
}


/**
 * Validate a file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
    };
  }

  // Check file type
  const ext = getFileType(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (.${ext}). Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}.`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension/type
 */
export function getFileType(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts[parts.length - 1] || '';
}

/**
 * Check if file type is supported
 */
export function isSupported(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(getFileType(fileName));
}

/**
 * Check if file is an image
 */
export function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileType(fileName));
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a processing error with recovery suggestion
 */
export function createProcessingError(
  type: DocumentProcessingError['type'],
  details?: Record<string, unknown>
): DocumentProcessingError {
  switch (type) {
    case 'FILE_TOO_LARGE':
      return {
        type: 'FILE_TOO_LARGE',
        maxSize: MAX_FILE_SIZE,
        actualSize: (details?.actualSize as number) || 0,
      };
    case 'UNSUPPORTED_FORMAT':
      return {
        type: 'UNSUPPORTED_FORMAT',
        format: (details?.format as string) || 'unknown',
        supported: SUPPORTED_EXTENSIONS,
      };
    case 'OCR_FAILED':
      return {
        type: 'OCR_FAILED',
        reason: (details?.reason as string) || 'Unknown error',
        suggestion: 'Try re-scanning the document with higher quality.',
      };
    case 'PDF_CORRUPTED':
      return {
        type: 'PDF_CORRUPTED',
        suggestion: 'Try re-saving or re-scanning the document.',
      };
    case 'NLP_FAILED':
      return {
        type: 'NLP_FAILED',
        reason: (details?.reason as string) || 'Unknown error',
      };
    case 'NETWORK_ERROR':
      return {
        type: 'NETWORK_ERROR',
        suggestion: 'Check your internet connection and try again.',
      };
    default:
      return {
        type: 'NLP_FAILED',
        reason: 'Unknown error occurred',
      };
  }
}

/**
 * Get error message for display
 */
export function getErrorMessage(error: DocumentProcessingError): string {
  switch (error.type) {
    case 'FILE_TOO_LARGE':
      return `File exceeds maximum size of ${formatFileSize(error.maxSize)}. Your file is ${formatFileSize(error.actualSize)}.`;
    case 'UNSUPPORTED_FORMAT':
      return `File format .${error.format} is not supported. Please upload: ${error.supported.join(', ')}.`;
    case 'OCR_FAILED':
      return `Text extraction failed: ${error.reason}. ${error.suggestion}`;
    case 'PDF_CORRUPTED':
      return `PDF file appears corrupted. ${error.suggestion}`;
    case 'NLP_FAILED':
      return `Entity extraction failed: ${error.reason}. Document will be processed without entity highlighting.`;
    case 'NETWORK_ERROR':
      return `Network error occurred. ${error.suggestion}`;
    default:
      return 'An unknown error occurred during processing.';
  }
}

export default {
  processDocument,
  validateFile,
  getFileType,
  isSupported,
  isImageFile,
  formatFileSize,
  createProcessingError,
  getErrorMessage,
};
