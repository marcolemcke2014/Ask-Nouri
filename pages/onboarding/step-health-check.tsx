import React, { useState } from 'react';
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
      // Check if user is authenticated first
      if (!user) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      setIsLoading(true);
      
      // Optionally save health conditions to the database
      if (selectedConditions.length > 0 || otherCondition.trim()) {
        // Save to user_health_data table
        const dataToSave = {
          user_id: user.id,
          health_conditions: selectedConditions.includes('none') ? [] : selectedConditions,
          other_health_condition: otherCondition.trim() || null,
          updated_at: new Date().toISOString()
        };
        
        // Check if user already has an entry in user_health_data
        const { data: existingData, error: fetchError } = await supabase
          .from('user_health_data')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (fetchError) {
          console.error('Error checking existing health data:', fetchError);
        }
        
        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_health_data')
            .update({
              health_conditions: selectedConditions.includes('none') ? [] : selectedConditions,
              other_health_condition: otherCondition.trim() || null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating health conditions:', updateError);
          }
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('user_health_data')
            .insert([dataToSave]);
            
          if (insertError) {
            console.error('Error saving health conditions:', insertError);
          }
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
          case 'diet':
            nextPath = '/onboarding/step-diet';
            break;
          case 'explore':
            // 'explore' skips goal-specific questions and goes directly to lifestyle
            nextPath = '/onboarding/step-lifestyle';
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
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-900">
        <h1 className="text-xl font-bold mb-6 text-center">
          Do you have any of these health conditions?
        </h1>
        
        <p className="text-gray-600 mb-4 text-center text-sm">
          This helps us provide more relevant menu recommendations for your specific needs.
        </p>

        {/* Health conditions selection */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-2">
            {HEALTH_CONDITIONS.map((condition) => (
              <div 
                key={condition.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedConditions.includes(condition.id) 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => toggleCondition(condition.id)}
              >
                <div className={`h-4 w-4 rounded flex items-center justify-center mr-3 border
                  ${selectedConditions.includes(condition.id) 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-400'}`}
                >
                  {selectedConditions.includes(condition.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{condition.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Other condition text area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anything else we should know about?
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Other conditions, medications, or health concerns (optional)"
            rows={3}
            value={otherCondition}
            onChange={(e) => setOtherCondition(e.target.value)}
          />
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Navigation buttons */}
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
            disabled={isLoading}
            className={`flex-1 px-5 py-2 rounded-lg text-white transition-colors bg-[#34A853] hover:bg-[#2c9247] flex items-center justify-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
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