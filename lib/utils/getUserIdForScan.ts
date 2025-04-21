/**
 * Utility to get a user ID for OCR scanning
 * 
 * Now uses real authenticated users via Supabase
 * Re-implementing development test mode directly
 */

import { supabase } from '../supabase';
import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Check for development test mode - handle all possible ways the flag could be passed
    // Note: We're being extra careful to handle the flag regardless of how it's passed
    let isTestMode = process.env.NODE_ENV !== 'production';
    
    // Custom detection for test flag in the req object
    if (isTestMode) {
      // Check request query params
      if (req.query?.test_dev_mode === 'true') {
        logger.log('AUTH', '[DEV TEST MODE] Found test_dev_mode in query params');
        isTestMode = true;
      }
      // Check request headers
      else if (req.headers?.['x-test-dev-mode'] === 'true') {
        logger.log('AUTH', '[DEV TEST MODE] Found test_dev_mode in headers');
        isTestMode = true;
      }
      // Check if parsed form fields exist (from multipart form with busboy)
      else if (req.formData?.fields?.test_dev_mode === 'true') {
        logger.log('AUTH', '[DEV TEST MODE] Found test_dev_mode in parsed form data');
        isTestMode = true;
      }
      // As a fallback, force test mode in development when no authenticated user
      else {
        logger.log('AUTH', '[DEV TEST MODE] Forcing test mode in development environment');
        isTestMode = true;
      }
    }
    
    if (isTestMode) {
      // Generate a new test user ID
      const testUserId = uuidv4();
      logger.log('AUTH', `[DEV TEST MODE] Creating test user ID: ${testUserId}`);
      
      // Create test user profile in database
      const { data, error } = await supabase
        .from('user_profile')
        .insert({
          id: testUserId,
          email: `test-${testUserId.substring(0, 8)}@example.com`,
          onboarding_complete: true,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        logger.error('AUTH', '[DEV TEST MODE] Failed to create test user profile', error);
      } else {
        logger.log('AUTH', '[DEV TEST MODE] Created test user profile', { id: data.id });
      }
      
      return testUserId;
    }
    
    // If not in test mode and no authenticated user
    logger.warn('AUTH', 'No authenticated user found. Authentication required for scans.');
    return null;
  } catch (err) {
    logger.error('AUTH', 'Error in getUserIdForScan utility', err);
    return null;
  }
} 