import React, { createContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { processMenuImage, initTesseract } from '../lib/ocr/tesseract';

// Context type definition
interface OCRContextType {
  isReady: boolean;
  isProcessing: boolean;
  result: string | null;
  confidence: number | null;
  error: string | null;
  processImage: (imageDataUrl: string) => Promise<void>;
  reset: () => void;
}

// Create context with default values
export const OCRContext = createContext<OCRContextType>({
  isReady: false,
  isProcessing: false,
  result: null,
  confidence: null,
  error: null,
  processImage: async () => {},
  reset: () => {},
});

// Provider component
interface OCRProviderProps {
  children: ReactNode;
}

export const OCRProvider: React.FC<OCRProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Tesseract when the component mounts
  useEffect(() => {
    const setupTesseract = async () => {
      try {
        await initTesseract();
        setIsReady(true);
      } catch (err) {
        console.error('Error initializing Tesseract:', err);
        setError('Failed to initialize OCR engine. Please reload the app.');
      }
    };

    if (!isReady && !isProcessing) {
      setupTesseract();
    }
    
    // No cleanup needed as Tesseract worker is managed globally
  }, [isReady, isProcessing]);

  // Process an image with OCR
  const processImage = useCallback(async (imageDataUrl: string) => {
    if (!isReady) {
      setError('OCR engine not ready. Please wait or reload the app.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      setConfidence(null);
      
      // Process the image
      const { text, confidence } = await processMenuImage(imageDataUrl);
      
      setResult(text);
      setConfidence(confidence);
    } catch (err: any) {
      console.error('Error processing image with OCR:', err);
      setError(`OCR processing failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isReady]);

  // Reset the OCR state
  const reset = useCallback(() => {
    setResult(null);
    setConfidence(null);
    setError(null);
  }, []);

  return (
    <OCRContext.Provider 
      value={{ 
        isReady, 
        isProcessing, 
        result, 
        confidence, 
        error, 
        processImage, 
        reset 
      }}
    >
      {children}
    </OCRContext.Provider>
  );
};