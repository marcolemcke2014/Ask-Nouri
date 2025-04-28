'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

// --- Styles ---
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const errorBoxStyle = "mb-3 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center";
// ---

export default function OnboardingPersonalize() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Keep loading state
  const [error, setError] = useState<string>('');

  // Fetch user session (can potentially be simplified if only used for ID)
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          console.error('[Onboarding Finish] No user session found, redirecting.');
          router.replace('/auth/login');
        }
      } catch (fetchError) {
        console.error('[Onboarding Finish] Error fetching session:', fetchError);
        setError('Could not load final step. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleBack = () => {
    router.push('/onboarding/step5-eating-style'); // Back to previous step
  };

  // handleFinish now only needs to mark onboarding as complete
  const handleFinish = async () => {
    if (!user) { 
        console.error('[Onboarding Finish] handleFinish called without user.'); 
        setError('User session not found.'); 
        return; 
    }
    setError('');
    setIsLoading(true);

    const updateData = {
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Finish] Marking onboarding complete for user:', user.id);
      const { error: updateError } = await supabase
        .from('user_profile')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) { 
          console.error('[Onboarding Finish] Supabase update error:', updateError);
          throw updateError; 
      }

      console.log('[Onboarding Finish] Profile updated successfully, onboarding complete.');
      router.push('/onboarding/step7-success'); // Navigate to the final success screen

    } catch (err: any) {
      console.error('[Onboarding Finish] Update failed:', err);
      setError(err.message || 'Failed to finalize setup.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout 
      title="Finish Setup"
      currentStep={6} 
      totalSteps={6}
      showBackButton={true}
      onBack={handleBack}
    >
        <h2 className="text-lg sm:text-xl font-light text-center mb-8 text-off-white">
           You're Ready to Go!
        </h2>
        
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        <p className="text-center text-off-white/80 mb-6 text-sm">
            Everything is set up based on your preferences. Click finish to start using the app.
        </p>

        <div className="pt-8">
          <button 
            type="button" 
            onClick={handleFinish}
            disabled={isLoading}
            className={buttonStyle}
          >
            {isLoading ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
    </OnboardingLayout>
  );
} 