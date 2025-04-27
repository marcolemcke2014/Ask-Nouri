'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
// TODO: Import or create PillButton component

const EATING_HABITS = [
    'Busy & Rushed', 'Flexible Schedule', 'Structured Routine', 'Irregular / Shift Work'
];

const ACTIVITY_LEVELS = [
    'Mostly Sitting', 'Lightly Active', 'Moderately Active', 'Very Active'
];

export default function OnboardingPersonalize() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [foodDislikes, setFoodDislikes] = useState<string>('');
  const [eatingHabits, setEatingHabits] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
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

  const handleHabitsSelect = (habit: string) => {
    setError('');
    setEatingHabits(habit);
  };

  const handleActivitySelect = (level: string) => {
    setError('');
    setActivityLevel(level);
  };

  const handleFinish = async () => {
    if (!user) {
      setError('User session not found. Please log in again.');
      return;
    }
    // Optional: Add validation if certain fields are required, though spec implies optional
    // if (!eatingHabits || !activityLevel) {
    //     setError('Please select your eating habits and activity level.');
    //     return;
    // }

    setError('');
    setIsLoading(true);

    const updateData = {
      food_dislikes: foodDislikes.trim() || null, // Store null if empty
      eating_habits: eatingHabits,
      activity_level: activityLevel,
      onboarding_complete: true, // Mark onboarding as complete!
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Personalize] Updating profile for user:', user.id, updateData);
      const { error: updateError } = await supabase
        .from('user_profile')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[Onboarding Personalize] Profile updated successfully, onboarding complete.');
      router.push('/onboarding/step7-success'); // Navigate to the final success step

    } catch (err: any) {
      console.error('[Onboarding Personalize] Update failed:', err);
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder styles
  const labelStyle = "block text-sm font-medium text-off-white mb-1";
  const inputStyle = "w-full p-3 border border-off-white/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 text-off-white bg-white/10 placeholder-gray-300";
  const pillBaseStyle = "px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]";
  const pillInactiveStyle = "bg-off-white/20 border-off-white/30 hover:bg-off-white/30 text-off-white";
  const pillActiveStyle = "bg-green-200 border-green-400 ring-2 ring-green-500 text-green-900";
  const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>Onboarding: Personalize - NutriFlow</title>
      </Head>

      {/* TODO: Add Progress Indicator (Step 5 of 6) */}

      <main className="w-full max-w-[600px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 mt-10">
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-8">
          Almost there! Let's personalize a little more ✨
        </h1>

        <div className="space-y-6">
          {/* Food Dislikes */}
          <div>
            <label htmlFor="dislikes" className={labelStyle}>Any foods or ingredients you strongly dislike?</label>
            <textarea
              id="dislikes"
              rows={3}
              value={foodDislikes}
              onChange={(e) => setFoodDislikes(e.target.value)}
              placeholder="e.g., cilantro, mushrooms, very spicy food..."
              className={inputStyle}
            />
          </div>

          {/* Eating Habits */}
          <div>
             <label className={labelStyle}>Which best describes your eating habits?</label>
             <div className="flex flex-wrap gap-2 mt-1">
                {EATING_HABITS.map((habit) => (
                    <button
                        key={habit}
                        type="button"
                        onClick={() => handleHabitsSelect(habit)}
                        className={`${pillBaseStyle} ${eatingHabits === habit ? pillActiveStyle : pillInactiveStyle}`}
                    >
                        {habit}
                    </button>
                ))}
            </div>
          </div>

          {/* Activity Level */}
          <div>
             <label className={labelStyle}>How active are you most days?</label>
             <div className="flex flex-wrap gap-2 mt-1">
                {ACTIVITY_LEVELS.map((level) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => handleActivitySelect(level)}
                        className={`${pillBaseStyle} ${activityLevel === level ? pillActiveStyle : pillInactiveStyle}`}
                    >
                        {level}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-300 text-sm text-center mt-6">{error}</p>
        )}

        {/* CTA Button */}
        <div className="pt-8">
          <button 
            type="button" 
            onClick={handleFinish}
            disabled={isLoading}
            className={buttonStyle}
          >
            {isLoading ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
      </main>
    </div>
  );
} 