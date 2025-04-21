import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type DietaryOption = {
  id: string;
  label: string;
  category: 'diet' | 'avoidance' | 'allergy';
};

// Add type definition for component props
interface DietaryLensProps {
  user: User | null;
}

const DIETARY_OPTIONS: DietaryOption[] = [
  // Diet styles
  { id: 'balanced', label: 'Balanced / No Strict Diet', category: 'diet' },
  { id: 'vegetarian', label: 'Vegetarian', category: 'diet' },
  { id: 'vegan', label: 'Vegan', category: 'diet' },
  { id: 'pescatarian', label: 'Pescatarian', category: 'diet' },
  { id: 'keto', label: 'Keto', category: 'diet' },
  { id: 'paleo', label: 'Paleo', category: 'diet' },
  { id: 'low_carb', label: 'Low Carb', category: 'diet' },
  { id: 'low_fat', label: 'Low Fat', category: 'diet' },
  { id: 'mediterranean', label: 'Mediterranean', category: 'diet' },
  { id: 'whole30', label: 'Whole30', category: 'diet' },
  { id: 'halal', label: 'Halal', category: 'diet' },
  { id: 'kosher', label: 'Kosher', category: 'diet' },
  { id: 'low_fodmap', label: 'Low-FODMAP', category: 'diet' },
  { id: 'anti_inflammatory', label: 'Anti-inflammatory', category: 'diet' },
  
  // Common avoidances
  { id: 'gluten_free', label: 'Gluten-Free', category: 'avoidance' },
  { id: 'dairy_free', label: 'Dairy-Free', category: 'avoidance' },
  { id: 'no_added_sugar', label: 'Avoiding Added Sugar', category: 'avoidance' },
  { id: 'no_alcohol', label: 'Avoiding Alcohol', category: 'avoidance' },
  { id: 'no_processed_food', label: 'Avoiding Processed Food', category: 'avoidance' },
  { id: 'no_red_meat', label: 'Avoiding Red Meat', category: 'avoidance' },
  { id: 'low_sodium', label: 'Low Sodium', category: 'avoidance' },
  
  // Common allergies and strict needs
  { id: 'none', label: 'No Allergies / Strict Needs', category: 'allergy' },
  { id: 'celiac', label: 'Celiac Disease', category: 'allergy' },
  { id: 'lactose_intolerant', label: 'Lactose Intolerance', category: 'allergy' },
  { id: 'histamine_intolerant', label: 'Histamine Intolerance', category: 'allergy' },
  { id: 'nuts', label: 'Nuts Allergy', category: 'allergy' },
  { id: 'peanuts', label: 'Peanut Allergy', category: 'allergy' },
  { id: 'shellfish', label: 'Shellfish Allergy', category: 'allergy' },
  { id: 'fish', label: 'Fish Allergy', category: 'allergy' },
  { id: 'soy', label: 'Soy Allergy', category: 'allergy' },
  { id: 'eggs', label: 'Eggs Allergy', category: 'allergy' },
  { id: 'wheat', label: 'Wheat Allergy', category: 'allergy' },
];

