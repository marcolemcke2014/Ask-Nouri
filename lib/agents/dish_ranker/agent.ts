/**
 * Agent 3: Dish Ranker + Health Scorer
 * Assigns a health score (0-100) and category to dishes
 */

import { Agent, MenuItem, MacroProfile, DishScore, UserProfile, AIResponse } from '../types';
import { generateDishRankerPrompt } from './prompts/ranking';
import { AIProvider } from '../../../types/ai';

// OpenRouter integration for AI processing
async function callAI(
  prompt: string, 
  provider: AIProvider = AIProvider.OPENAI
): Promise<AIResponse> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OpenRouter API key.");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nutriflow.vercel.app", 
      "X-Title": "NutriFlow AI", 
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful health-focused nutritionist AI." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json = await res.json();

  return {
    text: json.choices[0]?.message?.content || "No response.",
    raw: json,
    model: json.model,
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
    const aiResponse = await callAI(prompt, provider);
    
    try {
      // Parse the text response which should be in JSON format
      const responseData = JSON.parse(aiResponse.text);
      
      // Extract the health score and category from the parsed response
      let healthScore = typeof responseData.healthScore === 'number' ? responseData.healthScore : 50;
      let category = responseData.category || this.scoreToCategory(healthScore);
      const reasoning = responseData.reasoning || '';
      
      // Ensure category is one of our expected values
      if (!['Healthiest', 'Balanced', 'Indulgent'].includes(category)) {
        category = this.scoreToCategory(healthScore);
      }
      
      // Ensure score is between 0-100
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      return {
        healthScore,
        category: category as 'Healthiest' | 'Balanced' | 'Indulgent',
        reasoning
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', aiResponse.text);
      
      // Fallback to a default score
      const defaultScore = 50;
      return {
        healthScore: defaultScore,
        category: this.scoreToCategory(defaultScore),
        reasoning: 'Error processing AI response.'
      };
    }
  }
} 