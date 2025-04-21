import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Checks if a user profile exists in the user_profile table
 * @param userId The Supabase Auth user ID
 * @returns Boolean indicating if profile exists
 */
export async function checkUserProfileExists(userId: string): Promise<boolean> {
  try {
    console.log('[AUTH] Checking if user profile exists for:', userId);
    
    const { data, error } = await supabase
      .from('user_profile')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('[AUTH] Error checking user profile:', error.message);
      throw error;
    }
    
    return !!data;
  } catch (error: any) {
    console.error('[AUTH] Error in checkUserProfileExists:', error.message);
    return false;
  }
}

/**
 * Creates a user profile in the user_profile table
 * @param user The Supabase Auth user
 * @returns Success status
 */
export async function createUserProfile(user: User): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log('[AUTH] Creating user profile for:', user.id);
    
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
      auth_provider: 'google',
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('user_profile')
      .insert(userProfile);
    
    if (error) {
      console.error('[AUTH] Error creating user profile:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('[AUTH] User profile created successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('[AUTH] Error in createUserProfile:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Checks if a user profile exists and creates one if it doesn't
 * @param user The Supabase Auth user
 * @returns Whether the user is new and any error
 */
export async function createUserProfileIfNeeded(user: User): Promise<{ isNewUser: boolean; error: string | null }> {
  try {
    const profileExists = await checkUserProfileExists(user.id);
    
    if (profileExists) {
      console.log('[AUTH] User profile already exists');
      return { isNewUser: false, error: null };
    }
    
    const { success, error } = await createUserProfile(user);
    
    return { 
      isNewUser: success, 
      error: error 
    };
  } catch (error: any) {
    console.error('[AUTH] Error in createUserProfileIfNeeded:', error.message);
    return { isNewUser: false, error: error.message };
  }
} 