/**
 * OCR implementation using a simpler approach due to MediaPipe limitations in Next.js
 */

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