'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Import layout
import PillButton from '../../components/onboarding/PillButton'; // Import PillButton

// --- Styles (Applied from Guidelines) ---
const labelStyle = "block text-xs font-normal text-off-white/90 mb-1.5"; // Added
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const inputStyle = "w-full h-10 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]"; // Existing but ensure consistency with guideline (height might differ slightly)
const inputPlaceholderStyle = "placeholder-gray-400/80";
const errorBoxStyle = "mb-3 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center"; // Adjusted error style
// ---

const HEALTH_CONDITIONS = [
  'Diabetes', 'Kidney Disease', 'IBS / IBD',
  'High Blood Pressure', 'High Cholesterol',
  'Celiac Disease', 'BERD / Acid Reflux',
  'Bloating', 'None of these', 'Other'
];

const FOOD_AVOIDANCES = [
    'Gluten', 'Dairy', 'Shellfish', 'Soy', 'Nuts', 'Histamine', 'Sugar', // Row 1 (approx)
    'Wheat', 'Alcohol', 'Legumes', 'Corn', 'Eggs', 'Red Meat', // Row 2 (approx)
    'None', 'Other'
];

const SERIOUS_CONDITIONS = ['Diabetes', 'Kidney Disease', 'High Blood Pressure', 'High Cholesterol'];
// Define avoidances that might warrant the safety note
const POTENTIALLY_DANGEROUS_AVOIDANCES = ['Nuts', 'Shellfish']; // Add others like Celiac/Gluten if needed

// Helper function to parse 'Other: ...' text
const parseOtherText = (item: string): string => {
    if (item.startsWith('Other: ')) {
        return item.substring(7); // Length of "Other: "
    }
    return '';
};

