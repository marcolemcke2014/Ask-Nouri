/**
 * Types related to database tables and operations
 */

// Database table names
export enum Tables {
  USERS = 'users',
  PROFILES = 'profiles',
  MENUS = 'menus',
  MENU_ITEMS = 'menu_items',
  ANALYSES = 'analyses',
  MEAL_FEEDBACK = 'meal_feedback',
  USER_PREFERENCES = 'user_preferences',
  RESTAURANTS = 'restaurants',
  SCAN_HISTORY = 'scan_history',
  SAVED_MENUS = 'saved_menus',
}

// Database user profile
export type DbProfile = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

// Database user preferences
export type DbUserPreferences = {
  id: string;
  user_id: string;
  dietary_restrictions: string[]; // JSON array of dietary restrictions
  health_goals: string[]; // JSON array of health goals
  allergies: string[]; // JSON array of allergies
  preferred_cuisines: string[]; // JSON array of preferred cuisines
  avoid_ingredients: string[]; // JSON array of ingredients to avoid
  calorie_limit?: number;
  nutrition_targets?: Record<string, number>; // JSON object of nutrition targets
  created_at: string;
  updated_at: string;
};

// Database restaurant
export type DbRestaurant = {
  id: string;
  name: string;
  cuisine_type?: string;
  location?: string;
  price_range?: string;
  created_at: string;
  updated_at: string;
};

// Database menu
export type DbMenu = {
  id: string;
  restaurant_id?: string;
  text: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
};

// Database menu item
export type DbMenuItem = {
  id: string;
  menu_id: string;
  name: string;
  description?: string;
  price?: string;
  category?: string;
  health_rating: string;
  dietary_tags: string[]; // JSON array of dietary tags
  nutrition?: Record<string, number>; // JSON object of nutrition info
  ingredients?: string[]; // JSON array of ingredients
  reasons_for_rating?: string[]; // JSON array of reasons
  recommended_modifications?: string[]; // JSON array of modifications
  created_at: string;
  updated_at: string;
};

// Database analysis
export type DbAnalysis = {
  id: string;
  menu_id: string;
  user_id?: string;
  result: any; // JSON object with analysis results
  created_at: string;
  updated_at: string;
};

// Database meal feedback
export type DbMealFeedback = {
  id: string;
  analysis_id?: string;
  user_id: string;
  dish_name: string;
  rating: number; // 1-5 star rating
  notes?: string;
  feeling_after?: string;
  created_at: string;
  updated_at: string;
};

// Database scan history
export type DbScanHistory = {
  id: string;
  user_id: string;
  menu_id: string;
  analysis_id?: string;
  restaurant_id?: string;
  scanned_at: string;
};

// Database saved menu
export type DbSavedMenu = {
  id: string;
  user_id: string;
  menu_id: string;
  saved_at: string;
  notes?: string;
};

// Database query result with pagination
export type DbPaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// Database error
export type DbError = {
  code: string;
  message: string;
  details?: string;
}; 