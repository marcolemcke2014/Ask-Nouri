/**
 * Types related to users, authentication, and profiles
 */
import { DietaryTag } from './menu';

// User role for authorization
export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

// Authentication provider
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github',
  APPLE = 'apple',
}

// Health goal types
export enum HealthGoal {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MUSCLE_BUILDING = 'muscle_building',
  MAINTENANCE = 'maintenance',
  HEART_HEALTH = 'heart_health',
  DIABETES_MANAGEMENT = 'diabetes_management',
  ENERGY_BOOST = 'energy_boost',
  GENERAL_HEALTH = 'general_health',
  BALANCED_DIET = 'balanced_diet',
  LOW_SODIUM = 'low_sodium',
  LOW_CHOLESTEROL = 'low_cholesterol',
}

// User authentication state
export type AuthState = {
  loading: boolean;
  user: User | null;
  error: string | null;
};

// Basic user information
export type User = {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  emailVerified?: boolean;
  provider?: AuthProvider;
  createdAt: Date;
  lastLogin?: Date;
};

// User preferences
export type UserPreferences = {
  userId: string;
  dietaryRestrictions: DietaryTag[];
  healthGoals: HealthGoal[];
  allergies: string[];
  preferredCuisines: string[];
  avoidIngredients: string[];
  calorieLimit?: number;
  nutritionTargets?: Record<string, number>;
};

// User profile (public information)
export type UserProfile = {
  id: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: Date;
  dietaryPreferences?: DietaryTag[];
  healthGoals?: HealthGoal[];
};

// User settings
export type UserSettings = {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailNotifications: boolean;
  language: string;
  useMetricSystem: boolean;
  saveHistory: boolean;
  autoAnalyze: boolean;
  showHealthScores: boolean;
  privacyLevel: 'public' | 'private' | 'friends';
};

// Authentication request
export type AuthRequest = {
  email: string;
  password: string;
  remember?: boolean;
};

// Registration request
export type RegisterRequest = {
  email: string;
  password: string;
  name?: string;
  acceptTerms: boolean;
};

// Password reset request
export type PasswordResetRequest = {
  email: string;
};

// Update profile request
export type UpdateProfileRequest = {
  name?: string;
  avatar?: string | null;
  bio?: string;
  location?: string;
  website?: string;
}; 