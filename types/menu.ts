/**
 * Types related to menu items, analysis, and nutrition data
 */

// Dietary tags for menu items
export enum DietaryTag {
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
  GLUTEN_FREE = 'gluten-free',
  DAIRY_FREE = 'dairy-free',
  KETO = 'keto',
  LOW_CARB = 'low-carb',
  LOW_CALORIE = 'low-calorie',
  HIGH_PROTEIN = 'high-protein',
  PALEO = 'paleo',
  NUT_FREE = 'nut-free',
  PESCATARIAN = 'pescatarian',
  SOY_FREE = 'soy-free',
  EGG_FREE = 'egg-free',
  SHELLFISH_FREE = 'shellfish-free',
  HALAL = 'halal',
  KOSHER = 'kosher',
}

// Health rating for menu items
export enum HealthRating {
  EXCELLENT = 'excellent', // Very healthy choice
  GOOD = 'good',           // Healthy choice
  MODERATE = 'moderate',   // Moderately healthy
  POOR = 'poor',           // Not very healthy
  AVOID = 'avoid',         // Unhealthy choice
}

// Nutrition info for a menu item
export type NutritionInfo = {
  calories?: number;
  protein?: number; // grams
  carbs?: number;   // grams
  fat?: number;     // grams
  sugar?: number;   // grams
  sodium?: number;  // milligrams
  fiber?: number;   // grams
  saturatedFat?: number; // grams
  transFat?: number;     // grams
  cholesterol?: number;  // milligrams
};

// User's dietary preferences and health goals
export type UserPreferences = {
  dietaryRestrictions?: DietaryTag[];
  healthGoals?: string[];
  allergies?: string[];
  preferredCuisines?: string[];
  avoidIngredients?: string[];
  calorieLimit?: number;
  nutritionTargets?: Partial<NutritionInfo>;
};

// A single menu item analyzed
export type MenuItem = {
  id?: string;
  name: string;
  description?: string;
  price?: string;
  category?: string;
  healthRating: HealthRating;
  dietaryTags: DietaryTag[];
  nutrition?: NutritionInfo;
  ingredients?: string[];
  reasonsForRating?: string[];
  recommendedModifications?: string[];
  compatibilityScore?: number; // 0-100 score showing compatibility with user preferences
};

// Restaurant information
export type Restaurant = {
  id?: string;
  name: string;
  cuisineType?: string;
  location?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
};

// Full menu with multiple items
export type Menu = {
  id?: string;
  restaurantId?: string;
  restaurant?: Restaurant;
  items: MenuItem[];
  scannedAt?: Date;
  rawText?: string;
};

// Request to analyze menu items
export type MenuAnalysisRequest = {
  menuText: string;
  userPreferences?: UserPreferences;
  includeNutrition?: boolean;
  restaurantInfo?: Partial<Restaurant>;
};

// Recommendation types
export type Recommendations = {
  bestChoice?: MenuItem;
  alternatives?: MenuItem[];
  avoidItems?: MenuItem[];
  generalTips?: string[];
  healthySwaps?: Record<string, string>;
  diningscore?: number; // 0-100 score for overall menu health
};

// Response from menu analysis
export type MenuAnalysisResponse = {
  items: MenuItem[];
  recommendations: Recommendations;
  matchScore?: number; // How well the restaurant matches user preferences
}; 