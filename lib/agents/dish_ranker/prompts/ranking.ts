/**
 * Prompt template for the dish ranker agent
 */

import { MenuItem, MacroProfile } from '../../types';

interface DishRankerPromptInput {
  dish: MenuItem;
  macros: MacroProfile;
  userGoals?: string[];
  userRestrictions?: string[];
}

export function generateDishRankerPrompt(input: DishRankerPromptInput): string {
  const { dish, macros, userGoals = [], userRestrictions = [] } = input;
  
  return `
You are a nutrition expert that evaluates dishes for their health profile.

DISH INFORMATION:
Name: ${dish.name}
${dish.description ? `Description: ${dish.description}` : ''}
${dish.section ? `Menu Section: ${dish.section}` : ''}

MACRO NUTRITION PROFILE:
- Calories: ${macros.calories}
- Protein: ${macros.protein}
- Carbs: ${macros.carbs}
- Fat: ${macros.fat}
- Sugar: ${macros.sugar}

${userGoals.length > 0 ? `USER GOALS: ${userGoals.join(', ')}` : ''}
${userRestrictions.length > 0 ? `USER RESTRICTIONS: ${userRestrictions.join(', ')}` : ''}

Your task:
1. Analyze this dish objectively based on its nutritional properties
2. Consider the balance of macro nutrients and overall nutrition value
3. Assign a health score (0-100, higher = healthier)
4. Categorize as one of: "Healthiest", "Balanced", or "Indulgent"

Return your analysis in valid JSON format as follows:
{
  "healthScore": 80,
  "category": "Balanced",
  "reasoning": "This dish has a good balance of proteins and carbs with moderate fat."
}

Scoring Guidelines:
- 0-40: Indulgent (high in calories/fats/sugars with minimal nutritional benefits)
- 41-75: Balanced (moderate nutritional value with some concerns)
- 76-100: Healthiest (nutrient-dense with excellent macronutrient balance)

Important Notes:
- Focus on objective nutritional value, not taste or enjoyment
- Consider industry standards for portion sizes
- Higher protein typically adds points for satiety and muscle maintenance
- Processed foods typically score lower than whole foods
- If user restrictions exist, any violations should result in a low score
`;
} 