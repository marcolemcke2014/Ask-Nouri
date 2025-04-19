import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Add type definition for component props
interface StepFinalProps {
  user: User | null;
}

export default function StepFinal({ user }: StepFinalProps) {
  const router = useRouter();
  
  // State for onboarding data from query params
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  
  // State for inputs on this page
  const [foodTone, setFoodTone] = useState<string | null>(null);
  const [dislikesText, setDislikesText] = useState<string>('');
  const [customNotesText, setCustomNotesText] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [gender, setGender] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Extract query parameters when router is ready
  useEffect(() => {
    if (!router.isReady) return;
    
    // Get all query parameters
    const params = router.query;
    console.log('Retrieved onboarding data from URL:', params);
    
    // Store in state
    setOnboardingData(params);
  }, [router.isReady, router.query]);
  
  // Handle form submission
  const handleFinishSetup = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Use user from props instead of fetching again
      if (!user) {
        throw new Error('No authenticated user found. Please sign in again.');
      }
      
      const userId = user.id;
      console.log('Saving onboarding data for user:', userId);
      
      // Convert boolean strings to actual booleans
      const booleanFields = ['intermittentFasting'];
      const processedData = { ...onboardingData };
      booleanFields.forEach(field => {
        if (field in processedData) {
          processedData[field] = processedData[field] === 'true';
        }
      });
      
      // Convert comma-separated strings to arrays
      const arrayFields = ['healthConditions', 'dietaryOptions', 'trackingTools', 'wellnessGoals', 'digestiveIssues', 'mealTriggers', 'symptomManagement', 'previousDiets'];
      arrayFields.forEach(field => {
        if (field in processedData && typeof processedData[field] === 'string') {
          processedData[field] = processedData[field].split(',');
        }
      });
      
      // Prepare health data object
      const healthData = {
        user_id: userId,
        height: height ? parseInt(height, 10) : null,
        weight: weight ? parseInt(weight, 10) : null,
        age: age ? parseInt(age, 10) : null,
        gender: gender,
        sleep_quality: onboardingData.sleepQuality || null,
        activity_level: onboardingData.activityLevel || null,
        health_conditions: processedData.healthConditions || [],
        other_health_condition: onboardingData.otherCondition || null,
        uses_tracking_tools: Array.isArray(processedData.trackingTools) ? processedData.trackingTools : [],
        practices_intermittent_fasting: processedData.intermittentFasting || false,
        food_relationship_tone: foodTone,
        dislikes: dislikesText.trim() || null,
        custom_notes: customNotesText.trim() || null,
        user_persona: onboardingData.userPersona || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Prepare goals and diets data object
      const goalsAndDietsData = {
        user_id: userId,
        primary_goal: onboardingData.goal || null,
        protein_focus: onboardingData.proteinFocus || null,
        avoid_bloat: onboardingData.avoidBloat === 'true',
        post_workout_needs: onboardingData.postWorkoutNeed === 'true',
        weight_goal: onboardingData.weightGoal || null,
        weight_timeframe: onboardingData.timeframe || null,
        previous_diets: processedData.previousDiets || [],
        energy_issue: onboardingData.energyIssue || null,
        energy_time_of_day: processedData.timeOfDay || [],
        digestive_issues: processedData.digestiveIssues || [],
        meal_triggers: processedData.mealTriggers || [],
        medication_timing: onboardingData.medicationTiming || null,
        symptom_management: processedData.symptomManagement || [],
        wellness_goals: processedData.wellnessGoals || [],
        main_concern: onboardingData.mainConcern || null,
        diet_strictness: onboardingData.strictness || null,
        diet_duration: onboardingData.duration || null,
        dietary_preferences: processedData.dietaryOptions || [],
        other_allergies: onboardingData.otherAllergy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Prepared health data:', healthData);
      console.log('Prepared goals and diets data:', goalsAndDietsData);
      
      // Save to Supabase
      const { error: healthError } = await supabase.from('user_health_data').upsert(healthData);
      if (healthError) {
        console.error('Error saving health data:', healthError);
        throw new Error(`Failed to save health data: ${healthError.message}`);
      }
      
      const { error: goalsError } = await supabase.from('user_goals_and_diets').upsert(goalsAndDietsData);
      if (goalsError) {
        console.error('Error saving goals data:', goalsError);
        throw new Error(`Failed to save goals data: ${goalsError.message}`);
      }
      
      console.log('Successfully saved all onboarding data!');
      // Redirect to main app
      router.push('/scan');
    } catch (error: any) {
      console.error('Error in handleFinishSetup:', error);
      setErrorMessage(error.message || 'Failed to save your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Back button handler
  const handleBack = () => {
    router.back();
  };
  
  return (
    <OnboardingLayout currentStep={7}>
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-900">
        <h1 className="text-xl font-bold mb-4 text-center">
          Last Details & Preferences
        </h1>
        
        {/* Summary of key selections */}
        {onboardingData.goal && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h2 className="text-base font-medium mb-2">Your profile summary:</h2>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Primary focus:</span> {onboardingData.goal}
              {onboardingData.dietaryOptions && (
                <span>
                  <br />
                  <span className="font-medium">Dietary preferences:</span> {onboardingData.dietaryOptions}
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Food relationship tone */}
        <div className="mb-6">
          <h2 className="text-base font-medium mb-3">How does thinking about food choices usually make you feel?</h2>
          <div className="space-y-2">
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${foodTone === 'positive' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setFoodTone('positive')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${foodTone === 'positive' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {foodTone === 'positive' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Energized/Positive</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${foodTone === 'neutral' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setFoodTone('neutral')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${foodTone === 'neutral' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {foodTone === 'neutral' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Neutral</span>
            </div>
            
            <div 
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                ${foodTone === 'stressed' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setFoodTone('stressed')}
            >
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                ${foodTone === 'stressed' 
                  ? 'border-green-500' 
                  : 'border-gray-400'}`}
              >
                {foodTone === 'stressed' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
              </div>
              <span>Stressed/Guilty</span>
            </div>
          </div>
        </div>
        
        {/* Food dislikes */}
        <div className="mb-6">
          <label htmlFor="dislikes" className="block text-base font-medium mb-2">
            Any specific foods/ingredients you strongly dislike?
          </label>
          <textarea
            id="dislikes"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="E.g., cilantro, mushrooms, olives..."
            rows={2}
            value={dislikesText}
            onChange={(e) => setDislikesText(e.target.value)}
          />
        </div>
        
        {/* Custom notes */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-base font-medium mb-2">
            Anything else important for us to know?
          </label>
          <textarea
            id="notes"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Any other preferences or information you'd like to share..."
            rows={3}
            value={customNotesText}
            onChange={(e) => setCustomNotesText(e.target.value)}
          />
        </div>
        
        {/* Optional Demographics Section */}
        <div className="mb-6 pt-4 border-t border-gray-200">
          <h2 className="text-base font-medium mb-4">Optional Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium mb-1">
                Age
              </label>
              <input
                id="age"
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-1">
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="cm"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium mb-1">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="kg"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
          
          {/* Gender selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Gender
            </label>
            <div className="flex flex-wrap gap-3">
              {['male', 'female', 'non-binary', 'prefer-not-to-say'].map((option) => (
                <div 
                  key={option}
                  className={`px-3 py-2 rounded-full cursor-pointer text-sm transition-colors ${
                    gender === option
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setGender(option)}
                >
                  {option === 'male' && 'Male'}
                  {option === 'female' && 'Female'}
                  {option === 'non-binary' && 'Non-binary'}
                  {option === 'prefer-not-to-say' && 'Prefer not to say'}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Error message display */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
            onClick={handleFinishSetup}
            disabled={isLoading || !foodTone}
            className={`flex-1 px-5 py-2 rounded-lg text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : foodTone
                ? 'bg-[#34A853] hover:bg-[#2c9247]'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
} 