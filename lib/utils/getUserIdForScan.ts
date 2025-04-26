/**
 * Utility to get a user ID for OCR scanning
 * 
 * Only uses real authenticated users via Supabase
 */

import { supabase } from '../supabase';
import logger from '../logger';

// Since our API routes are in JS, we need to make this compatible with both Request types
export async function getUserIdForScan(req: any): Promise<string | null> {
  logger.log('AUTH', 'Checking for authenticated user in scan context');
  
  try {
    // Get current user session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('AUTH', 'Error retrieving session for scan', error);
      throw error;
    }
    
    // If user is authenticated, use their ID
    if (session?.user?.id) {
      logger.log('AUTH', `Found authenticated user for scan: ${session.user.id}`);
      return session.user.id;
    }
    
    // If no authenticated user
    logger.warn('AUTH', 'No authenticated user found. Authentication required for scans.');
    return null;
  } catch (err) {
    logger.error('AUTH', 'Error in getUserIdForScan utility', err);
    return null;
  }
} 