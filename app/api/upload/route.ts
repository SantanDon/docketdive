import { NextRequest, NextResponse } from 'next/server';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

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

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: PDF, DOCX, TXT' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let pageCount = 0;

    try {
      if (file.type === 'application/pdf') {
        const pdfData = await pdf(buffer);
        text = pdfData.text;
        pageCount = pdfData.numpages;
      } else if (file.name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
        pageCount = Math.ceil(text.length / 3000); // Estimate pages
      } else if (file.type === 'text/plain') {
        text = buffer.toString('utf-8');
        pageCount = Math.ceil(text.length / 3000); // Estimate pages
      }
    } catch (extractionError) {
      console.error('Extraction error:', extractionError);
      return NextResponse.json(
        { error: 'Failed to extract text from file. File may be corrupted.' },
        { status: 500 }
      );
    }

    // Validate extracted text
    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file' },
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
        wordCount: text.trim().split(/\s+/).length,
        charCount: text.length,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
