import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Log environment variables
console.log('[Stripe API] Environment variables check:');
console.log('- STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('- SUPABASE_SERVICE_KEY present:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('- STRIPE_WEEKLY_PRICE_ID:', process.env.STRIPE_WEEKLY_PRICE_ID);
console.log('- STRIPE_ANNUALLY_PRICE_ID:', process.env.STRIPE_ANNUALLY_PRICE_ID);

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[Stripe API] FATAL: Missing STRIPE_SECRET_KEY environment variable');
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
let stripe: Stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
  });
  console.log('[Stripe API] Stripe client initialized successfully');
} catch (error) {
  console.error('[Stripe API] Failed to initialize Stripe client:', error);
  throw error;
}

// Initialize Supabase Admin client
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('[Stripe API] FATAL: Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}
let supabaseAdmin: SupabaseClient;
try {
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  console.log('[Stripe API] Supabase Admin client initialized successfully');
} catch (error) {
  console.error('[Stripe API] Failed to initialize Supabase Admin client:', error);
  throw error;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[Stripe API] ===== Request received =====');
  // Only allow POST method
  if (req.method !== 'POST') {
    console.log('[Stripe API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In development mode, optionally bypass processing to improve HMR stability
  if (process.env.NODE_ENV === 'development' && req.headers['x-skip-in-dev']) {
    console.log('[Stripe API] Bypassing in development mode');
    return res.status(200).json({ 
      success: true, 
      mock: true, 
      message: 'Bypassed in development mode',
      sessionId: 'mock-session-id-123456789'
    });
  }

  try {
    // Extract and validate request data
    const { planId, userId } = req.body;
    console.log('[Stripe API] Request body received:', { planId, userId });

    if (!planId || !userId) {
      console.error('[Stripe API] Missing required fields:', { planId: !!planId, userId: !!userId });
      return res.status(400).json({ error: 'Missing required fields: planId and userId' });
    }

    // Map planId to Stripe Price ID
    let stripePriceId;
    console.log('[Stripe API] Mapping planId to Stripe Price ID...');
    if (planId === 'Weekly Plan') {
      if (!process.env.STRIPE_WEEKLY_PRICE_ID) {
        console.error('[Stripe API] Missing STRIPE_WEEKLY_PRICE_ID environment variable');
        return res.status(500).json({ error: 'Missing STRIPE_WEEKLY_PRICE_ID environment variable' });
      }
      stripePriceId = process.env.STRIPE_WEEKLY_PRICE_ID;
    } else if (planId === 'Annual Plan') {
      if (!process.env.STRIPE_ANNUALLY_PRICE_ID) {
        console.error('[Stripe API] Missing STRIPE_ANNUALLY_PRICE_ID environment variable');
        return res.status(500).json({ error: 'Missing STRIPE_ANNUALLY_PRICE_ID environment variable' });
      }
      stripePriceId = process.env.STRIPE_ANNUALLY_PRICE_ID;
    } else {
      console.error('[Stripe API] Invalid planId:', planId);
      return res.status(400).json({ error: 'Invalid planId. Must be "Weekly Plan" or "Annual Plan"' });
    }
    console.log('[Stripe API] Selected Stripe Price ID:', stripePriceId);

    // Get or create user profile
    let userProfile;
    let stripeCustomerId;

    // Try to get existing user profile
    console.log('[Stripe API] Querying user_profile for user ID:', userId);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profile')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    console.log('[Stripe API] Profile query result:', { 
      found: !!profile, 
      hasEmail: profile?.email ? true : false,
      hasStripeId: profile?.stripe_customer_id ? true : false,
      error: profileError ? profileError.message : null 
    });

    // If user profile not found, try to get the user from auth and create a profile
    if (profileError || !profile) {
      console.log(`[Stripe API] User profile not found for ID: ${userId}, attempting to retrieve from auth...`);
      
      // Check if user exists in auth
      console.log('[Stripe API] Querying auth system for user ID:', userId);
      try {
        const { data: authUser, error: authError } = await supabaseAdmin
          .auth
          .admin
          .getUserById(userId);
        
        console.log('[Stripe API] Auth user query result:', { 
          found: !!authUser, 
          hasEmail: authUser?.user?.email ? true : false,
          error: authError ? authError.message : null 
        });
        
        if (authError || !authUser) {
          console.error('[Stripe API] User not found in auth:', authError);
          return res.status(404).json({ error: 'User not found in authentication system' });
        }

        // User exists in auth but not in profile, create a profile
        console.log('[Stripe API] Creating new user profile with email:', authUser.user?.email);
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('user_profile')
          .insert({
            id: userId,
            email: authUser.user?.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarded: false,
            plan_type: 'pending' // Will be updated after checkout
          })
          .select('email, stripe_customer_id')
          .single();
        
        console.log('[Stripe API] Profile creation result:', { 
          success: !!newProfile, 
          error: createError ? createError.message : null 
        });
        
        if (createError || !newProfile) {
          console.error('[Stripe API] Failed to create user profile:', createError);
          return res.status(500).json({ error: 'Failed to create user profile' });
        }
        
        console.log(`[Stripe API] Created new profile for user ${userId}`);
        userProfile = newProfile;
      } catch (authQueryError) {
        console.error('[Stripe API] Error during Auth API call:', authQueryError);
        return res.status(500).json({ error: 'Error accessing Auth API', details: authQueryError instanceof Error ? authQueryError.message : 'Unknown error' });
      }
    } else {
      // Existing profile found
      console.log('[Stripe API] Existing profile found');
      userProfile = profile;
    }

    // Get or create Stripe customer
    console.log('[Stripe API] Processing Stripe customer...');
    if (userProfile.stripe_customer_id) {
      // Use existing customer
      console.log('[Stripe API] Using existing Stripe customer ID:', userProfile.stripe_customer_id);
      stripeCustomerId = userProfile.stripe_customer_id;
    } else {
      // Create new customer
      if (!userProfile.email) {
        console.error('[Stripe API] User email is missing, cannot create Stripe customer');
        return res.status(400).json({ error: 'User email is required to create a Stripe customer' });
      }

      console.log('[Stripe API] Creating new Stripe customer with email:', userProfile.email);
      try {
        const customer = await stripe.customers.create({
          email: userProfile.email,
          metadata: {
            supabaseUserId: userId
          }
        });

        console.log('[Stripe API] Stripe customer created:', { customerId: customer.id });
        stripeCustomerId = customer.id;

        // Update user profile with Stripe customer ID
        console.log('[Stripe API] Updating user profile with Stripe customer ID');
        const { error: updateError } = await supabaseAdmin
          .from('user_profile')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', userId);

        if (updateError) {
          console.error('[Stripe API] Failed to update user profile with Stripe customer ID:', updateError);
          // Continue with checkout creation even if update fails
        } else {
          console.log('[Stripe API] Successfully updated user profile with Stripe customer ID');
        }
      } catch (stripeError) {
        console.error('[Stripe API] Error creating Stripe customer:', stripeError);
        return res.status(500).json({ error: 'Failed to create Stripe customer', details: stripeError instanceof Error ? stripeError.message : 'Unknown error' });
      }
    }

    // Create Stripe Checkout Session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.asknouri.com';
    console.log('[Stripe API] Creating Stripe checkout session with params:', {
      mode: 'subscription',
      priceId: stripePriceId,
      quantity: 1,
      customerId: stripeCustomerId,
      success_url: `${siteUrl}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}&planId=${encodeURIComponent(planId)}`,
      cancel_url: `${siteUrl}/auth/choose-plan`,
      client_reference_id: userId
    });
    
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: stripePriceId, quantity: 1 }],
        customer: stripeCustomerId,
        success_url: `${siteUrl}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}&planId=${encodeURIComponent(planId)}`,
        cancel_url: `${siteUrl}/auth/choose-plan`,
        client_reference_id: userId,
        subscription_data: {
          metadata: {
            supabaseUserId: userId
          }
        }
      });

      console.log('[Stripe API] Successfully created checkout session:', { sessionId: session.id });
      // Return session ID
      return res.status(200).json({ sessionId: session.id });
    } catch (checkoutError) {
      console.error('[Stripe API] Error creating checkout session:', checkoutError);
      return res.status(500).json({ 
        error: 'Failed to create Stripe checkout session', 
        details: checkoutError instanceof Error ? checkoutError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('[Stripe API] Unhandled error in checkout API:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 