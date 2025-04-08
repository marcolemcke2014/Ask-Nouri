/**
 * Agent 2: Macro Estimator
 * Estimates nutritional macros based on dish name + ingredient tags
 */

import fs from 'fs';
import path from 'path';
import { Agent, MenuItem, MacroProfile } from '../types';
import { AIProvider } from '@/types/ai';

// Types that match our lookup table structure
interface FoodMacros {
  foods: {
    name: string;
    category: string;
    calories: number;
    macros: MacroProfile;
  }[];
  cookingMethods: {
    method: string;
    modifiers: {
      calories: number;
      fat: "increase" | "decrease" | "neutral" | "slight_increase";
    };
  }[];
  commonDishes: {
    name: string;
    ingredients: string[];
    cookingMethods: string[];
    calories: number;
    macros: MacroProfile;
  }[];
}

export class MacroEstimator implements Agent<MenuItem, MacroProfile> {
  private foodMacrosData: FoodMacros;
  
  constructor() {
    // Load the food macros data from JSON file
    try {
      const dataPath = path.join(process.cwd(), 'lib/agents/macro_estimator/data/food_macros.json');
      const jsonData = fs.readFileSync(dataPath, 'utf8');
      this.foodMacrosData = JSON.parse(jsonData);
    } catch (error) {
      console.error('Error loading food macros data:', error);
      // Initialize with empty data if file can't be loaded
      this.foodMacrosData = { foods: [], cookingMethods: [], commonDishes: [] };
    }
  }

  /**
   * Process a menu item to estimate its macronutrient profile
   */
  async process(
    menuItem: MenuItem, 
    provider?: AIProvider
  ): Promise<MacroProfile> {
    try {
      // 1. Check for exact matches in common dishes
      const exactMatch = this.findExactDishMatch(menuItem.name);
      if (exactMatch) {
        return exactMatch.macros;
      }
      
      // 2. Extract keywords from dish name
      const keywords = this.extractKeywords(menuItem.name);
      
      // 3. Identify cooking methods
      const cookingMethods = this.identifyCookingMethods(menuItem.name);
      
      // 4. Find ingredient matches
      const ingredients = this.findIngredientMatches(keywords);
      
      // 5. If we have ingredient matches, combine their macros
      if (ingredients.length > 0) {
        return this.combineMacros(ingredients, cookingMethods);
      }
      
      // 6. Try partial matching with common dishes
      const partialMatch = this.findPartialDishMatch(menuItem.name);
      if (partialMatch) {
        return partialMatch.macros;
      }
      
      // 7. If all fails, return default profile
      return this.getDefaultProfile();
    } catch (error) {
      console.error('Error in MacroEstimator:', error);
      return this.getDefaultProfile();
    }
  }
  
