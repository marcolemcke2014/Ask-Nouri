import { useContext } from 'react';
import { OCRContext } from '../contexts/OCRContext';

/**
 * Hook to access the OCRContext
 *
 * @deprecated Use useContext(OCRContext) directly instead
 */
export function useOCR() {
  return useContext(OCRContext);
}