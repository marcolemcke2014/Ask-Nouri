import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import OnboardingHeader from '@/components/OnboardingHeader';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function OnboardingComplete({ user }: { user: User | null }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status and onboarding status
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[ONBOARDING UI] No user session found, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if user has already completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`[ERROR] Failed to check onboarding status: ${profileError.message}`);
      } else if (profile?.onboarding_complete) {
        console.log('[ROUTE] User already onboarded, redirecting to profile');
        router.push('/profile');
      } else {
        // Mark user as onboarded
        markUserAsOnboarded(session.user.id);
      }
    };
    
    checkAuthAndOnboarding();
  }, [router]);

  console.log('[ONBOARDING COMPLETE] Rendering completion step');

  const markUserAsOnboarded = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log(`[SUPABASE] Marking user ${userId} as onboarded`);
      
      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', userId)
        .single();
      
      let updateError;
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profile')
          .update({ 
            onboarding_complete: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        updateError = error;
      } else {
        // Create new profile record
        const { error } = await supabase
          .from('user_profile')
          .insert({ 
            id: userId,
            onboarding_complete: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        updateError = error;
      }
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`[SUPABASE] Successfully marked user ${userId} as onboarded`);
    } catch (err: any) {
      console.error(`[ERROR] Failed to update onboarding status: ${err.message}`);
      setError(`Error saving your profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToProfile = () => {
    console.log('[ROUTE] Navigating to profile page');
    router.push('/profile');
  };

  if (!user) {
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>You're All Set! - NutriFlow</title>
      </Head>

      <div className="max-w-md mx-auto px-4 py-8">
        <OnboardingHeader currentStep={3} totalSteps={3} hideBackButton={true} />
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            You're All Set!
          </h1>
          <p className="text-gray-600 mb-4">
            Thanks for providing your preferences, {user.user_metadata?.full_name || user.email}.
          </p>
          <p className="text-gray-600 mb-8">
            We'll now tailor your meal insights to match your goals and diet preferences.
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="font-medium text-blue-800 mb-2">What's next?</h2>
          <p className="text-blue-700 mb-4">
            Visit your profile to:
          </p>
          <ul className="text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2 mt-0.5">•</span>
              <span>View and edit your preferences</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-0.5">•</span>
              <span>Scan food labels for nutritional insights</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-0.5">•</span>
              <span>Get personalized recommendations</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <button
          onClick={navigateToProfile}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading ? 'Saving...' : 'Go to My Profile'}
        </button>
      </div>
    </div>
  );
} 