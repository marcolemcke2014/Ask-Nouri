/**
 * Agent 3: Dish Ranker + Health Scorer
 * Assigns a health score (0-100) and category to dishes
 */

import { Agent, MenuItem, MacroProfile, DishScore, UserProfile } from '../types';
import { generateDishRankerPrompt } from './prompts/ranking';
import { AIProvider } from '@/types/ai';

// Local AI integration - should be replaced with your actual AI client
// We're stubbing this function since the actual implementation depends
// on your AI service
async function callAI(
  prompt: string, 
  provider: AIProvider = AIProvider.OPENAI
): Promise<any> {
  // This would call your OpenAI or other AI service
  // For now, we'll just log the prompt and return a mock response
  console.log(`[AI Request] Provider: ${provider}`);
  console.log(`Prompt: ${prompt.substring(0, 100)}...`);
  
  // Mock response - in production this would come from the AI
  return {
    healthScore: 75,
    category: "Balanced",
    reasoning: "This is a mock response since we're not calling a real AI service."
  };
}

export interface DishRankerInput {
  dish: MenuItem;
  macros: MacroProfile;
  userProfile?: UserProfile;
}

export class DishRanker implements Agent<DishRankerInput, DishScore> {
  /**
   * Score a dish based on its macronutrient profile and user preferences
   */
  async process(
    input: DishRankerInput,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<DishScore> {
    try {
      const { dish, macros, userProfile } = input;
      
      // 1. Rule-based pre-scoring
      const ruleBasedScore = this.calculateRuleBasedScore(macros, dish);
      
      // 2. If score is very clear (extremely healthy or unhealthy), skip AI call
      if (ruleBasedScore <= 20 || ruleBasedScore >= 90) {
        return {
          healthScore: ruleBasedScore,
          category: this.scoreToCategory(ruleBasedScore)
        };
      }
      
      // 3. For more nuanced cases, use AI
      return await this.getAIScore(dish, macros, userProfile, provider);
    } catch (error) {
      console.error('Error in DishRanker:', error);
      
      // Return default mid-range score in case of error
      return {
        healthScore: 50,
        category: 'Balanced'
      };
    }
  }
  
  /**
   * Calculate a preliminary score based on simple nutrition rules
   */
  private calculateRuleBasedScore(macros: MacroProfile, dish: MenuItem): number {
    let score = 50; // Start with neutral score
    
    // Adjust for macros
    if (macros.protein === 'High') score += 10;
    if (macros.protein === 'Low') score -= 5;
    
    if (macros.carbs === 'High') score -= 5;
    if (macros.carbs === 'Low') score += 5;
    
    if (macros.fat === 'High') score -= 10;
    if (macros.fat === 'Low') score += 5;
    
    if (macros.sugar === 'High') score -= 15;
    if (macros.sugar === 'Mid') score -= 5;
    
    // Check if calories are very high
    if (macros.calories > 800) score -= 15;
    if (macros.calories < 300) score += 5;
    
    // Check dish name for obvious indicators
    const name = dish.name.toLowerCase();
    
    // Common unhealthy indicators
    const unhealthyTerms = ['fried', 'deep fried', 'crispy', 'battered', 'creamy', 
      'cheesy', 'buttery', 'gravy', 'sugar', 'sweetened', 'caramel', 'chocolate',
      'candy', 'cake', 'pie', 'donut', 'pastry', 'cookies', 'milkshake'];
      
    // Common healthy indicators
    const healthyTerms = ['grilled', 'steamed', 'baked', 'roasted', 'poached', 'fresh',
      'vegetable', 'garden', 'salad', 'lean', 'whole grain', 'quinoa', 'lentil',
      'bean', 'chickpea', 'tofu', 'vegan', 'plant-based'];
      
    // Adjust score based on these terms
    for (const term of unhealthyTerms) {
      if (name.includes(term)) {
        score -= 5;
      }
    }
    
    for (const term of healthyTerms) {
      if (name.includes(term)) {
        score += 5;
      }
    }
    
    // Clamp score between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Map a numeric score to a category
   */
  private scoreToCategory(score: number): 'Healthiest' | 'Balanced' | 'Indulgent' {
    if (score >= 76) return 'Healthiest';
    if (score >= 41) return 'Balanced';
    return 'Indulgent';
  }
  
  /**
   * Get a score from AI
   */
  private async getAIScore(
    dish: MenuItem,
    macros: MacroProfile,
    userProfile?: UserProfile,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<DishScore> {
    // Generate prompt
    const prompt = generateDishRankerPrompt({
      dish,
      macros,
      userGoals: userProfile?.goals,
      userRestrictions: userProfile?.restrictions
    });
    
    // Call AI
    const response = await callAI(prompt, provider);
    
    // Parse response (handle potential errors in response format)
    let healthScore = typeof response.healthScore === 'number' ? response.healthScore : 50;
    let category = response.category || this.scoreToCategory(healthScore);
    
    // Ensure category is one of our expected values
    if (!['Healthiest', 'Balanced', 'Indulgent'].includes(category)) {
      category = this.scoreToCategory(healthScore);
    }
    
    // Ensure score is between 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    return {
      healthScore,
      category: category as 'Healthiest' | 'Balanced' | 'Indulgent'
    };
  }
} 