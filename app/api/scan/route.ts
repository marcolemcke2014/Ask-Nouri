/**
 * API route for OCR processing of menu images
 */
import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/lib/ocr/scanner';
import { OCRLanguage } from '@/types/ocr';

// Set max content length to 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

// Define runtime environment (can be 'edge' or 'nodejs')
export const runtime = 'nodejs'; // Using nodejs for Tesseract.js compatibility

/**
 * POST handler for OCR processing
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart/form-data (direct file upload)
      const formData = await request.formData();
      const imageFile = formData.get('image') as File | null;
      const language = formData.get('language') as string || OCRLanguage.ENGLISH;
      
      if (!imageFile) {
        return NextResponse.json(
          { error: 'Image file is required' },
          { status: 400 }
        );
      }
      
      // Process the image with OCR
      const result = await processImage(imageFile, {
        language,
        enhanceContrast: true,
        preprocessImage: true
      });
      
      return NextResponse.json({
        text: result.text,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs
      });
    } else {
      // Handle JSON request (base64 image data)
      const body = await request.json();
      
      if (!body.imageData) {
        return NextResponse.json(
          { error: 'Image data is required' },
          { status: 400 }
        );
      }
      
      const imageData = body.imageData;
      const language = body.language || OCRLanguage.ENGLISH;
      
      // Validate base64 image data
      if (!imageData.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image data format' },
          { status: 400 }
        );
      }
      
      // Process the image with OCR
      const result = await processImage(imageData, {
        language,
        enhanceContrast: body.enhanceContrast !== false,
        preprocessImage: body.preprocessImage !== false
      });
      
      return NextResponse.json({
        text: result.text,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs
      });
    }
  } catch (error) {
    console.error('Error processing OCR:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 