'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
// TODO: Import or create GoalCard component
// TODO: Import icons (Dumbbell, Zap, Brain, Leaf, Heart, HelpCircle)

interface GoalOption {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>; // Placeholder for icon component
}

const GOAL_OPTIONS: GoalOption[] = [
  { id: 'build_muscle', title: 'Build Muscle', icon: undefined }, // Replace undefined with actual icon component
  { id: 'lose_weight', title: 'Lose Weight', icon: undefined },
  { id: 'boost_energy', title: 'Boost Energy', icon: undefined },
  { id: 'improve_gut_health', title: 'Improve Gut Health', icon: undefined },
  { id: 'manage_health_conditions', title: 'Manage Health Conditions', icon: undefined },
  { id: 'other', title: 'Other', icon: undefined },
];

export default function OnboardingMission() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [otherGoalText, setOtherGoalText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // TODO: Pre-fill form if data exists?
      } else {
        console.error('Onboarding: No user session found, redirecting.');
        router.replace('/auth/login');
      }
    };
    fetchUser();
  }, [router]);

  const handleSelectGoal = (goalId: string) => {
    setSelectedGoal(goalId);
    setError('');
    if (goalId !== 'other') {
        setOtherGoalText(''); // Clear other text if a predefined goal is selected
    }
  };

  const handleSkip = () => {
    console.log('[Onboarding Mission] Skipping step.');
    router.push('/onboarding/step4-health-check'); // Navigate to the next step directly
  };

  const handleNext = async () => {
    if (!user) {
      setError('User session not found. Please log in again.');
      return;
    }
    if (!selectedGoal) {
      setError('Please select a priority or skip this step.');
      return;
    }
    if (selectedGoal === 'other' && !otherGoalText.trim()) {
        setError('Please specify your goal or select another option.');
        return;
    }

    setError('');
    setIsLoading(true);

    const goalToSave = selectedGoal === 'other' ? otherGoalText.trim() : selectedGoal;

    try {
        console.log('[Onboarding Mission] Saving goal for user:', user.id, { primary_goal: goalToSave });

        // Check if a record exists for this user in user_goals_and_diets
        const { data: existingData, error: fetchError } = await supabase
            .from('user_goals_and_diets')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to not error if no row exists

        if (fetchError) {
            throw fetchError;
        }

        let upsertError;
        if (existingData) {
            // Update existing record
            console.log('[Onboarding Mission] Updating existing goal record.');
            const { error } = await supabase
                .from('user_goals_and_diets')
                .update({ primary_goal: goalToSave, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
            upsertError = error;
        } else {
            // Insert new record
            console.log('[Onboarding Mission] Inserting new goal record.');
            const { error } = await supabase
                .from('user_goals_and_diets')
                .insert({ user_id: user.id, primary_goal: goalToSave, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            upsertError = error;
        }

        if (upsertError) {
            throw upsertError;
        }

        console.log('[Onboarding Mission] Goal saved successfully.');
        router.push('/onboarding/step4-health-check'); // Navigate to the next step

    } catch (err: any) {
        console.error('[Onboarding Mission] Save failed:', err);
        setError(err.message || 'Failed to save your priority.');
    } finally {
        setIsLoading(false);
    }
  };

  // Placeholder simple styles - Adapt using existing UI components/Tailwind
  const cardBaseStyle = "block w-full p-5 border rounded-lg text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]";
  const cardInactiveStyle = "bg-off-white/20 border-off-white/30 hover:bg-off-white/30 text-off-white";
  const cardActiveStyle = "bg-green-200 border-green-400 ring-2 ring-green-500 text-green-900";
  const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const inputStyle = "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 bg-white placeholder-gray-500 mt-2";

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>Onboarding: Your Mission - NutriFlow</title>
      </Head>

      {/* TODO: Add Progress Indicator (e.g., Dots: Step 2 of 6) */}

      <main className="w-full max-w-[500px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 mt-10">
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-8">
          What's your priority right now?
        </h1>

        <div className="space-y-3 mb-6">
          {GOAL_OPTIONS.map((goal) => (
            <div key={goal.id}>
                <button
                    type="button"
                    onClick={() => handleSelectGoal(goal.id)}
                    className={`${cardBaseStyle} ${selectedGoal === goal.id ? cardActiveStyle : cardInactiveStyle}`}
                >
                    <div className="flex items-center">
                        {/* TODO: Add goal.icon rendering here */}
                        <span className={`text-base font-medium ${selectedGoal === goal.id ? '' : 'ml-0' /* Adjust margin if icon present */}`}>{goal.title}</span>
                    </div>
                </button>
                {/* Show text input if 'Other' is selected */} 
                {goal.id === 'other' && selectedGoal === 'other' && (
                    <input 
                        type="text"
                        value={otherGoalText}
                        onChange={(e) => setOtherGoalText(e.target.value)}
                        placeholder="What's on your mind?"
                        className={inputStyle}
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
        <div className="space-y-3">
            <button 
              type="button" 
              onClick={handleNext}
              disabled={isLoading || !selectedGoal}
              className={buttonStyle}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
            {/* Skip Link */} 
            <button 
                type="button" 
                onClick={handleSkip}
                className="text-sm text-green-200 hover:text-green-100 text-center w-full"
            >
                Not sure? Skip for now
            </button>
        </div>
      </main>
    </div>
  );
} 