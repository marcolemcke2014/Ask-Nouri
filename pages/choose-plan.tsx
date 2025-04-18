import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

// Plan data - would normally come from a backend API or database
const PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$3,99',
    period: 'weekly',
    scans: 'Unlimited scans',
    highlighted: false
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9,99',
    period: 'monthly',
    scans: 'Unlimited scans',
    highlighted: true
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$89,99',
    period: 'annual',
    scans: 'Unlimited scans',
    bestValue: true
  },
  {
    id: 'free',
    name: 'Free Tier',
    price: '$0',
    period: 'monthly',
    scans: '5 scans/month',
    isFree: true
  }
];

export default function ChoosePlan() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly'); // Default to monthly plan
  const [isPromoOpen, setIsPromoOpen] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Clear any previous error messages when changing selection
    if (errorMessage) setErrorMessage('');
  };
  
  // Handle continue button click
  const handleContinue = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      console.log('Starting plan selection process...');
      
      // Get user ID from query parameters
      const { new_user_id } = router.query;
      if (!new_user_id || typeof new_user_id !== 'string') {
        console.error('User ID not found in URL:', router.query);
        setErrorMessage('User ID not found in URL. Cannot save plan.');
        return;
      }
      
      const userId = new_user_id as string;
      console.log(`Calling API to save plan '${selectedPlan}' for user ${userId}`);

      // Call our API endpoint instead of directly using Supabase client
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

      const result = await response.json(); // Parse JSON response

      if (!response.ok) {
        // Use error message from API response if available
        throw new Error(result.error || `Failed to save plan (HTTP ${response.status})`);
      }

      console.log('API call successful, plan saved.');
      
      // Wait a brief moment before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Proceeding with navigation to onboarding...');
      router.push('/onboarding/step1');
    } catch (error: any) {
      console.error('Error in handleContinue:', error);
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };
  
  // Toggle promo code input
  const togglePromoInput = () => {
    setIsPromoOpen(!isPromoOpen);
  };

  return (
    <>
      <Head>
        <title>Choose Your Plan - NutriFlow</title>
        <meta name="description" content="Select a subscription plan to continue" />
      </Head>
      
      <div className="min-h-screen bg-[#145328] flex flex-col">
        {/* Header with back button */}
        <header className="px-4 py-5">
          <button 
            onClick={handleBack}
            className="text-white flex items-center"
            aria-label="Go back"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-6 h-6 mr-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex flex-col items-center px-4 pb-8">
          <div className="w-full max-w-md">
            {/* Title section */}
            <div className="text-center text-white mb-8">
              <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
              <p className="text-white/80">
                To complete the sign up process, choose a plan that works for you
              </p>
            </div>
            
            {/* Plan options */}
            <div className="space-y-4 mb-6">
              {PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative bg-[#1A6333] rounded-xl p-4 border-2 transition-colors cursor-pointer ${
                    selectedPlan === plan.id 
                      ? 'border-white' 
                      : 'border-transparent hover:border-white/30'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {/* Best value tag */}
                  {plan.bestValue && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-[#145328] text-xs font-bold px-2 py-1 rounded-md">
                      BEST VALUE
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    {/* Radio indicator */}
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                      selectedPlan === plan.id ? 'border-white bg-white/20' : 'border-white/50'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                    
                    {/* Plan details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium">{plan.name}</h3>
                        <div className="text-right">
                          <span className="text-white font-bold">{plan.price}</span>
                          {!plan.isFree && (
                            <span className="text-white/70 text-sm"> / {plan.period}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-white/70 text-sm">{plan.scans}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Promo code section */}
            <div className="mb-8">
              <button 
                onClick={togglePromoInput}
                className="text-white/80 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Insert promo code
              </button>
              
              {isPromoOpen && (
                <div className="mt-2 flex">
                  <input 
                    type="text" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 bg-white/10 text-white border border-white/30 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button className="bg-white/20 text-white px-4 rounded-r-lg hover:bg-white/30 transition-colors">
                    Apply
                  </button>
                </div>
              )}
            </div>
            
            {/* Error message */}
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-700/20 border border-red-500/30 text-red-100 text-sm rounded-lg">
                {errorMessage}
              </div>
            )}
            
            {/* Continue button */}
            <button
              onClick={handleContinue}
              disabled={isLoading}
              className={`w-full bg-white text-[#145328] font-medium py-3 rounded-lg transition-colors flex items-center justify-center ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/90'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[#145328]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </main>
      </div>
    </>
  );
} 