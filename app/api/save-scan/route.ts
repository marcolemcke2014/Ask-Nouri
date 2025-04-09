import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromBuffer } from '@/lib/ocr';
import { OCRParser } from '@/lib/agents/ocr_parser/agent';
import { OCRResult } from '@/types/ocr';

/**
 * Type for the save scan request body
 */
interface SaveScanRequest {
  rawText: string;
  cleanedText?: string;
  items: Array<{
    name: string;
    score: number;
    tags: string[];
    flags: string[];
    improvements: string[];
  }>;
  restaurantName?: string;
  imageDataUrl?: string;
  userId?: string;
  userGoals?: string[];
}

/**
 * API endpoint to save OCR scan results and AI analysis
 * 
 * @param request The incoming request with scan data
 * @returns Confirmation with the saved scan ID
 */
export async function POST(request: Request) {
  try {
    // Get the image data from the request
    const imageBuffer = Buffer.from(await request.arrayBuffer());
    
    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing image of size: ${imageBuffer.length} bytes`);
    
    // Extract text from image using PaddleOCR
    try {
      const extractedText = await extractTextFromBuffer(imageBuffer);
      console.log('Extracted text from image:', extractedText);
      
      // Process through OCR parser agent
      const ocrParser = new OCRParser();
      const ocrResult: OCRResult = {
        text: extractedText,
        processedAt: new Date(),
        confidence: 0.9
      };
      
      const menuItems = await ocrParser.process(ocrResult);
      
      // Generate a unique ID for this scan
      const scanId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // In a real implementation, this would save to a database
      // For now, we'll just log it to demonstrate the endpoint works
      console.log(`Saving scan ${scanId} at ${timestamp}`);
      console.log(`Extracted ${menuItems.length} menu items`);
      
      // Return success response with the extracted text and menu items
      return NextResponse.json({
        success: true,
        id: scanId,
        timestamp,
        rawText: extractedText,
        items: menuItems,
        message: 'Menu scanned successfully'
      });
      
    } catch (error) {
      console.error('OCR processing error:', error);
      return NextResponse.json(
        { error: 'Failed to extract text from image' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in save scan endpoint:', error);
    
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
} 