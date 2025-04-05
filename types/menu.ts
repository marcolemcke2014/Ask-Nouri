/**
 * Menu item and analysis related type definitions
 */

/**
 * A parsed menu item from OCR text
 */
export interface ParsedMenuItem {
  title: string;
  description?: string;
  price?: string;
}

/**
 * Menu item after AI analysis
 */
export interface AnalyzedMenuItem {
  name: string;
  score: number; // 1-10 scale
  tags: Tag[];
  flags: NutritionalFlag[];
  improvements: string[];
  reasonForScore?: string;
  matchesGoals?: boolean;
}

/**
 * Tag types for categorizing menu items
 */
export enum TagType {
  DIETARY = 'dietary',
  NUTRITIONAL = 'nutritional',
  CUISINE = 'cuisine',
  MEAL_TYPE = 'meal-type',
  INGREDIENT = 'ingredient'
}

/**
 * A tag for a menu item
 */
export interface Tag {
  id: string;
  label: string;
  type: TagType;
  icon?: string; // Emoji or icon code
  color?: string; // CSS color code
}

/**
 * Common dietary tags
 */
export const DIETARY_TAGS: Tag[] = [
  { id: 'vegan', label: 'Vegan', type: TagType.DIETARY, icon: '🌱', color: '#4CAF50' },
  { id: 'vegetarian', label: 'Vegetarian', type: TagType.DIETARY, icon: '🥗', color: '#8BC34A' },
  { id: 'gluten-free', label: 'Gluten-Free', type: TagType.DIETARY, icon: '🌾', color: '#CDDC39' },
  { id: 'dairy-free', label: 'Dairy-Free', type: TagType.DIETARY, icon: '🥛', color: '#FFEB3B' },
  { id: 'keto', label: 'Keto-Friendly', type: TagType.DIETARY, icon: '🥑', color: '#FF9800' },
  { id: 'paleo', label: 'Paleo', type: TagType.DIETARY, icon: '🍖', color: '#795548' },
  { id: 'low-carb', label: 'Low-Carb', type: TagType.DIETARY, icon: '🍽️', color: '#FF5722' },
  { id: 'high-protein', label: 'High-Protein', type: TagType.DIETARY, icon: '💪', color: '#F44336' }
];

/**
 * Nutritional flag levels
 */
export enum FlagLevel {
  INFO = 'info',
  WARNING = 'warning',
  ALERT = 'alert'
}

/**
 * A nutritional flag for a menu item
 */
export interface NutritionalFlag {
  id: string;
  label: string;
  level: FlagLevel;
  icon: string; // Emoji or icon code
  description?: string;
}

/**
 * Common nutritional flags
 */
export const NUTRITIONAL_FLAGS: NutritionalFlag[] = [
  { id: 'high-sodium', label: 'High Sodium', level: FlagLevel.WARNING, icon: '🧂', description: 'This dish contains high levels of sodium' },
  { id: 'high-sugar', label: 'High Sugar', level: FlagLevel.WARNING, icon: '🍬', description: 'This dish contains high levels of sugar' },
  { id: 'high-fat', label: 'High Fat', level: FlagLevel.WARNING, icon: '🍕', description: 'This dish is high in saturated fats' },
  { id: 'high-calorie', label: 'High Calorie', level: FlagLevel.INFO, icon: '🔥', description: 'This dish is high in calories' },
  { id: 'low-fiber', label: 'Low Fiber', level: FlagLevel.INFO, icon: '🌿', description: 'This dish is low in dietary fiber' },
  { id: 'allergens', label: 'Contains Allergens', level: FlagLevel.ALERT, icon: '⚠️', description: 'This dish contains common allergens' },
  { id: 'processed', label: 'Highly Processed', level: FlagLevel.INFO, icon: '🏭', description: 'This dish contains highly processed ingredients' }
];

/**
 * Complete menu analysis results
 */
export interface MenuAnalysisResult {
  id: string;
  timestamp: Date;
  rawText: string;
  items: AnalyzedMenuItem[];
  restaurantName?: string;
  userGoals: string[];
  error?: string;
}

/**
 * Menu improvement suggestion
 */
export interface MenuImprovement {
  itemName: string;
  original: string;
  suggestion: string;
  reasonForSuggestion: string;
  healthImpact: string;
} 