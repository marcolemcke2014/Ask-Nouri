import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil', // Use the latest compatible API version
});

// Initialize Supabase Admin client
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate request data
    const { planId, userId } = req.body;

    if (!planId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: planId and userId' });
    }

    // Map planId to Stripe Price ID
    let stripePriceId;
    if (planId === 'weekly') {
      if (!process.env.STRIPE_WEEKLY_PRICE_ID) {
        return res.status(500).json({ error: 'Missing STRIPE_WEEKLY_PRICE_ID environment variable' });
      }
      stripePriceId = process.env.STRIPE_WEEKLY_PRICE_ID;
    } else if (planId === 'annual') {
      if (!process.env.STRIPE_ANNUALLY_PRICE_ID) {
        return res.status(500).json({ error: 'Missing STRIPE_ANNUALLY_PRICE_ID environment variable' });
      }
      stripePriceId = process.env.STRIPE_ANNUALLY_PRICE_ID;
    } else {
      return res.status(400).json({ error: 'Invalid planId. Must be "weekly" or "annual"' });
    }

    // Get or create user profile
    let userProfile;
    let stripeCustomerId;

    // Try to get existing user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profile')
      .select('email, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    // If user profile not found, try to get the user from auth and create a profile
    if (profileError || !profile) {
      console.log(`User profile not found for ID: ${userId}, attempting to retrieve from auth...`);
      
      // Check if user exists in auth
      const { data: authUser, error: authError } = await supabaseAdmin
        .auth
        .admin
        .getUserById(userId);
      
      if (authError || !authUser) {
        console.error('User not found in auth:', authError);
        return res.status(404).json({ error: 'User not found in authentication system' });
      }

      // User exists in auth but not in profile, create a profile
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('user_profile')
        .insert({
          user_id: userId,
          email: authUser.user?.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          onboarded: false,
          plan_type: 'pending' // Will be updated after checkout
        })
        .select('email, stripe_customer_id')
        .single();
      
      if (createError || !newProfile) {
        console.error('Failed to create user profile:', createError);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
      
      console.log(`Created new profile for user ${userId}`);
      userProfile = newProfile;
    } else {
      // Existing profile found
      userProfile = profile;
    }

    // Get or create Stripe customer
    if (userProfile.stripe_customer_id) {
      // Use existing customer
      stripeCustomerId = userProfile.stripe_customer_id;
    } else {
      // Create new customer
      if (!userProfile.email) {
        return res.status(400).json({ error: 'User email is required to create a Stripe customer' });
      }

      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          supabaseUserId: userId
        }
      });

      stripeCustomerId = customer.id;

      // Update user profile with Stripe customer ID
      const { error: updateError } = await supabaseAdmin
        .from('user_profile')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update user profile with Stripe customer ID:', updateError);
        // Continue with checkout creation even if update fails
      }
    }

    // Create Stripe Checkout Session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.asknouri.com';
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer: stripeCustomerId,
      success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/choose-plan`,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          supabaseUserId: userId
        }
      }
    });

    // Return session ID
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 