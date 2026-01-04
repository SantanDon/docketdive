/**
 * Document Export API
 * 
 * POST /api/export - Export document to Word (.docx) or PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';

// ============================================
// Types
// ============================================

interface ExportRequest {
  content: string;
  format: 'docx' | 'pdf' | 'txt';
  title?: string;
  author?: string;
  metadata?: {
    documentType?: string;
    tone?: string;
    generatedAt?: string;
  };
}

// ============================================
// Markdown to DOCX Conversion
// ============================================

function parseMarkdownToDocx(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split('\n');
  
  let inList = false;
  let listItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const trimmedLine = line.trim();

    // Skip empty lines (but add spacing)
    if (!trimmedLine) {
      if (inList && listItems.length > 0) {
        // End list
        listItems.forEach(item => {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `• ${item}` })],
            indent: { left: 720 },
            spacing: { after: 100 },
          }));
        });
        listItems = [];
        inList = false;
      }
      continue;
    }

    // Headings
    if (trimmedLine.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.slice(2), bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.slice(3), bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }));
      continue;
    }

    if (trimmedLine.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.slice(4), bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
      continue;
    }

    // List items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine)) {
      inList = true;
      const itemText = trimmedLine.replace(/^[-*]\s|^\d+\.\s/, '');
      listItems.push(itemText);
      continue;
    }

    // Horizontal rule
    if (trimmedLine === '---' || trimmedLine === '***') {
      paragraphs.push(new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
        },
        spacing: { before: 200, after: 200 },
      }));
      continue;
    }

    // Regular paragraph with inline formatting
    const textRuns = parseInlineFormatting(trimmedLine);
    paragraphs.push(new Paragraph({
      children: textRuns,
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    }));
  }

  // Handle any remaining list items
  if (listItems.length > 0) {
    listItems.forEach(item => {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `• ${item}` })],
        indent: { left: 720 },
        spacing: { after: 100 },
      }));
    });
  }

  return paragraphs;
}

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let remaining = text;

  // Simple regex-based parsing for bold and italic
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, style: { bold: true } },
    { regex: /\*(.+?)\*/g, style: { italics: true } },
    { regex: /__(.+?)__/g, style: { bold: true } },
    { regex: /_(.+?)_/g, style: { italics: true } },
  ];

  // For simplicity, just handle bold for now
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }
    // Add bold text
    runs.push(new TextRun({ text: match[1] ?? '', bold: true }));
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  // If no formatting found, return plain text
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

// ============================================
// Document Generation
// ============================================

async function generateDocx(
  content: string,
  title: string,
  author: string
): Promise<Buffer> {
  const paragraphs = parseMarkdownToDocx(content);

  const doc = new Document({
    creator: author,
    title: title,
    description: 'Generated by DocketDive Legal AI',
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: title, size: 20, color: '666666' }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Page ', size: 20 }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 20,
                }),
                new TextRun({ text: ' of ', size: 20 }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: 'Generated by DocketDive Legal AI', 
                  size: 16, 
                  color: '999999',
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: paragraphs,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ============================================
// POST /api/export
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { content, format, title = 'Legal Document', author = 'DocketDive' } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (format === 'docx') {
      const buffer = await generateDocx(content, title, author);
      
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.docx"`,
        },
      });
    }

    if (format === 'txt') {
      // Strip markdown formatting for plain text
      const plainText = content
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^#+\s/gm, '')
        .replace(/^[-*]\s/gm, '• ');

      return new NextResponse(plainText, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.txt"`,
        },
      });
    }

    if (format === 'pdf') {
      // PDF generation would require additional library like pdfkit
      // For now, return an error suggesting docx
      return NextResponse.json(
        { error: 'PDF export coming soon. Please use DOCX format.' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}
