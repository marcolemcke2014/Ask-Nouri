/**
 * Agent 4: Macro Profiler
 * Estimates the calories and macronutrient levels for a dish
 */

import { Agent, MacroProfile, StructuredMenuItem } from './types';
import { AIProvider } from '@/types/ai';
import { callAI } from '@/lib/ai';

export class MacroProfiler implements Agent<StructuredMenuItem, MacroProfile> {
  /**
   * Get the prompt for the macro profiler
   */
  getPrompt(input: StructuredMenuItem): string {    
    return `
You are a nutrition estimator. Given this menu item, estimate its macronutrient profile:

DISH: ${input.title}
${input.description ? `DESCRIPTION: ${input.description}` : ''}
${input.section ? `SECTION: ${input.section}` : ''}

Estimate:
1. Total calories (a specific number)
2. Protein level (High, Mid, or Low)
3. Carbs level (High, Mid, or Low)
4. Fat level (High, Mid, or Low)
5. Sugar level (High, Mid, or Low)
6. A confidence score (0-1) for your estimation

Base your estimates on standard restaurant portion sizes and cooking methods.
Use your knowledge of similar dishes and common ingredients.
If the description is vague, make a reasonable inference based on the dish name and restaurant context.

Return your analysis as valid JSON with this structure:
{
  "calories": 520,
  "protein": "High",
  "carbs": "High",
  "fat": "Mid",
  "sugar": "Low",
  "confidence": 0.85
}

For macro levels, use these guidelines:
- Protein: Low < 15g, Mid = 15-30g, High > 30g
- Carbs: Low < 30g, Mid = 30-60g, High > 60g
- Fat: Low < 10g, Mid = 10-25g, High > 25g
- Sugar: Low < 5g, Mid = 5-15g, High > 15g
`;
  }

  /**
   * Process a menu item to estimate its macronutrient profile
   */
  async process(
    input: StructuredMenuItem,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<MacroProfile> {
    try {
      const prompt = this.getPrompt(input);
      
      // Call the AI service
      const response = await callAI(prompt, provider);
      
      if (response.error) {
        console.error('Macro profiler error:', response.error);
        return this.getFallbackProfile();
      }
      
      // For now, we'll need to adapt the response format
      // Later we can update the AI service to return the exact format we need
      if (response.items.length > 0) {
        const item = response.items[0];
        
        // Map the tags to macros
        const macros = this.parseMacrosFromTags(item.tags);
        
        return {
          calories: item.score * 100 || 500, // Temporarily use score * 100 as calories
          protein: macros.protein || 'Mid',
          carbs: macros.carbs || 'Mid',
          fat: macros.fat || 'Mid',
          sugar: macros.sugar || 'Low',
          confidence: 0.7
        };
      }
      
      return this.getFallbackProfile();
    } catch (error) {
      console.error('Error in MacroProfiler:', error);
      return this.getFallbackProfile();
    }
  }
  
  /**
   * Parse macro levels from tags
   */
  private parseMacrosFromTags(tags: string[]): {
    protein?: 'High' | 'Mid' | 'Low';
    carbs?: 'High' | 'Mid' | 'Low';
    fat?: 'High' | 'Mid' | 'Low';
    sugar?: 'High' | 'Mid' | 'Low';
  } {
    const result: {
      protein?: 'High' | 'Mid' | 'Low';
      carbs?: 'High' | 'Mid' | 'Low';
      fat?: 'High' | 'Mid' | 'Low';
      sugar?: 'High' | 'Mid' | 'Low';
    } = {};
    
    // Look for tags that might indicate macro levels
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      
      if (lowerTag.includes('high protein')) {
        result.protein = 'High';
      } else if (lowerTag.includes('low protein')) {
        result.protein = 'Low';
      }
      
      if (lowerTag.includes('high carb')) {
        result.carbs = 'High';
      } else if (lowerTag.includes('low carb')) {
        result.carbs = 'Low';
      }
      
      if (lowerTag.includes('high fat')) {
        result.fat = 'High';
      } else if (lowerTag.includes('low fat')) {
        result.fat = 'Low';
      }
      
      if (lowerTag.includes('high sugar')) {
        result.sugar = 'High';
      } else if (lowerTag.includes('low sugar')) {
        result.sugar = 'Low';
      }
    }
    
    return result;
  }
  
  /**
   * Get a fallback profile when the AI service fails
   */
  private getFallbackProfile(): MacroProfile {
    return {
      calories: 500,
      protein: 'Mid',
      carbs: 'Mid',
      fat: 'Mid',
      sugar: 'Low',
      confidence: 0.5
    };
  }
}
