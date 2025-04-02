/**
 * Types related to OCR (Optical Character Recognition) functionality
 */

// Supported OCR engines
export enum OCREngine {
  TESSERACT = 'tesseract',
}

// Supported OCR languages
export enum OCRLanguage {
  ENGLISH = 'eng',
  SPANISH = 'spa',
  FRENCH = 'fra',
  GERMAN = 'deu',
  ITALIAN = 'ita',
  PORTUGUESE = 'por',
  CHINESE = 'chi_sim',
  JAPANESE = 'jpn',
  KOREAN = 'kor',
  ARABIC = 'ara',
  HINDI = 'hin',
  RUSSIAN = 'rus',
}

// OCR progress status
export enum OCRStatus {
  INITIALIZING = 'initializing',
  LOADING = 'loading',
  PROCESSING = 'processing',
  RECOGNIZING = 'recognizing',
  COMPLETE = 'complete',
  ERROR = 'error',
}

// OCR progress information
export type OCRProgress = {
  status: OCRStatus;
  progress: number; // 0 to 1
  message?: string;
};

// OCR options
export type OCROptions = {
  language?: OCRLanguage | string;
  onProgress?: (progress: OCRProgress) => void;
  logger?: (message: string) => void;
  preprocessImage?: boolean;
  enhanceContrast?: boolean;
  convertToGrayscale?: boolean;
  detectionTimeout?: number; // timeout in milliseconds
};

// OCR result for a region
export type OCRRegionResult = {
  text: string;
  confidence: number; // 0 to 1
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
};

// OCR result for the entire image
export type OCRResult = {
  text: string;
  confidence: number; // 0 to 1
  regions?: OCRRegionResult[];
  language?: string;
  processingTimeMs?: number;
};

// Image preprocessing options
export type ImagePreprocessingOptions = {
  resize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  grayscale?: boolean;
  contrast?: number; // 0 to 2, where 1 is normal
  brightness?: number; // 0 to 2, where 1 is normal
  threshold?: boolean;
  thresholdValue?: number; // 0 to 255
  denoise?: boolean;
  deskew?: boolean;
};

// Scanner configuration
export type ScannerConfig = {
  engine: OCREngine;
  defaultLanguage: OCRLanguage | string;
  workerPath?: string;
  corePath?: string;
  langPath?: string;
  cachePath?: string;
  defaultOptions?: OCROptions;
  imagePreprocessing?: ImagePreprocessingOptions;
}; 