export default function DietaryLens({ user }: DietaryLensProps) {
  const router = useRouter();
  
  // State for selected dietary options and other allergies
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState<string>('');
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
  
  // Toggle a dietary option selection with special handling for "None" option
  const toggleOption = (optionId: string) => {
    const option = DIETARY_OPTIONS.find(opt => opt.id === optionId);
    if (!option) return;
    
    // Create a copy of current selections
    let newSelections = [...selectedOptions];
    
    // Special handling for allergies
    if (option.category === 'allergy') {
      if (optionId === 'none') {
        // If "None" is selected, remove all other allergy options
        const allergyOptionIds = DIETARY_OPTIONS
          .filter(opt => opt.category === 'allergy' && opt.id !== 'none')
          .map(opt => opt.id);
          
        newSelections = newSelections.filter(id => !allergyOptionIds.includes(id));
        
        // Add "none" if it's not already selected
        if (!newSelections.includes('none')) {
          newSelections.push('none');
        } else {
          // If "none" is already selected, remove it (toggle behavior)
          newSelections = newSelections.filter(id => id !== 'none');
        }
      } else {
        // If any other allergy is selected, remove "none" option
        newSelections = newSelections.filter(id => id !== 'none');
        
        // Toggle the selected allergy
        if (newSelections.includes(optionId)) {
          newSelections = newSelections.filter(id => id !== optionId);
        } else {
          newSelections.push(optionId);
        }
      }
    } else {
      // Normal toggle behavior for non-allergy categories
      if (newSelections.includes(optionId)) {
        newSelections = newSelections.filter(id => id !== optionId);
      } else {
        newSelections.push(optionId);
      }
    }
    
    setSelectedOptions(newSelections);
    
    // Clear any error message when selecting options
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
      
      // Process selected options if any exist
      if (selectedOptions.length > 0 || otherAllergy.trim()) {
        // Get all diet style options that are selected
        const selectedDietStyles = selectedOptions.filter(optionId => 
          DIETARY_OPTIONS.find(opt => opt.id === optionId && opt.category === 'diet')
        );
        
        // Get the primary diet type (first selected style, or null if none)
        const dietType = selectedDietStyles.length > 0 ? selectedDietStyles[0] : null;
        
        // Get all avoidance options that are selected
        const selectedAvoidances = selectedOptions.filter(optionId => 
          DIETARY_OPTIONS.find(opt => opt.id === optionId && opt.category === 'avoidance')
        );
        
        // Get all allergy options that are selected (except 'none')
        const selectedAllergies = selectedOptions.filter(optionId => 
          DIETARY_OPTIONS.find(opt => opt.id === optionId && opt.category === 'allergy' && optionId !== 'none')
        );
        
        // Combine diet styles and avoidances for dietary_tags (excluding allergies)
        const dietaryTags = [...selectedDietStyles, ...selectedAvoidances];
        
        // Process avoidances for avoid_ingredients mapping
        const avoidIngredients = [];
        
        if (selectedAvoidances.includes('gluten_free')) avoidIngredients.push('gluten');
        if (selectedAvoidances.includes('dairy_free')) avoidIngredients.push('dairy');
        if (selectedAvoidances.includes('no_added_sugar')) avoidIngredients.push('added_sugar');
        if (selectedAvoidances.includes('no_alcohol')) avoidIngredients.push('alcohol');
        if (selectedAvoidances.includes('no_processed_food')) avoidIngredients.push('processed_food');
        if (selectedAvoidances.includes('no_red_meat')) avoidIngredients.push('red_meat');
        if (selectedAvoidances.includes('low_sodium')) avoidIngredients.push('high_sodium');
        
        // Prepare data for user_goals_and_diets table (NO allergy information)
        const goalsDataToSave = {
          user_id: currentUserId,
          diet_type: dietType,
          dietary_tags: dietaryTags,
          avoid_ingredients: avoidIngredients,
          updated_at: new Date().toISOString()
        };
        
        // Prepare data for user_health_data table (ONLY allergy information)
        const healthDataToSave = {
          user_id: currentUserId,
          allergies: selectedAllergies,
          other_allergies_text: otherAllergy.trim() || null,
          updated_at: new Date().toISOString()
        };
        
        // Save diet information to user_goals_and_diets
        const goalsResponse = await fetch('/api/save-onboarding-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'user_goals_and_diets',
            data: goalsDataToSave
          })
        });
        
        const goalsResult = await goalsResponse.json();
        
        if (!goalsResponse.ok) {
          throw new Error(goalsResult.error || `Failed to save dietary information (HTTP ${goalsResponse.status})`);
        }
        
        // Save allergy information to user_health_data
        const healthResponse = await fetch('/api/save-onboarding-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'user_health_data',
            data: healthDataToSave
          })
        });
        
        const healthResult = await healthResponse.json();
        
        if (!healthResponse.ok) {
          throw new Error(healthResult.error || `Failed to save allergy information (HTTP ${healthResponse.status})`);
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
      
      // Ensure user_id is in params
      if (!params.has('user_id') && currentUserId) {
        params.append('user_id', currentUserId);
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
  const avoidances = DIETARY_OPTIONS.filter(option => option.category === 'avoidance');
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

        {/* Avoidances section */}
        <div className="mb-6">
          <h2 className="text-base font-medium mb-3">Common Avoidances</h2>
          <div className="flex flex-wrap gap-2">
            {avoidances.map((option) => (
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
          <h2 className="text-base font-medium mb-3">Allergies / Strict Needs</h2>
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
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

        {/* Navigation buttons (only Back and Next now) */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={handleBack}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
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
          
          router.push(`/onboarding/step-health-check?${params.toString()}`);
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