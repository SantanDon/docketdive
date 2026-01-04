/**
 * OCR Service using Tesseract.js
 * Provides text extraction from images and scanned PDFs
 */

import type {
  OCRResult,
  OCROptions,
  OCRProgress,
  TextBlock,
} from '@/types/document-processing';

// Lazy-loaded worker instance
let workerInstance: any = null;
let isWorkerLoading = false;
let workerLoadPromise: Promise<any> | null = null;

/**
 * Initialize Tesseract worker lazily
 */
async function getWorker(language: string = 'eng'): Promise<any> {
  if (workerInstance) {
    return workerInstance;
  }

  if (isWorkerLoading && workerLoadPromise) {
    return workerLoadPromise;
  }

  isWorkerLoading = true;
  
  workerLoadPromise = (async () => {
    try {
      // Dynamic import to avoid loading Tesseract until needed
      const Tesseract = await import('tesseract.js');
      
      workerInstance = await Tesseract.createWorker(language, 1, {
        logger: (m: any) => {
          // Silent logger - progress handled separately
        },
      });

      return workerInstance;
    } catch (error) {
      isWorkerLoading = false;
      workerLoadPromise = null;
      throw error;
    }
  })();

  return workerLoadPromise;
}

/**
 * Terminate the worker to free resources
 */
export async function terminateOCRWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    isWorkerLoading = false;
    workerLoadPromise = null;
  }
}

/**
 * Perform OCR on an image or canvas element
 */
export async function performOCR(
  image: File | Blob | HTMLImageElement | HTMLCanvasElement | string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();
  const language = options.language || 'eng';
  
  // Notify loading status
  options.onProgress?.({
    status: 'loading',
    progress: 0,
  });

  try {
    const worker = await getWorker(language);
    
    // Set language if different from current
    if (language !== 'eng') {
      await worker.loadLanguage(language);
      await worker.initialize(language);
    }

    options.onProgress?.({
      status: 'recognizing',
      progress: 0.1,
    });

    // Perform recognition
    const result = await worker.recognize(image, {
      // Progress callback
    }, {
      text: true,
      blocks: true,
      hocr: false,
      tsv: false,
    });

    options.onProgress?.({
      status: 'recognizing',
      progress: 0.9,
    });

    const processingTime = Date.now() - startTime;
    const confidence = result.data.confidence;
    
    // Extract text blocks with positions
    const blocks: TextBlock[] = (result.data.blocks || []).map((block: any, idx: number) => ({
      text: block.text || '',
      confidence: block.confidence || 0,
      bbox: {
        x0: block.bbox?.x0 || 0,
        y0: block.bbox?.y0 || 0,
        x1: block.bbox?.x1 || 0,
        y1: block.bbox?.y1 || 0,
      },
      pageNumber: 1,
    }));

    options.onProgress?.({
      status: 'complete',
      progress: 1,
    });

    return {
      text: result.data.text || '',
      confidence: Math.round(confidence),
      blocks,
      processingTime,
      language: language === 'eng+afr' ? 'eng' : (language as 'eng' | 'afr'),
      showWarning: confidence < 70,
    };
  } catch (error: any) {
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Process multiple pages (for multi-page PDFs converted to images)
 */
export async function performMultiPageOCR(
  images: (File | Blob | HTMLImageElement | HTMLCanvasElement | string)[],
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();
  const totalPages = images.length;
  const allBlocks: TextBlock[] = [];
  let allText = '';
  let totalConfidence = 0;

  for (let i = 0; i < images.length; i++) {
    const pageNum = i + 1;
    
    options.onProgress?.({
      status: 'recognizing',
      progress: i / totalPages,
      currentPage: pageNum,
      totalPages,
    });

    const pageOptions: OCROptions = {
      language: options.language,
      pageNumbers: options.pageNumbers,
    };
    const pageResult = await performOCR(images[i]!, pageOptions);

    allText += (i > 0 ? '\n\n--- Page ' + pageNum + ' ---\n\n' : '') + pageResult.text;
    totalConfidence += pageResult.confidence;
    
    // Add page number to blocks
    pageResult.blocks.forEach(block => {
      allBlocks.push({
        ...block,
        pageNumber: pageNum,
      });
    });
  }

  const avgConfidence = Math.round(totalConfidence / totalPages);
  const processingTime = Date.now() - startTime;

  options.onProgress?.({
    status: 'complete',
    progress: 1,
    currentPage: totalPages,
    totalPages,
  });

  return {
    text: allText,
    confidence: avgConfidence,
    blocks: allBlocks,
    processingTime,
    language: options.language === 'afr' ? 'afr' : 'eng',
    showWarning: avgConfidence < 70,
  };
}

/**
 * Check if OCR is available (Tesseract can be loaded)
 */
export async function isOCRAvailable(): Promise<boolean> {
  try {
    await import('tesseract.js');
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate confidence score with warning threshold
 */
export function processOCRConfidence(confidence: number): { confidence: number; showWarning: boolean } {
  const normalizedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));
  return {
    confidence: normalizedConfidence,
    showWarning: normalizedConfidence < 70,
  };
}

export default {
  performOCR,
  performMultiPageOCR,
  terminateOCRWorker,
  isOCRAvailable,
  processOCRConfidence,
};
