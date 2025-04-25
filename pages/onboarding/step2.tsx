import React, { useEffect } from 'react';
import { useRouter } from 'next/router'; // Import router to access query params
import OnboardingLayout from './layout'; // Use the onboarding layout

export default function OnboardingStep2() {
  const router = useRouter();

  useEffect(() => {
    // Only proceed with redirection if router is ready and query parameters are available
    if (!router.isReady) return;
    
    const { goal, user_id } = router.query;
    
    // Validate we have the required parameters
    if (!goal) {
      console.warn('No goal parameter found in URL, redirecting to step1');
      router.replace('/onboarding/step1');
      return;
    }
    
    // Validate user_id is present - log warning but continue
    if (!user_id) {
      console.warn('No user_id parameter found in URL, redirection may fail in later steps');
    }
    
    console.log(`Redirecting based on goal: ${goal}`);
    
    // Always redirect to dietary lens step
    const nextPath = '/onboarding/step-dietary-lens';
    
    // Construct query parameters for the next step, including user_id if available
    const queryParams = new URLSearchParams();
    queryParams.append('goal', goal.toString());
    
    // Add user_id to query parameters if available
    if (user_id) {
      queryParams.append('user_id', user_id.toString());
    }
    
    // Redirect to the appropriate next step with all parameters
    router.replace(`${nextPath}?${queryParams.toString()}`);
  }, [router.isReady, router.query]);

  // Render minimal loading state while redirection happens
  return (
    <OnboardingLayout>
      <div className="flex flex-col items-center justify-center bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse flex space-x-4 items-center">
          <div className="h-5 w-5 bg-green-500 rounded-full"></div>
          <div className="text-gray-700">Personalizing your journey...</div>
        </div>
      </div>
    </OnboardingLayout>
  );
} 