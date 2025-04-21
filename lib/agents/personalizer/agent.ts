/**
 * Agent 4: Personalizer
 * Generates health predictions and recommendations based on user profile
 */

import { 
  Agent, 
  MenuItem, 
  MacroProfile, 
  UserProfile, 
  PersonalizedInsights,
  AIResponse
} from '../types';
import { generatePersonalizerPrompt } from './prompts/insights';
import { AIProvider } from '../../../types/ai';

// OpenRouter integration for AI processing
async function callAI(prompt: string, provider: AIProvider): Promise<AIResponse> {
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
      const aiResponse = await callAI(prompt, provider);
      
      try {
        // Parse the text response which should be in JSON format
        const responseData = JSON.parse(aiResponse.text);
      
      return {
          healthPrediction: responseData.healthPrediction || this.generateDefaultHealthPrediction(input.macros),
          todayRecommendation: responseData.todayRecommendation || this.generateDefaultRecommendation(input.userProfile)
      };
      } catch (error) {
        console.error('Error parsing AI response:', error);
        console.error('Raw response:', aiResponse.text);
        return this.getDefaultInsights(input.macros);
      }
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