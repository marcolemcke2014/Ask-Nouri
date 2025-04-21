import { supabase } from '../../lib/supabase';

/**
 * API endpoint to retrieve a user's scan history
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Get the current user session
    console.log('[AUTH] Checking for authenticated user session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(`[ERROR] Failed to get user session: ${sessionError.message}`);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    // Check if user is authenticated
    if (!session?.user) {
      console.error('[AUTH] No authenticated user found');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = session.user.id;
    console.log(`[AUTH] Found authenticated user: ${userId}`);

    // Query the menu_scan table for this user's scans
    console.log(`[QUERY] Fetching scans for user: ${userId}`);
    const { data: scans, error: queryError } = await supabase
      .from('menu_scan')
      .select('id, menu_raw_text, scanned_at, restaurant_name, location')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false });

    if (queryError) {
      console.error(`[ERROR] Database query failed: ${queryError.message}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve scan history'
      });
    }

    // Process the results
    const scanCount = scans?.length || 0;
    console.log(`[RESULT] Found ${scanCount} scans for user ${userId}`);

    // Return the results
    return res.status(200).json({
      success: true,
      data: scans || []
    });
  } catch (error) {
    console.error(`[ERROR] Unhandled exception: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    });
  }
} 