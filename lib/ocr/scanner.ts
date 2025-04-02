/**
 * OCR scanner service using Tesseract.js
 */
import { createWorker, createScheduler } from 'tesseract.js';
import { preprocessImage } from './imageProcessing';
import { 
  OCREngine, 
  OCRLanguage, 
  OCROptions, 
  OCRProgress, 
  OCRResult, 
  OCRStatus 
} from '@/types/ocr';

// Default OCR options
const DEFAULT_OPTIONS: OCROptions = {
  language: OCRLanguage.ENGLISH,
  enhanceContrast: true,
  preprocessImage: true,
  convertToGrayscale: true,
  detectionTimeout: 30000 // 30 seconds
};

/**
 * Process an image and extract text using OCR
 */
export async function processImage(
  imageSource: File | string | Blob,
  options: OCROptions = {}
): Promise<OCRResult> {
  const {
    language = DEFAULT_OPTIONS.language,
    onProgress,
    logger = console.log,
    preprocessImage: shouldPreprocess = DEFAULT_OPTIONS.preprocessImage,
    enhanceContrast = DEFAULT_OPTIONS.enhanceContrast,
    convertToGrayscale = DEFAULT_OPTIONS.convertToGrayscale
  } = options;
  
  // Create a scheduler for potential parallel processing in the future
  const scheduler = createScheduler();
  const worker = await createWorker({
    logger: message => {
      if (logger) logger(`OCR: ${message.status}`);
      
      if (onProgress) {
        onProgress({
          status: mapTesseractStatusToOCRStatus(message.status),
          progress: message.progress,
          message: message.status
        });
      }
    }
  });
  
  try {
    // Add worker to scheduler
    scheduler.addWorker(worker);
    
    // Initialize worker with language
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    // Process the image
    let imageData: string;
    
    if (typeof imageSource === 'string') {
      // URL or data URL
      imageData = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      // Convert blob/file to data URL
      imageData = await blobToDataURL(imageSource);
    } else {
      throw new Error('Invalid image source');
    }
    
    // Preprocess image if requested
    if (shouldPreprocess) {
      imageData = await preprocessImage(imageData, {
        grayscale: convertToGrayscale,
        contrast: enhanceContrast ? 1.5 : 1.0,
        resize: true,
        maxWidth: 1200,
        maxHeight: 1200
      });
    }
    
    // Recognize text in the image
    const { data } = await scheduler.addJob('recognize', imageData);
    
    // Map result to our OCR result type
    const result: OCRResult = {
      text: data.text,
      confidence: data.confidence / 100, // Tesseract gives confidence as 0-100, normalize to 0-1
      processingTimeMs: data.times.total
    };
    
    return result;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  } finally {
    // Clean up resources
    await scheduler.terminate();
  }
}

/**
 * Convert a blob to a data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Map Tesseract.js status to our OCR status enum
 */
function mapTesseractStatusToOCRStatus(status: string): OCRStatus {
  switch (status) {
    case 'loading tesseract core':
    case 'loading language traineddata':
      return OCRStatus.LOADING;
    case 'initializing tesseract':
    case 'initializing api':
      return OCRStatus.INITIALIZING;
    case 'recognizing text':
      return OCRStatus.RECOGNIZING;
    case 'done':
      return OCRStatus.COMPLETE;
    default:
      return OCRStatus.PROCESSING;
  }
}

/**
 * Get supported languages for OCR
 */
export function getSupportedLanguages(): { code: string; name: string }[] {
  return [
    { code: OCRLanguage.ENGLISH, name: 'English' },
    { code: OCRLanguage.SPANISH, name: 'Spanish' },
    { code: OCRLanguage.FRENCH, name: 'French' },
    { code: OCRLanguage.GERMAN, name: 'German' },
    { code: OCRLanguage.ITALIAN, name: 'Italian' },
    { code: OCRLanguage.PORTUGUESE, name: 'Portuguese' },
    { code: OCRLanguage.CHINESE, name: 'Chinese (Simplified)' },
    { code: OCRLanguage.JAPANESE, name: 'Japanese' },
    { code: OCRLanguage.KOREAN, name: 'Korean' },
    { code: OCRLanguage.ARABIC, name: 'Arabic' },
    { code: OCRLanguage.HINDI, name: 'Hindi' },
    { code: OCRLanguage.RUSSIAN, name: 'Russian' }
  ];
}

export default {
  processImage,
  getSupportedLanguages
}; 