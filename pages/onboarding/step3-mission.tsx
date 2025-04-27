'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Import layout
// Assuming SelectionCard can be adapted or use similar styling
import SelectionCard from '../../components/SelectionCard'; 
import { Dumbbell, Zap, Brain, Leaf, Heart, HelpCircle } from 'lucide-react'; // Import icons

// --- Styles (Matching Input.tsx component) ---
const inputStyle = "w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]"; // For 'Other' input
const inputPlaceholderStyle = "placeholder-gray-400/80";
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const skipButtonStyle = "text-sm text-green-200 hover:text-green-100 text-center w-full";
const errorBoxStyle = "mb-3 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center"; // Adjusted error style
// ---

interface GoalOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>; // Use imported icons
}

// Map IDs to actual icons
const GOAL_OPTIONS: GoalOption[] = [
  { id: 'build_muscle', title: 'Build Muscle', icon: Dumbbell }, 
  { id: 'lose_weight', title: 'Lose Weight', icon: Zap },
  { id: 'boost_energy', title: 'Boost Energy', icon: Brain },
  { id: 'improve_gut_health', title: 'Improve Gut Health', icon: Leaf },
  { id: 'manage_health_conditions', title: 'Manage Health Conditions', icon: Heart },
  { id: 'other', title: 'Other', icon: HelpCircle },
];

export default function OnboardingMission() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [otherGoalText, setOtherGoalText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string>('');

  // Fetch user session and pre-fill
  useEffect(() => {
    const fetchUserAndGoal = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch existing goal
          const { data: goalData, error: goalError } = await supabase
              .from('user_goals_and_diets')
              .select('primary_goal')
              .eq('user_id', session.user.id)
              .maybeSingle();
              
          if (goalError) {
              console.error('[Onboarding Mission] Error fetching primary goal:', goalError);
          } else if (goalData?.primary_goal) {
              const existingGoal = goalData.primary_goal;
              // Check if it's one of the predefined IDs or custom text
              const isPredefined = GOAL_OPTIONS.some(opt => opt.id === existingGoal);
              if (isPredefined) {
                  setSelectedGoal(existingGoal);
              } else {
                  setSelectedGoal('other');
                  setOtherGoalText(existingGoal); // Pre-fill the text field
              }
          }
        } else {
          console.error('[Onboarding Mission] No user session found, redirecting.');
          router.replace('/auth/login');
        }
      } catch (fetchError) {
        console.error('[Onboarding Mission] Error in initial data fetch:', fetchError);
        setError('Could not load step. Please refresh.');
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    fetchUserAndGoal();
  }, [router]);

  const handleSelectGoal = (goalId: string) => {
    setSelectedGoal(goalId);
    setError('');
    if (goalId !== 'other') {
        setOtherGoalText('');
    }
  };

  const handleSkip = () => {
    console.log('[Onboarding Mission] Skipping step.');
    router.push('/onboarding/step4-health-check');
  };

  const handleNext = async () => {
    if (!user) {
      console.error('[Onboarding Mission] handleNext called without user.');
      setError('User session not found.');
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
            console.error('[Onboarding Mission] Supabase upsert error:', upsertError);
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

  if (isLoading && !user) {
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout title="Your Mission" currentStep={2} totalSteps={6}>
        <h1 className="text-xl sm:text-2xl font-light text-center mb-6 text-off-white">
          What's your priority right now?
        </h1>

        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        <div className="space-y-3 mb-6">
          {GOAL_OPTIONS.map((goal) => {
             const Icon = goal.icon; // Get the component type
             return (
                <div key={goal.id}>
                    {/* Using SelectionCard - assumes it takes similar props */}
                    <SelectionCard
                        id={goal.id} 
                        title={goal.title}
                        icon={Icon ? <Icon className={`w-5 h-5 mr-3 ${selectedGoal === goal.id ? 'text-green-700' : 'text-green-200'}`} /> : null}
                        selected={selectedGoal === goal.id}
                        onSelect={handleSelectGoal}
                        // Add description prop if SelectionCard supports it
                    />
                    {/* Show text input if 'Other' is selected */} 
                    {goal.id === 'other' && selectedGoal === 'other' && (
                        <input 
                            type="text"
                            value={otherGoalText}
                            onChange={(e) => setOtherGoalText(e.target.value)}
                            placeholder="What's on your mind?"
                            className={`${inputStyle} ${inputPlaceholderStyle} mt-2`}
                        />
                    )}
                </div>
             );
          })}
        </div>

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
                className={skipButtonStyle}
            >
                Not sure? Skip for now
            </button>
        </div>
    </OnboardingLayout>
  );
} 