/**
 * Agent 6: Score Synthesizer
 * Combines all data points to produce a final health score and category
 */

import { 
  Agent, 
  ScoreSynthesis, 
  MacroProfile, 
  BenefitSummary, 
  UserProfile, 
  StructuredMenuItem 
} from './types';
import { AIProvider } from '@/types/ai';
import { callAI } from '@/lib/ai';

export interface ScoreSynthInput {
  dish: StructuredMenuItem;
  macros: MacroProfile;
  benefits: BenefitSummary;
  userProfile: UserProfile;
  initialScore?: number; // If available from DishScorer
}

export class ScoreSynth implements Agent<ScoreSynthInput, ScoreSynthesis> {
  /**
   * Get the prompt for the score synthesizer
   */
  getPrompt(input: ScoreSynthInput): string {
    const { dish, macros, benefits, userProfile, initialScore } = input;
    
    return `
You are a health score synthesizer. Analyze all data about this dish and determine a final health score and category.

DISH: ${dish.title}
${dish.description ? `DESCRIPTION: ${dish.description}` : ''}

USER GOALS: ${userProfile.goals.join(', ')}
USER RESTRICTIONS: ${userProfile.restrictions.join(', ')}

MACRO PROFILE:
- Calories: ${macros.calories}
- Protein: ${macros.protein}
- Carbs: ${macros.carbs}
- Fat: ${macros.fat}
- Sugar: ${macros.sugar}

HEALTH BENEFITS:
- Summary: ${benefits.summary}
- Short-term: ${benefits.shortTerm}
- Long-term: ${benefits.longTerm}

${initialScore ? `INITIAL HEALTH SCORE: ${initialScore}` : ''}

Your task:
1. Analyze how well this dish aligns with the user's health goals
2. Consider the balance of macronutrients and overall nutrition
3. Weigh both short and long-term health implications
4. Assign a final health score (0-100, higher = healthier)
5. Categorize as: 🥗 Healthiest, ⚖️ Balanced, or 🍔 Indulgent
6. Provide a confidence score (0-1)

Return your analysis as valid JSON with this structure:
{
  "score": 85,
  "category": "🥗 Healthiest",
  "confidence": 0.9
}

Important considerations:
- A dish can be "healthiest" even with higher calories if it's nutrient-dense
- Consider the overall balance, not just individual factors
- A dish aligned with user goals should score higher than general health scoring
`;
  }

  /**
   * Process all dish data to synthesize a final health score
   */
  async process(
    input: ScoreSynthInput,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<ScoreSynthesis> {
    try {
      const prompt = this.getPrompt(input);
      
      // Call the AI service
      const response = await callAI(prompt, provider);
      
      if (response.error) {
        console.error('Score synthesis error:', response.error);
        return this.getFallbackScore(input);
      }
      
      // For now, we need to adapt the response
      if (response.items.length > 0) {
        const item = response.items[0];
        
        // Calculate the category based on score
        let category: '🥗 Healthiest' | '⚖️ Balanced' | '🍔 Indulgent';
        const score = item.score * 10; // Convert from 0-10 to 0-100
        
        if (score >= 70) {
          category = '🥗 Healthiest';
        } else if (score >= 40) {
          category = '⚖️ Balanced';
        } else {
          category = '🍔 Indulgent';
        }
        
        return {
          score: score,
          category: category,
          confidence: 0.8
        };
      }
      
      return this.getFallbackScore(input);
    } catch (error) {
      console.error('Error in ScoreSynth:', error);
      return this.getFallbackScore(input);
    }
  }
  
  /**
   * Get a fallback score when the AI service fails
   */
  private getFallbackScore(input: ScoreSynthInput): ScoreSynthesis {
    let category: '🥗 Healthiest' | '⚖️ Balanced' | '🍔 Indulgent';
    const score = input.initialScore || 50;
    
    if (score >= 70) {
      category = '🥗 Healthiest';
    } else if (score >= 40) {
      category = '⚖️ Balanced';
    } else {
      category = '🍔 Indulgent';
    }
    
    return {
      score: score,
      category: category,
      confidence: 0.6
    };
  }
}
