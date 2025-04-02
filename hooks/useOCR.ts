/**
 * React hook for using OCR in client components
 */
import { useState, useCallback } from 'react';
import { createWorker, Worker } from 'tesseract.js';
import { OCRLanguage, OCROptions, OCRProgress, OCRResult, OCRStatus } from '@/types/ocr';

type OCRHookState = {
  text: string;
  isProcessing: boolean;
  progress: OCRProgress;
  error: Error | null;
  worker: Worker | null;
  result: OCRResult | null;
};

type OCRHookReturn = {
  text: string;
  isProcessing: boolean;
  progress: OCRProgress;
  error: Error | null;
  result: OCRResult | null;
  processImage: (image: File | Blob | string) => Promise<OCRResult>;
  cancelProcessing: () => void;
};

/**
 * Hook for OCR functionality
 */
export function useOCR(options: OCROptions = {}): OCRHookReturn {
  const [state, setState] = useState<OCRHookState>({
    text: '',
    isProcessing: false,
    progress: {
      status: OCRStatus.INITIALIZING,
      progress: 0,
    },
    error: null,
    worker: null,
    result: null,
  });

  /**
   * Convert a blob to a data URL
   */
  const blobToDataURL = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  /**
   * Process an image and extract text using OCR
   */
  const processImage = useCallback(
    async (image: File | Blob | string): Promise<OCRResult> => {
      try {
        setState(prev => ({
          ...prev,
          isProcessing: true,
          error: null,
          text: '',
          result: null,
        }));

        // Create a worker
        const worker = await createWorker({
          logger: message => {
            setState(prev => ({
              ...prev,
              progress: {
                status: message.status as any,
                progress: message.progress,
                message: message.status,
              },
            }));
          },
        });

        // Store the worker in the state
        setState(prev => ({ ...prev, worker }));

        // Initialize worker with language
        const language = options.language || OCRLanguage.ENGLISH;
        await worker.loadLanguage(language);
        await worker.initialize(language);

        // Convert the image to a data URL if it's a Blob or File
        let imageSource: string;
        if (typeof image === 'string') {
          imageSource = image;
        } else {
          imageSource = await blobToDataURL(image);
        }

        // Recognize text
        const { data } = await worker.recognize(imageSource);

        // Create the result
        const result: OCRResult = {
          text: data.text,
          confidence: data.confidence / 100, // Normalize to 0-1
          processingTimeMs: data.times.total,
        };

        // Update the state
        setState(prev => ({
          ...prev,
          isProcessing: false,
          text: data.text,
          result,
          progress: {
            status: OCRStatus.COMPLETE,
            progress: 1,
          },
        }));

        // Terminate the worker
        await worker.terminate();
        setState(prev => ({ ...prev, worker: null }));

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown OCR error');
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: err,
          progress: {
            status: OCRStatus.ERROR,
            progress: 0,
            message: err.message,
          },
        }));
        throw err;
      }
    },
    [options.language, blobToDataURL]
  );

  /**
   * Cancel the OCR processing
   */
  const cancelProcessing = useCallback(async () => {
    if (state.worker) {
      await state.worker.terminate();
      setState(prev => ({
        ...prev,
        isProcessing: false,
        worker: null,
        progress: {
          status: OCRStatus.ERROR,
          progress: 0,
          message: 'Processing canceled',
        },
      }));
    }
  }, [state.worker]);

  return {
    text: state.text,
    isProcessing: state.isProcessing,
    progress: state.progress,
    error: state.error,
    result: state.result,
    processImage,
    cancelProcessing,
  };
}

export default useOCR; 