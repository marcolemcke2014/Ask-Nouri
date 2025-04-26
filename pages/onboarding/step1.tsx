import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// Goal options
const GOALS = [
  { id: 'muscle', label: 'Build Muscle / Strength' },
  { id: 'weight', label: 'Lose Weight / Manage Weight' },
  { id: 'energy', label: 'Improve Energy / Focus' },
  { id: 'digestion', label: 'Improve Digestion / Gut Health' },
  { id: 'condition', label: 'Manage a Health Condition / Allergy' },
  { id: 'wellness', label: 'Eat Healthier / General Wellness' }
];

// Add a type for the component props
interface Step1Props {
  user: User | null;
}

export default function Step1({ user }: Step1Props) {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Extract user_id from URL as soon as router is ready
  useEffect(() => {
    if (!router.isReady) return;
    
    const { user_id } = router.query;
    if (user_id && typeof user_id === 'string') {
      setUserId(user_id);
      console.log('User ID from URL:', user_id);
    } else {
      console.error('No user_id found in URL query parameters');
    }
  }, [router.isReady, router.query]);

  // Get user's first name considering two sources: URL user_id and global user prop
  useEffect(() => {
    async function fetchUserName() {
      // Try to get userId from URL first, then fall back to user prop
      const userIdToUse = userId || user?.id;
      
      if (!userIdToUse) {
        console.log('Profile fetch skipped, user prop not ready and no userId in URL.');
        return;
      }
      
      try {
        console.log(`Fetching profile data for user ID: ${userIdToUse}`);
        
        // Get user profile to get the first name
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('first_name')
          .eq('id', userIdToUse)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return;
        }
        
        if (profileData && profileData.first_name) {
          setFirstName(profileData.first_name);
          console.log(`Profile fetch successful, first name: ${profileData.first_name}`);
        } else {
          console.log('Profile found but no first name available');
        }
      } catch (err) {
        console.error('Unexpected error fetching user data:', err);
        // Don't show blocking UI error for profile fetch failures
      }
    }
    
    fetchUserName();
  }, [userId, user]); // Depend on both userId from URL and user prop

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    // Clear any error message when selecting a new goal
    if (errorMessage) setErrorMessage(null);
  };

  const handleNext = async () => {
    if (!selectedGoal) return;
    
    console.log('[handleNext step1] Start. State userId:', userId, 'Prop user:', user);
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Use the user ID from URL query first, fallback to global user state
      const currentUserId = userId || user?.id;
      
      console.log('[handleNext step1] currentUserId determined:', currentUserId);
      
      // Validate that we have a user ID from one of the sources
      if (!currentUserId) {
        console.error('[handleNext step1] Error condition met! currentUserId is falsy.');
        throw new Error('User ID not found. Please refresh the page or try signing in again.');
      }
      
      // Prepare data to save
      const dataToSave = { 
        user_id: currentUserId,
        primary_goal: selectedGoal,
        updated_at: new Date().toISOString()
      };
      
      // Use the API endpoint instead of direct Supabase call to bypass RLS
      const response = await fetch('/api/save-onboarding-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'user_goals_and_diets',
          data: dataToSave
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to save data for this step (HTTP ${response.status})`);
      }
      
      // Navigate to next step after successful save, passing both the goal and user_id
      router.push(`/onboarding/step2?goal=${selectedGoal}&user_id=${currentUserId}`);
      
    } catch (error: any) {
      console.error('Error in handleNext:', error);
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={1}>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
          {firstName 
            ? `Hi ${firstName}, what's your main focus with food right now?`
            : "What's your main focus with food right now?"}
        </h1>

        <div className="space-y-3 mb-6">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedGoal === goal.id
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleGoalSelect(goal.id)}
            >
              <span className="font-medium text-gray-900">{goal.label}</span>
            </button>
          ))}
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleNext}
            disabled={!selectedGoal || isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition flex items-center justify-center ${
              selectedGoal && !isLoading
                ? 'bg-[#34A853] hover:bg-[#2c9247]'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
      
      {/* Skip for now button moved outside the card with frosted glass effect */}
      <button
        onClick={() => {
          const currentParams = new URLSearchParams(window.location.search);
          const params = new URLSearchParams();
          
          // Copy all existing parameters
          Array.from(currentParams.entries()).forEach(([key, value]) => {
            params.append(key, value);
          });
          
          // Ensure user_id is in params
          if (!params.has('user_id') && (userId || user?.id)) {
            params.append('user_id', userId || user?.id || '');
          }
          
          router.push(`/onboarding/step2?${params.toString()}`);
        }}
        disabled={isLoading}
        className="w-full max-w-md mt-4 py-2.5 px-4 text-white/90 rounded-xl font-medium hover:text-white 
          backdrop-blur-md bg-white/10 border border-white/20 transition-all hover:bg-white/15
          focus:outline-none focus:ring-2 focus:ring-white/30 shadow-sm"
      >
        Skip for now
      </button>
    </OnboardingLayout>
  );
} 