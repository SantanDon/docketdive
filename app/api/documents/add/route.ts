import { NextRequest, NextResponse } from 'next/server';
import { DataAPIClient } from '@datastax/astra-db-ts';
import { getEmbedding } from '../../utils/rag';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(process.env.ENDPOINT!);
const collection = db.collection(process.env.COLLECTION_NAME || 'docketdive');

const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 150;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.substring(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks.filter(chunk => chunk.length > 50);
}

export async function POST(request: NextRequest) {
  try {
    const { text, fileName, metadata, userId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    if (text.length > 500000) {
      return NextResponse.json(
        { error: 'Text too long (max 500,000 characters)' },
        { status: 400 }
      );
    }

    // Generate anonymous userId if not provided for privacy isolation
    const effectiveUserId = userId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No valid chunks could be created from text' },
        { status: 400 }
      );
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        if (!chunk) continue;
        const embedding = await getEmbedding(chunk);

        await collection.insertOne({
          content: chunk,
          metadata: {
            source: 'uploaded_document',
            fileName: fileName || 'Unknown',
            uploadDate: new Date().toISOString(),
            userId: effectiveUserId, // Critical: isolate documents by user
            isPrivate: true, // Mark as private document
            chunkIndex: i,
            totalChunks: chunks.length,
            title: fileName || 'Uploaded Document',
            category: metadata?.category || 'Legal Document',
            ...metadata,
          },
          $vector: embedding,
        });

        successCount++;
      } catch (error: any) {
        console.error(`Error storing chunk ${i}:`, error);
        errors.push(`Chunk ${i}: ${error.message}`);
      }
    }

    if (successCount === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to store any chunks',
          details: errors.slice(0, 5) 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chunksStored: successCount,
      totalChunks: chunks.length,
      errors: errors.length > 0 ? errors.slice(0, 3) : undefined,
      message: `Successfully added ${fileName} to knowledge base`,
      userId: effectiveUserId, // Return the userId for client reference
    });
  } catch (error: any) {
    console.error('Knowledge base addition error:', error);
    return NextResponse.json(
      { error: 'Failed to add to knowledge base' },
      { status: 500 }
    );
  }
}

