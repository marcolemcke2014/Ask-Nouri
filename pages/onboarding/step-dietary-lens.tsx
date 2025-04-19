import React, { useState } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type DietaryOption = {
  id: string;
  label: string;
  category: 'diet' | 'restriction' | 'allergy';
};

// Add type definition for component props
interface DietaryLensProps {
  user: User | null;
}

const DIETARY_OPTIONS: DietaryOption[] = [
  // Diet styles
  { id: 'vegetarian', label: 'Vegetarian', category: 'diet' },
  { id: 'vegan', label: 'Vegan', category: 'diet' },
  { id: 'pescatarian', label: 'Pescatarian', category: 'diet' },
  { id: 'keto', label: 'Keto', category: 'diet' },
  { id: 'paleo', label: 'Paleo', category: 'diet' },
  { id: 'low_carb', label: 'Low Carb', category: 'diet' },
  { id: 'mediterranean', label: 'Mediterranean', category: 'diet' },
  { id: 'whole30', label: 'Whole30', category: 'diet' },
  
  // Common restrictions
  { id: 'gluten_free', label: 'Gluten-Free', category: 'restriction' },
  { id: 'dairy_free', label: 'Dairy-Free', category: 'restriction' },
  { id: 'sugar_free', label: 'Sugar-Free', category: 'restriction' },
  { id: 'low_sodium', label: 'Low Sodium', category: 'restriction' },
  
  // Common allergies
  { id: 'nuts', label: 'Nuts', category: 'allergy' },
  { id: 'shellfish', label: 'Shellfish', category: 'allergy' },
  { id: 'soy', label: 'Soy', category: 'allergy' },
  { id: 'eggs', label: 'Eggs', category: 'allergy' },
];

export default function DietaryLens({ user }: DietaryLensProps) {
  const router = useRouter();
  
  // State for selected dietary options and other allergies
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Toggle a dietary option selection
  const toggleOption = (optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      // If option is already selected, remove it
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    } else {
      // Add the option to selected options
      setSelectedOptions([...selectedOptions, optionId]);
    }
  };

  // Handle navigation to next step
  const handleNext = async () => {
    try {
      // Check if user is authenticated first
      if (!user) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      setIsLoading(true);
      
      // Optionally save dietary preferences to database
      if (selectedOptions.length > 0 || otherAllergy.trim()) {
        // Save to user_goals_and_diets table
        const dataToSave = {
          user_id: user.id,
          dietary_preferences: selectedOptions,
          other_allergies: otherAllergy.trim() || null,
          updated_at: new Date().toISOString()
        };
        
        // Check if user already has an entry in user_goals_and_diets
        const { data: existingData, error: fetchError } = await supabase
          .from('user_goals_and_diets')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (fetchError) {
          console.error('Error checking existing data:', fetchError);
        }
        
        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_goals_and_diets')
            .update({
              dietary_preferences: selectedOptions,
              other_allergies: otherAllergy.trim() || null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating dietary preferences:', updateError);
          }
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('user_goals_and_diets')
            .insert([dataToSave]);
            
          if (insertError) {
            console.error('Error saving dietary preferences:', insertError);
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
      
      // Add dietary options
      if (selectedOptions.length > 0) {
        params.append('dietaryOptions', selectedOptions.join(','));
      }
      
      // Add other allergies if provided
      if (otherAllergy.trim()) {
        params.append('otherAllergy', otherAllergy.trim());
      }
      
      // Navigate to health check step with all parameters
      router.push(`/onboarding/step-health-check?${params.toString()}`);
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

  // Group options by category for display
  const dietStyles = DIETARY_OPTIONS.filter(option => option.category === 'diet');
  const restrictions = DIETARY_OPTIONS.filter(option => option.category === 'restriction');
  const allergies = DIETARY_OPTIONS.filter(option => option.category === 'allergy');

  return (
    <OnboardingLayout currentStep={3}>
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-900">
        <h1 className="text-xl font-bold mb-3 text-center">
          Do you follow any of these?
        </h1>
        
        <p className="text-gray-600 mb-6 text-center text-sm">
          Select all that apply to help us find the right menu items for you.
        </p>

        {/* Diet Styles section */}
        <div className="mb-6">
          <h2 className="text-base font-medium mb-3">Diet Styles</h2>
          <div className="flex flex-wrap gap-2">
            {dietStyles.map((option) => (
              <div 
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`px-3 py-2 rounded-full cursor-pointer text-sm transition-colors ${
                  selectedOptions.includes(option.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>

        {/* Restrictions section */}
        <div className="mb-6">
          <h2 className="text-base font-medium mb-3">Restrictions</h2>
          <div className="flex flex-wrap gap-2">
            {restrictions.map((option) => (
              <div 
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`px-3 py-2 rounded-full cursor-pointer text-sm transition-colors ${
                  selectedOptions.includes(option.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>

        {/* Allergies section */}
        <div className="mb-6">
          <h2 className="text-base font-medium mb-3">Allergies</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {allergies.map((option) => (
              <div 
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`px-3 py-2 rounded-full cursor-pointer text-sm transition-colors ${
                  selectedOptions.includes(option.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
          
          {/* Other allergies input */}
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Other allergies or sensitivities (optional)"
            value={otherAllergy}
            onChange={(e) => setOtherAllergy(e.target.value)}
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
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-5 py-2 rounded-lg text-white transition-colors bg-[#34A853] hover:bg-[#2c9247] flex items-center justify-center"
            disabled={isLoading}
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