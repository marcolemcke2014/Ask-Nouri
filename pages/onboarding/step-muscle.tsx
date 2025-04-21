import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Add type definition for component props
interface StepMuscleProps {
  user: User | null;
}

export default function StepMuscle({ user }: StepMuscleProps) {
  const router = useRouter();
  
  // State for user selections
  const [proteinFocus, setProteinFocus] = useState<string | null>(null);
  const [avoidBloat, setAvoidBloat] = useState<boolean>(false);
  const [postWorkoutNeed, setPostWorkoutNeed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Extract user_id and goal from URL as soon as router is ready
  useEffect(() => {
    if (!router.isReady) return;
    
    const { user_id } = router.query;
    if (user_id && typeof user_id === 'string') {
      setUserId(user_id);
      console.log('User ID from URL:', user_id);
    } else {
      console.warn('No user_id found in URL query parameters');
    }
  }, [router.isReady, router.query]);

  // Handle navigation to previous and next steps
  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    try {
      // Use user ID from URL first, then fallback to global state
      const currentUserId = userId || user?.id;
      
      // Check if user ID is available from one of the sources
      if (!currentUserId) {
        throw new Error('User ID not found. Please refresh the page or try signing in again.');
      }

      setIsLoading(true);
      setErrorMessage(null);
      
      // Get goal from URL
      const { goal } = router.query;
      
      // Prepare data to save
      const dataToSave = {
        user_id: currentUserId,
        protein_focus: proteinFocus,
        avoid_bloat: avoidBloat,
        post_workout_needs: postWorkoutNeed,
        updated_at: new Date().toISOString()
      };
      
      // Use API endpoint to save data and bypass RLS
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
        throw new Error(result.error || `Failed to save muscle building preferences (HTTP ${response.status})`);
      }
      
      // Get all existing query parameters
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      
      // Copy all existing parameters
      Array.from(currentParams.entries()).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      // Add muscle-specific parameters
      if (proteinFocus) {
        params.append('proteinFocus', proteinFocus);
      }
      
      params.append('avoidBloat', avoidBloat.toString());
      params.append('postWorkoutNeed', postWorkoutNeed.toString());
      
      // Ensure user_id is in params (might have been removed if copying from currentParams)
      if (!params.has('user_id') && currentUserId) {
        params.append('user_id', currentUserId);
      }
      
      // Navigate to next step with all parameters
      router.push(`/onboarding/step-lifestyle?${params.toString()}`);
    } catch (error: any) {
      console.error('Error in handleNext:', error);
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep={5}>
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-900">
        <h1 className="text-xl font-bold mb-6 text-center">
          Great! To help maximize gains, tell us a bit more:
        </h1>

        {/* Question 1: Protein Focus */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">How important is protein intake to you?</h2>
          <div className="space-y-2">
            {/* Radio options implemented with tailwind to match design */}
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${proteinFocus === 'high_track' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setProteinFocus('high_track')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${proteinFocus === 'high_track' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {proteinFocus === 'high_track' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Very Important (I track it)</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${proteinFocus === 'high_aim' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setProteinFocus('high_aim')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${proteinFocus === 'high_aim' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {proteinFocus === 'high_aim' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Important (I aim for enough)</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${proteinFocus === 'moderate' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setProteinFocus('moderate')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${proteinFocus === 'moderate' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {proteinFocus === 'moderate' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Somewhat Important</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${proteinFocus === 'low' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setProteinFocus('low')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${proteinFocus === 'low' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {proteinFocus === 'low' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Not a primary focus</span>
            </div>
          </div>
        </div>

        {/* Question 2: Bloating Concern */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">Do you sometimes feel bloated after large meals?</h2>
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setAvoidBloat(!avoidBloat)}
          >
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${avoidBloat ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${avoidBloat ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className="ml-3">{avoidBloat ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Question 3: Post-Workout Need */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">Need quick meal ideas for after workouts?</h2>
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setPostWorkoutNeed(!postWorkoutNeed)}
          >
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${postWorkoutNeed ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${postWorkoutNeed ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className="ml-3">{postWorkoutNeed ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={handleBack}
            disabled={isLoading}
            className={`px-5 py-2 border border-gray-300 text-gray-700 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!proteinFocus || isLoading}
            className={`flex-1 px-5 py-2 rounded-lg text-white transition-colors ${
              isLoading
                ? 'opacity-70 cursor-not-allowed'
                : proteinFocus
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
          
          router.push(`/onboarding/step-lifestyle?${params.toString()}`);
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