/**
 * Database operations related to users
 */
import supabase, { handleDbError } from './client';
import { Tables, DbProfile, DbUserPreferences } from '@/types/db';
import { UserProfile, UserPreferences, HealthGoal } from '@/types/user';
import { DietaryTag } from '@/types/menu';

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<DbProfile | null> {
  try {
    const { data, error } = await supabase
      .from(Tables.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as DbProfile;
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  profile: Partial<DbProfile> & { id: string }
): Promise<DbProfile | null> {
  try {
    const { data, error } = await supabase
      .from(Tables.PROFILES)
      .upsert(profile)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as DbProfile;
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from(Tables.USER_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Convert from DB format to application format
    return {
      userId: data.user_id,
      dietaryRestrictions: data.dietary_restrictions as DietaryTag[],
      healthGoals: data.health_goals as HealthGoal[],
      allergies: data.allergies,
      preferredCuisines: data.preferred_cuisines,
      avoidIngredients: data.avoid_ingredients,
      calorieLimit: data.calorie_limit,
      nutritionTargets: data.nutrition_targets,
    };
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(
  preferences: UserPreferences
): Promise<UserPreferences | null> {
  try {
    // Convert from application format to DB format
    const dbPreferences: Partial<DbUserPreferences> = {
      user_id: preferences.userId,
      dietary_restrictions: preferences.dietaryRestrictions,
      health_goals: preferences.healthGoals,
      allergies: preferences.allergies,
      preferred_cuisines: preferences.preferredCuisines,
      avoid_ingredients: preferences.avoidIngredients,
      calorie_limit: preferences.calorieLimit,
      nutrition_targets: preferences.nutritionTargets,
    };
    
    const { data, error } = await supabase
      .from(Tables.USER_PREFERENCES)
      .upsert(dbPreferences)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Convert back to application format
    return {
      userId: data.user_id,
      dietaryRestrictions: data.dietary_restrictions as DietaryTag[],
      healthGoals: data.health_goals as HealthGoal[],
      allergies: data.allergies,
      preferredCuisines: data.preferred_cuisines,
      avoidIngredients: data.avoid_ingredients,
      calorieLimit: data.calorie_limit,
      nutritionTargets: data.nutrition_targets,
    };
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    // Start a transaction to delete all user data
    const { error } = await supabase.rpc('delete_user_data', {
      user_id: userId
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    handleDbError(error);
    return false;
  }
} 