'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Import layout
import PillButton from '../../components/onboarding/PillButton'; // Import PillButton

// --- Styles (Matching auth pages) ---
const labelStyle = "block text-sm font-medium text-off-white mb-1";
const inputStyle = "w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 text-off-white bg-white/10 placeholder-gray-300"; // Textarea style
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const errorBoxStyle = "mb-3 p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm text-center";
// ---

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
              .select('food_dislikes, eating_habits, activity_level')
              .eq('id', session.user.id)
              .maybeSingle();

          if (profileError) {
              console.error('[Onboarding Personalize] Error fetching profile:', profileError);
          } else if (profile) {
              if (profile.food_dislikes) setFoodDislikes(profile.food_dislikes);
              if (profile.eating_habits) setEatingHabits(profile.eating_habits);
              if (profile.activity_level) setActivityLevel(profile.activity_level);
          }
        } else {
          console.error('[Onboarding Personalize] No user session found, redirecting.');
          router.replace('/auth/login');
        }
      } catch (fetchError) {
        console.error('[Onboarding Personalize] Error in initial data fetch:', fetchError);
        setError('Could not load step. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndData();
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
      console.error('[Onboarding Personalize] handleFinish called without user.');
      setError('User session not found.');
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
      console.log('[Onboarding Personalize] Updating profile for user:', user.id);
      const { error: updateError } = await supabase
        .from('user_profile')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('[Onboarding Personalize] Supabase update error:', updateError);
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

  if (isLoading && !user) {
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout title="Personalize" currentStep={5} totalSteps={6}>
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-8 text-off-white">
          Almost there! Let's personalize a little more ✨
        </h1>

        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

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

          {/* Eating Habits - Use PillButton */}
          <div>
             <label className={labelStyle}>Which best describes your eating habits?</label>
             <div className="flex flex-wrap gap-2 mt-1 justify-center">
                {EATING_HABITS.map((habit) => (
                    <PillButton
                        key={habit}
                        text={habit}
                        isSelected={eatingHabits === habit}
                        onClick={() => handleHabitsSelect(habit)}
                    />
                ))}
            </div>
          </div>

          {/* Activity Level - Use PillButton */}
          <div>
             <label className={labelStyle}>How active are you most days?</label>
             <div className="flex flex-wrap gap-2 mt-1 justify-center">
                {ACTIVITY_LEVELS.map((level) => (
                    <PillButton
                        key={level}
                        text={level}
                        isSelected={activityLevel === level}
                        onClick={() => handleActivitySelect(level)}
                    />
                ))}
            </div>
          </div>
        </div>

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
    </OnboardingLayout>
  );
} 