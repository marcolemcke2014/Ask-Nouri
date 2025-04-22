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

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profile')
      .select('email, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get or create Stripe customer
    let customerId: string;

    if (profile.stripe_customer_id) {
      // Use existing customer
      customerId = profile.stripe_customer_id;
    } else {
      // Create new customer
      if (!profile.email) {
        return res.status(400).json({ error: 'User email is required to create a Stripe customer' });
      }

      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabaseUserId: userId
        }
      });

      customerId = customer.id;

      // Update user profile with Stripe customer ID
      const { error: updateError } = await supabaseAdmin
        .from('user_profile')
        .update({ stripe_customer_id: customerId })
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
      customer: customerId,
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