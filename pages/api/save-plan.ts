import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client with SERVICE ROLE KEY for admin privileges
// This bypasses RLS policies completely
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // In development mode, optionally bypass processing to improve HMR stability
  if (process.env.NODE_ENV === 'development' && req.headers['x-skip-in-dev']) {
    console.log('[API /save-plan] Bypassing in development mode');
    return res.status(200).json({ success: true, mock: true, message: 'Bypassed in development mode' });
  }

  // Check for required environment variables
  if (!supabaseAdmin) {
    console.error('[API /save-plan] Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    return res.status(500).json({ error: 'Server configuration error. Check server logs.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, planType } = req.body;

    // Validate input
    if (!userId || typeof userId !== 'string' || !planType || typeof planType !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId or planType in request body' });
    }
    console.log(`[API /save-plan] Received request for user: ${userId}, plan: ${planType}`);

    // 1. First check if user profile exists
    console.log(`[API /save-plan] Checking if user profile exists for: ${userId}`);
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('user_profile')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error(`[API /save-plan] Error checking profile for ${userId}:`, checkError);
      return res.status(500).json({ error: `Database error checking profile: ${checkError.message}` });
    }

    // 2. If user profile doesn't exist, try to get user from auth and create a profile
    if (!existingProfile) {
      console.log(`[API /save-plan] User profile not found, attempting to create one for ${userId}`);
      
      try {
        // Try to get user info from Auth API
        const { data: authUser, error: authError } = await supabaseAdmin
          .auth
          .admin
          .getUserById(userId);

        if (authError || !authUser) {
          console.error(`[API /save-plan] User not found in auth system: ${userId}`);
          return res.status(404).json({ error: 'User not found in authentication system' });
        }

        // Create a basic profile
        console.log(`[API /save-plan] Creating user profile for ${userId} with email ${authUser.user?.email}`);
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('user_profile')
          .insert({
            id: userId,
            email: authUser.user?.email,
            plan_type: planType, // Set the requested plan type directly
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarded: false
          })
          .select()
          .single();

        if (createError || !newProfile) {
          console.error(`[API /save-plan] Failed to create profile for ${userId}:`, createError);
          return res.status(500).json({ error: `Failed to create user profile: ${createError?.message || 'Unknown error'}` });
        }

        console.log(`[API /save-plan] Successfully created new user profile for ${userId}`);
        return res.status(200).json({ 
          success: true, 
          updatedProfile: newProfile,
          isNewProfile: true
        });
      } catch (authError) {
        console.error(`[API /save-plan] Error accessing Auth API:`, authError);
        return res.status(500).json({ 
          error: 'Error accessing Auth API', 
          details: authError instanceof Error ? authError.message : 'Unknown error' 
        });
      }
    }

    // 3. If user profile exists, update it
    console.log(`[API /save-plan] Updating plan type for existing user: ${userId}`);
    const { data, error } = await supabaseAdmin
      .from('user_profile')
      .update({ 
          plan_type: planType,
          updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select() // Select to confirm update
      .single(); // Expecting only one row

    if (error) {
      console.error(`[API /save-plan] Error updating profile for ${userId}:`, error);
      return res.status(500).json({ error: `Database error: ${error.message}` });
    }

    if (!data) {
      console.error(`[API /save-plan] Update seemed successful but no data returned for user ${userId}`);
      return res.status(404).json({ error: 'User profile found but update failed silently.' });
    }

    console.log(`[API /save-plan] Successfully updated plan for user ${userId}.`);
    return res.status(200).json({ success: true, updatedProfile: data });

  } catch (error: any) {
    console.error('[API /save-plan] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 