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

    // Use admin client to update the user profile
    const { data, error } = await supabaseAdmin
      .from('user_profile')
      .update({ 
          plan_type: planType
      })
      .eq('user_id', userId)
      .select() // Select to confirm update
      .single(); // Expecting only one row

    if (error) {
      console.error(`[API /save-plan] Error updating profile for ${userId}:`, error);
      // Check for specific errors, like row not found (though trigger should create it)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User profile not found for the given ID.' });
      }
      return res.status(500).json({ error: `Database error: ${error.message}` });
    }

    if (!data) {
      console.error(`[API /save-plan] Update seemed successful but no data returned for user ${userId}. Row might not exist or RLS issue persists unexpectedly.`);
      return res.status(404).json({ error: 'User profile found but update failed silently.' });
    }

    console.log(`[API /save-plan] Successfully updated plan for user ${userId}.`);
    return res.status(200).json({ success: true, updatedProfile: data });

  } catch (error: any) {
    console.error('[API /save-plan] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 