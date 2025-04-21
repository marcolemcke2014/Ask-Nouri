import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './layout';
import { User } from '@supabase/supabase-js';

// Persona options
const PERSONA_OPTIONS = [
  { id: 'busy_professional', label: 'Busy professional with limited time' },
  { id: 'parent', label: 'Parent with family responsibilities' },
  { id: 'student', label: 'Student with irregular schedule' },
  { id: 'shift_worker', label: 'Shift worker with changing hours' },
  { id: 'remote_worker', label: 'Remote worker / home-based' },
  { id: 'frequent_traveler', label: 'Frequent traveler' },
  { id: 'retiree', label: 'Retiree with flexible schedule' }
];

// Activity level options
const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary (mostly sitting)' },
  { id: 'light', label: 'Lightly active (light exercise 1-3 days/week)' },
  { id: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)' },
  { id: 'very', label: 'Very active (hard exercise 6-7 days/week)' },
  { id: 'extra', label: 'Extra active (very hard exercise & physical job)' }
];

// Sleep quality options
const SLEEP_OPTIONS = [
  { id: 'poor', label: 'Poor (frequently interrupted, not enough)' },
  { id: 'fair', label: 'Fair (sometimes interrupted)' },
  { id: 'good', label: 'Good (mostly consistent)' },
  { id: 'excellent', label: 'Excellent (consistent and refreshing)' }
];

// Tracking options
const TRACKING_OPTIONS = [
  { id: 'calories', label: 'Calorie counter' },
  { id: 'macro', label: 'Macro tracker' },
  { id: 'fitness', label: 'Fitness watch/tracker' },
  { id: 'journal', label: 'Food journal' },
  { id: 'none', label: 'None of these' }
];

// Add type definition for component props
interface StepLifestyleProps {
  user: User | null;
}

export default function StepLifestyle({ user }: StepLifestyleProps) {
  const router = useRouter();
  
  // State for lifestyle selections
  const [userPersona, setUserPersona] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [sleepQuality, setSleepQuality] = useState<string | null>(null);
  const [trackingTools, setTrackingTools] = useState<string[]>([]);
  const [intermittentFasting, setIntermittentFasting] = useState<boolean>(false);
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
  
  // Function to handle tracking tools selection
  const toggleTrackingTool = (tool: string) => {
    if (tool === 'none') {
      // If 'none' is selected, clear other selections
      setTrackingTools(['none']);
    } else if (trackingTools.includes('none')) {
      // If another option is selected and 'none' was previously selected, remove 'none'
      setTrackingTools([tool]);
    } else if (trackingTools.includes(tool)) {
      // If tool is already selected, remove it
      setTrackingTools(trackingTools.filter(t => t !== tool));
    } else {
      // Add the tool to selected tools
      setTrackingTools([...trackingTools, tool]);
    }
    
    // Clear any error message when selecting tools
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
      
      if (!userPersona || !activityLevel || !sleepQuality) {
        throw new Error('Please complete all required fields before continuing.');
      }
      
      setIsLoading(true);
      setErrorMessage(null);
      
      // Prepare data to save
      const dataToSave = {
        user_id: currentUserId,
        user_persona: userPersona,
        activity_level: activityLevel,
        sleep_quality: sleepQuality,
        tracking_tools: trackingTools,
        intermittent_fasting: intermittentFasting,
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
        throw new Error(result.error || `Failed to save lifestyle data (HTTP ${response.status})`);
      }
      
      // Get all existing query parameters
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      
      // Copy all existing parameters
      Array.from(currentParams.entries()).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      // Add lifestyle-specific parameters
      if (userPersona) {
        params.append('userPersona', userPersona);
      }
      
      if (activityLevel) {
        params.append('activityLevel', activityLevel);
      }
      
      if (sleepQuality) {
        params.append('sleepQuality', sleepQuality);
      }
      
      if (trackingTools.length > 0) {
        params.append('trackingTools', trackingTools.join(','));
      }
      
      params.append('intermittentFasting', intermittentFasting.toString());
      
      // Ensure user_id is in params
      if (!params.has('user_id') && currentUserId) {
        params.append('user_id', currentUserId);
      }
      
      // Navigate to final step with all parameters
      router.push(`/onboarding/step-final?${params.toString()}`);
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
    <OnboardingLayout currentStep={6}>
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-900">
        <h1 className="text-xl font-bold mb-6 text-center">
          Almost there! A bit about your lifestyle...
        </h1>

        {/* Question 1: Lifestyle Type/Persona */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">Which best describes your typical day or situation?</h2>
          <div className="space-y-2">
            {PERSONA_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                  ${userPersona === option.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setUserPersona(option.id)}
              >
                <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                  ${userPersona === option.id 
                    ? 'border-green-500' 
                    : 'border-gray-400'}`}
                >
                  {userPersona === option.id && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question 2: Activity Level */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">How active are you typically?</h2>
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                  ${activityLevel === option.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setActivityLevel(option.id)}
              >
                <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                  ${activityLevel === option.id 
                    ? 'border-green-500' 
                    : 'border-gray-400'}`}
                >
                  {activityLevel === option.id && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question 3: Sleep Quality */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">How would you rate your usual sleep quality?</h2>
          <div className="space-y-2">
            {SLEEP_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                  ${sleepQuality === option.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setSleepQuality(option.id)}
              >
                <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3
                  ${sleepQuality === option.id 
                    ? 'border-green-500' 
                    : 'border-gray-400'}`}
                >
                  {sleepQuality === option.id && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question 4: Tracking Tools */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">Do you use any tracking tools? (Select all that apply)</h2>
          <div className="space-y-2">
            {TRACKING_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                  ${trackingTools.includes(option.id) 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => toggleTrackingTool(option.id)}
              >
                <div className={`h-4 w-4 rounded flex items-center justify-center mr-3 border
                  ${trackingTools.includes(option.id) 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-400'}`}
                >
                  {trackingTools.includes(option.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question 5: Intermittent Fasting */}
        <div className="mb-8">
          <h2 className="text-base font-medium mb-3">Do you practice intermittent fasting?</h2>
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setIntermittentFasting(!intermittentFasting)}
          >
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${intermittentFasting ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${intermittentFasting ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className="ml-3">{intermittentFasting ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={handleBack}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <div className="flex-1 flex flex-col space-y-2">
            <button
              onClick={handleNext}
              disabled={!userPersona || !activityLevel || !sleepQuality}
              className={`w-full px-5 py-2 rounded-lg text-white transition-colors ${
                userPersona && activityLevel && sleepQuality
                  ? 'bg-[#34A853] hover:bg-[#2c9247]'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
            
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
                
                router.push(`/onboarding/step-final?${params.toString()}`);
              }}
              className="w-full py-2 px-4 text-gray-600 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
} 