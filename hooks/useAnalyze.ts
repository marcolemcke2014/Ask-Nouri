import { useState, useCallback } from 'react';
import { AIAnalysisResponse, MenuItemAnalysis } from '../types/ai';
import { v4 as uuidv4 } from 'uuid';

interface AnalyzeState {
  isAnalyzing: boolean;
  results: MenuItemAnalysis[];
  error: string | null;
  lastAnalyzedAt: Date | null;
}

/**
 * Hook for handling menu text analysis with AI
 */
export const useAnalyze = () => {
  const [state, setState] = useState<AnalyzeState>({
    isAnalyzing: false,
    results: [],
    error: null,
    lastAnalyzedAt: null
  });

  /**
   * Analyze menu text with user goals
   */
  const analyzeMenu = useCallback(async (
    menuText: string, 
    userGoals: string[],
    dietaryRestrictions?: string[]
  ) => {
    if (!menuText || !userGoals.length) {
      setState(prev => ({
        ...prev,
        error: 'Menu text and user goals are required'
      }));
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Call the API endpoint to analyze the menu
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          menuText,
          userGoals,
          dietaryRestrictions
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update state with the analysis results
      setState(prev => ({
        ...prev,
        results: data.items || [],
        isAnalyzing: false,
        lastAnalyzedAt: new Date()
      }));
      
      return {
        id: data.id || uuidv4(),
        timestamp: data.timestamp || new Date().toISOString(),
        items: data.items || [],
        rawText: menuText,
        userGoals
      };
      
    } catch (error) {
      console.error('Menu analysis error:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown analysis error',
        isAnalyzing: false
      }));
      
      return null;
    }
  }, []);

  /**
   * Clear analysis results
   */
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      error: null
    }));
  }, []);

  return {
    ...state,
    analyzeMenu,
    clearResults
  };
}; 