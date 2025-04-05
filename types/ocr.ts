/**
 * OCR related type definitions
 */

/**
 * Raw OCR result from the OCR engine
 */
export interface OCRResult {
  text: string;
  confidence?: number;
  processedAt: Date;
}

/**
 * OCR text recognized from an image with metadata
 */
export interface OCRTextData {
  id: string;
  rawText: string;
  cleanedText: string;
  source: 'camera' | 'gallery' | 'screenshot';
  timestamp: Date;
  imageDataUrl?: string; // Base64 encoded image for reference
  confidence?: number; // Overall OCR confidence (0-1)
}

/**
 * OCR processing options
 */
export interface OCROptions {
  enhanceContrast?: boolean; // Whether to apply contrast enhancement
  detectOrientation?: boolean; // Auto-detect and correct text orientation
  cleanupSpaces?: boolean; // Clean up extra spaces and line breaks
  language?: string; // Language hint for the OCR engine
}

/**
 * OCR scan status
 */
export enum OCRStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * OCR bounding box for text regions
 */
export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * OCR text block with position information
 */
export interface OCRTextBlock {
  text: string;
  boundingBox: OCRBoundingBox;
  confidence: number;
  lines?: OCRTextBlock[];
}

/**
 * OCR service provider
 */
export enum OCRProvider {
  MEDIAPIPE = 'mediapipe',
  TESSERACT = 'tesseract',
  EXTERNAL_API = 'external-api'
} 