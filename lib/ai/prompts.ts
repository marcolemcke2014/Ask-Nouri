/**
 * AI prompt templates for menu analysis
 */
import { AIPromptTemplate } from '@/types/ai';

/**
 * Prompt template for analyzing menu items
 */
export const menuAnalysisPrompt: AIPromptTemplate = `
You are a nutritionist helping a user analyze menu items and find healthy options.

## MENU TEXT
The following is text from a restaurant menu:
"""
{{MENU_TEXT}}
"""

## USER PREFERENCES
The user has the following dietary preferences and health goals:
"""
{{USER_PREFERENCES}}
"""

## INSTRUCTIONS
1. Analyze the menu text and extract individual dish items.
2. For each item, provide a health rating, dietary tags, estimated nutrition if possible, ingredients, reasons for the rating, and any recommended modifications to make the dish healthier.
3. Provide 1-3 best recommendations for the user based on their preferences.
4. Format your response as a JSON object that conforms to the specified schema.

## OUTPUT SCHEMA
{
  "items": [
    {
      "name": "Name of the dish",
      "description": "Description from the menu (if available)",
      "price": "Price from menu (if available)",
      "category": "Appetizer, Entree, Dessert, etc.",
      "healthRating": "excellent|good|moderate|poor|avoid",
      "dietaryTags": ["vegan", "vegetarian", "gluten-free", etc.],
      "nutrition": {
        "calories": 000,
        "protein": 00,
        "carbs": 00,
        "fat": 00,
        "sugar": 00,
        "sodium": 000
      },
      "ingredients": ["ingredient1", "ingredient2", etc.],
      "reasonsForRating": ["reason1", "reason2", etc.],
      "recommendedModifications": ["modification1", "modification2", etc.]
    }
  ],
  "recommendations": {
    "bestChoice": {
      "name": "Best dish name",
      // same structure as items above
    },
    "alternatives": [
      // 1-2 alternative dishes with same structure
    ],
    "avoidItems": [
      // 1-2 dishes to avoid with same structure
    ],
    "generalTips": [
      "tip1", "tip2", etc.
    ],
    "healthySwaps": {
      "unhealthy item": "healthier alternative"
    },
    "diningScore": 75 // 0-100 score for overall menu health
  }
}

Be thorough but concise in your analysis.
`;

/**
 * Prompt template for extracting nutritional information
 */
export const nutritionExtractionPrompt: AIPromptTemplate = `
You are a nutrition expert helping extract nutrition information from dish descriptions.

## DISH INFORMATION
"""
{{DISH_DESCRIPTION}}
"""

## TASK
Extract or estimate the nutrition information for this dish based on the description, ingredients, and common preparation methods.

## OUTPUT SCHEMA
{
  "nutrition": {
    "calories": 000,
    "protein": 00,
    "carbs": 00,
    "fat": 00,
    "saturatedFat": 00,
    "transFat": 00,
    "sugar": 00,
    "sodium": 000,
    "fiber": 00,
    "cholesterol": 00
  },
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of how you estimated these values"
}

If you cannot estimate a value with reasonable confidence, omit it from the output.
`;

/**
 * Prompt template for ingredient extraction
 */
export const ingredientExtractionPrompt: AIPromptTemplate = `
You are a chef helping to extract ingredients from dish descriptions.

## DISH INFORMATION
Name: {{DISH_NAME}}
Description: {{DISH_DESCRIPTION}}

## TASK
Extract the likely ingredients in this dish based on the name and description.
Include both explicitly mentioned ingredients and those that would typically be in this dish.
Categorize them as "explicit" (directly mentioned) or "implicit" (likely included but not directly mentioned).

## OUTPUT SCHEMA
{
  "explicitIngredients": ["ingredient1", "ingredient2", ...],
  "implicitIngredients": ["ingredient1", "ingredient2", ...],
  "allergens": ["allergen1", "allergen2", ...],
  "confidence": 0.0 to 1.0
}
`;

/**
 * Prompt template for dietary restrictions analysis
 */
export const dietaryRestrictionsPrompt: AIPromptTemplate = `
You are a dietary specialist helping to evaluate if a dish meets specific dietary restrictions.

## DISH INFORMATION
Name: {{DISH_NAME}}
Description: {{DISH_DESCRIPTION}}
Ingredients: {{INGREDIENTS}}

## DIETARY RESTRICTIONS
{{DIETARY_RESTRICTIONS}}

## TASK
Analyze if this dish is compatible with the specified dietary restrictions.
If it's not compatible, explain why and suggest modifications to make it compatible.

## OUTPUT SCHEMA
{
  "isCompatible": true or false,
  "dietaryTags": ["vegan", "vegetarian", "gluten-free", etc.],
  "incompatibleReasons": ["reason1", "reason2", ...] (if not compatible),
  "suggestedModifications": ["modification1", "modification2", ...] (if not compatible),
  "confidence": 0.0 to 1.0
}
`;

export default {
  menuAnalysisPrompt,
  nutritionExtractionPrompt,
  ingredientExtractionPrompt,
  dietaryRestrictionsPrompt
}; 