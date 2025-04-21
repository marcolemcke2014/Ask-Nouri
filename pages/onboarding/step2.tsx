import React, { useEffect } from 'react';
import { useRouter } from 'next/router'; // Import router to access query params
import OnboardingLayout from './layout'; // Use the onboarding layout
import { User } from '@supabase/supabase-js';

// Add type definition for the component props
interface Step2Props {
  user: User | null;
}

export default function OnboardingStep2({ user }: Step2Props) {
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
    
    // Validate user_id is present
    if (!user_id) {
      console.warn('No user_id parameter found in URL');
      // Try to get it from the global user state
      const currentUserId = user?.id;
      if (!currentUserId) {
        console.error('No user ID available from URL or global state');
        // Proceed anyway, but log the error
      }
    }
    
    console.log(`Redirecting based on goal: ${goal}`);
    
    let nextPath;
    
    switch (goal) {
      case 'muscle':
      case 'weight':
      case 'energy':
      case 'digestion':
      case 'condition':
      case 'wellness':
      case 'diet':
      case 'explore':
      default:
        nextPath = '/onboarding/step-dietary-lens';
        break;
    }
    
    // Construct query parameters for the next step, including user_id if available
    const queryParams = new URLSearchParams();
    queryParams.append('goal', goal.toString());
    
    // Add user_id to query parameters if available
    if (user_id) {
      queryParams.append('user_id', user_id.toString());
    } else if (user?.id) {
      // Fallback to global user state if URL doesn't have it
      queryParams.append('user_id', user.id);
    }
    
    // Redirect to the appropriate next step with all parameters
    router.replace(`${nextPath}?${queryParams.toString()}`);
  }, [router.isReady, router.query, user]);

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