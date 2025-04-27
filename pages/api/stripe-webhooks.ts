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
  console.log(`[Stripe Webhook DEBUG] Enter findUserByStripeCustomerId for: ${stripeCustomerId}`);
  
  // First try with stripe_customer_id field
  console.log(`[Stripe Webhook DEBUG] Attempting lookup by stripe_customer_id field...`);
  let { data, error } = await supabaseAdmin
    .from('user_profile')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error || !data) {
    console.log(`[Stripe Webhook DEBUG] User not found by stripe_customer_id: ${error?.message || 'No data returned'}`);
    
    // Also check if the user exists with this ID as their primary key
    console.log(`[Stripe Webhook DEBUG] Attempting fallback lookup by primary key field...`);
    const { data: dataByPk, error: errorByPk } = await supabaseAdmin
      .from('user_profile')
      .select('id')
      .eq('id', stripeCustomerId)
      .single();
      
    if (errorByPk || !dataByPk) {
      console.error(`[Stripe Webhook DEBUG] User also not found by primary key: ${errorByPk?.message || 'No data returned'}`);
      console.log(`[Stripe Webhook DEBUG] Exit findUserByStripeCustomerId - Returning null`);
      return null;
    }
    
    console.log(`[Stripe Webhook DEBUG] User found by primary key: ${dataByPk.id}`);
    console.log(`[Stripe Webhook DEBUG] Exit findUserByStripeCustomerId - Returning ${dataByPk.id}`);
    return dataByPk.id;
  }
  
  console.log(`[Stripe Webhook DEBUG] User found by stripe_customer_id: ${data.id}`);
  console.log(`[Stripe Webhook DEBUG] Exit findUserByStripeCustomerId - Returning ${data.id}`);
  return data.id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[Stripe Webhook DEBUG] ===== Handler Start =====`);
  console.log(`[Stripe Webhook] Received webhook request, method: ${req.method}`);
  
  if (req.method !== 'POST') {
    console.log(`[Stripe Webhook] Rejected non-POST method: ${req.method}`);
    console.log(`[Stripe Webhook DEBUG] Sending 405 response.`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable');
    console.log(`[Stripe Webhook DEBUG] Sending 500 response (missing secret).`);
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET environment variable' });
  }

  let event: Stripe.Event;
  try {
    console.log(`[Stripe Webhook DEBUG] Entering main try block.`);
    // Get raw body for signature verification
    console.log('[Stripe Webhook] Getting raw body for signature verification');
    const rawBody = await buffer(req);
    console.log(`[Stripe Webhook] Raw body received, length: ${rawBody.length} bytes`);
    
    const signature = req.headers['stripe-signature'] as string;
    console.log(`[Stripe Webhook] Signature header present: ${!!signature}`);

    if (!signature) {
      console.error('[Stripe Webhook] Missing Stripe signature header');
      console.log(`[Stripe Webhook DEBUG] Sending 400 response (missing signature).`);
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // Verify webhook signature
    console.log(`[Stripe Webhook] Verifying signature with secret starting with: ${webhookSecret.substring(0, 10)}`);
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log(`[Stripe Webhook DEBUG] Signature verified successfully for event: ${event.id}`);
    } catch (err) {
      const error = err as Error;
      console.error('[Stripe Webhook] ⚠️ Webhook signature verification failed:', error.message);
      console.log(`[Stripe Webhook DEBUG] Sending 400 response (invalid signature).`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle webhook events
    console.log(`[Stripe Webhook] Handling Stripe event: ${event.type} (${event.id})`);
    console.log(`[Stripe Webhook DEBUG] Entering switch statement for event type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log(`[Stripe Webhook DEBUG] Case: checkout.session.completed`);
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe Webhook] Checkout session completed: ${session.id}`);
        console.log(`[Stripe Webhook DEBUG] Session customer: ${session.customer}, Session subscription: ${session.subscription}, Session client_reference_id: ${session.client_reference_id}`);
        
        // Extract subscription ID and customer ID
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        
        // Extract user ID
        let userId = null;
        console.log(`[Stripe Webhook DEBUG] Attempting userId extraction...`);
        if (session.client_reference_id) {
          userId = session.client_reference_id;
          console.log(`[Stripe Webhook DEBUG] Found userId in client_reference_id: ${userId}`);
        } else if (session.metadata && session.metadata.supabaseUserId) {
          userId = session.metadata.supabaseUserId;
          console.log(`[Stripe Webhook DEBUG] Found userId in metadata.supabaseUserId: ${userId}`);
        } else if (session.metadata && session.metadata.userId) {
          userId = session.metadata.userId;
          console.log(`[Stripe Webhook DEBUG] Found userId in metadata.userId: ${userId}`);
        } else if (customerId) {
          console.log(`[Stripe Webhook DEBUG] No userId in session, trying customer lookup: ${customerId}`);
          userId = await findUserByStripeCustomerId(customerId);
          if (userId) {
            console.log(`[Stripe Webhook DEBUG] Found userId via customer lookup: ${userId}`);
          } else {
             console.error(`[Stripe Webhook DEBUG] Could not find user by customer ID: ${customerId}`);
          }
        }

        if (!userId) {
          console.error('[Stripe Webhook] No user ID found in session or by lookup');
          console.log(`[Stripe Webhook DEBUG] Sending 400 response (missing userId).`);
          return res.status(400).json({ error: 'Missing user ID in session' });
        }

        // NEW: Fetch the subscription to get the price ID
        let planType = 'unknown';
        let priceId = null;
        if (subscriptionId) {
          try {
            console.log(`[Stripe Webhook DEBUG] Fetching subscription details for: ${subscriptionId}`);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['items.data.price'] // Expand price details
            });
            priceId = subscription.items.data[0]?.price?.id;
            console.log(`[Stripe Webhook DEBUG] Subscription fetched. Price ID: ${priceId}`);

            // Map priceId to planType
            if (priceId === process.env.STRIPE_WEEKLY_PRICE_ID) {
              planType = 'Weekly Plan';
              console.log(`[Stripe Webhook DEBUG] Matched Weekly Plan for price ID: ${priceId}`);
            } else if (priceId === process.env.STRIPE_ANNUALLY_PRICE_ID) {
              planType = 'Annual Plan';
              console.log(`[Stripe Webhook DEBUG] Matched Annual Plan for price ID: ${priceId}`);
            } else {
              console.warn(`[Stripe Webhook] Unrecognized price ID: ${priceId}. Expected Weekly: ${process.env.STRIPE_WEEKLY_PRICE_ID} or Annual: ${process.env.STRIPE_ANNUALLY_PRICE_ID}`);
            }
          } catch (subError) {
            console.error(`[Stripe Webhook] Error fetching subscription ${subscriptionId}:`, subError);
            // Proceed without planType if subscription fetch fails, but log error
          }
        } else {
          console.warn('[Stripe Webhook] No subscription ID found in checkout session, cannot determine plan type.');
        }

        // Update user profile
        const baseUpdateData = {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        };

        // Conditionally add plan_type only if it was successfully determined
        const updateData = planType !== 'unknown'
          ? { ...baseUpdateData, plan_type: planType }
          : baseUpdateData;

        if (planType === 'unknown') {
          console.log('[Stripe Webhook DEBUG] Plan type is unknown, will not update plan_type field.');
        }
        
        console.log(`[Stripe Webhook DEBUG] Attempting Supabase update for userId: ${userId} with data:`, updateData);

        try { // Wrap Supabase update in its own try/catch
          const { error: updateError } = await supabaseAdmin
            .from('user_profile')
            .update(updateData)
            .eq('id', userId);

          if (updateError) {
            throw updateError; // Throw to be caught by the catch block below
          }

          console.log(`[Stripe Webhook DEBUG] Supabase update successful for userId: ${userId}`);

        } catch (dbError) { // IMPROVED catch block
            const error = dbError as Error;
            console.error(`[Stripe Webhook] Supabase update failed for userId ${userId}:`, error); // Log the actual error object
            console.error(`[Stripe Webhook DEBUG] Update data attempted:`, updateData); // Log the data we tried to update
            console.log(`[Stripe Webhook DEBUG] Sending 500 response (Supabase update failed).`);
            return res.status(500).json({
              error: 'Database update failed',
              details: error.message // Include specific error message in response
            });
        }
        break;
      }

      case 'invoice.paid': {
        console.log(`[Stripe Webhook DEBUG] Case: invoice.paid`);
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string;
        console.log(`[Stripe Webhook DEBUG] Invoice customer: ${customerId}, Invoice subscription: ${subscriptionId}`);

        if (!subscriptionId) {
          console.log('[Stripe Webhook] Invoice is not for a subscription, skipping update.');
          break;
        }
        
        console.log(`[Stripe Webhook DEBUG] Attempting customer lookup for: ${customerId}`);
        const userId = await findUserByStripeCustomerId(customerId);
        if (!userId) {
          console.error(`[Stripe Webhook] No user found for Stripe customer ID: ${customerId}`);
          console.log(`[Stripe Webhook DEBUG] Sending 404 response (user not found).`);
          return res.status(404).json({ error: 'User not found' }); 
        }
        console.log(`[Stripe Webhook DEBUG] Found userId: ${userId}`);
        
        // Update user profile (simplified, assuming renewal date isn't critical here)
        const updateData = {
            subscription_status: 'active_paid',
            updated_at: new Date().toISOString(),
          };
        console.log(`[Stripe Webhook DEBUG] Attempting Supabase update for userId: ${userId} with data:`, updateData);
        const { error: updateError } = await supabaseAdmin
          .from('user_profile')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          console.error(`[Stripe Webhook] Supabase update failed: ${updateError.message}`, updateError);
          console.log(`[Stripe Webhook DEBUG] Sending 500 response (Supabase update failed).`);
          return res.status(500).json({ error: 'Database update failed' });
        }
        
        console.log(`[Stripe Webhook DEBUG] Supabase update successful for userId: ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
         console.log(`[Stripe Webhook DEBUG] Case: invoice.payment_failed`);
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
             updated_at: new Date().toISOString(),
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
         console.log(`[Stripe Webhook DEBUG] Case: customer.subscription.deleted`);
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
             updated_at: new Date().toISOString(),
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
         console.log(`[Stripe Webhook DEBUG] Case: customer.subscription.updated`);
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
           planType = 'Weekly Plan'; // UPDATED
           console.log(`[Stripe Webhook] Identified weekly plan from price ID: ${priceId}`);
         } else if (priceId === process.env.STRIPE_ANNUALLY_PRICE_ID) {
           planType = 'Annual Plan'; // UPDATED
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
             updated_at: new Date().toISOString(),
           })
           .eq('id', userId);

         if (error) {
           console.error(`[Stripe Webhook] Failed to update subscription after update: ${error.message}`, error);
           return res.status(500).json({ error: 'Database update failed' });
         }
         
         console.log(`[Stripe Webhook] Successfully updated user ${userId} with new subscription details`);
         break;
      }

      default:
        console.log(`[Stripe Webhook DEBUG] Case: default (Unhandled event type: ${event.type})`);
    }

    // Return success response
    console.log(`[Stripe Webhook DEBUG] Reached end of switch statement for event: ${event.type}`);
    console.log(`[Stripe Webhook DEBUG] Sending 200 OK response.`);
    return res.status(200).json({ received: true });

  } catch (err) {
    const error = err as Error;
    console.error('[Stripe Webhook] Unhandled error in main try block:', error.message);
    console.log(`[Stripe Webhook DEBUG] Sending 500 response (unhandled error).`);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      message: error.message
    });
  } finally {
      console.log(`[Stripe Webhook DEBUG] ===== Handler End =====`);
  }
} 