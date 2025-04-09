/**
 * Agent 2: Dish Scorer & Menu Summary
 * Scores each dish (0-100) based on nutritional value
 * Provides an overall menu category assessment
 */

import { Agent, StructuredMenuItem, ScoredMenuItem, MenuSummary } from './types';
import { AIProvider } from '@/types/ai';
import { callAI } from '@/lib/ai';

export interface DishScorerOutput {
  scoredItems: ScoredMenuItem[];
  menuSummary: MenuSummary;
}

export class DishScorer implements Agent<StructuredMenuItem[], DishScorerOutput> {
  /**
   * Get the prompt for the dish scorer
   */
  getPrompt(input: StructuredMenuItem[]): string {
    const menuItems = JSON.stringify(input, null, 2);
    
    return `
You are a food health analyzer. For each dish in the provided menu, assign a health score from 0-100 based on nutrition, processing level, sodium content, additives, macro balance, etc.

Menu Items:
${menuItems}

For each dish:
1. Score from 0-100 (higher = healthier)
2. Provide a confidence level from 0-1 based on how certain you are about the score

Then:
1. Calculate an average menu score (weighted by confidence)
2. Classify the menu overall as one of: [🥗 Healthy, ⚖️ Balanced, 🍟 Indulgent]
3. Provide a confidence value (0-1) for this classification

Return your analysis as valid JSON with this structure:
{
  "scoredItems": [
    {
      "title": "Dish name",
      "description": "Description (if available)",
      "price": "Price (if available)",
      "section": "Section (if available)",
      "score": 75,
      "confidence": 0.8
    },
    ...
  ],
  "menuSummary": {
    "averageScore": 65,
    "category": "⚖️ Balanced",
    "confidence": 0.85
  }
}

Use all available information to make your assessment, but prioritize nutrition science over subjective judgments.
`;
  }

  /**
   * Process structured menu items into scored items with a menu summary
   */
  async process(
    input: StructuredMenuItem[],
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<DishScorerOutput> {
    try {
      const prompt = this.getPrompt(input);
      
      // Call the AI service
      const response = await callAI(prompt, provider);
      
      if (response.error) {
        console.error('Dish scorer error:', response.error);
        
        // Return a fallback response with the input items and a default score
        const fallbackItems = input.map(item => ({
          ...item,
          score: 50,
          confidence: 0.5
        }));
        
        return {
          scoredItems: fallbackItems,
          menuSummary: {
            averageScore: 50,
            category: '⚖️ Balanced',
            confidence: 0.5
          }
        };
      }
      
      // The existing AI response format doesn't match what we need
      // We'll need to parse the content and adapt it to our structure
      
      // This is a temporary adapter until we change the AI response format
      // For now, we'll create a basic mapping that uses our input and adds scores
      const scoredItems: ScoredMenuItem[] = input.map((item, index) => {
        // Use the AI response if available, otherwise assign a default
        const aiItem = response.items[index];
        
        return {
          ...item,
          score: aiItem ? aiItem.score * 10 : 50, // Convert 0-10 to 0-100
          confidence: 0.7 // Default confidence
        };
      });
      
      // Calculate the average score
      const totalScore = scoredItems.reduce((sum, item) => sum + item.score, 0);
      const averageScore = totalScore / scoredItems.length;
      
      // Determine the menu category based on average score
      let category: '🥗 Healthy' | '⚖️ Balanced' | '🍟 Indulgent';
      if (averageScore >= 70) {
        category = '🥗 Healthy';
      } else if (averageScore >= 40) {
        category = '⚖️ Balanced';
      } else {
        category = '🍟 Indulgent';
      }
      
      return {
        scoredItems,
        menuSummary: {
          averageScore,
          category,
          confidence: 0.7
        }
      };
    } catch (error) {
      console.error('Error in DishScorer:', error);
      
      // Return a fallback response
      const fallbackItems = input.map(item => ({
        ...item,
        score: 50,
        confidence: 0.5
      }));
      
      return {
        scoredItems: fallbackItems,
        menuSummary: {
          averageScore: 50,
          category: '⚖️ Balanced',
          confidence: 0.5
        }
      };
    }
  }
}