  /**
   * Find an exact match in common dishes
   */
  private findExactDishMatch(dishName: string): FoodMacros['commonDishes'][0] | null {
    const lowercaseName = dishName.toLowerCase();
    
    // First try exact match
    const exactMatch = this.foodMacrosData.commonDishes.find(
      dish => dish.name.toLowerCase() === lowercaseName
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, try to see if dish name contains one of our common dishes
    for (const dish of this.foodMacrosData.commonDishes) {
      if (lowercaseName.includes(dish.name.toLowerCase())) {
        return dish;
      }
    }
    
    return null;
  }
  
  /**
   * Find a partial match in common dishes
   */
  private findPartialDishMatch(dishName: string): FoodMacros['commonDishes'][0] | null {
    const lowercaseName = dishName.toLowerCase();
    const keywords = this.extractKeywords(dishName);
    
    // Calculate match score for each dish
    const scored = this.foodMacrosData.commonDishes.map(dish => {
      let score = 0;
      const dishKeywords = this.extractKeywords(dish.name);
      
      // Count matching keywords
      for (const keyword of keywords) {
        if (dishKeywords.includes(keyword)) {
          score += 1;
        }
      }
      
      return { dish, score };
    });
    
    // Sort by score, highest first
    scored.sort((a, b) => b.score - a.score);
    
    // Return the best match if it has a score > 0
    if (scored.length > 0 && scored[0].score > 0) {
      return scored[0].dish;
    }
    
    return null;
  }
  
  /**
   * Extract meaningful keywords from a dish name
   */
  private extractKeywords(dishName: string): string[] {
    const lowercaseName = dishName.toLowerCase();
    // Split and filter
    return lowercaseName
      .split(/[\s,&().-]+/) // Split on spaces, commas, etc.
      .filter(word => word.length > 2) // Only words with 3+ chars
      .filter(word => !['with', 'and', 'the', 'for', 'from'].includes(word)); // Remove common words
  }
  
  /**
   * Identify cooking methods from dish name
   */
  private identifyCookingMethods(dishName: string): string[] {
    const lowercaseName = dishName.toLowerCase();
    const foundMethods: string[] = [];
    
    for (const method of this.foodMacrosData.cookingMethods) {
      if (lowercaseName.includes(method.method)) {
        foundMethods.push(method.method);
      }
    }
    
    return foundMethods;
  }
  
  /**
   * Find matching ingredients from keywords
   */
  private findIngredientMatches(keywords: string[]): FoodMacros['foods'] {
    const matches: FoodMacros['foods'] = [];
    
    for (const keyword of keywords) {
      for (const food of this.foodMacrosData.foods) {
        if (keyword.includes(food.name) || food.name.includes(keyword)) {
          matches.push(food);
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Combine macros from multiple ingredients and apply cooking method modifiers
   */
  private combineMacros(
    ingredients: FoodMacros['foods'],
    cookingMethods: string[]
  ): MacroProfile {
    // Start with default values
    let calories = 0;
    let protein: "High" | "Mid" | "Low" = "Low";
    let carbs: "High" | "Mid" | "Low" = "Low";
    let fat: "High" | "Mid" | "Low" = "Low";
    let sugar: "High" | "Mid" | "Low" = "Low";
    
    // Sum up calories
    calories = ingredients.reduce((sum, food) => sum + food.calories, 0);
    
    // Score each macro
    let proteinScore = 0;
    let carbScore = 0;
    let fatScore = 0;
    let sugarScore = 0;
    
    for (const ingredient of ingredients) {
      // Convert text values to numeric scores
      proteinScore += ingredient.macros.protein === "High" ? 3 : 
                     ingredient.macros.protein === "Mid" ? 2 : 1;
                     
      carbScore += ingredient.macros.carbs === "High" ? 3 : 
                  ingredient.macros.carbs === "Mid" ? 2 : 1;
                  
      fatScore += ingredient.macros.fat === "High" ? 3 : 
                 ingredient.macros.fat === "Mid" ? 2 : 1;
                 
      sugarScore += ingredient.macros.sugar === "High" ? 3 : 
                   ingredient.macros.sugar === "Mid" ? 2 : 1;
    }
    
    // Normalize scores based on ingredient count
    const count = ingredients.length;
    proteinScore = proteinScore / count;
    carbScore = carbScore / count;
    fatScore = fatScore / count;
    sugarScore = sugarScore / count;
    
    // Convert back to text values
    protein = proteinScore > 2.3 ? "High" : (proteinScore > 1.3 ? "Mid" : "Low");
    carbs = carbScore > 2.3 ? "High" : (carbScore > 1.3 ? "Mid" : "Low");
    fat = fatScore > 2.3 ? "High" : (fatScore > 1.3 ? "Mid" : "Low");
    sugar = sugarScore > 2.3 ? "High" : (sugarScore > 1.3 ? "Mid" : "Low");
    
    // Apply cooking method modifiers
    for (const methodName of cookingMethods) {
      const method = this.foodMacrosData.cookingMethods.find(m => m.method === methodName);
      if (method) {
        // Modify calories
        calories = calories * method.modifiers.calories;
        
        // Modify fat level based on cooking method
        if (method.modifiers.fat === "increase") {
          fat = this.increaseMacroLevel(fat);
        } else if (method.modifiers.fat === "slight_increase" && fat === "Low") {
          fat = "Mid";
        } else if (method.modifiers.fat === "decrease") {
          fat = this.decreaseMacroLevel(fat);
        }
      }
    }
    
    return {
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
      sugar
    };
  }
  
  /**
   * Increase a macro level (e.g., Low -> Mid -> High)
   */
  private increaseMacroLevel(level: "High" | "Mid" | "Low"): "High" | "Mid" | "Low" {
    if (level === "Low") return "Mid";
    if (level === "Mid") return "High";
    return "High";
  }
  
  /**
   * Decrease a macro level (e.g., High -> Mid -> Low)
   */
  private decreaseMacroLevel(level: "High" | "Mid" | "Low"): "High" | "Mid" | "Low" {
    if (level === "High") return "Mid";
    if (level === "Mid") return "Low";
    return "Low";
  }
  
  /**
   * Get a default profile when no matches are found
   */
  private getDefaultProfile(): MacroProfile {
    return {
      calories: 500,
      protein: "Mid",
      carbs: "Mid",
      fat: "Mid",
      sugar: "Low"
    };
  }
} 