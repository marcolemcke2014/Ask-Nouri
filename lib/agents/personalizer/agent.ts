/**
 * Agent 4: Personalizer
 * Generates health predictions and recommendations based on user profile
 */

import { 
  Agent, 
  MenuItem, 
  MacroProfile, 
  UserProfile, 
  PersonalizedInsights 
} from '../types';
import { generatePersonalizerPrompt } from './prompts/insights';
import { AIProvider } from '@/types/ai';

// Mock AI call for development
async function callAI(prompt: string, provider: AIProvider): Promise<any> {
  console.log(`[AI Request] Provider: ${provider}`);
  
  return {
    healthPrediction: "You'll likely feel energized for 3-4 hours with stable blood sugar levels.",
    todayRecommendation: "Try to include a fiber-rich snack later today to balance your nutrition intake."
  };
}

export interface PersonalizerInput {
  dish: MenuItem;
  macros: MacroProfile;
  userProfile: UserProfile;
  healthScore: number;
  previousMeals?: string[];
}

export class Personalizer implements Agent<PersonalizerInput, PersonalizedInsights> {
  async process(
    input: PersonalizerInput,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<PersonalizedInsights> {
    try {
      // If no user profile, return defaults
      if (!input.userProfile || !input.userProfile.goals || input.userProfile.goals.length === 0) {
        return this.getDefaultInsights(input.macros);
      }
      
      const prompt = generatePersonalizerPrompt(input);
      const response = await callAI(prompt, provider);
      
      return {
        healthPrediction: response.healthPrediction || this.generateDefaultHealthPrediction(input.macros),
        todayRecommendation: response.todayRecommendation || this.generateDefaultRecommendation(input.userProfile)
      };
    } catch (error) {
      console.error('Error in Personalizer:', error);
      return this.getDefaultInsights(input.macros);
    }
  }
  
  private generateDefaultHealthPrediction(macros: MacroProfile): string {
    if (macros.protein === 'High' && macros.carbs === 'Low') {
      return "Expect sustained energy without crashes due to the protein-rich, low-carb profile.";
    }
    
    if (macros.fat === 'High' && macros.sugar === 'High') {
      return "May experience an initial energy boost followed by a dip in 1-2 hours.";
    }
    
    return "Should provide balanced energy for 2-3 hours after eating.";
  }
  
  private generateDefaultRecommendation(userProfile: UserProfile): string {
    const goals = userProfile.goals || [];
    
    if (goals.some(goal => goal.toLowerCase().includes('weight loss'))) {
      return "Focus on fiber-rich vegetables with your other meals today to support your weight management goals.";
    }
    
    if (goals.some(goal => goal.toLowerCase().includes('muscle'))) {
      return "Try to include another protein-rich meal today to support your muscle-building goals.";
    }
    
    return "Focus on a nutrient-dense whole food diet throughout the day to maintain energy and focus.";
  }
  
  private getDefaultInsights(macros: MacroProfile): PersonalizedInsights {
    return {
      healthPrediction: this.generateDefaultHealthPrediction(macros),
      todayRecommendation: "Focus on a balanced intake of whole foods throughout the rest of the day."
    };
  }
} 