/**
 * User profile and preferences type definitions
 */

/**
 * Complete user profile
 */
export interface UserProfile {
  id: string;
  name: string;
  healthGoals: HealthGoal[];
  dietaryRestrictions: DietaryRestriction[];
  preferredCuisines?: string[];
  calorieTarget?: number;
  nutrientTargets?: NutrientTargets;
  saveHistory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Health goal with details
 */
export interface HealthGoal {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

/**
 * Common health goals
 */
export const HEALTH_GOALS: HealthGoal[] = [
  { 
    id: 'weight-loss', 
    name: 'Weight Loss', 
    description: 'Focus on lower calorie options with good satiety', 
    icon: '⚖️',
    priority: 'high',
    tags: ['low-calorie', 'high-protein', 'high-fiber']
  },
  { 
    id: 'muscle-gain', 
    name: 'Muscle Gain', 
    description: 'Focus on protein-rich foods with adequate calories', 
    icon: '💪',
    priority: 'high',
    tags: ['high-protein', 'moderate-carbs', 'nutrient-dense']
  },
  { 
    id: 'diabetes-management', 
    name: 'Diabetes Management', 
    description: 'Focus on low glycemic index foods and balanced meals', 
    icon: '🩸',
    priority: 'high',
    tags: ['low-sugar', 'low-glycemic', 'high-fiber'] 
  },
  { 
    id: 'heart-health', 
    name: 'Heart Health', 
    description: 'Focus on heart-healthy fats and low sodium foods', 
    icon: '❤️',
    priority: 'high',
    tags: ['low-sodium', 'healthy-fats', 'high-fiber'] 
  },
  { 
    id: 'general-health', 
    name: 'General Health', 
    description: 'Focus on balanced nutrition from whole foods', 
    icon: '🥗',
    priority: 'medium',
    tags: ['balanced', 'whole-foods', 'nutrient-dense'] 
  }
];

/**
 * Dietary restriction with details
 */
export interface DietaryRestriction {
  id: string;
  name: string;
  description: string;
  icon: string;
  severity: 'allergy' | 'intolerance' | 'preference';
  excludedIngredients: string[];
}

/**
 * Common dietary restrictions
 */
export const DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'No meat, poultry, or seafood',
    icon: '🥗',
    severity: 'preference',
    excludedIngredients: ['meat', 'chicken', 'beef', 'pork', 'seafood', 'fish']
  },
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'No animal products including eggs, dairy, and honey',
    icon: '🌱',
    severity: 'preference',
    excludedIngredients: ['meat', 'chicken', 'beef', 'pork', 'seafood', 'fish', 'eggs', 'dairy', 'milk', 'cheese', 'honey']
  },
  {
    id: 'gluten-free',
    name: 'Gluten-Free',
    description: 'No wheat, barley, rye or other gluten-containing ingredients',
    icon: '🌾',
    severity: 'intolerance',
    excludedIngredients: ['wheat', 'barley', 'rye', 'gluten', 'bread', 'pasta', 'flour']
  },
  {
    id: 'dairy-free',
    name: 'Dairy-Free',
    description: 'No milk, cheese, or dairy-derived ingredients',
    icon: '🥛',
    severity: 'intolerance',
    excludedIngredients: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy']
  },
  {
    id: 'nut-allergy',
    name: 'Nut Allergy',
    description: 'No tree nuts or peanuts',
    icon: '🥜',
    severity: 'allergy',
    excludedIngredients: ['peanuts', 'almonds', 'walnuts', 'cashews', 'pistachios', 'hazelnuts', 'pecans', 'macadamia']
  }
];

/**
 * User nutrient targets
 */
export interface NutrientTargets {
  calories?: {
    min: number;
    max: number;
  };
  protein?: {
    min: number;
    max: number;
    unit: 'g' | '%';
  };
  carbs?: {
    min: number;
    max: number;
    unit: 'g' | '%';  
  };
  fat?: {
    min: number;
    max: number;
    unit: 'g' | '%';
  };
  sodium?: {
    max: number;
    unit: 'mg';
  };
  sugar?: {
    max: number;
    unit: 'g';
  };
}

/**
 * User scan history
 */
export interface UserScanHistory {
  scans: ScanHistoryItem[];
  favoriteItems: SavedMenuItem[];
}

/**
 * Scan history item
 */
export interface ScanHistoryItem {
  id: string;
  createdAt: Date;
  restaurantName?: string;
  imageDataUrl?: string;
  menuAnalysisId: string;
  favoriteItems: string[]; // Array of menu item names that were favorited
}

/**
 * Saved menu item
 */
export interface SavedMenuItem {
  id: string;
  savedAt: Date;
  menuItemName: string;
  restaurantName?: string;
  healthScore: number;
  comment: string;
  scanHistoryId: string;
} 