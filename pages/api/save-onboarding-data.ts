import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Log environment variables as they are read at the top level
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const maskedKey = supabaseServiceKey ? `ServiceKeyLoaded(Starts:${supabaseServiceKey.slice(0,5)},Ends:${supabaseServiceKey.slice(-4)})` : 'SERVICE KEY NOT LOADED';
console.log(`[API Route Load] SUPABASE_URL: ${supabaseUrl || 'MISSING'}`);
console.log(`[API Route Load] SUPABASE_SERVICE_KEY Status: ${maskedKey}`);

// Log client creation
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
console.log(`[API Route Load] supabaseAdmin client created: ${!!supabaseAdmin}`);

/**
 * API route to save onboarding data using the service role to bypass RLS
 * This is called from onboarding steps to ensure data is properly saved
 * regardless of RLS policies.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // In development mode, optionally bypass processing to improve HMR stability
  if (process.env.NODE_ENV === 'development' && req.headers['x-skip-in-dev']) {
    console.log('[API /save-onboarding-data] Bypassing in development mode');
    return res.status(200).json({ success: true, mock: true, message: 'Bypassed in development mode' });
  }

  try {
    // Extract data from request body
    const { table, data } = req.body;

    // Validate input
    if (!table || !data) {
      return res.status(400).json({ error: 'Missing required fields: table and data' });
    }

    // Ensure user_id is provided for data
    if (!data.user_id) {
      return res.status(400).json({ error: 'Missing user_id in data' });
    }

    // Log client usage in handler - immediately before using supabaseAdmin
    console.log(`[API Handler] Attempting operation on table '${table}' using supabaseAdmin client.`);
    if (!supabaseAdmin) {
      console.error('[API Handler] CRITICAL: supabaseAdmin client is NULL before operation!');
      return res.status(500).json({ error: 'Admin client not initialized.' });
    }

    // Special handling for user_profile to ensure it always exists
    if (table === 'user_profile') {
      const userId = data.id || data.user_id;
      
      // Check if profile already exists before upserting
      console.log(`[API Handler] Checking if user profile exists for: ${userId}`);
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from('user_profile')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error(`[API Handler] Error checking profile existence: ${checkError.message}`);
        // Continue anyway, the upsert will handle it
      }

      if (!existingProfile && !data.email) {
        // Try to fetch user email from auth if not provided
        try {
          console.log(`[API Handler] Fetching user data from auth for: ${userId}`);
          const { data: authUser, error: authError } = await supabaseAdmin
            .auth
            .admin
            .getUserById(userId);
            
          if (!authError && authUser?.user?.email) {
            console.log(`[API Handler] Found email in auth: ${authUser.user.email}`);
            data.email = authUser.user.email;
          } else {
            console.warn(`[API Handler] Could not find user email in auth: ${authError?.message || 'No auth user found'}`);
          }
        } catch (authError) {
          console.warn(`[API Handler] Error accessing Auth API: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
          // Continue anyway with what we have
        }
      }
      
      // Ensure basic fields exist
      if (!data.created_at) {
        data.created_at = new Date().toISOString();
      }
      data.updated_at = new Date().toISOString();
    }

    // For any table, make sure we're using user_id or id as conflict column
    const onConflict = table === 'user_profile' ? 'id' : 'user_id';

    // Perform the upsert operation using service role
    console.log(`[API Handler] Performing UPSERT on table '${table}' with conflict column '${onConflict}'`);
    const { data: savedData, error } = await supabaseAdmin
      .from(table)
      .upsert(data, {
        onConflict
      });

    // Handle errors
    if (error) {
      console.error(`[API Handler] Error from Supabase: ${error.message}`, error);
      return res.status(500).json({ error: error.message });
    }

    // Log success
    console.log(`[API Handler] Successfully saved data to '${table}' for user: ${data.user_id || data.id}`);
    
    // Return success
    return res.status(200).json({ success: true, data: savedData });
  } catch (error: any) {
    console.error('[API Handler] Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'An unexpected error occurred' });
  }
} 