import React, { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MenuAnalysis, MenuItem } from '../types';
import { analyzeMenu, cleanMenuText } from '../lib/ai/openai';
import { analyzeMenuWithClaude, cleanMenuTextWithClaude } from '../lib/ai/anthropic';
import { inMemoryDb } from '../lib/db/inMemoryDb';
import { UserProfileContext } from './UserProfileContext';

// Context type definition
interface MenuAnalysisContextType {
  isAnalyzing: boolean;
  analysis: MenuAnalysis | null;
  error: string | null;
  analyzeMenuText: (menuText: string, restaurantName?: string) => Promise<MenuAnalysis | null>;
  saveAnalysis: (analysis: MenuAnalysis) => Promise<void>;
  reset: () => void;
}

// Create context with default values
export const MenuAnalysisContext = createContext<MenuAnalysisContextType>({
  isAnalyzing: false,
  analysis: null,
  error: null,
  analyzeMenuText: async () => null,
  saveAnalysis: async () => {},
  reset: () => {},
});

// Provider component
interface MenuAnalysisProviderProps {
  children: ReactNode;
}

export const MenuAnalysisProvider: React.FC<MenuAnalysisProviderProps> = ({ children }) => {
  const { profile } = useContext(UserProfileContext);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MenuAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Choose AI service based on available API keys
  const chooseAIService = (): 'openai' | 'anthropic' => {
    // Check if environment has Anthropic API key
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    // Check if environment has OpenAI API key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (hasOpenAIKey) return 'openai';
    if (hasAnthropicKey) return 'anthropic';
    
    // Default to OpenAI (will likely fail if key isn't available)
    return 'openai';
  };

  // Analyze menu text
  const analyzeMenuText = useCallback(async (
    menuText: string, 
    restaurantName?: string
  ): Promise<MenuAnalysis | null> => {
    if (!profile) {
      setError('User profile not available');
      return null;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Determine which AI service to use
      const aiService = chooseAIService();
      
      // Clean the menu text first
      let cleanedText: string;
      if (aiService === 'openai') {
        cleanedText = await cleanMenuText(menuText);
      } else {
        cleanedText = await cleanMenuTextWithClaude(menuText);
      }
      
      // Analyze the cleaned menu text
      let menuItems: MenuItem[];
      if (aiService === 'openai') {
        const result = await analyzeMenu(
          cleanedText, 
          profile.healthGoals, 
          profile.dietaryRestrictions
        );
        menuItems = result.menuItems;
      } else {
        const result = await analyzeMenuWithClaude(
          cleanedText, 
          profile.healthGoals, 
          profile.dietaryRestrictions
        );
        menuItems = result.menuItems;
      }
      
      // Create analysis object
      const newAnalysis: MenuAnalysis = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        restaurantName,
        rawMenuText: menuText,
        cleanedMenuText: cleanedText,
        menuItems,
        userProfile: {
          healthGoals: profile.healthGoals,
          dietaryRestrictions: profile.dietaryRestrictions
        },
        aiModel: aiService
      };
      
      setAnalysis(newAnalysis);
      return newAnalysis;
    } catch (err: any) {
      console.error('Error analyzing menu:', err);
      setError(`Failed to analyze menu: ${err?.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [profile]);

  // Save analysis to database
  const saveAnalysis = useCallback(async (analysisToSave: MenuAnalysis): Promise<void> => {
    try {
      // Save to in-memory database
      inMemoryDb.createMenuAnalysis(analysisToSave);
      
      // Create scan history item
      const scanHistoryItem = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        restaurantName: analysisToSave.restaurantName,
        menuAnalysisId: analysisToSave.id,
        favoriteItems: []
      };
      
      inMemoryDb.createScanHistoryItem(scanHistoryItem);
    } catch (err: any) {
      console.error('Error saving analysis:', err);
      setError(`Failed to save analysis: ${err?.message || 'Unknown error'}`);
    }
  }, []);

  // Reset the state
  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return (
    <MenuAnalysisContext.Provider 
      value={{ 
        isAnalyzing, 
        analysis, 
        error, 
        analyzeMenuText, 
        saveAnalysis, 
        reset 
      }}
    >
      {children}
    </MenuAnalysisContext.Provider>
  );
};