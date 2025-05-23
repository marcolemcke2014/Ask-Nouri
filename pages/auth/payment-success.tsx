'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { CheckCircle2 } from 'lucide-react'; // Using lucide-react for icons

export default function PaymentSuccessPage() {
  console.log('>>> [PaymentSuccess Page] Component rendering initiated.');
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [planName, setPlanName] = useState<string>(router.query.planId as string || 'Selected Plan');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (router.isReady && router.query.planId && planName === 'Selected Plan') {
        const urlPlan = router.query.planId as string;
        if (urlPlan === 'Weekly Plan' || urlPlan === 'Annual Plan' || urlPlan === 'Free Plan') {
            setPlanName(urlPlan);
            console.log(`[PaymentSuccess] Plan name set from URL: ${urlPlan}`);
        }
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // 1. Get the current authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('[PaymentSuccess] Auth Error:', authError.message);
          throw new Error('Authentication error. Please log in again.');
        }
        if (!authUser) {
          console.log('[PaymentSuccess] No authenticated user found. Redirecting to login.');
          router.replace('/auth/login'); // Redirect if no user
          return;
        }
        setUser(authUser); // Store user object

        // 2. Fetch user profile data (first name, plan type)
        console.log(`[PaymentSuccess] Fetching profile for user: ${authUser.id}`);
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile') // Ensure this table name is correct
          .select('first_name, plan_type')
          .eq('id', authUser.id)
          .maybeSingle(); // Use maybeSingle to handle potential null profile gracefully

        if (profileError) {
          console.error('[PaymentSuccess] Profile fetch error:', profileError.message);
          // Don't throw, but log and maybe show a generic message
          setError('Could not load profile details, but payment was likely successful.');
        }

        console.log('[PaymentSuccess] Profile data fetched:', profileData);

        // 3. Update state
        setFirstName(profileData?.first_name || 'there'); // Use fallback "there"
        
        // Plan name is now primarily set from URL param, this fetch can act as confirmation/fallback
        const profilePlan = profileData?.plan_type;
        if (!planName || planName === 'Selected Plan') { // Only update if not already set from URL
             if (profilePlan === 'Weekly Plan' || profilePlan === 'Annual Plan' || profilePlan === 'Free Plan') {
                 setPlanName(profilePlan);
                 console.log(`[PaymentSuccess] Plan name confirmed from profile: ${profilePlan}`);
             } else {
                 // Keep default 'Selected Plan' if profile is also missing/invalid
                 console.log('[PaymentSuccess] Plan name could not be confirmed from profile, using default.');
             }
        } else {
             console.log(`[PaymentSuccess] Plan name already set from URL (${planName}), profile fetch value (${profilePlan}) ignored for display.`);
        }
        
      } catch (err: any) {
        console.error('[PaymentSuccess] Unexpected error:', err);
        setError(err.message || 'An unexpected error occurred.');
        if (err.message.includes('log in again')) {
          router.replace('/auth/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router.isReady, router.query]);

  const handleContinue = () => {
    if (user?.id) {
      // Navigate to the first step of the NEW onboarding flow
      router.push(`/onboarding/step1-basics`); // Updated path
    } else {
      // Fallback if user ID somehow missing
      setError('Could not proceed. User information is missing.');
      console.error('[PaymentSuccess] Cannot continue: user ID is missing.');
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif]">
        <Head>
          <title>Processing Payment - NutriFlow</title>
        </Head>
        <div className="text-off-white text-xl animate-pulse">Confirming Subscription...</div>
      </div>
    );
  }

  // Main Success UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] px-4 py-10">
      <Head>
        <title>Subscription Confirmed - NutriFlow</title>
        <meta name="description" content="Your NutriFlow subscription is active." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <main className="w-full max-w-[400px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 text-center">
        
        {/* Success Icon */}
        <div className="mb-5 flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-[#34A853]" strokeWidth={1.5} />
        </div>

        {/* Headline */}
        <h1 className="text-xl sm:text-2xl font-light text-off-white mb-3">
          Welcome, {firstName}!
        </h1>

        {/* Success Message */}
        <p className="text-off-white/90 text-sm mb-4">
          Your <span className="font-semibold">{planName}</span> is now active.
        </p>

        {/* Benefit Reinforcement - Updated Copy */}
        <p className="text-off-white/80 text-xs mb-6">
          You've just unlocked the first step to a healthier, stronger you. Tell us what to watch for — your goals, your needs, your path to better health.
        </p>

        {/* Error Message Display (if fetching profile failed) */}
        {error && !error.includes('log in again') && (
          <div className="mb-5 p-3 bg-red-700/20 border border-red-500/30 text-red-200 text-xs rounded-lg text-left">
             {error} Please proceed to onboarding, you can update profile details later if needed.
          </div>
        )}
        
        {/* Next Step Button */}
        <button
          onClick={handleContinue}
          disabled={!user?.id} 
          // Use standard button style
          className={`w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm ${
             !user?.id ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Begin Setting Up Nouri {/* Updated Text */}
        </button>

        {/* Updated Subtext Color */}
        <p className="text-xs text-[#84F7AC] mt-2 italic">
          Takes less than a minute.
        </p>

      </main>
    </div>
  );
} 