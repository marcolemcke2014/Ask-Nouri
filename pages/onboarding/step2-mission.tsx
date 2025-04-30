'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Import layout
// Assuming SelectionCard can be adapted or use similar styling
import SelectionCard from '../../components/SelectionCard'; 
import { Dumbbell, Zap, Brain, Leaf, Heart, HelpCircle } from 'lucide-react'; // Import icons

// --- Styles ---
// Updated style for the transformed "Other" input to match active SelectionCard
const otherInputStyle = "w-full h-auto p-4 rounded-lg border border-[#84F7AC] bg-green-100 backdrop-blur-sm text-green-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#84F7AC] transition-all font-['Poppins',sans-serif]"; 
const otherInputPlaceholderStyle = "placeholder-green-700/60"; // Adjusted placeholder color
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const skipButtonStyle = "text-sm text-green-200 hover:text-green-100 text-center w-full";
const errorBoxStyle = "mb-3 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center";
// Style for the "Other" input - attempt to match SelectionCard active state or general inputStyle
const inputStyle = "w-full h-12 px-4 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-base font-['Poppins',sans-serif]"; // Added base input style
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
  const otherInputRef = useRef<HTMLInputElement>(null); // Ref for focus

  // Fetch user session and pre-fill
  useEffect(() => {
    const fetchUserAndGoal = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch existing goal
          const { data: healthData, error: healthError } = await supabase
              .from('user_health_data')
              .select('primary_goal')
              .eq('user_id', session.user.id)
              .maybeSingle();
              
          if (healthError) {
              console.error('[Onboarding Mission] Error fetching primary goal:', healthError);
          } else if (healthData?.primary_goal && Array.isArray(healthData.primary_goal) && healthData.primary_goal.length > 0) {
              const existingGoal = healthData.primary_goal[0]; // Get first item from array
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

  // Focus the 'Other' input when it appears
  useEffect(() => {
    if (selectedGoal === 'other' && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [selectedGoal]);

  const handleSelectGoal = (goalId: string) => {
    setSelectedGoal(goalId);
    setError('');
    if (goalId !== 'other') {
        setOtherGoalText('');
    }
  };

  const handleBack = () => {
      router.push('/onboarding/step1-basics');
  };

  const handleSkip = () => {
    console.log('[Onboarding Mission] Skipping step.');
    router.push('/onboarding/step3-health-check');
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
        console.log('[Onboarding Mission] Saving goal for user:', user.id, { primary_goal: [goalToSave] });

        // Use upsert to ensure the record exists
        const { error: upsertError } = await supabase
            .from('user_health_data')
            .upsert({ 
                user_id: user.id, 
                primary_goal: [goalToSave], // Save as array with a single item
                updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });

        if (upsertError) {
            console.error('[Onboarding Mission] Supabase upsert error:', upsertError);
            throw upsertError;
        }

        console.log('[Onboarding Mission] Goal saved successfully.');
        router.push('/onboarding/step3-health-check');

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
    <OnboardingLayout 
      title="Your Mission" 
      currentStep={2}
      totalSteps={4}
      showBackButton={true}
      onBack={handleBack}
    >
        <h2 className="text-lg sm:text-xl font-light text-center mb-6 text-off-white">
          What's your priority right now?
        </h2>

        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        <div className="space-y-3 mb-6">
          {GOAL_OPTIONS.map((goal) => {
             const Icon = goal.icon; // Get the component type
             // Conditional Rendering for "Other"
             if (goal.id === 'other' && selectedGoal === 'other') {
               return (
                 <div key="other-input">
                   <input 
                      ref={otherInputRef} 
                      type="text"
                      value={otherGoalText}
                      onChange={(e) => setOtherGoalText(e.target.value)}
                      placeholder="What's on your mind?"
                      className={`${otherInputStyle} ${otherInputPlaceholderStyle}`}
                   />
                 </div>
               );
             } else {
               // Render SelectionCard for all other goals OR if 'Other' is not selected
               return (
                  <div key={goal.id}>
                      <SelectionCard
                          id={goal.id} 
                          title={goal.title}
                          icon={Icon ? <Icon className={`w-5 h-5 mr-3 ${selectedGoal === goal.id ? 'text-green-700' : 'text-green-200'}`} /> : null}
                          selected={selectedGoal === goal.id}
                          onSelect={handleSelectGoal}
                      />
                  </div>
               );
             }
          })}
        </div>

        {/* CTA Button */}
        <div className="space-y-3">
            <button 
              type="button" 
              onClick={handleNext}
              disabled={isLoading || !selectedGoal || (selectedGoal === 'other' && !otherGoalText.trim())}
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