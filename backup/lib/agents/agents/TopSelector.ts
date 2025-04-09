/**
 * Agent 3: Top Dishes Selector
 * Selects the best dishes in each category (Healthiest, Balanced, Indulgent)
 * based on user profile and dish scores
 */

import { Agent, ScoredMenuItem, TopDishesResult, UserProfile } from './types';
import { AIProvider } from '@/types/ai';
import { callAI } from '@/lib/ai';

export interface TopSelectorInput {
  scoredItems: ScoredMenuItem[];
  userProfile: UserProfile;
}

export class TopSelector implements Agent<TopSelectorInput, TopDishesResult> {
  /**
   * Get the prompt for the top selector
   */
  getPrompt(input: TopSelectorInput): string {
    const { scoredItems, userProfile } = input;
    const menuItems = JSON.stringify(scoredItems, null, 2);
    const userGoals = userProfile.goals.join(', ');
    const userRestrictions = userProfile.restrictions.join(', ');
    const recentPatterns = userProfile.recentPatterns?.join(', ') || 'None specified';
    
    return `
You are a food curator for personalized nutrition. Based on the user profile and scored menu items, select the best dishes in three categories.

USER PROFILE:
- Health Goals: ${userGoals}
- Dietary Restrictions: ${userRestrictions}
- Recent Patterns: ${recentPatterns}

SCORED MENU ITEMS:
${menuItems}

Pick 3 meals from the menu that best represent:
1. 🥗 Healthiest - Best aligned with user's long-term health goals
2. ⚖️ Balanced - Good compromise between health and satisfaction
3. 🍔 Indulgent - Treat option that minimizes negative health impacts

For each selection, provide a brief rationale explaining why it's the best choice in its category for this specific user.

Return your selections as valid JSON with this structure:
{
  "healthiest": "Dish Title",
  "balanced": "Dish Title",
  "indulgent": "Dish Title",
  "rationale": {
    "healthiest": "1-2 sentence explanation",
    "balanced": "1-2 sentence explanation",
    "indulgent": "1-2 sentence explanation"
  }
}

Prioritize dishes that match dietary restrictions absolutely (never recommend a dish the user can't eat).
`;
  }

  /**
   * Process scored menu items and user profile to select top dishes
   */
  async process(
    input: TopSelectorInput,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<TopDishesResult> {
    try {
      const prompt = this.getPrompt(input);
      
      // Call the AI service
      const response = await callAI(prompt, provider);
      
      if (response.error) {
        console.error('Top selector error:', response.error);
        
        // Return a fallback using the highest, middle, and lowest scored items
        const sortedItems = [...input.scoredItems].sort((a, b) => b.score - a.score);
        const highestItem = sortedItems[0];
        const middleItem = sortedItems[Math.floor(sortedItems.length / 2)];
        const lowestItem = sortedItems[sortedItems.length - 1];
        
        return {
          healthiest: highestItem.title,
          balanced: middleItem.title,
          indulgent: lowestItem.title,
          rationale: {
            healthiest: "Highest health score on the menu.",
            balanced: "Middle-range health score for balance.",
            indulgent: "Treat option with lower health score."
          }
        };
      }
      
      // Parse and adapt the response
      // For now, we'll simulate with a default adapter
      if (response.items.length >= 3) {
        return {
          healthiest: response.items[0].name,
          balanced: response.items[1].name,
          indulgent: response.items[2].name,
          rationale: {
            healthiest: response.items[0].tags.join('. '),
            balanced: response.items[1].tags.join('. '),
            indulgent: response.items[2].tags.join('. ')
          }
        };
      } else {
        // If we don't have enough items, use the scored items as fallback
        const sortedItems = [...input.scoredItems].sort((a, b) => b.score - a.score);
        const highestItem = sortedItems[0];
        const middleItem = sortedItems[Math.floor(sortedItems.length / 2)] || highestItem;
        const lowestItem = sortedItems[sortedItems.length - 1] || middleItem;
        
        return {
          healthiest: highestItem.title,
          balanced: middleItem.title,
          indulgent: lowestItem.title,
          rationale: {
            healthiest: "Highest health score on the menu.",
            balanced: "Middle-range health score for balance.",
            indulgent: "Treat option with lower health score."
          }
        };
      }
    } catch (error) {
      console.error('Error in TopSelector:', error);
      
      // Return a fallback using the highest, middle, and lowest scored items
      const sortedItems = [...input.scoredItems].sort((a, b) => b.score - a.score);
      const highestItem = sortedItems[0];
      const middleItem = sortedItems[Math.floor(sortedItems.length / 2)] || highestItem;
      const lowestItem = sortedItems[sortedItems.length - 1] || middleItem;
      
      return {
        healthiest: highestItem.title,
        balanced: middleItem.title,
        indulgent: lowestItem.title,
        rationale: {
          healthiest: "Highest health score on the menu.",
          balanced: "Middle-range health score for balance.",
          indulgent: "Treat option with lower health score."
        }
      };
    }
  }
}
