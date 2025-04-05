/**
 * AI Prompt templates for menu analysis
 */

/**
 * Main prompt for analyzing menu text with user goals
 * @param text - The OCR-extracted menu text
 * @param goals - Array of user health goals and preferences
 * @returns Formatted prompt for the AI
 */
export const menuAnalyzerPrompt = (text: string, goals: string[]): string => `
You are a health-conscious AI that helps users pick the best meals.

Menu: 
${text}

User Goals:
${goals.join(", ")}

Your Task:
- List and rank the best meals from this menu
- For each, explain why it matches the user's goals
- Flag any meals that are bad (e.g., high in sodium for kidney health)
- Suggest small modifications (e.g., swap fries for salad)
- Output in JSON format like:
[
  {
    "name": "Grilled Salmon",
    "score": 9.5,
    "tags": ["High Protein", "Low Carb"],
    "flags": [],
    "improvements": ["Ask for no butter on top"]
  },
  ...
]
`;

/**
 * Prompt for getting user feedback about a meal they've had
 * @param mealName - The name of the meal the user had
 * @returns Formatted prompt for the AI
 */
export const feedbackPrompt = (mealName: string): string => `
You had the "${mealName}" dish. How did it make you feel? 

Please rate your experience on:
- Overall satisfaction (1-10)
- Whether it aligned with your health goals
- Any digestive or other issues you experienced
- Would you order it again?

Your feedback will help us personalize future recommendations.
`;

/**
 * System prompt for the AI to set context and behavior
 * @returns System prompt string
 */
export const systemPrompt = (): string => `
You are NutriAssist, an AI designed to help users make healthier food choices when dining out. 
Your goal is to match menu items to the user's specific health goals and dietary restrictions.

Key behaviors:
- Be concise and direct in your analysis
- Always provide scores from 1-10 for each dish
- Use consistent tags across analyses for user convenience
- Suggest practical modifications that restaurants can actually accommodate
- Express uncertainty when menu descriptions are vague or incomplete
- Focus on being helpful rather than judgmental about food choices
`;

/**
 * Prompt for extracting menu items from poorly formatted OCR text
 * @param text - The raw OCR result
 * @returns Formatted prompt for the AI
 */
export const menuCleanupPrompt = (text: string): string => `
I've scanned a restaurant menu with OCR, but the formatting is inconsistent. Please help me extract the menu items and organize them.

Raw OCR Text:
${text}

Please:
1. Identify distinct menu items
2. For each item, extract: name, description, and price (if available)
3. Organize by sections (appetizers, entrees, etc.) if apparent
4. Ignore any non-menu text like restaurant info, hours, etc.
5. Format in clean JSON as:

{
  "sections": [
    {
      "name": "Section Name",
      "items": [
        {
          "name": "Item Name",
          "description": "Description text",
          "price": "$XX.XX"
        },
        ...
      ]
    },
    ...
  ]
}
`; 