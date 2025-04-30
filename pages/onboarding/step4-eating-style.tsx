'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import PillButton from '../../components/onboarding/PillButton';
import { CheckCircle } from 'lucide-react';

// --- Styles ---
const labelStyle = "block text-xs font-normal text-off-white/90 mb-1.5";
const textareaStyle = "w-full p-3.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]"; 
const textareaPlaceholderStyle = "placeholder-gray-400/80";
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const inputStyle = "w-full h-10 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]";
const inputPlaceholderStyle = "placeholder-gray-400/80";
const errorBoxStyle = "mb-3 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center";
const successBoxStyle = "mb-4 p-3 bg-green-800/30 border border-green-500/30 text-green-200 rounded-lg text-sm text-center flex items-center justify-center space-x-2";
// ---

// Updated EATING_STYLES order
const EATING_STYLES = [
    'Balanced', 'High Protein', 'Low Carb', 'Keto', 'Vegan', 'Vegetarian',
    'Pescatarian', 'Paleo', 'Halal', 'Kosher', 'Raw Food', 'Carnivore',
    'No strict rules', 'Other' // Moved Other to end
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
  const [firstName, setFirstName] = useState<string>('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [otherStyleText, setOtherStyleText] = useState<string>('');
  const [foodDislikes, setFoodDislikes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // Fetch user session and pre-fill
  useEffect(() => {
    const fetchUserAndData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch existing styles, dislikes, AND first name
          const [goalsResult, profileResult] = await Promise.all([
              supabase.from('user_goals_and_diets').select('eating_styles').eq('user_id', session.user.id).maybeSingle(),
              supabase.from('user_profile').select('food_dislikes, first_name').eq('id', session.user.id).maybeSingle()
          ]);

          if (goalsResult.error) {
              console.error('[Onboarding Eating Style] Error fetching eating styles:', goalsResult.error);
          } else if (goalsResult.data?.eating_styles && Array.isArray(goalsResult.data.eating_styles)) {
              const styles = goalsResult.data.eating_styles;
              setSelectedStyles(styles.filter(s => !s.startsWith('Other: ')));
              const otherStyle = styles.find(s => s.startsWith('Other: '));
              if (otherStyle) {
                  setSelectedStyles(prev => [...prev, 'Other']);
                  setOtherStyleText(parseOtherText(otherStyle));
              }
          }
          
          if (profileResult.error) {
              console.error('[Onboarding Eating Style] Error fetching profile data:', profileResult.error);
          } else if (profileResult.data) {
              if (profileResult.data.food_dislikes) setFoodDislikes(profileResult.data.food_dislikes);
              if (profileResult.data.first_name) setFirstName(profileResult.data.first_name);
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
        newState = prev.includes(style) ? [] : ['No strict rules'];
      } else {
        newState = newState.filter(item => item !== 'No strict rules');
        if (newState.includes(style)) {
          newState = newState.filter(item => item !== style);
          if (style === 'Other') setOtherStyleText('');
        } else {
          newState.push(style);
        }
      }
      if (newState.length > 0) { 
          setShowSuccessMessage(true);
      } else {
          setShowSuccessMessage(false);
      }
      return newState;
    });
  };

  const handleBack = () => {
    router.push('/onboarding/step3-health-check');
  };

  const handleFinishSetup = async () => {
    if (!user) {
        console.error('[Onboarding Eating Style] handleFinishSetup called without user.');
        setError('User session not found.');
        return;
    }
    if (selectedStyles.includes('Other') && !otherStyleText.trim()) {
        setError('Please specify other eating style.');
        return;
    }
    if (selectedStyles.length === 0) {
        setError('Please select an eating style or choose \'No strict rules\'.');
        return;
    }
    
    setError('');
    setIsLoading(true);
    
    const stylesToSave = selectedStyles.map(s => s === 'Other' ? `Other: ${otherStyleText.trim()}` : s);
    const goalsUpdateData = {
      eating_styles: stylesToSave.length > 0 ? stylesToSave : null,
      updated_at: new Date().toISOString(),
    };
    const profileUpdateData = {
        food_dislikes: foodDislikes.trim() || null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Eating Style] Final update and navigate for user:', user.id);
      const [goalsUpsertResult, profileUpdateResult] = await Promise.all([
          supabase.from('user_goals_and_diets').upsert({ user_id: user.id, ...goalsUpdateData }, { onConflict: 'user_id' }),
          supabase.from('user_profile').update(profileUpdateData).eq('id', user.id)
      ]);

      if (goalsUpsertResult.error) throw goalsUpsertResult.error; 
      if (profileUpdateResult.error) throw profileUpdateResult.error; 

      console.log('[Onboarding Eating Style] Onboarding complete. Navigating to app...');
      router.push('/scan/index'); 

    } catch (err: any) {
      console.error('[Onboarding Eating Style] Final update failed:', err);
      setError(err.message || 'Failed to save preferences.');
      setShowSuccessMessage(false);
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout 
      title="Eating Style" 
      currentStep={4} 
      totalSteps={4}
      showBackButton={true}
      onBack={handleBack}
    >
        <h2 className="text-lg sm:text-xl font-light text-center mb-6 text-off-white">
          Any diet you're aiming for?
        </h2>
        
        {error && !showSuccessMessage && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}
       
        <div className={`flex flex-wrap gap-2 mb-6 justify-center ${showSuccessMessage ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        className={`${inputStyle} ${inputPlaceholderStyle} w-48`}
                    />
                )}
            </div>
          ))}
        </div>
        
        <hr className={`border-off-white/30 my-6 ${showSuccessMessage ? 'opacity-50' : ''}`} />
        
        <div className={showSuccessMessage ? 'opacity-50 pointer-events-none' : ''}>
            <h2 id="dislikes-label" className="text-lg sm:text-xl font-light text-center mb-4 text-off-white">Any foods or ingredients you strongly dislike?</h2>
            <textarea
              id="dislikes"
              aria-labelledby="dislikes-label"
              rows={3}
              value={foodDislikes}
              onChange={(e) => setFoodDislikes(e.target.value)}
              placeholder="e.g., cilantro, mushrooms, very spicy food..."
              className={`${textareaStyle} ${textareaPlaceholderStyle}`}
            />
        </div>

        {showSuccessMessage && (
             <div className={successBoxStyle}>
                <CheckCircle size={18} className="mr-2 flex-shrink-0"/>
                <span>{firstName ? `${firstName}, everything` : 'Everything'} is set up! Let's start scanning.</span>
            </div>
        )}

        <div className="pt-6">
          <button 
            type="button" 
            onClick={showSuccessMessage ? handleFinishSetup : handleFinishSetup}
            disabled={isLoading}
            className={buttonStyle}
          >
            {isLoading ? 'Saving...' : (showSuccessMessage ? 'Start Scanning Menus' : 'Finish Setup')}
          </button>
        </div>
    </OnboardingLayout>
  );
} 