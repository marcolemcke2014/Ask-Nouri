'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import PillButton from '../../components/onboarding/PillButton';

// --- Styles (Matching auth pages) ---
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const inputStyle = "h-10 px-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-900 bg-white placeholder-gray-400";
const errorBoxStyle = "mb-3 p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm text-center";
// ---

const EATING_STYLES = [
    'Balanced', 'High Protein', 'Low Carb', 'Keto', 'Vegan', 'Vegetarian',
    'Pescatarian', 'Paleo', 'Halal', 'Kosher', 'Raw Food', 'Carnivore',
    'Other', 'No strict rules'
];

// Helper function to parse 'Other: ...' text (same as in health-check)
const parseOtherText = (item: string): string => {
    if (item.startsWith('Other: ')) {
        return item.substring(7);
    }
    return '';
};

export default function OnboardingEatingStyle() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [otherStyleText, setOtherStyleText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: goalData, error: goalError } = await supabase
              .from('user_goals_and_diets')
              .select('eating_styles')
              .eq('user_id', session.user.id)
              .maybeSingle();

          if (goalError) {
              console.error('[Onboarding Eating Style] Error fetching eating styles:', goalError);
          } else if (goalData?.eating_styles && Array.isArray(goalData.eating_styles)) {
              const styles = goalData.eating_styles;
              setSelectedStyles(styles.filter(s => !s.startsWith('Other: ')));
              const otherStyle = styles.find(s => s.startsWith('Other: '));
              if (otherStyle) {
                  setSelectedStyles(prev => [...prev, 'Other']);
                  setOtherStyleText(parseOtherText(otherStyle));
              }
          }
        } else {
          console.error('[Onboarding Eating Style] No user session found, redirecting.');
          router.replace('/auth/login');
        }
      } catch (fetchError) {
          console.error('[Onboarding Eating Style] Error in initial data fetch:', fetchError);
          setError('Could not load step. Please refresh.');
      } finally {
          setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, [router]);

  const handleStyleToggle = (style: string) => {
    setError('');
    setSelectedStyles(prev => {
      let newState = [...prev];
      if (style === 'No strict rules') {
        return prev.includes(style) ? [] : ['No strict rules'];
      } else {
        newState = newState.filter(item => item !== 'No strict rules');
        if (newState.includes(style)) {
          newState = newState.filter(item => item !== style);
          if (style === 'Other') setOtherStyleText('');
        } else {
          newState.push(style);
        }
        return newState;
      }
    });
  };

  const handleNext = async () => {
    if (!user) { console.error('[Onboarding Eating Style] handleNext called without user.'); setError('User session not found.'); return; }
    if (selectedStyles.includes('Other') && !otherStyleText.trim()) { setError('Please specify other eating style.'); return; }
    setError('');
    setIsLoading(true);
    const stylesToSave = selectedStyles.map(s => s === 'Other' ? `Other: ${otherStyleText.trim()}` : s);
    const updateData = {
      eating_styles: stylesToSave.length > 0 ? stylesToSave : null,
      updated_at: new Date().toISOString(),
    };
    try {
      console.log('[Onboarding Eating Style] Updating goals for user:', user.id);
      const { data: existingData, error: fetchError } = await supabase.from('user_goals_and_diets').select('user_id').eq('user_id', user.id).maybeSingle();
      if (fetchError) {
          console.error('[Onboarding Eating Style] Error checking existing goals record:', fetchError);
          throw fetchError;
      }
      let upsertError;
      if (existingData) {
          console.log('[Onboarding Eating Style] Updating existing goals record.');
          const { error } = await supabase.from('user_goals_and_diets').update(updateData).eq('user_id', user.id);
          upsertError = error;
      } else {
          console.log('[Onboarding Eating Style] Inserting new goals record.');
          const { data: goalData } = await supabase.from('user_goals_and_diets').select('primary_goal').eq('user_id', user.id).maybeSingle(); // Fetch existing goal if inserting
          const { error } = await supabase.from('user_goals_and_diets').insert({ 
              user_id: user.id, 
              primary_goal: goalData?.primary_goal, 
              ...updateData, 
              created_at: new Date().toISOString() 
          });
          upsertError = error;
      }
      if (upsertError) { 
          console.error('[Onboarding Eating Style] Supabase upsert error:', upsertError);
          throw upsertError; 
      }
      console.log('[Onboarding Eating Style] Goals/Diets updated successfully.');
      router.push('/onboarding/step6-personalize');
    } catch (err: any) {
      console.error('[Onboarding Eating Style] Update failed:', err);
      setError(err.message || 'Failed to save eating style.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout title="Eating Style" currentStep={4} totalSteps={6}>
        <h1 className="text-xl sm:text-2xl font-light text-center mb-4 text-off-white">
          Do you follow a specific eating style?
        </h1>
        <p className="text-sm text-center text-green-200 mb-6">
           (Optional — you can always update later.)
        </p>
        
        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        {/* Use PillButton */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {EATING_STYLES.map((style) => (
             <div key={style} className="flex items-center space-x-2">
                <PillButton
                    text={style}
                    isSelected={selectedStyles.includes(style)}
                    onClick={() => handleStyleToggle(style)}
                />
                {style === 'Other' && selectedStyles.includes('Other') && (
                    <input 
                        type="text"
                        value={otherStyleText}
                        onChange={(e) => setOtherStyleText(e.target.value)}
                        placeholder="Please specify..."
                        className={`${inputStyle} w-48`}
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