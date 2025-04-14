/**
 * Types for the New 4-Agent Architecture
 */

import { AIProvider } from '@/types/ai';

/**
 * Common AI service response format
 */
export interface AIResponse {
  text: string;
  raw: any;
  model: string;
}

/**
 * User health profile / context
 */
export interface UserProfile {
  goals: string[];
  restrictions: string[];
  recentPatterns?: string[];
}

/**
 * Raw OCR result from Agent 1
 */
export interface OCRResult {
  text: string;
  confidence?: number;
}

/**
 * Structured menu item from Agent 1
 */
export interface MenuItem {
  name: string;
  price?: number;
  section?: string;
  description?: string;
}

/**
 * Macro nutrition profile from Agent 2
 */
export interface MacroProfile {
  calories: number;
  protein: 'High' | 'Mid' | 'Low';
  carbs: 'High' | 'Mid' | 'Low';
  fat: 'High' | 'Mid' | 'Low';
  sugar: 'High' | 'Mid' | 'Low';
}

/**
 * Dish health score and category from Agent 3
 */
export interface DishScore {
  healthScore: number; // 0-100 
  category: 'Healthiest' | 'Balanced' | 'Indulgent';
  reasoning?: string; // Explanation for the score and category
}

/**
 * Dish with added macro profile and health score
 */
export interface EnrichedDish extends MenuItem {
  macros: MacroProfile;
  healthScore: number;
  category: 'Healthiest' | 'Balanced' | 'Indulgent';
  reasoning?: string;
}

/**
 * Personalized recommendations from Agent 4
 */
export interface PersonalizedInsights {
  healthPrediction: string;
  todayRecommendation: string;
}

/**
 * Complete menu analysis result
 */
export interface MenuAnalysisResult {
  restaurantName?: string;
  location?: string;
  timestamp: string;
  averageHealthScore: number;
  dishes: EnrichedDish[];
  topDishes: {
    healthiest: EnrichedDish;
    balanced: EnrichedDish;
    indulgent: EnrichedDish;
  };
  personalInsights?: PersonalizedInsights;
}

/**
 * Common interface for all agents
 */
export interface Agent<InputType, OutputType> {
  process(input: InputType, provider?: AIProvider): Promise<OutputType>;
} 