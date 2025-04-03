// User Profile
export interface UserProfile {
  id: string;
  name: string;
  healthGoals: HealthGoal[];
  dietaryRestrictions: DietaryRestriction[];
  preferredCuisines?: string[];
  calorieTarget?: number;
  saveHistory: boolean;
}

// Enum for health goals
export enum HealthGoal {
  WeightLoss = 'Weight Loss',
  WeightGain = 'Weight Gain',
  MuscleGain = 'Muscle Gain',
  LowCarb = 'Low Carb',
  LowFat = 'Low Fat',
  LowSodium = 'Low Sodium',
  HighProtein = 'High Protein',
  HeartHealth = 'Heart Health',
  DiabetesManagement = 'Diabetes Management',
  GeneralHealth = 'General Health'
}

// Enum for dietary restrictions
export enum DietaryRestriction {
  Vegetarian = 'Vegetarian',
  Vegan = 'Vegan',
  GlutenFree = 'Gluten Free',
  DairyFree = 'Dairy Free',
  NutFree = 'Nut Free',
  ShellfishFree = 'Shellfish Free',
  Kosher = 'Kosher',
  Halal = 'Halal',
  None = 'None'
}

// Menu item analyzed
export interface MenuItem {
  name: string;
  description: string;
  suitable: boolean;
  healthScore: number; // 1-10 scale
  comment: string;
}

// Full menu analysis result
export interface MenuAnalysis {
  id: string;
  createdAt: string;
  restaurantName?: string;
  rawMenuText: string;
  cleanedMenuText: string;
  menuItems: MenuItem[];
  userProfile: {
    healthGoals: HealthGoal[];
    dietaryRestrictions: DietaryRestriction[];
  };
  aiModel: 'openai' | 'anthropic';
}

// Scan history item
export interface ScanHistoryItem {
  id: string;
  createdAt: string;
  restaurantName?: string;
  imageDataUrl?: string;
  menuAnalysisId: string;
  favoriteItems: string[]; // Array of menu item names that were favorited
}

// Favorite or saved menu item
export interface SavedMenuItem {
  id: string;
  savedAt: string;
  menuItemName: string;
  restaurantName?: string;
  healthScore: number;
  comment: string;
  scanHistoryId: string;
}