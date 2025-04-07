/**
 * Agent 5: Benefit Summarizer
 * Generates an emotionally intelligent summary of how the dish benefits the user
 */

import { Agent, BenefitSummary, StructuredMenuItem, UserProfile } from './types';
import { AIProvider } from '@/types/ai';
import { callAI } from '@/lib/ai';

export interface BenefitSummarizerInput {
  dish: StructuredMenuItem;
  userProfile: UserProfile;
}

export class BenefitSummarizer implements Agent<BenefitSummarizerInput, BenefitSummary> {
  /**
   * Get the prompt for the benefit summarizer
   */
  getPrompt(input: BenefitSummarizerInput): string {
    const { dish, userProfile } = input;
    const userGoals = userProfile.goals.join(', ');
    
    return `
You are a smart food explainer, skilled in communicating health benefits in an emotionally intelligent way.

DISH:
- Name: ${dish.title}
${dish.description ? `- Description: ${dish.description}` : ''}
${dish.section ? `- Section: ${dish.section}` : ''}

USER HEALTH GOALS:
${userGoals}

Your task:
1. Identify how this dish may support the user's health goals
2. Create three components:
   a) A concise summary (1-2 sentences) of the dish's main health benefits
   b) Short-term benefits the user might experience
   c) Long-term health implications of eating this regularly

Make your explanation:
- Human and conversational, not clinical
- Motivating and positive (focus on benefits, not warnings)
- Science-backed but accessible
- Specific to the dish ingredients and user's goals

Return your analysis as valid JSON with this structure:
{
  "summary": "1-2 sentence summary of main benefits",
  "shortTerm": "How this might make the user feel today",
  "longTerm": "Health impact if eaten regularly"
}

Example tone: "Rich in omega-3s with anti-inflammatory benefits. Supports your protein needs."
`;
  }

  /**
   * Process a dish and user profile to generate a benefit summary
   */
  async process(
    input: BenefitSummarizerInput,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<BenefitSummary> {
    try {
      const prompt = this.getPrompt(input);
      
      // Call the AI service
      const response = await callAI(prompt, provider);
      
      if (response.error) {
        console.error('Benefit summarizer error:', response.error);
        return this.getFallbackSummary(input.dish);
      }
      
      // For now, we'll need to adapt the response format
      if (response.items.length > 0) {
        const item = response.items[0];
        
        return {
          summary: item.name,
          shortTerm: item.tags.join('. '),
          longTerm: item.improvements.join('. ')
        };
      }
      
      return this.getFallbackSummary(input.dish);
    } catch (error) {
      console.error('Error in BenefitSummarizer:', error);
      return this.getFallbackSummary(input.dish);
    }
  }
  
  /**
   * Get a fallback summary when the AI service fails
   */
  private getFallbackSummary(dish: StructuredMenuItem): BenefitSummary {
    return {
      summary: `${dish.title} provides a balanced mix of nutrients.`,
      shortTerm: "May provide energy and satisfaction.",
      longTerm: "Regular consumption should be balanced with other food groups."
    };
  }
}
