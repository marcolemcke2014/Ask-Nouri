/**
 * Prompt templates for AI interactions
 */

/**
 * System prompt for AI analysis
 * @returns The system prompt for the AI
 */
export const systemPrompt = (): string => {
  return `You are a nutrition expert assistant helping analyze menu items.
Your task is to evaluate food items based on the user's health goals and preferences.
Provide a numeric score (1-10), tags, potential health flags, and suggestions for improvements.
Respond with valid JSON array of food item analyses.`;
};

/**
 * Menu analyzer prompt
 * @param menuText - The OCR-extracted text from the menu
 * @param userGoals - Array of user health goals and preferences
 * @returns The prompt for menu analysis
 */
export const menuAnalyzerPrompt = (menuText: string, userGoals: string[]): string => {
  return `
Analyze the following menu items based on the user's health goals and preferences:

USER GOALS:
${userGoals.join('\n')}

MENU TEXT:
${menuText}

For each menu item you can identify, provide:
1. name: The name of the menu item
2. score: A score from 1-10 (10 being best) indicating how well it matches the user's goals
3. tags: Array of relevant health tags (e.g., "protein-rich", "low-carb", "high-fiber")
4. flags: Array of potential health concerns (e.g., "high-sodium", "processed")
5. improvements: Array of suggestions to make the dish healthier

Respond with a JSON array of item analyses. Example:
[
  {
    "name": "Grilled Chicken Salad",
    "score": 8,
    "tags": ["high-protein", "low-carb"],
    "flags": ["possibly high sodium"],
    "improvements": ["Ask for dressing on the side", "Add extra vegetables"]
  }
]
`;
}; 