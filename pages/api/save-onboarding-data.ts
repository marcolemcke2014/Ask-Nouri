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
    console.log(`[API Handler] Attempting UPSERT to table '${table}' using supabaseAdmin client.`);
    if (!supabaseAdmin) {
      console.error('[API Handler] CRITICAL: supabaseAdmin client is NULL before upsert!');
      return res.status(500).json({ error: 'Admin client not initialized.' });
    }

    // Perform the upsert operation using service role
    const { data: savedData, error } = await supabaseAdmin
      .from(table)
      .upsert(data, {
        onConflict: 'user_id'
      });

    // Handle errors
    if (error) {
      console.error(`[API Handler] Error from Supabase: ${error.message}`, error);
      return res.status(500).json({ error: error.message });
    }

    // Log success
    console.log(`[API Handler] Successfully saved data to '${table}' for user: ${data.user_id}`);
    
    // Return success
    return res.status(200).json({ success: true, data: savedData });
  } catch (error: any) {
    console.error('[API Handler] Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'An unexpected error occurred' });
  }
} 