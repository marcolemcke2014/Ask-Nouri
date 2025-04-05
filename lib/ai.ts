/**
 * AI service wrapper for calling OpenAI or Anthropic APIs
 */

import { systemPrompt } from './prompts';
import { AIProvider } from '@/types/ai';

// Types for API responses
export interface AIAnalysisResponse {
  items: MenuItemAnalysis[];
  error?: string;
}

export interface MenuItemAnalysis {
  name: string;
  score: number;
  tags: string[];
  flags: string[];
  improvements: string[];
}

/**
 * Call the AI API with the given prompt
 * @param prompt - The prompt text to send to the AI
 * @param provider - Which AI provider to use (defaults to OpenAI)
 * @returns Promise with the AI response
 */
export const callAI = async (
  prompt: string,
  provider: AIProvider = AIProvider.OPENAI
): Promise<AIAnalysisResponse> => {
  try {
    // Use the appropriate API based on the provider
    const apiEndpoint = provider === AIProvider.OPENAI 
      ? '/api/openai' 
      : '/api/anthropic';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        system: systemPrompt(),
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Try parsing the response as JSON
    let parsedItems: MenuItemAnalysis[] = [];
    
    try {
      // Check if response is already parsed JSON or a JSON string
      if (typeof data.content === 'string') {
        // Extract JSON from potential message wrapper
        const jsonMatch = data.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedItems = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      } else if (Array.isArray(data.content)) {
        parsedItems = data.content;
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return {
        items: [],
        error: 'Failed to parse AI response as JSON'
      };
    }

    return { items: parsedItems };
  } catch (error) {
    console.error('AI API error:', error);
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error calling AI API'
    };
  }
};

/**
 * Analyze menu text with user goals
 * @param menuText - OCR-extracted text from the menu
 * @param userGoals - Array of user health goals and preferences
 * @param provider - Which AI provider to use
 * @returns Promise with menu item analyses
 */
export const analyzeMenu = async (
  menuText: string,
  userGoals: string[],
  provider: AIProvider = AIProvider.OPENAI
): Promise<AIAnalysisResponse> => {
  // Import the prompt dynamically to avoid circular dependencies
  const { menuAnalyzerPrompt } = await import('./prompts');
  
  const prompt = menuAnalyzerPrompt(menuText, userGoals);
  return callAI(prompt, provider);
}; 