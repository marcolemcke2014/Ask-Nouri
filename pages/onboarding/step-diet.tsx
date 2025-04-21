import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Add type definition for component props
interface StepDietProps {
  user: User | null;
}

export default function StepDiet({ user }: StepDietProps) {
  const router = useRouter();
  
  // State for user selections
  const [strictness, setStrictness] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
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
        diet_strictness: strictness,
        diet_duration: duration,
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
        throw new Error(result.error || `Failed to save diet preferences (HTTP ${response.status})`);
      }
      
      // Get all existing query parameters
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      
      // Copy all existing parameters
      Array.from(currentParams.entries()).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      // Add diet-specific parameters
      if (strictness) {
        params.append('strictness', strictness);
      }
      
      if (duration) {
        params.append('duration', duration);
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
          Tell us about your diet approach
        </h1>

        {/* Strictness Question */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">How strict are you with your diet?</h2>
          <div className="space-y-2">
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${strictness === 'very_strict' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setStrictness('very_strict')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${strictness === 'very_strict' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {strictness === 'very_strict' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Very strict (100% adherence)</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${strictness === 'mostly_strict' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setStrictness('mostly_strict')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${strictness === 'mostly_strict' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {strictness === 'mostly_strict' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Mostly strict (80/20 rule)</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${strictness === 'flexible' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setStrictness('flexible')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${strictness === 'flexible' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {strictness === 'flexible' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Flexible (general guidelines)</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${strictness === 'just_starting' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setStrictness('just_starting')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${strictness === 'just_starting' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {strictness === 'just_starting' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Just starting to learn</span>
            </div>
          </div>
        </div>

        {/* Duration Question */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">How long have you been following this diet?</h2>
          <div className="space-y-2">
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${duration === 'less_month' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setDuration('less_month')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${duration === 'less_month' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {duration === 'less_month' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Less than a month</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${duration === '1_6_months' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setDuration('1_6_months')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${duration === '1_6_months' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {duration === '1_6_months' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>1-6 months</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${duration === '6_12_months' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setDuration('6_12_months')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${duration === '6_12_months' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {duration === '6_12_months' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>6-12 months</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${duration === 'over_year' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setDuration('over_year')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${duration === 'over_year' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {duration === 'over_year' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Over a year</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${duration === 'not_yet' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setDuration('not_yet')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${duration === 'not_yet' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {duration === 'not_yet' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Not started yet</span>
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
            disabled={isLoading || (!strictness && !duration)}
            className={`flex-1 px-5 py-2 rounded-lg text-white transition-colors ${
              isLoading
                ? 'opacity-70 cursor-not-allowed'
                : (strictness || duration)
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
    </OnboardingLayout>
  );
} 