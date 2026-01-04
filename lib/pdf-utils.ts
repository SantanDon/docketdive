/**
 * PDF Utilities using pdf.js
 * Provides PDF text extraction and scanned document detection
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFTextContent {
  text: string;
  pageCount: number;
  hasTextLayer: boolean;
  textDensity: number; // chars per page
}

export interface PDFPageImage {
  dataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
}

/**
 * Load a PDF document from various sources
 */
export async function loadPDF(
  source: File | Blob | ArrayBuffer | string
): Promise<pdfjsLib.PDFDocumentProxy> {
  let data: ArrayBuffer | string;

  if (source instanceof File || source instanceof Blob) {
    data = await source.arrayBuffer();
  } else if (source instanceof ArrayBuffer) {
    data = source;
  } else {
    // Assume URL string
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  return loadingTask.promise;
}

/**
 * Extract text content from a PDF
 */
export async function extractPDFText(
  source: File | Blob | ArrayBuffer | string
): Promise<PDFTextContent> {
  const pdf = await loadPDF(source);
  const pageCount = pdf.numPages;
  let fullText = '';
  let totalChars = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    
    fullText += (i > 1 ? '\n\n' : '') + pageText;
    totalChars += pageText.length;
  }

  const textDensity = totalChars / pageCount;
  // Consider PDF as scanned if average text per page is very low
  const hasTextLayer = textDensity > 100;

  return {
    text: fullText.trim(),
    pageCount,
    hasTextLayer,
    textDensity,
  };
}

/**
 * Detect if a PDF is scanned (image-based) vs text-based
 * Returns true if the PDF appears to be scanned
 */
export async function isScannedPDF(
  source: File | Blob | ArrayBuffer | string
): Promise<boolean> {
  try {
    const { hasTextLayer, textDensity } = await extractPDFText(source);
    
    // If text density is very low, it's likely scanned
    // Typical text documents have 500+ chars per page
    return !hasTextLayer || textDensity < 50;
  } catch (error) {
    // If we can't extract text, assume it's scanned
    return true;
  }
}

/**
 * Convert PDF pages to images for OCR processing
 */
export async function pdfPagesToImages(
  source: File | Blob | ArrayBuffer | string,
  options: {
    scale?: number;
    pageNumbers?: number[];
  } = {}
): Promise<PDFPageImage[]> {
  const { scale = 2, pageNumbers } = options;
  const pdf = await loadPDF(source);
  const images: PDFPageImage[] = [];
  
  const pagesToProcess = pageNumbers || 
    Array.from({ length: pdf.numPages }, (_, i) => i + 1);

  for (const pageNum of pagesToProcess) {
    if (pageNum < 1 || pageNum > pdf.numPages) continue;
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    images.push({
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height,
      pageNumber: pageNum,
    });
  }

  return images;
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(
  source: File | Blob | ArrayBuffer | string
): Promise<{
  pageCount: number;
  title?: string | undefined;
  author?: string | undefined;
  creationDate?: Date | undefined;
}> {
  const pdf = await loadPDF(source);
  const metadata = await pdf.getMetadata();
  
  const creationDateStr = (metadata.info as any)?.CreationDate;
  
  return {
    pageCount: pdf.numPages,
    title: (metadata.info as any)?.Title || undefined,
    author: (metadata.info as any)?.Author || undefined,
    creationDate: creationDateStr ? new Date(creationDateStr) : undefined,
  };
}

export default {
  loadPDF,
  extractPDFText,
  isScannedPDF,
  pdfPagesToImages,
  getPDFMetadata,
};
