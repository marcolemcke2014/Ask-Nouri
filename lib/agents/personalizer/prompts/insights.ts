/**
 * Prompt template for the personalizer agent
 */

import { MenuItem, MacroProfile, UserProfile } from '../../types';

interface PersonalizerPromptInput {
  dish: MenuItem;
  macros: MacroProfile;
  userProfile: UserProfile;
  previousMeals?: string[];
  healthScore: number;
}

export function generatePersonalizerPrompt(input: PersonalizerPromptInput): string {
  const { 
    dish, 
    macros, 
    userProfile, 
    previousMeals = [], 
    healthScore 
  } = input;
  
  const previousMealsText = previousMeals.length > 0 
    ? `Recent meals: ${previousMeals.join(', ')}` 
    : 'No recent meal history available';
  
  return `
You are a nutrition coach that provides personalized health guidance.

DISH SELECTED:
Name: ${dish.name}
${dish.description ? `Description: ${dish.description}` : ''}
Health Score: ${healthScore}/100

MACRO NUTRITION PROFILE:
- Calories: ${macros.calories}
- Protein: ${macros.protein}
- Carbs: ${macros.carbs}
- Fat: ${macros.fat}
- Sugar: ${macros.sugar}

USER PROFILE:
- Goals: ${userProfile.goals.join(', ')}
- Restrictions: ${userProfile.restrictions.join(', ')}
- Patterns: ${userProfile.recentPatterns ? userProfile.recentPatterns.join(', ') : 'None specified'}

CONTEXT:
${previousMealsText}

Your task is to provide two personalized insights:

1. Health Prediction: A brief prediction of how this specific meal will likely affect the user based on their goals and the dish nutrients. Focus on short-term effects.

2. Today's Recommendation: A general nutrition recommendation for today based on user's goals and recent patterns.

Return your insights in JSON format:
{
  "healthPrediction": "You'll likely feel energized without a sugar crash from this balanced protein-rich meal.",
  "todayRecommendation": "Focus on getting 2-3 more servings of vegetables today to complement your protein intake."
}

Guidelines:
- Be specific and personalized to the user's goals
- Keep each response concise (1-2 sentences)
- Be encouraging and positive while being honest
- Focus on practical, actionable guidance
- For health prediction, focus on how they'll feel 1-4 hours after eating
- For recommendations, focus on what they should do for the rest of today
`;
} 