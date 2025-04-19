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
    
    const { goal } = router.query;
    
    if (!goal) {
      console.warn('No goal parameter found in URL, redirecting to step1');
      router.replace('/onboarding/step1');
      return;
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
    
    // Redirect to the appropriate next step, keeping the goal parameter
    router.replace(`${nextPath}?goal=${goal}`);
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