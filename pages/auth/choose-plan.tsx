import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe.js
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Simplified plan data with updated pricing
const PLANS = [
  {
    id: 'Weekly Plan',
    name: 'Weekly Plan',
    price: '€1.99',
    period: 'per week',
    description: 'Low risk. High impact. Cancel anytime.',
    features: [
      'Unlimited meal scans',
      'Unlock every goal: Gut, Longevity, Muscle & more',
      'Real-time AI tweaks to improve any meal',
      'Predicts crashes, bloating, and mood dips'
    ],
    footer: 'Perfect if you want flexibility without missing out.'
  },
  {
    id: 'Annual Plan',
    name: 'Annual Plan',
    price: '€19.99',
    period: 'per year',
    description: 'Pay once. Use all year. Just €0.38/week.',
    bestValue: true,
    features: [
      'Everything in Weekly',
      'Our best deal—built for long-term changemakers',
      'Bonus: Early access to future features'
    ],
    footer: 'One choice today = 365 days of smarter eating.'
  },
  {
    id: 'Free Plan',
    name: 'Free Trial',
    price: '€0',
    period: 'limited',
    description: 'See how it works. Feel the difference.',
    features: [
      '4 free scans',
      '1 health goal (Gut, Muscle, Kidney, etc.)',
      'Instant, science-backed food insights'
    ],
    footer: 'Get a taste of smarter eating—no pressure, no card.'
  }
];

