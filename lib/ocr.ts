/**
 * OCR implementation using a simpler approach due to MediaPipe limitations in Next.js
 */

import { OCRProvider, OCRResult, OCROptions } from '@/types/ocr';
import { GOOGLE_VISION_KEY } from '@/lib/env';

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
 * Supports both cloud-based (Google Vision) and local (MediaPipe) OCR
 */

// Default OCR provider
let defaultProvider: OCRProvider = OCRProvider.GOOGLE_VISION;

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
    case OCRProvider.GOOGLE_VISION:
      return extractTextWithGoogleVision(cleanedImageData);
    case OCRProvider.MEDIAPIPE:
      return extractTextWithMediaPipe(cleanedImageData);
    default:
      throw new Error(`Unsupported OCR provider: ${activeProvider}`);
  }
}

/**
 * Extract text from an image using Google Cloud Vision API
 * @param imageBase64 Base64 encoded image (without prefix)
 * @returns OCR result with extracted text
 */
async function extractTextWithGoogleVision(imageBase64: string): Promise<OCRResult> {
  try {
    // Use our environment variable module to access the Google Vision API key
    const API_KEY = GOOGLE_VISION_KEY;
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
    
    const requestData = {
      requests: [
        {
          image: {
            content: imageBase64
          },
          features: [
            {
              type: 'TEXT_DETECTION'
            }
          ]
        }
      ]
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Vision API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract text from response
    if (!data.responses?.[0]?.textAnnotations?.[0]?.description) {
      return {
        text: '',
        confidence: 0,
        processedAt: new Date()
      };
    }
    
    return {
      text: data.responses[0].textAnnotations[0].description,
      confidence: 0.9, // Google doesn't provide confidence scores for full text
      processedAt: new Date()
    };
  } catch (error) {
    console.error('Google Vision OCR error:', error);
    throw new Error(`Google Vision OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from an image using MediaPipe Vision (WebAssembly)
 * @param imageBase64 Base64 encoded image (without prefix)
 * @returns OCR result with extracted text
 */
async function extractTextWithMediaPipe(imageBase64: string): Promise<OCRResult> {
  try {
    // This is a placeholder for MediaPipe implementation
    // For a real implementation, you would:
    // 1. Load the MediaPipe WASM module
    // 2. Convert the base64 image to a format MediaPipe can process
    // 3. Run the text detection task
    
    console.warn('MediaPipe OCR implementation is a placeholder - use Google Vision for now');
    
    // Mock implementation for now
    return {
      text: "MediaPipe OCR not yet fully implemented",
      confidence: 0,
      processedAt: new Date()
    };
    
    // Real implementation would look something like:
    // const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
    // const textDetector = await TextDetector.createFromOptions(vision, {...});
    // const img = await createImageBitmap(imageBase64ToBlob(imageBase64));
    // const result = textDetector.detect(img);
    // return { text: result.text, confidence: result.confidence, processedAt: new Date() };
  } catch (error) {
    console.error('MediaPipe OCR error:', error);
    throw new Error(`MediaPipe OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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