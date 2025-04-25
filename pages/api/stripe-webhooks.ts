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
  console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY environment variable');
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
});
console.log('[Stripe Webhook] Stripe initialized');

// Initialize Supabase Admin client
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('[Stripe Webhook] Missing Supabase environment variables');
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
console.log('[Stripe Webhook] Supabase Admin client initialized');

// Log webhook secret presence and partial content for debugging
console.log('[Stripe Webhook] Webhook secret present:', !!process.env.STRIPE_WEBHOOK_SECRET);
if (process.env.STRIPE_WEBHOOK_SECRET) {
  console.log('[Stripe Webhook] Webhook secret starts with:', process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10));
}

// Helper function to find a user by Stripe customer ID
async function findUserByStripeCustomerId(stripeCustomerId: string) {
  console.log(`[Stripe Webhook] Finding user by Stripe customer ID: ${stripeCustomerId}`);
  
  // First try with stripe_customer_id field
  let { data, error } = await supabaseAdmin
    .from('user_profile')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error || !data) {
    console.log(`[Stripe Webhook] User not found by stripe_customer_id: ${error?.message || 'No data returned'}`);
    
    // Also check if the user exists with this ID as their primary key
    // This handles cases where the ID might have been stored in a different field
    const { data: dataByPk, error: errorByPk } = await supabaseAdmin
      .from('user_profile')
      .select('id')
      .eq('id', stripeCustomerId)
      .single();
      
    if (errorByPk || !dataByPk) {
      console.error(`[Stripe Webhook] User also not found by primary key: ${errorByPk?.message || 'No data returned'}`);
      return null;
    }
    
    console.log(`[Stripe Webhook] User found by primary key: ${dataByPk.id}`);
    return dataByPk.id;
  }
  
  console.log(`[Stripe Webhook] User found: ${data.id}`);
  return data.id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[Stripe Webhook] Received webhook request, method: ${req.method}`);
  
  if (req.method !== 'POST') {
    console.log(`[Stripe Webhook] Rejected non-POST method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET environment variable' });
  }

  try {
    // Get raw body for signature verification
    console.log('[Stripe Webhook] Getting raw body for signature verification');
    const rawBody = await buffer(req);
    console.log(`[Stripe Webhook] Raw body received, length: ${rawBody.length} bytes`);
    console.log(`[Stripe Webhook] Raw body preview: ${rawBody.toString().substring(0, 100)}...`);
    
    const signature = req.headers['stripe-signature'] as string;
    console.log(`[Stripe Webhook] Signature header present: ${!!signature}`);
    if (signature) {
      console.log(`[Stripe Webhook] Signature header: ${signature.substring(0, 20)}...`);
    }

    if (!signature) {
      console.error('[Stripe Webhook] Missing Stripe signature header');
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // Verify webhook signature
    console.log(`[Stripe Webhook] Verifying signature with secret starting with: ${webhookSecret.substring(0, 10)}`);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log(`[Stripe Webhook] Signature verified successfully for event: ${event.id}`);
    } catch (err) {
      console.error('[Stripe Webhook] ⚠️ Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle webhook events
    console.log(`[Stripe Webhook] Handling Stripe event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe Webhook] Checkout session completed: ${session.id}`);
        console.log(`[Stripe Webhook] Session customer: ${session.customer}`);
        console.log(`[Stripe Webhook] Session subscription: ${session.subscription}`);
        console.log(`[Stripe Webhook] Session client_reference_id: ${session.client_reference_id}`);
        console.log(`[Stripe Webhook] Session metadata:`, session.metadata);
        
        // Extract subscription ID and customer ID
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        
        // Extract user ID from various possible locations
        let userId = null;
        
        // Try client_reference_id first (preferred method)
        if (session.client_reference_id) {
          userId = session.client_reference_id;
          console.log(`[Stripe Webhook] Found userId in client_reference_id: ${userId}`);
        } 
        // Then try metadata.supabaseUserId
        else if (session.metadata && session.metadata.supabaseUserId) {
          userId = session.metadata.supabaseUserId;
          console.log(`[Stripe Webhook] Found userId in metadata.supabaseUserId: ${userId}`);
        }
        // Then try metadata.userId as fallback
        else if (session.metadata && session.metadata.userId) {
          userId = session.metadata.userId;
          console.log(`[Stripe Webhook] Found userId in metadata.userId: ${userId}`);
        }
        // As last resort, try to find user by customer ID
        else if (customerId) {
          console.log(`[Stripe Webhook] No userId in session, trying to find by customerId: ${customerId}`);
          const foundUserId = await findUserByStripeCustomerId(customerId);
          
          if (foundUserId) {
            userId = foundUserId;
            console.log(`[Stripe Webhook] Found userId by customer lookup: ${userId}`);
          } else {
            console.error(`[Stripe Webhook] Could not find user by customer ID: ${customerId}`);
          }
        }

        if (!userId) {
          console.error('[Stripe Webhook] No user ID found in session or by lookup');
          return res.status(400).json({ error: 'Missing user ID in session' });
        }

        // Update user profile with subscription details
        console.log(`[Stripe Webhook] Updating user ${userId} with subscription details`);
        
        // Determine plan type from the session
        let planType = 'unknown';
        if (session.metadata && session.metadata.planId) {
          planType = session.metadata.planId;
          console.log(`[Stripe Webhook] Using plan type from metadata: ${planType}`);
        }
        
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active_paid',
            ...(planType !== 'unknown' && { plan_type: planType }),
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`[Stripe Webhook] Failed to update user subscription details: ${error.message}`, error);
          return res.status(500).json({ error: 'Database update failed' });
        }
        
        console.log(`[Stripe Webhook] Successfully updated user ${userId} subscription details`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
        console.log(`[Stripe Webhook] Invoice customer: ${invoice.customer}`);
        
        const customerId = invoice.customer as string;
        
        // Access subscription using index notation to avoid TypeScript errors
        // Stripe invoices for subscriptions do have a subscription property
        const subscriptionId = (invoice as any).subscription as string;
        console.log(`[Stripe Webhook] Invoice subscription ID: ${subscriptionId}`);
        
        // If no subscription ID, this might not be a subscription invoice
        if (!subscriptionId) {
          console.log('[Stripe Webhook] Invoice is not for a subscription, skipping');
          break;
        }
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`[Stripe Webhook] No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[Stripe Webhook] Found user ${userId} for invoice payment`);

        // Calculate renewal date based on billing period
        let renewalDate = new Date();
        // Add appropriate days depending on the plan (could be retrieved from the invoice)
        renewalDate.setDate(renewalDate.getDate() + 30); // Default to 30 days
        console.log(`[Stripe Webhook] Setting renewal date to: ${renewalDate.toISOString()}`);
        
        // Update user profile
        console.log(`[Stripe Webhook] Updating user ${userId} subscription after invoice payment`);
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: 'active_paid',
            subscription_renewal_date: renewalDate.toISOString(),
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`[Stripe Webhook] Failed to update subscription after invoice payment: ${error.message}`, error);
          return res.status(500).json({ error: 'Database update failed' });
        }
        
        console.log(`[Stripe Webhook] Successfully updated user ${userId} after invoice payment`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`);
        console.log(`[Stripe Webhook] Invoice customer: ${invoice.customer}`);
        
        const customerId = invoice.customer as string;
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`[Stripe Webhook] No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[Stripe Webhook] Found user ${userId} for failed invoice payment`);

        // Update user profile to past_due status
        console.log(`[Stripe Webhook] Updating user ${userId} to past_due status`);
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: 'past_due',
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`[Stripe Webhook] Failed to update subscription after payment failure: ${error.message}`, error);
          return res.status(500).json({ error: 'Database update failed' });
        }
        
        console.log(`[Stripe Webhook] Successfully updated user ${userId} to past_due status`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);
        console.log(`[Stripe Webhook] Subscription customer: ${subscription.customer}`);
        
        const customerId = subscription.customer as string;
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`[Stripe Webhook] No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[Stripe Webhook] Found user ${userId} for subscription deletion`);

        // Update user profile to canceled status
        console.log(`[Stripe Webhook] Updating user ${userId} to canceled status`);
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: 'canceled',
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`[Stripe Webhook] Failed to update subscription after deletion: ${error.message}`, error);
          return res.status(500).json({ error: 'Database update failed' });
        }
        
        console.log(`[Stripe Webhook] Successfully updated user ${userId} to canceled status`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}`);
        console.log(`[Stripe Webhook] Subscription customer: ${subscription.customer}`);
        console.log(`[Stripe Webhook] Subscription status: ${subscription.status}`);
        
        if (subscription.items.data.length > 0) {
          console.log(`[Stripe Webhook] Subscription price ID: ${subscription.items.data[0].price.id}`);
        }
        
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        
        // Find the user by Stripe customer ID
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`[Stripe Webhook] No user found for Stripe customer ID: ${customerId}`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[Stripe Webhook] Found user ${userId} for subscription update`);

        // Determine plan type based on price ID
        let planType = 'unknown';
        if (priceId === process.env.STRIPE_WEEKLY_PRICE_ID) {
          planType = 'weekly';
          console.log(`[Stripe Webhook] Identified weekly plan from price ID: ${priceId}`);
        } else if (priceId === process.env.STRIPE_ANNUALLY_PRICE_ID) {
          planType = 'annual';
          console.log(`[Stripe Webhook] Identified annual plan from price ID: ${priceId}`);
        } else {
          console.log(`[Stripe Webhook] Unknown plan type for price ID: ${priceId}`);
          console.log(`[Stripe Webhook] Expected weekly: ${process.env.STRIPE_WEEKLY_PRICE_ID}`);
          console.log(`[Stripe Webhook] Expected annual: ${process.env.STRIPE_ANNUALLY_PRICE_ID}`);
        }

        // Get subscription status
        let subscriptionStatus = 'active_paid';
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          subscriptionStatus = 'inactive';
        } else if (subscription.status === 'past_due') {
          subscriptionStatus = 'past_due';
        }
        
        console.log(`[Stripe Webhook] Determined subscription status: ${subscriptionStatus}`);

        // Update user profile
        console.log(`[Stripe Webhook] Updating user ${userId} with new subscription details`);
        const { error } = await supabaseAdmin
          .from('user_profile')
          .update({
            subscription_status: subscriptionStatus,
            plan_type: planType,
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`[Stripe Webhook] Failed to update subscription after update: ${error.message}`, error);
          return res.status(500).json({ error: 'Database update failed' });
        }
        
        console.log(`[Stripe Webhook] Successfully updated user ${userId} with new subscription details`);
        break;
      }

      // Add other event types as needed
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return success response
    console.log(`[Stripe Webhook] Successfully processed event: ${event.type}`);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Unhandled error:', err);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 