export default function ChoosePlan() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('Weekly Plan');
  const [isPromoOpen, setIsPromoOpen] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [expandedPlans, setExpandedPlans] = useState<string[]>(['Weekly Plan']);
  
  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Keep only the selected plan expanded, collapse all others
    setExpandedPlans([planId]);
    // Clear any previous error messages when changing selection
    if (errorMessage) setErrorMessage('');
  };
  
  // Handle continue button click
  const handleContinue = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Get user ID from query parameters
      const { new_user_id } = router.query;
      if (!new_user_id || typeof new_user_id !== 'string') {
        setErrorMessage('User ID not found in URL. Cannot save plan.');
        setIsLoading(false);
        return;
      }
      
      const userId = new_user_id as string;

      // For free plan, use the existing flow
      if (selectedPlan === 'Free Plan') {
        // Call our API endpoint to save the free plan selection
        const response = await fetch('/api/save-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            planType: selectedPlan 
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to save plan (HTTP ${response.status})`);
        }
        
        // API call was successful
        console.log('API call successful, plan saved.');
        console.log(`Navigating to payment success page for user: ${userId}`);
        
        // Redirect to the payment success page
        router.push(`/auth/payment-success`);
      } 
      // For paid plans, redirect to Stripe checkout
      else {
        // Call our Stripe checkout API endpoint
        const response = await fetch('/api/create-stripe-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            planId: selectedPlan
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to create checkout session (HTTP ${response.status})`);
        }

        // Get the Stripe session ID
        const { sessionId } = result;

        // Load Stripe and redirect to checkout
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) {
          throw new Error(error.message || 'Failed to redirect to Stripe checkout');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    router.push('/auth/signup');  // Navigate specifically to signup page
  };
  
  // Toggle promo code input
  const togglePromoInput = () => {
    setIsPromoOpen(!isPromoOpen);
  };

  return (
    <>
      <Head>
        <title>Choose Your Plan - Forkcast</title>
        <meta name="description" content="Select a subscription plan for Forkcast" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-[#14532D] to-[#0A4923] flex flex-col font-['Poppins',sans-serif]">
        <div className="w-full max-w-md mx-auto px-4 py-5 flex-1">
          {/* Back button and headline in the same row */}
          <div className="flex items-center mb-8">
            {/* Back button - arrow only */}
            <button 
              onClick={handleBack}
              className="text-off-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              aria-label="Back to signup"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            {/* Main headline centered */}
            <h1 className="text-2xl font-light text-center flex-1 pr-8 text-off-white">
              <span className="block sm:inline md:block">Eating out shouldn't</span>{" "}
              <span className="block sm:inline md:block">cost your health</span>
            </h1>
          </div>
          
          {/* Subline in its own section */}
          <div className="text-center text-off-white mb-8">
            <p className="text-off-white/80 text-sm">
              <span className="md:block">Every meal impacts your energy, focus, and health.</span>
              <span className="hidden md:block">Our AI helps you make better choices, tailored to your goals.</span>
              <span className="hidden md:block">Pick your plan and eat smarter today:</span>
              <span className="md:hidden">
                <br />Our AI helps you make better choices, tailored to your goals. Pick your plan and eat smarter today:
              </span>
            </p>
          </div>
          
          {/* Plan options - vertical layout */}
          <div className="space-y-4 mb-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`relative backdrop-blur-xl rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden ${
                  selectedPlan === plan.id 
                    ? 'border-[#84F7AC] bg-off-white/25' 
                    : 'border-off-white/15 hover:border-off-white/40 bg-off-white/20 hover:bg-off-white/30 hover:translate-y-[-1px] hover:shadow-md'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <div className="p-4">
                  <div className="flex items-start">
                    {/* Radio indicator */}
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 mt-1 ${
                      selectedPlan === plan.id ? 'border-[#84F7AC]' : 'border-off-white/50'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[#84F7AC]"></div>
                      )}
                    </div>
                    
                    {/* Plan details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <h3 className="text-off-white font-medium flex items-center justify-between">
                            <span>{plan.name}</span> 
                            <span className="text-off-white/80">{plan.price}{plan.id !== 'Free Plan' ? ` / ${plan.period.split(' ')[1]}` : ''}</span>
                          </h3>
                          
                          {/* Plan description */}
                          <p className="text-off-white/70 text-xs mt-1 italic">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Feature list - conditionally expanded */}
                      {expandedPlans.includes(plan.id) ? (
                        <div>
                          <ul className="space-y-1.5 mt-3 pl-1">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#84F7AC] mr-2 mt-0.5 flex-shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span className="text-off-white/80">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {/* Plan footer text */}
                          {plan.footer && (
                            <p className="text-xs text-off-white/70 mt-3 pl-1 font-medium flex items-center">
                              {plan.id === 'Weekly Plan' && (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1.5 text-[#84F7AC] flex-shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                </svg>
                              )}
                              
                              {plan.id === 'Annual Plan' && (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1.5 text-[#84F7AC] flex-shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                              )}
                              
                              {plan.id === 'Free Plan' && (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1.5 text-[#84F7AC] flex-shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              
                              {plan.footer}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="w-full mt-2 text-xs text-[#84F7AC] text-left">
                          Show all benefits
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Promo code section */}
          <div className="mb-6">
            <button 
              onClick={togglePromoInput}
              className="text-off-white/70 text-xs flex items-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Have a promo code?
            </button>
            
            {isPromoOpen && (
              <div className="mt-2 flex max-w-xs mx-auto">
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="flex-1 bg-off-white/20 text-off-white border border-off-white/30 rounded-l-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#34A853]"
                />
                <button className="bg-off-white/20 text-off-white px-3 text-xs rounded-r-lg hover:bg-off-white/30 transition-colors">
                  Apply
                </button>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-red-700/20 border border-red-500/30 text-red-200 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {/* Continue button with simple text */}
          <button
            onClick={handleContinue}
            disabled={isLoading || selectedPlan === ''}
            className={`w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-sm text-sm ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              selectedPlan === 'Annual Plan'
                ? 'Upgrade. Get 80% Discount' 
                : selectedPlan === 'Free Plan'
                  ? 'Start Free Trial'
                  : 'Subscribe Now'
            )}
          </button>
          
          {/* Updated legal disclaimer text */}
          <div className="text-center mt-3 mb-2">
            <p className="text-[#34A853] text-[10px]">
              By selecting, you agree to automatic renewal at the selected price and duration.
            </p>
          </div>
          
          {/* Updated subtle note */}
          <div className="text-center mt-8 mb-4">
            <div className="text-off-white/60 text-xs flex flex-col items-center">
              <span className="flex items-center mb-1 font-medium">
                🔁 Cancel or switch plans anytime.
              </span>
              <span>No lock-in, no fine print drama.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 