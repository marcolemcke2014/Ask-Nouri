/**
 * OCR implementation for text extraction from images
 */

import { OCRProvider, OCRResult, OCROptions } from '../types/ocr';
import { extractTextWithPaddleOCR } from './ocr/paddleOCR';

// Use a mock implementation for now to get the app working
let isInitialized = false;

/**
 * Initializes the OCR system
 */
export const initOCR = async (): Promise<void> => {
  try {
    // For now, we'll just set a flag
    isInitialized = true;
    console.log('OCR system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OCR:', error);
    throw new Error('OCR initialization failed');
  }
};

/**
 * Performs OCR on an image
 * This is a simplified implementation until MediaPipe issues are resolved
 */
export const performOCR = async (
  imageSource: HTMLCanvasElement | HTMLImageElement | ImageBitmap
): Promise<string> => {
  if (!isInitialized) {
    await initOCR();
  }
  
  try {
    // For demo purposes, return a mock result
    // In a real implementation, this would process the image
    console.log('Processing OCR on image source');
    
    // Mock delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return "SAMPLE MENU\n\nAppetizers\nBruschetta $8.99\nMozzarella Sticks $7.99\nSpinach Artichoke Dip $9.99\n\nMain Courses\nGrilled Salmon $18.99\nChicken Parmesan $16.99\nVegetable Stir Fry $14.99\nSteak with Mushroom Sauce $22.99\n\nSides\nFrench Fries $3.99\nSide Salad $4.99\nGarlic Bread $2.99";
    
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('OCR processing failed');
  }
};

/**
 * Cleans up OCR results by removing extra whitespace, 
 * fixing common OCR errors, and formatting text
 */
export const cleanOCRResult = (text: string): string => {
  if (!text) return '';
  
  // Basic cleanup
  let cleaned = text
    .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
    .replace(/(\r\n|\n|\r)/gm, '\n')  // Normalize line breaks
    .trim();
    
  // Remove any non-printable characters
  cleaned = cleaned.replace(/[^\x20-\x7E\n]/g, '');
  
  return cleaned;
};

/**
 * OCR Service for text extraction from images
 * Supports PaddleOCR with OpenRouter vision fallback
 */

// Default OCR provider
let defaultProvider: OCRProvider = OCRProvider.PADDLE_OCR;

/**
 * Set the default OCR provider
 * @param provider The OCR provider to use
 */
export function setOCRProvider(provider: OCRProvider): void {
  defaultProvider = provider;
}

/**
 * Get the current OCR provider
 * @returns The current OCR provider
 */
export function getOCRProvider(): OCRProvider {
  return defaultProvider;
}

/**
 * Extract text from an image using OCR
 * @param imageData Base64 encoded image data (without the data:image/jpeg;base64, prefix)
 * @param options OCR options
 * @param provider Override the default OCR provider
 * @returns OCR result with extracted text
 */
export async function extractTextFromImage(
  imageData: string,
  options?: OCROptions,
  provider?: OCRProvider
): Promise<OCRResult> {
  const activeProvider = provider || defaultProvider;
  
  // Remove data URL prefix if present
  const cleanedImageData = imageData.replace(/^data:image\/\w+;base64,/, '');
  
  switch (activeProvider) {
    case OCRProvider.PADDLE_OCR:
      return extractTextWithPaddleOCR(Buffer.from(cleanedImageData, 'base64'))
        .then(text => ({
          text,
          confidence: 0.9,
          processedAt: new Date()
        }));
    default:
      throw new Error(`Unsupported OCR provider: ${activeProvider}`);
  }
}

/**
 * Extract text from an image buffer
 * @param imageBuffer Raw image buffer
 * @returns OCR result with extracted text
 */
export async function extractTextFromBuffer(imageBuffer: Buffer): Promise<string> {
  try {
    return await extractTextWithPaddleOCR(imageBuffer);
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper to capture a frame from a video element
 * @param videoElement The video element to capture from
 * @returns Base64 encoded image data
 */
export function captureImageFromVideo(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Draw the current video frame to the canvas
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  // Convert to base64 image
  return canvas.toDataURL('image/jpeg');
} 