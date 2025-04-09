/**
 * Multi-Agent Orchestrator
 * Coordinates the execution of all agents and builds the final result
 */

import { AIProvider } from '@/types/ai';
import { MenuStructurer } from './MenuStructurer';
import { DishScorer } from './DishScorer';
import { TopSelector } from './TopSelector';
import { MacroProfiler } from './MacroProfiler';
import { BenefitSummarizer } from './BenefitSummarizer';
import { ScoreSynth } from './ScoreSynth';
import {
  AnalysisResults,
  EnrichedDishResult,
  OCRResult,
  StructuredMenuItem,
  UserProfile
} from './types';

export interface OrchestratorInput {
  ocrResult: OCRResult;
  userProfile: UserProfile;
  provider?: AIProvider;
}

/**
 * Orchestrates the multi-agent system to analyze a menu
 */
export class AgentOrchestrator {
  private menuStructurer: MenuStructurer;
  private dishScorer: DishScorer;
  private topSelector: TopSelector;
  private macroProfiler: MacroProfiler;
  private benefitSummarizer: BenefitSummarizer;
  private scoreSynth: ScoreSynth;

  constructor() {
    this.menuStructurer = new MenuStructurer();
    this.dishScorer = new DishScorer();
    this.topSelector = new TopSelector();
    this.macroProfiler = new MacroProfiler();
    this.benefitSummarizer = new BenefitSummarizer();
    this.scoreSynth = new ScoreSynth();
  }

  /**
   * Process a menu through the entire agent pipeline
   */
  async analyze(input: OrchestratorInput): Promise<AnalysisResults> {
    try {
      const { ocrResult, userProfile, provider = AIProvider.OPENAI } = input;
      
      // Step 1: Convert OCR to structured menu items
      console.log('🧠 Agent 1: Structuring menu items...');
      const menuItems = await this.menuStructurer.process(ocrResult, provider);
      
      // Validate that we have menu items to work with
      if (!menuItems || menuItems.length === 0) {
        throw new Error('MENU_STRUCTURING_FAILED: No menu items identified in the OCR text');
      }
      
      // Step 2: Score dishes and get menu summary
      console.log('🧠 Agent 2: Scoring dishes...');
      const { scoredItems, menuSummary } = await this.dishScorer.process(menuItems, provider);
      
      // Step 3: Select top dishes based on user profile
      console.log('🧠 Agent 3: Selecting top dishes...');
      const topDishes = await this.topSelector.process({
        scoredItems,
        userProfile
      }, provider);
      
      // Find the selected dishes from the structured menu
      const healthiestDish = menuItems.find(item => item.title === topDishes.healthiest);
      const balancedDish = menuItems.find(item => item.title === topDishes.balanced);
      const indulgentDish = menuItems.find(item => item.title === topDishes.indulgent);
      
      // Validate that all top dishes were found
      if (!healthiestDish) {
        throw new Error(`DISH_NOT_FOUND: Healthiest dish "${topDishes.healthiest}" not found in menu items`);
      }
      
      if (!balancedDish) {
        throw new Error(`DISH_NOT_FOUND: Balanced dish "${topDishes.balanced}" not found in menu items`);
      }
      
      if (!indulgentDish) {
        throw new Error(`DISH_NOT_FOUND: Indulgent dish "${topDishes.indulgent}" not found in menu items`);
      }
      
      // Process each selected dish with the remaining agents
      console.log('🧠 Processing top dishes with remaining agents...');
      
      const healthiestResult = await this.processDish(
        healthiestDish,
        userProfile,
        provider,
        topDishes.rationale.healthiest
      );
      
      const balancedResult = await this.processDish(
        balancedDish,
        userProfile,
        provider,
        topDishes.rationale.balanced
      );
      
      const indulgentResult = await this.processDish(
        indulgentDish,
        userProfile,
        provider,
        topDishes.rationale.indulgent
      );
      
      return {
        averageMenuScore: menuSummary.averageScore,
        menuCategory: menuSummary.category,
        topDishes: {
          healthiest: healthiestResult,
          balanced: balancedResult,
          indulgent: indulgentResult
        }
      };
    } catch (error) {
      console.error('Orchestration error:', error);
      throw error;
    }
  }
  
  /**
   * Process a single dish through Agents 4-6
   */
  private async processDish(
    dish: StructuredMenuItem,
    userProfile: UserProfile,
    provider: AIProvider,
    rationale?: string
  ): Promise<EnrichedDishResult> {
    try {
      // Validate dish has required properties
      if (!dish || !dish.title) {
        throw new Error('INVALID_DISH: Dish is missing required title property');
      }
      
      // Step 4: Get macro profile
      console.log(`🧠 Agent 4: Profiling macros for ${dish.title}...`);
      const macros = await this.macroProfiler.process(dish, provider);
      
      // Step 5: Get benefit summary
      console.log(`🧠 Agent 5: Summarizing benefits for ${dish.title}...`);
      const benefits = await this.benefitSummarizer.process({
        dish,
        userProfile
      }, provider);
      
      // Step 6: Synthesize final score
      console.log(`🧠 Agent 6: Synthesizing score for ${dish.title}...`);
      const synthesis = await this.scoreSynth.process({
        dish,
        macros,
        benefits,
        userProfile
      }, provider);
      
      // Create the enriched dish result
      return {
        title: dish.title,
        price: dish.price,
        category: synthesis.category,
        summary: benefits.summary || rationale || `${dish.title} is a good choice.`,
        macros,
        health_prediction: {
          short_term: benefits.shortTerm,
          long_term: benefits.longTerm
        },
        score: synthesis.score,
        confidence: synthesis.confidence
      };
    } catch (error: any) {
      // Don't create fallback - propagate the error with detailed information
      console.error(`Error processing dish ${dish?.title || 'unknown'}:`, error);
      throw new Error(`DISH_PROCESSING_FAILED: Failed to process dish "${dish?.title || 'unknown'}". ${error.message}`);
    }
  }
}
