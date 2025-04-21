import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Add type definition for component props
interface StepWellnessProps {
  user: User | null;
}

export default function StepWellness({ user }: StepWellnessProps) {
  const router = useRouter();
  
  // State for user selections
  const [wellnessGoals, setWellnessGoals] = useState<string[]>([]);
  const [mainConcern, setMainConcern] = useState<string | null>(null);
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
      console.warn('No user_id found in URL query parameters');
    }
  }, [router.isReady, router.query]);
  
  // Toggle a wellness goal selection
  const toggleWellnessGoal = (goal: string) => {
    if (wellnessGoals.includes(goal)) {
      // If goal is already selected, remove it
      setWellnessGoals(wellnessGoals.filter(g => g !== goal));
    } else {
      // Add the goal to selected goals
      setWellnessGoals([...wellnessGoals, goal]);
    }
  };

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
      
      // Prepare data to save
      const dataToSave = {
        user_id: currentUserId,
        wellness_goals: wellnessGoals,
        main_concern: mainConcern,
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
        throw new Error(result.error || `Failed to save wellness goals (HTTP ${response.status})`);
      }
      
      // Get all existing query parameters
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      
      // Copy all existing parameters
      Array.from(currentParams.entries()).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      // Add wellness-specific parameters
      if (wellnessGoals.length > 0) {
        params.append('wellnessGoals', wellnessGoals.join(','));
      }
      
      if (mainConcern) {
        params.append('mainConcern', mainConcern);
      }
      
      // Ensure user_id is in params (might have been removed if copying from currentParams)
      if (!params.has('user_id') && currentUserId) {
        params.append('user_id', currentUserId);
      }
      
      // Navigate to lifestyle step with all parameters
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
          Enhance your overall wellness
        </h1>

        {/* Wellness Goals Question */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">What's most important to you? (Select all that apply)</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'More energy',
              'Better sleep',
              'Mental clarity',
              'Balanced diet',
              'Portion control',
              'Stable mood',
              'Limit processed foods',
              'Increase nutrition'
            ].map((goal) => (
              <div 
                key={goal}
                onClick={() => toggleWellnessGoal(goal.toLowerCase().replace(/\s+/g, '_'))}
                className={`px-3 py-2 rounded-full cursor-pointer text-sm transition-colors ${
                  wellnessGoals.includes(goal.toLowerCase().replace(/\s+/g, '_'))
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {goal}
              </div>
            ))}
          </div>
        </div>

        {/* Main Concern Question */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">What's your main concern about your current diet?</h2>
          <div className="space-y-2">
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${mainConcern === 'too_processed' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setMainConcern('too_processed')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${mainConcern === 'too_processed' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {mainConcern === 'too_processed' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Too many processed foods</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${mainConcern === 'poor_balance' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setMainConcern('poor_balance')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${mainConcern === 'poor_balance' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {mainConcern === 'poor_balance' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Poor balance of food groups</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${mainConcern === 'irregular_meals' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setMainConcern('irregular_meals')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${mainConcern === 'irregular_meals' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {mainConcern === 'irregular_meals' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Irregular eating times</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${mainConcern === 'lack_variety' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setMainConcern('lack_variety')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${mainConcern === 'lack_variety' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {mainConcern === 'lack_variety' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Not enough variety</span>
            </div>
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
            disabled={isLoading || (wellnessGoals.length === 0 && !mainConcern)}
            className={`flex-1 px-5 py-2 rounded-lg text-white transition-colors ${
              isLoading
                ? 'opacity-70 cursor-not-allowed'
                : (wellnessGoals.length > 0 || mainConcern)
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