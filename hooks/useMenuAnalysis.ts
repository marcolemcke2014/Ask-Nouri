import { useContext } from 'react';
import { MenuAnalysisContext } from '../contexts/MenuAnalysisContext';
import { MenuAnalysis } from '../types';

/**
 * Hook to access the MenuAnalysisContext
 * 
 * @deprecated Use useContext(MenuAnalysisContext) directly instead
 */
export function useMenuAnalysis() {
  return useContext(MenuAnalysisContext);
}