export default function OnboardingHealthCheck() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherConditionText, setOtherConditionText] = useState<string>('');
  const [selectedAvoidances, setSelectedAvoidances] = useState<string[]>([]);
  const [otherAvoidanceText, setOtherAvoidanceText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string>('');

  // --- Validation Logic ---
  const isConditionsValid = selectedConditions.length > 0 && 
                            (!selectedConditions.includes('Other') || otherConditionText.trim() !== '');
  const isAvoidancesValid = selectedAvoidances.length > 0 &&
                            (!selectedAvoidances.includes('Other') || otherAvoidanceText.trim() !== '');
  const isStepValid = isConditionsValid && isAvoidancesValid;
  // ---

  // Fetch user session and pre-fill
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch existing profile data
          const { data: healthData, error: healthError } = await supabase
              .from('user_health_data')
              .select('conditions, avoid_ingredients')
              .eq('user_id', session.user.id)
              .maybeSingle();

          if (healthError) {
              console.error('[Onboarding Health Check] Error fetching health data:', healthError);
          } else if (healthData) {
              // Pre-fill health conditions
              if (healthData.conditions && Array.isArray(healthData.conditions)) {
                  const conditions = healthData.conditions;
                  setSelectedConditions(conditions.filter(c => !c.startsWith('Other: ')));
                  const otherCond = conditions.find(c => c.startsWith('Other: '));
                  if (otherCond) {
                      setSelectedConditions(prev => [...prev, 'Other']);
                      setOtherConditionText(parseOtherText(otherCond));
                  }
              }
              // Pre-fill food avoidances from avoid_ingredients string field
              if (healthData.avoid_ingredients) {
                   try {
                       // Try to parse as JSON first in case it's stored as a serialized array
                       const avoidances = JSON.parse(healthData.avoid_ingredients);
                       if (Array.isArray(avoidances)) {
                           setSelectedAvoidances(avoidances.filter((a: string) => !a.startsWith('Other: ')));
                           const otherAvoid = avoidances.find((a: string) => a.startsWith('Other: '));
                           if (otherAvoid) {
                               setSelectedAvoidances(prev => [...prev, 'Other']);
                               setOtherAvoidanceText(parseOtherText(otherAvoid));
                           }
                       }
                   } catch (e) {
                       // If not JSON, split by commas
                       const avoidances = healthData.avoid_ingredients.split(', ');
                       setSelectedAvoidances(avoidances.filter((a: string) => !a.startsWith('Other: ')));
                       const otherAvoid = avoidances.find((a: string) => a.startsWith('Other: '));
                       if (otherAvoid) {
                           setSelectedAvoidances(prev => [...prev, 'Other']);
                           setOtherAvoidanceText(parseOtherText(otherAvoid));
                       }
                   }
              }
          }
        } else {
          console.error('[Onboarding Health Check] No user session found, redirecting.');
          router.replace('/auth/login');
        }
      } catch (fetchError) {
        console.error('[Onboarding Health Check] Error in initial data fetch:', fetchError);
        setError('Could not load step. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, [router]);

  const handleConditionToggle = (condition: string) => {
    setError('');
    setSelectedConditions(prev => {
        let newState = [...prev];
        if (condition === 'None of these') {
            return prev.includes(condition) ? [] : ['None of these'];
        } else {
            newState = newState.filter(item => item !== 'None of these');
            if (newState.includes(condition)) {
                newState = newState.filter(item => item !== condition);
                if (condition === 'Other') setOtherConditionText('');
            } else {
                newState.push(condition);
            }
            return newState;
        }
    });
  };

  const handleAvoidanceToggle = (avoidance: string) => {
    setError('');
    setSelectedAvoidances(prev => {
      let newState = [...prev];
      if (avoidance === 'None') {
          return prev.includes(avoidance) ? [] : ['None'];
      } else {
          newState = newState.filter(item => item !== 'None');
          if (newState.includes(avoidance)) {
              newState = newState.filter(item => item !== avoidance);
              if (avoidance === 'Other') setOtherAvoidanceText(''); 
          } else {
              newState.push(avoidance);
          }
          return newState;
      }
    });
  };

  // Updated logic for showing the safety note
  const showSafetyNote = 
      selectedConditions.some(cond => SERIOUS_CONDITIONS.includes(cond)) ||
      selectedAvoidances.some(avoid => POTENTIALLY_DANGEROUS_AVOIDANCES.includes(avoid));

  const handleBack = () => {
    router.push('/onboarding/step2-mission');
  };

  const handleNext = async () => {
    if (!user) {
      console.error('[Onboarding Health Check] handleNext called without user.');
      setError('User session not found.');
      return;
    }
    if (!isConditionsValid) {
        setError('Please select applicable health conditions or \'None of these\'.');
        if (selectedConditions.includes('Other') && !otherConditionText.trim()) {
           setError('Please specify other health condition.');
        }
        return;
    }
    if (!isAvoidancesValid) {
        setError('Please select foods to avoid or \'None\'.');
         if (selectedAvoidances.includes('Other') && !otherAvoidanceText.trim()) {
           setError('Please specify other food to avoid.');
        }
        return;
    }

    setError('');
    setIsLoading(true);

    const conditionsToSave = selectedConditions.map(c => c === 'Other' ? `Other: ${otherConditionText.trim()}` : c);
    const avoidancesToSave = selectedAvoidances.map(a => a === 'Other' ? `Other: ${otherAvoidanceText.trim()}` : a);

    // Serialize the avoidances to a string for storage
    const avoidancesString = JSON.stringify(avoidancesToSave);

    const updateData = {
      user_id: user.id,
      conditions: conditionsToSave.length > 0 ? conditionsToSave : null,
      avoid_ingredients: avoidancesToSave.length > 0 ? avoidancesString : null,
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Health Check] Updating health data for user:', user.id);
      const { error: upsertError } = await supabase
        .from('user_health_data')
        .upsert(updateData, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('[Onboarding Health Check] Supabase upsert error:', upsertError);
        throw upsertError;
      }

      console.log('[Onboarding Health Check] Health data updated successfully.');
      router.push('/onboarding/step4-eating-style');

    } catch (err: any) {
      console.error('[Onboarding Health Check] Update failed:', err);
      setError(err.message || 'Failed to save health information.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout 
      title="Health Check" 
      currentStep={3}
      totalSteps={4}
      showBackButton={true} 
      onBack={handleBack}
    >
        <h2 className="text-lg sm:text-xl font-light text-center mb-6 text-off-white">
          Any health conditions to consider?
        </h2>

        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        {/* Health Conditions Section */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {HEALTH_CONDITIONS.map((condition) => (
            <div key={condition} className="flex flex-wrap items-center gap-2">
              <PillButton
                text={condition}
                isSelected={selectedConditions.includes(condition)}
                onClick={() => handleConditionToggle(condition)}
              />
              {condition === 'Other' && selectedConditions.includes('Other') && (
                <input 
                  type="text"
                  value={otherConditionText}
                  onChange={(e) => setOtherConditionText(e.target.value)}
                  placeholder="Please specify..."
                  className={`${inputStyle} ${inputPlaceholderStyle} flex-shrink min-w-[100px] max-w-xs`}
                />
              )}
            </div>
          ))}
        </div>

        <hr className="border-off-white/30 my-6" />

        {/* Reduced h3 font size */}
        <h3 className="text-base sm:text-lg font-light text-center mb-6 text-off-white">
          Should we avoid any of these foods?
        </h3>
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {FOOD_AVOIDANCES.map((avoidance) => (
            <div key={avoidance} className="flex flex-wrap items-center gap-2">
              <PillButton
                text={avoidance}
                isSelected={selectedAvoidances.includes(avoidance)}
                onClick={() => handleAvoidanceToggle(avoidance)}
              />
              {avoidance === 'Other' && selectedAvoidances.includes('Other') && (
                <input 
                  type="text"
                  value={otherAvoidanceText}
                  onChange={(e) => setOtherAvoidanceText(e.target.value)}
                  placeholder="Please specify..."
                  className={`${inputStyle} ${inputPlaceholderStyle} flex-shrink min-w-[100px] max-w-xs`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Safety Note Moved Here - Above Button */}
        {showSafetyNote && (
            <p className="text-sm text-green-200 text-center bg-green-800/30 rounded p-2 mb-4">
                Thanks! We'll aim to tailor meal suggestions that align with your conditions
            </p>
        )}

        {/* CTA Button - Apply validation to disabled prop */}
        <div className="pt-4">
          <button 
            type="button" 
            onClick={handleNext}
            disabled={isLoading || !isStepValid} // Use the combined validation state
            className={buttonStyle}
          >
            {isLoading ? 'Saving...' : 'Next'}
          </button>
        </div>
    </OnboardingLayout>
  );
} 