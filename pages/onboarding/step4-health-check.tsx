'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Import layout
import PillButton from '../../components/onboarding/PillButton'; // Import PillButton

// --- Styles (Matching Input.tsx component) ---
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const inputStyle = "h-10 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]"; // Inline Input style
const inputPlaceholderStyle = "placeholder-gray-400/80";
const errorBoxStyle = "mb-3 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center"; // Adjusted error style
// ---

const HEALTH_CONDITIONS = [
  'Diabetes', 'Kidney Issues', 'High Blood Pressure', 'High Cholesterol',
  'Celiac Disease', 'IBS / IBD', 'BERD / Acid Reflux', 'Bloating',
  'None of these', 'Other'
];

const FOOD_AVOIDANCES = [
    'Gluten', 'Dairy', 'Shellfish', 'Soy', 'Wheat', 'Nuts', 'Histamine',
    'Sugar', 'Alcohol', 'Legumes', 'Corn', 'Eggs', 'Red Meat', 'Other'
];

const SERIOUS_CONDITIONS = ['Diabetes', 'Kidney Issues', 'High Blood Pressure', 'High Cholesterol'];

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

  // Fetch user session and pre-fill
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch existing profile data
          const { data: profile, error: profileError } = await supabase
              .from('user_profile')
              .select('health_conditions, food_avoidances')
              .eq('id', session.user.id)
              .maybeSingle();

          if (profileError) {
              console.error('[Onboarding Health Check] Error fetching profile:', profileError);
          } else if (profile) {
              // Pre-fill health conditions
              if (profile.health_conditions && Array.isArray(profile.health_conditions)) {
                  const conditions = profile.health_conditions;
                  setSelectedConditions(conditions.filter(c => !c.startsWith('Other: ')));
                  const otherCond = conditions.find(c => c.startsWith('Other: '));
                  if (otherCond) {
                      setSelectedConditions(prev => [...prev, 'Other']);
                      setOtherConditionText(parseOtherText(otherCond));
                  }
              }
              // Pre-fill food avoidances
              if (profile.food_avoidances && Array.isArray(profile.food_avoidances)) {
                   const avoidances = profile.food_avoidances;
                   setSelectedAvoidances(avoidances.filter(a => !a.startsWith('Other: ')));
                   const otherAvoid = avoidances.find(a => a.startsWith('Other: '));
                   if (otherAvoid) {
                       setSelectedAvoidances(prev => [...prev, 'Other']);
                       setOtherAvoidanceText(parseOtherText(otherAvoid));
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
      const newState = [...prev];
      if (newState.includes(avoidance)) {
        if (avoidance === 'Other') setOtherAvoidanceText('');
        return newState.filter(item => item !== avoidance);
      } else {
        newState.push(avoidance);
        return newState;
      }
    });
  };

  const showSeriousConditionNote = selectedConditions.some(cond => SERIOUS_CONDITIONS.includes(cond));

  const handleNext = async () => {
    if (!user) {
      console.error('[Onboarding Health Check] handleNext called without user.');
      setError('User session not found.');
      return;
    }
    if (selectedConditions.includes('Other') && !otherConditionText.trim()) {
        setError('Please specify other health condition.');
        return;
    }
    if (selectedAvoidances.includes('Other') && !otherAvoidanceText.trim()) {
        setError('Please specify other food to avoid.');
        return;
    }

    setError('');
    setIsLoading(true);

    const conditionsToSave = selectedConditions.map(c => c === 'Other' ? `Other: ${otherConditionText.trim()}` : c);
    const avoidancesToSave = selectedAvoidances.map(a => a === 'Other' ? `Other: ${otherAvoidanceText.trim()}` : a);

    const updateData = {
      health_conditions: conditionsToSave.length > 0 ? conditionsToSave : null,
      food_avoidances: avoidancesToSave.length > 0 ? avoidancesToSave : null,
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Health Check] Updating profile for user:', user.id);
      const { error: updateError } = await supabase.from('user_profile').update(updateData).eq('id', user.id);

      if (updateError) {
        console.error('[Onboarding Health Check] Supabase update error:', updateError);
        throw updateError;
      }

      console.log('[Onboarding Health Check] Profile updated successfully.');
      router.push('/onboarding/step5-eating-style');

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
    <OnboardingLayout title="Health Check" currentStep={3} totalSteps={6}>
        <h1 className="text-xl sm:text-2xl font-light text-center mb-6 text-off-white">
          Any health conditions we should consider?
        </h1>

        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        {/* Health Conditions Section - Use PillButton */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {HEALTH_CONDITIONS.map((condition) => (
            <div key={condition} className="flex items-center space-x-2">
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
                    className={`${inputStyle} ${inputPlaceholderStyle} w-48`}
                 />
              )}
            </div>
          ))}
        </div>

        {/* Serious Condition Note */}
        {showSeriousConditionNote && (
            <p className="text-sm text-green-200 text-center bg-green-800/30 rounded p-2 mb-4">
                We'll make sure your meals are safe and supportive for your condition.
            </p>
        )}

        <hr className="border-off-white/30 my-6" />

        {/* Food Avoidances Section - Use PillButton */}
        <h2 className="text-lg font-light text-center mb-4 text-off-white">
          Do you avoid any of these foods?
        </h2>
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {FOOD_AVOIDANCES.map((avoidance) => (
             <div key={avoidance} className="flex items-center space-x-2">
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
                        className={`${inputStyle} ${inputPlaceholderStyle} w-48`}
                    />
                )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <button 
            type="button" 
            onClick={handleNext}
            disabled={isLoading}
            className={buttonStyle}
          >
            {isLoading ? 'Saving...' : 'Next'}
          </button>
        </div>
    </OnboardingLayout>
  );
} 