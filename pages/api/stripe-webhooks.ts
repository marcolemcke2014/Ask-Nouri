import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

// Disable body parser to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
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

// Helper function to find a user by Stripe customer ID
async function findUserByStripeCustomerId(stripeCustomerId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profile')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error || !data) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
  return data.user_id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET environment variable' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle webhook events
    console.log(`Handling Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const userId = session.client_reference_id || 
                      (session.metadata && session.metadata.supabaseUserId);

        if (!userId) {
          console.error('No user ID found in session');
          return res.status(400).json({ error: 'Missing user ID in session' });
        }

        // Update user profile with subscription details
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active_paid',
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update user subscription details:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Access subscription using index notation to avoid TypeScript errors
        // Stripe invoices for subscriptions do have a subscription property
        const subscriptionId = (invoice as any).subscription as string;
        
        // If no subscription ID, this might not be a subscription invoice
        if (!subscriptionId) {
          console.log('Invoice is not for a subscription, skipping');
          break;
        }
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }

        // Calculate renewal date based on billing period
        let renewalDate = new Date();
        // Add appropriate days depending on the plan (could be retrieved from the invoice)
        renewalDate.setDate(renewalDate.getDate() + 30); // Default to 30 days
        
        // Update user profile
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: 'active_paid',
            subscription_renewal_date: renewalDate.toISOString(),
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update subscription after invoice payment:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }

        // Update user profile to past_due status
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: 'past_due',
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update subscription after payment failure:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }

        // Update user profile to canceled status
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: 'canceled',
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update subscription after deletion:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }

        // Determine plan type based on price ID
        let planType = 'unknown';
        if (priceId === process.env.STRIPE_WEEKLY_PRICE_ID) {
          planType = 'weekly';
        } else if (priceId === process.env.STRIPE_ANNUALLY_PRICE_ID) {
          planType = 'annual';
        }

        // Get subscription status
        let subscriptionStatus = 'active_paid';
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          subscriptionStatus = 'inactive';
        } else if (subscription.status === 'past_due') {
          subscriptionStatus = 'past_due';
        }

        // Update user profile
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: subscriptionStatus,
            plan_type: planType,
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update subscription after update:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        break;
      }

      // Add other event types as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 