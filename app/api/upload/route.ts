import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
import { withErrorHandling } from '../utils/route-handler';

export const dynamic = 'force-dynamic';
const require = createRequire(import.meta.url);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const uploadHandler = async (request: Request) => {
  const pdf = require('pdf-parse');
  const mammoth = require('mammoth');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const enableOCR = formData.get('enableOCR') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type - now includes images
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    const isValidType = allowedTypes.includes(file.type) || 
                        file.name.endsWith('.docx') ||
                        file.name.endsWith('.pdf') ||
                        file.name.endsWith('.txt') ||
                        file.name.match(/\.(png|jpg|jpeg)$/i);

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: PDF, DOCX, TXT, PNG, JPG' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let pageCount = 0;
    let isScanned = false;
    let ocrConfidence: number | undefined;

    // Check if this is an image file
    const isImage = file.type.startsWith('image/') || 
                    file.name.match(/\.(png|jpg|jpeg)$/i);

    try {
      if (isImage) {
        // For images, we need OCR - return a message that OCR should be done client-side
        // Since Tesseract.js runs in the browser, we'll return the base64 image
        // and let the client handle OCR
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/png';
        
        return NextResponse.json({
          success: true,
          requiresClientOCR: true,
          imageData: `data:${mimeType};base64,${base64}`,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            pageCount: 1,
            wordCount: 0,
            charCount: 0,
            isScanned: true,
          },
        });
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        console.log(`Processing PDF: ${file.name}, size: ${buffer.length} bytes`);
        const pdfData = await pdf(buffer);
        text = pdfData.text || '';
        pageCount = pdfData.numpages || 0;
        console.log(`Extracted ${text.length} characters from ${pageCount} pages`);
        
        // Check if PDF might be scanned (very little text for the number of pages)
        const avgCharsPerPage = text.length / Math.max(pageCount, 1);
        if (avgCharsPerPage < 100 && pageCount > 0) {
          isScanned = true;
          // For scanned PDFs, return info that OCR is needed client-side
          // We can't easily extract images from PDF server-side without heavy dependencies
          console.log('PDF appears to be scanned, minimal text extracted');
        }
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
        pageCount = Math.ceil(text.length / 3000); // Estimate pages
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = buffer.toString('utf-8');
        pageCount = Math.ceil(text.length / 3000); // Estimate pages
      }
    } catch (extractionError) {
      console.error('Extraction error:', extractionError);
      return NextResponse.json(
        { error: 'Failed to extract text from file. File may be corrupted or password protected.' },
        { status: 500 }
      );
    }

    // Validate extracted text (unless it's a scanned document)
    if (!isScanned && (!text || text.trim().length < 10)) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file. If this is a scanned document, try uploading as an image.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: text.trim(),
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pageCount,
        wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length,
        charCount: text.length,
        isScanned,
        ocrConfidence,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
};

export const POST = withErrorHandling(uploadHandler);
