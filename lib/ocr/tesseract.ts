import { createWorker } from 'tesseract.js';

// Global Tesseract worker instance
let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

// Initialize Tesseract with English language
export async function initTesseract(): Promise<void> {
  if (worker) return; // Already initialized
  
  try {
    worker = await createWorker('eng');
    console.log('Tesseract worker initialized successfully');
  } catch (error) {
    console.error('Error initializing Tesseract worker:', error);
    throw new Error('Failed to initialize OCR engine');
  }
}

// Terminate Tesseract worker to free up resources
export async function terminateTesseract(): Promise<void> {
  if (!worker) return;
  
  try {
    await worker.terminate();
    worker = null;
    console.log('Tesseract worker terminated');
  } catch (error) {
    console.error('Error terminating Tesseract worker:', error);
  }
}

// Process an image with OCR
export async function processImageOCR(imageDataUrl: string): Promise<{ text: string, confidence: number }> {
  if (!worker) {
    throw new Error('Tesseract worker not initialized');
  }
  
  try {
    // Process the image
    const result = await worker.recognize(imageDataUrl);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100 // Normalize to 0-1 range
    };
  } catch (error) {
    console.error('Error processing image with Tesseract:', error);
    throw new Error('OCR processing failed');
  }
}

// Process a menu image specifically - with pre/post processing optimized for menus
export async function processMenuImage(imageDataUrl: string): Promise<{
  text: string;
  confidence: number;
}> {
  try {
    // For menu images, we could add preprocessing here in the future
    // like contrast enhancement, deskewing, etc.
    
    // For now, just use standard OCR processing
    const result = await processImageOCR(imageDataUrl);
    
    // Post-process the text to clean up common OCR errors in menus
    const cleanedText = result.text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR errors for prices
      .replace(/\$(\s+)(\d+)/g, '$$$2')
      .trim();
    
    return {
      text: cleanedText,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Error processing menu image:', error);
    throw error;
  }
}