/**
 * Types for the Multi-Agent Architecture
 * Each agent has a focused responsibility in the menu analysis pipeline
 */

import { AIProvider } from '@/types/ai';

/**
 * User health profile / context
 */
export interface UserProfile {
  goals: string[];
  restrictions: string[];
  recentPatterns?: string[];
}

/**
 * Raw OCR result structure
 */
export interface OCRResult {
  text: string;
  confidence?: number;
}

/**
 * Structured menu item from Agent 1
 */
export interface StructuredMenuItem {
  title: string;
  description?: string;
  price?: string;
  section?: string;
}

/**
 * Menu item with scores from Agent 2
 */
export interface ScoredMenuItem extends StructuredMenuItem {
  score: number;
  confidence?: number;
}

/**
 * Menu summary from Agent 2
 */
export interface MenuSummary {
  averageScore: number;
  category: '🥗 Healthy' | '⚖️ Balanced' | '🍟 Indulgent';
  confidence: number;
}

/**
 * Top dishes selector result from Agent 3
 */
export interface TopDishesResult {
  healthiest: string; // dish title
  balanced: string; // dish title
  indulgent: string; // dish title
  rationale: {
    healthiest: string;
    balanced: string;
    indulgent: string;
  };
}

/**
 * Macro profile estimation from Agent 4
 */
export interface MacroProfile {
  calories: number;
  protein: 'High' | 'Mid' | 'Low';
  carbs: 'High' | 'Mid' | 'Low';
  fat: 'High' | 'Mid' | 'Low';
  sugar: 'High' | 'Mid' | 'Low';
  confidence: number;
}

/**
 * Benefit summary from Agent 5
 */
export interface BenefitSummary {
  shortTerm: string;
  longTerm: string;
  summary: string;
}

/**
 * Health prediction synthesis from Agent 6
 */
export interface ScoreSynthesis {
  score: number; // 0-100
  category: '🥗 Healthiest' | '⚖️ Balanced' | '🍔 Indulgent';
  confidence: number;
}

/**
 * Final enriched dish result for the UI
 */
export interface EnrichedDishResult {
  title: string;
  price?: string;
  category: '🥗 Healthiest' | '⚖️ Balanced' | '🍔 Indulgent';
  summary: string;
  macros: MacroProfile;
  health_prediction: {
    short_term: string;
    long_term: string;
  };
  score: number;
  confidence: number;
}

/**
 * Complete analysis results
 */
export interface AnalysisResults {
  averageMenuScore: number;
  menuCategory: '🥗 Healthy' | '⚖️ Balanced' | '🍟 Indulgent';
  topDishes: {
    healthiest: EnrichedDishResult;
    balanced: EnrichedDishResult;
    indulgent: EnrichedDishResult;
  };
}

/**
 * Common interface for all agents
 */
export interface Agent<InputType, OutputType> {
  process(input: InputType, provider?: AIProvider): Promise<OutputType>;
  getPrompt(input: InputType): string;
}
