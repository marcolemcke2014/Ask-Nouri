import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Add type definition for component props
interface HealthCheckProps {
  user: User | null;
}

type HealthCondition = {
  id: string;
  label: string;
};

const HEALTH_CONDITIONS: HealthCondition[] = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'High Blood Pressure' },
  { id: 'heart_disease', label: 'Heart Disease' },
  { id: 'cholesterol', label: 'High Cholesterol' },
  { id: 'thyroid', label: 'Thyroid Issues' },
  { id: 'celiac', label: 'Celiac Disease' },
  { id: 'ibs', label: 'IBS/IBD' },
  { id: 'gerd', label: 'GERD/Acid Reflux' },
  { id: 'kidney', label: 'Kidney Disease' },
  { id: 'liver', label: 'Liver Disease' },
  { id: 'none', label: 'None of these' },
];

export default function HealthCheck({ user }: HealthCheckProps) {
  const router = useRouter();
  
  // State for selected health conditions
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState<string>('');
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
  
  // Toggle a condition selection
  const toggleCondition = (conditionId: string) => {
    if (conditionId === 'none') {
      // If 'none' is selected, clear all other selections
      setSelectedConditions(['none']);
    } else if (selectedConditions.includes('none')) {
      // If another condition is selected and 'none' was previously selected, remove 'none'
      setSelectedConditions([conditionId]);
    } else if (selectedConditions.includes(conditionId)) {
      // If condition is already selected, remove it
      setSelectedConditions(selectedConditions.filter(id => id !== conditionId));
    } else {
      // Add the condition to selected conditions
      setSelectedConditions([...selectedConditions, conditionId]);
    }
    
    // Clear any error message when selecting conditions
    if (errorMessage) setErrorMessage(null);
  };

  // Handle navigation to next step
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
      
      // Optionally save health conditions to the database
      if (selectedConditions.length > 0 || otherCondition.trim()) {
        // Prepare data to save
        const dataToSave = {
          user_id: currentUserId,
          conditions: selectedConditions.includes('none') ? [] : selectedConditions,
          other_health_condition: otherCondition.trim() || null,
          updated_at: new Date().toISOString()
        };
        
        // Use API endpoint to save data and bypass RLS
        const response = await fetch('/api/save-onboarding-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'user_health_data',
            data: dataToSave
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to save health conditions (HTTP ${response.status})`);
        }
      }
      
      // Get all existing query parameters
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      
      // Copy all existing parameters
      Array.from(currentParams.entries()).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      // Add health conditions
      if (selectedConditions.length > 0) {
        params.append('healthConditions', selectedConditions.join(','));
      }
      
      // Add other condition if provided
      if (otherCondition.trim()) {
        params.append('otherCondition', otherCondition.trim());
      }
      
      // Ensure user_id is in params (might have been removed if copying from currentParams)
      if (!params.has('user_id') && currentUserId) {
        params.append('user_id', currentUserId);
      }
      
      // Determine the next step based on the goal
      const goal = currentParams.get('goal');
      let nextPath = '/onboarding/step-lifestyle'; // Default next path
      
      if (goal) {
        // If we have a specific goal, go to the corresponding goal-specific step
        switch (goal) {
          case 'muscle':
            nextPath = '/onboarding/step-muscle';
            break;
          case 'weight':
            nextPath = '/onboarding/step-weight';
            break;
          case 'energy':
            nextPath = '/onboarding/step-energy';
            break;
          case 'digestion':
            nextPath = '/onboarding/step-digestion';
            break;
          case 'condition':
            nextPath = '/onboarding/step-condition';
            break;
          case 'wellness':
            nextPath = '/onboarding/step-wellness';
            break;
          default:
            // Default fallback
            nextPath = '/onboarding/step-lifestyle';
        }
      }
      
      // Navigate to next step with all parameters
      router.push(`${nextPath}?${params.toString()}`);
    } catch (error: any) {
      console.error('Error in handleNext:', error);
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingLayout currentStep={4}>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
          Do you have any health conditions we should know about?
        </h1>

        <div className="space-y-4 mb-6">
          {HEALTH_CONDITIONS.map((condition) => (
            <button
              key={condition.id}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedConditions.includes(condition.id)
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => toggleCondition(condition.id)}
            >
              <span className="font-medium text-gray-900">{condition.label}</span>
            </button>
          ))}
        </div>

        {/* Other text field, visible only if 'other' is selected */}
        {selectedConditions.includes('other') && (
          <div className="mb-6">
            <label htmlFor="otherCondition" className="block text-sm font-medium text-gray-700 mb-1">
              Please specify your other condition:
            </label>
            <textarea
              id="otherCondition"
              value={otherCondition}
              onChange={(e) => setOtherCondition(e.target.value)}
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Enter your condition here..."
            />
          </div>
        )}
        
        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="flex space-x-3 mt-6">
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
            disabled={selectedConditions.length === 0 || isLoading || (selectedConditions.includes('other') && !otherCondition.trim())}
            className={`flex-1 px-5 py-2 rounded-lg text-white transition-colors ${
              isLoading
                ? 'opacity-70 cursor-not-allowed'
                : selectedConditions.length > 0 && (!selectedConditions.includes('other') || otherCondition.trim())
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
          
          // Determine the next step based on the goal
          const goal = currentParams.get('goal');
          let nextPath = '/onboarding/step-lifestyle';
          
          if (goal) {
            // If we have a specific goal, go to the corresponding goal-specific step
            switch (goal) {
              case 'muscle':
                nextPath = '/onboarding/step-muscle';
                break;
              case 'weight':
                nextPath = '/onboarding/step-weight';
                break;
              case 'energy':
                nextPath = '/onboarding/step-energy';
                break;
              case 'digestion':
                nextPath = '/onboarding/step-digestion';
                break;
              case 'condition':
                nextPath = '/onboarding/step-condition';
                break;
              case 'wellness':
                nextPath = '/onboarding/step-wellness';
                break;
              default:
                nextPath = '/onboarding/step-lifestyle';
            }
          }
          
          router.push(`${nextPath}?${params.toString()}`);
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