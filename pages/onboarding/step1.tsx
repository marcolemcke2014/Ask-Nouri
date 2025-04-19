import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Goal options
const GOALS = [
  { id: 'muscle', label: 'Build Muscle / Strength' },
  { id: 'weight', label: 'Lose Weight / Manage Weight' },
  { id: 'energy', label: 'Improve Energy / Focus' },
  { id: 'digestion', label: 'Improve Digestion / Gut Health' },
  { id: 'condition', label: 'Manage a Health Condition / Allergy' },
  { id: 'wellness', label: 'Eat Healthier / General Wellness' },
  { id: 'diet', label: 'Follow a Specific Diet' },
  { id: 'explore', label: 'Just Exploring / Curious!' }
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

  // Get user's first name from the global auth state
  useEffect(() => {
    async function fetchUserName() {
      // If no user is available from props, we can't proceed
      if (!user) {
        console.error('No user found in global state');
        return;
      }
      
      try {
        // Get user profile to get the first name
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('first_name')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return;
        }
        
        if (profileData && profileData.first_name) {
          setFirstName(profileData.first_name);
        }
      } catch (err) {
        console.error('Unexpected error fetching user data:', err);
      }
    }
    
    if (user) {
      fetchUserName();
    }
  }, [user]);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    // Clear any error message when selecting a new goal
    if (errorMessage) setErrorMessage(null);
  };

  const handleNext = async () => {
    if (!selectedGoal) return;
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Check if user is available from the global state
      if (!user) {
        throw new Error('User not authenticated. Please sign in again.');
      }
      
      const userId = user.id;
      
      // Prepare data to save
      const dataToSave = { 
        user_id: userId,
        primary_goal: selectedGoal,
        updated_at: new Date().toISOString()
      };
      
      // Save to Supabase - using upsert to handle both insert and update cases
      const { error: saveError } = await supabase
        .from('user_goals_and_diets')
        .upsert(dataToSave);
        
      if (saveError) {
        throw new Error(`Failed to save your goal: ${saveError.message}`);
      }
      
      // Navigate to next step after successful save
      router.push(`/onboarding/step2?goal=${selectedGoal}`);
      
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
    </OnboardingLayout>
  );
} 