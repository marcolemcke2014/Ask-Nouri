'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
// TODO: Import or create PillButton component

const EATING_STYLES = [
    'Balanced', 'High Protein', 'Low Carb', 'Keto', 'Vegan', 'Vegetarian',
    'Pescatarian', 'Paleo', 'Halal', 'Kosher', 'Raw Food', 'Carnivore',
    'Other', 'No strict rules'
];

export default function OnboardingEatingStyle() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [otherStyleText, setOtherStyleText] = useState<string>('');
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

  const handleStyleToggle = (style: string) => {
    setError('');
    setSelectedStyles(prev => {
      let newState = [...prev];
      if (style === 'No strict rules') {
        // Selecting 'No strict rules' deselects everything else and itself if already selected
        return prev.includes(style) ? [] : ['No strict rules'];
      } else {
        // Remove 'No strict rules' if selecting something specific
        newState = newState.filter(item => item !== 'No strict rules');
        if (newState.includes(style)) {
          newState = newState.filter(item => item !== style);
          if (style === 'Other') setOtherStyleText(''); // Clear text if 'Other' deselected
        } else {
          newState.push(style);
        }
        return newState;
      }
    });
  };

  const handleNext = async () => {
    if (!user) {
      setError('User session not found. Please log in again.');
      return;
    }
    // Basic validation for 'Other' field
    if (selectedStyles.includes('Other') && !otherStyleText.trim()) {
      setError('Please specify the other eating style.');
      return;
    }

    setError('');
    setIsLoading(true);

    // Prepare array for DB, including the 'Other' text if applicable
    const stylesToSave = selectedStyles.map(s => s === 'Other' ? `Other: ${otherStyleText.trim()}` : s);

    const updateData = {
      eating_styles: stylesToSave.length > 0 ? stylesToSave : null, // Use the new column
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Eating Style] Updating goals for user:', user.id, updateData);
       // Upsert logic for user_goals_and_diets table
        const { data: existingData, error: fetchError } = await supabase
            .from('user_goals_and_diets')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let upsertError;
        if (existingData) {
            console.log('[Onboarding Eating Style] Updating existing goals record.');
            const { error } = await supabase
                .from('user_goals_and_diets')
                .update(updateData)
                .eq('user_id', user.id);
            upsertError = error;
        } else {
            console.log('[Onboarding Eating Style] Inserting new goals record.');
            // Need primary_goal if inserting - fetch it or handle null?
            // For now, let's assume primary_goal might exist or be null
            const { data: goalData } = await supabase.from('user_goals_and_diets').select('primary_goal').eq('user_id', user.id).maybeSingle();
            const { error } = await supabase
                .from('user_goals_and_diets')
                .insert({ 
                    user_id: user.id, 
                    primary_goal: goalData?.primary_goal, // Include potentially existing goal
                    ...updateData, // Spread the new data (eating_styles, updated_at)
                    created_at: new Date().toISOString() 
                });
            upsertError = error;
        }

        if (upsertError) {
            throw upsertError;
        }

      console.log('[Onboarding Eating Style] Goals/Diets updated successfully.');
      router.push('/onboarding/step6-personalize'); // Navigate to the next step

    } catch (err: any) {
      console.error('[Onboarding Eating Style] Update failed:', err);
      setError(err.message || 'Failed to save eating style.');
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
        <title>Onboarding: Eating Style - NutriFlow</title>
      </Head>

      {/* TODO: Add Progress Indicator (Step 4 of 6) */}

      <main className="w-full max-w-[600px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 mt-10">
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-4">
          Do you follow a specific eating style?
        </h1>
        <p className="text-sm text-center text-green-200 mb-6">
           (Optional — you can always update later.)
        </p>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {EATING_STYLES.map((style) => (
             <div key={style}>
                <button
                    type="button"
                    onClick={() => handleStyleToggle(style)}
                    className={`${pillBaseStyle} ${selectedStyles.includes(style) ? pillActiveStyle : pillInactiveStyle}`}
                >
                    {style}
                </button>
                {style === 'Other' && selectedStyles.includes('Other') && (
                    <input 
                        type="text"
                        value={otherStyleText}
                        onChange={(e) => setOtherStyleText(e.target.value)}
                        placeholder="Please specify style..."
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