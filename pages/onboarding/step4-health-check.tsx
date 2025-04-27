'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
// TODO: Import or create PillButton component

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

export default function OnboardingHealthCheck() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherConditionText, setOtherConditionText] = useState<string>('');
  const [selectedAvoidances, setSelectedAvoidances] = useState<string[]>([]);
  const [otherAvoidanceText, setOtherAvoidanceText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // TODO: Pre-fill selections?
      } else {
        console.error('Onboarding: No user session found, redirecting.');
        router.replace('/auth/login');
      }
    };
    fetchUser();
  }, [router]);

  const handleConditionToggle = (condition: string) => {
    setError('');
    setSelectedConditions(prev => {
        let newState = [...prev];
        if (condition === 'None of these') {
            return prev.includes(condition) ? [] : ['None of these']; // Select only 'None' or deselect it
        } else {
            newState = newState.filter(item => item !== 'None of these'); // Remove 'None' if selecting something else
            if (newState.includes(condition)) {
                newState = newState.filter(item => item !== condition);
                if (condition === 'Other') setOtherConditionText(''); // Clear text if 'Other' deselected
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
        if (avoidance === 'Other') setOtherAvoidanceText(''); // Clear text if 'Other' deselected
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
      setError('User session not found. Please log in again.');
      return;
    }
    // Basic validation for 'Other' fields
    if (selectedConditions.includes('Other') && !otherConditionText.trim()) {
        setError('Please specify the other health condition.');
        return;
    }
    if (selectedAvoidances.includes('Other') && !otherAvoidanceText.trim()) {
        setError('Please specify the other food to avoid.');
        return;
    }

    setError('');
    setIsLoading(true);

    // Prepare arrays for DB, including the 'Other' text if applicable
    const conditionsToSave = selectedConditions.map(c => c === 'Other' ? `Other: ${otherConditionText.trim()}` : c);
    const avoidancesToSave = selectedAvoidances.map(a => a === 'Other' ? `Other: ${otherAvoidanceText.trim()}` : a);

    const updateData = {
      health_conditions: conditionsToSave.length > 0 ? conditionsToSave : null, // Store null if empty
      food_avoidances: avoidancesToSave.length > 0 ? avoidancesToSave : null, // Store null if empty
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Health Check] Updating profile for user:', user.id, updateData);
      const { error: updateError } = await supabase
        .from('user_profile')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[Onboarding Health Check] Profile updated successfully.');
      router.push('/onboarding/step5-eating-style'); // Navigate to the next step

    } catch (err: any) {
      console.error('[Onboarding Health Check] Update failed:', err);
      setError(err.message || 'Failed to save health information.');
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder styles
  const pillBaseStyle = "px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]";
  const pillInactiveStyle = "bg-off-white/20 border-off-white/30 hover:bg-off-white/30 text-off-white";
  const pillActiveStyle = "bg-green-200 border-green-400 ring-2 ring-green-500 text-green-900";
  const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const inputStyle = "w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 bg-white placeholder-gray-500 text-sm";

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>Onboarding: Health Check - NutriFlow</title>
      </Head>

      {/* TODO: Add Progress Indicator (Step 3 of 6) */}

      <main className="w-full max-w-[600px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 mt-10">
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-6">
          Any health conditions we should consider?
        </h1>

        {/* Health Conditions Section */}
        <div className="flex flex-wrap gap-2 mb-4">
          {HEALTH_CONDITIONS.map((condition) => (
            <div key={condition}>
              <button
                type="button"
                onClick={() => handleConditionToggle(condition)}
                className={`${pillBaseStyle} ${selectedConditions.includes(condition) ? pillActiveStyle : pillInactiveStyle}`}
              >
                {condition}
              </button>
              {condition === 'Other' && selectedConditions.includes('Other') && (
                 <input 
                    type="text"
                    value={otherConditionText}
                    onChange={(e) => setOtherConditionText(e.target.value)}
                    placeholder="Please specify condition..."
                    className={`${inputStyle} mt-1 w-48`}
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

        {/* Food Avoidances Section */}
        <h2 className="text-lg font-medium text-center mb-4">
          Do you avoid any of these foods?
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {FOOD_AVOIDANCES.map((avoidance) => (
             <div key={avoidance}>
                <button
                    type="button"
                    onClick={() => handleAvoidanceToggle(avoidance)}
                    className={`${pillBaseStyle} ${selectedAvoidances.includes(avoidance) ? pillActiveStyle : pillInactiveStyle}`}
                >
                    {avoidance}
                </button>
                {avoidance === 'Other' && selectedAvoidances.includes('Other') && (
                    <input 
                        type="text"
                        value={otherAvoidanceText}
                        onChange={(e) => setOtherAvoidanceText(e.target.value)}
                        placeholder="Please specify food..."
                        className={`${inputStyle} mt-1 w-48`}
                    />
                )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-300 text-sm text-center mb-4">{error}</p>
        )}

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
      </main>
    </div>
  );
} 