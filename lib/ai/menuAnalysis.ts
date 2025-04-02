/**
 * Menu analysis using AI
 */
import { callAI, getDefaultModel } from './service';
import { menuAnalysisPrompt } from './prompts';
import { 
  MenuItem, 
  MenuAnalysisRequest, 
  MenuAnalysisResponse, 
  UserPreferences 
} from '@/types/menu';
import { AIModel, AICompletionRequest } from '@/types/ai';
import { saveAnalysis, saveMenuItems } from '../db/menu';

/**
 * Analyze menu items using AI
 */
export async function analyzeMenu(
  request: MenuAnalysisRequest
): Promise<MenuAnalysisResponse> {
  const { menuText, userPreferences = {}, includeNutrition = true } = request;
  
  // Prepare the AI prompt using the template
  const filledPrompt = menuAnalysisPrompt
    .replace('{{MENU_TEXT}}', menuText)
    .replace('{{USER_PREFERENCES}}', JSON.stringify(userPreferences, null, 2));
  
  // Use default model or override if specified
  const model = process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL as AIModel || getDefaultModel();
  
  // Set up the AI request
  const aiRequest: AICompletionRequest = {
    prompt: filledPrompt,
    systemPrompt: 'You are a nutritionist helping users analyze restaurant menus. Be honest but encouraging about healthier options.',
    model,
    temperature: 0.2,
    maxTokens: 2500,
    outputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        recommendations: {
          type: 'object'
        }
      }
    }
  };
  
  try {
    // Make the call to the AI service
    const response = await callAI(aiRequest);
    
    if (!response.parsedJson) {
      throw new Error('Failed to parse AI response');
    }
    
    return response.parsedJson as MenuAnalysisResponse;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

/**
 * Analyze menu and save results to database
 */
export async function analyzeAndSaveMenu(
  menuId: string,
  menuText: string,
  userPreferences?: UserPreferences,
  userId?: string
): Promise<MenuAnalysisResponse> {
  try {
    // Analyze the menu
    const analysis = await analyzeMenu({
      menuText,
      userPreferences
    });
    
    // Save the analysis to the database
    const savedAnalysis = await saveAnalysis(menuId, analysis, userId);
    
    // Save the menu items to the database
    if (analysis.items) {
      await saveMenuItems(menuId, analysis.items);
    }
    
    return analysis;
  } catch (error) {
    console.error('Failed to analyze and save menu:', error);
    throw error;
  }
}

/**
 * Get dish compatibility with user preferences
 */
export function getDishCompatibilityScore(
  dish: MenuItem,
  preferences: UserPreferences
): number {
  let score = 50; // Start with a neutral score
  
  if (!preferences || Object.keys(preferences).length === 0) {
    return score; // No preferences to match against
  }
  
  // Check dietary restrictions
  if (preferences.dietaryRestrictions?.length) {
    const matchingTags = dish.dietaryTags.filter(tag => 
      preferences.dietaryRestrictions?.includes(tag)
    );
    
    if (matchingTags.length > 0) {
      score += 20 * (matchingTags.length / preferences.dietaryRestrictions.length);
    } else {
      score -= 30; // Major penalty for not matching any dietary restrictions
    }
  }
  
  // Check for avoided ingredients
  if (preferences.avoidIngredients?.length && dish.ingredients?.length) {
    const avoidedIngredientsPresent = dish.ingredients.filter(ingredient =>
      preferences.avoidIngredients?.some(avoided => 
        ingredient.toLowerCase().includes(avoided.toLowerCase())
      )
    );
    
    if (avoidedIngredientsPresent.length > 0) {
      score -= 40; // Major penalty for containing avoided ingredients
    }
  }
  
  // Check nutrition targets if both exist
  if (preferences.nutritionTargets && dish.nutrition) {
    let nutritionMatches = 0;
    let nutritionTotal = 0;
    
    // For each nutrition target, check if the dish is within reasonable bounds
    for (const [key, target] of Object.entries(preferences.nutritionTargets)) {
      if (key in dish.nutrition) {
        nutritionTotal++;
        const value = dish.nutrition[key as keyof typeof dish.nutrition];
        
        if (typeof value === 'number') {
          // For calories and macros, allow a 20% buffer
          const buffer = 0.2;
          
          if (key === 'calories' && preferences.calorieLimit) {
            if (value <= preferences.calorieLimit) {
              nutritionMatches++;
            }
          } else if (value <= target * (1 + buffer)) {
            nutritionMatches++;
          }
        }
      }
    }
    
    if (nutritionTotal > 0) {
      score += 20 * (nutritionMatches / nutritionTotal);
    }
  }
  
  // Adjust for health rating
  switch (dish.healthRating) {
    case 'excellent':
      score += 15;
      break;
    case 'good':
      score += 10;
      break;
    case 'moderate':
      score += 0;
      break;
    case 'poor':
      score -= 10;
      break;
    case 'avoid':
      score -= 15;
      break;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

export default {
  analyzeMenu,
  analyzeAndSaveMenu,
  getDishCompatibilityScore
}; 