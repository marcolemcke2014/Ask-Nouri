import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createUserProfileIfNeeded } from '@/lib/auth';

/**
 * Authentication callback handler
 * This endpoint is called by Supabase after a successful OAuth login
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the auth code and session from the query parameters
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      console.error('[AUTH] Missing auth code');
      return res.redirect('/login?error=missing_code');
    }
    
    console.log('[AUTH] Received callback with code');
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[AUTH] Error exchanging code for session:', error.message);
      return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    
    if (!data.session || !data.user) {
      console.error('[AUTH] No session or user in response');
      return res.redirect('/login?error=no_session');
    }
    
    console.log('[AUTH] Session created for user:', data.user.id);
    
    // Check if user profile exists, if not create it
    const { isNewUser, error: profileError } = await createUserProfileIfNeeded(data.user);
    
    if (profileError) {
      console.error('[AUTH] Error creating user profile:', profileError);
      // Continue anyway since the user is authenticated
    }
    
    // Redirect based on whether this is a new user or not
    if (isNewUser) {
      console.log('[AUTH] New user, redirecting to onboarding');
      return res.redirect('/onboarding');
    } else {
      console.log('[AUTH] Returning user, redirecting to dashboard');
      return res.redirect('/dashboard');
    }
  } catch (error: any) {
    console.error('[AUTH] Callback error:', error.message);
    return res.redirect(`/login?error=${encodeURIComponent('An unexpected error occurred')}`);
  }
} 