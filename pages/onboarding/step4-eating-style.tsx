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

  // --- Validation --- 
  const isStyleValid = selectedStyles.length > 0 && 
                       (!selectedStyles.includes('Other') || otherStyleText.trim() !== '');
  // Show success message as soon as valid selections are made
  const shouldShowSuccess = isStyleValid;
  // ---

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
        // Toggle 'No strict rules', clears others if selected
        newState = prev.includes(style) ? [] : ['No strict rules'];
      } else {
        // Handle other styles
        newState = newState.filter(item => item !== 'No strict rules');
        if (newState.includes(style)) {
          newState = newState.filter(item => item !== style);
          if (style === 'Other') setOtherStyleText(''); // Clear other text if deselected
        } else {
          newState.push(style);
        }
      }
      return newState;
    });
  };

  const handleBack = () => {
    router.push('/onboarding/step3-health-check');
  };

  // Combined function that saves data first, then navigates
  const handleSaveAndNavigate = async () => {
    if (!user) {
        setError('User session not found.');
        return;
    }
    
    // Check for "Other" without text
    if (selectedStyles.includes('Other') && !otherStyleText.trim()) {
        setError('Please specify other eating style.');
        return;
    }
    
    setError('');
    setIsLoading(true);
    
    const stylesToSave = selectedStyles.map(s => s === 'Other' ? `Other: ${otherStyleText.trim()}` : s);
    
    try {
      console.log('[Onboarding Eating Style] Saving and navigating for user:', user.id);
      
      // First fetch any existing avoid_ingredients data so we can append to it
      const { data: existingHealthData } = await supabase
        .from('user_health_data')
        .select('avoid_ingredients')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Prepare the food dislikes
      let avoidIngredientsValue = null;
      
      if (foodDislikes.trim()) {
        const dislikesArray = foodDislikes.trim().split(',').map(item => item.trim());
        
        // If we already have avoid_ingredients data, we need to combine them
        if (existingHealthData?.avoid_ingredients) {
          try {
            // Try to parse as JSON first
            const existingAvoidances = JSON.parse(existingHealthData.avoid_ingredients);
            if (Array.isArray(existingAvoidances)) {
              // Merge arrays and remove duplicates
              const combinedArray = [...existingAvoidances, ...dislikesArray];
              const uniqueArray = Array.from(new Set(combinedArray));
              avoidIngredientsValue = JSON.stringify(uniqueArray);
            } else {
              // If not an array, just use the new dislikes
              avoidIngredientsValue = JSON.stringify(dislikesArray);
            }
          } catch (e) {
            // If not valid JSON, treat as string
            const combinedString = existingHealthData.avoid_ingredients + ', ' + dislikesArray.join(', ');
            avoidIngredientsValue = combinedString;
          }
        } else {
          // No existing data, just set the new dislikes
          avoidIngredientsValue = JSON.stringify(dislikesArray);
        }
      }
      
      // Prepare health data update
      const healthDataUpdate = {
        user_id: user.id,
        eating_styles: stylesToSave.length > 0 ? stylesToSave : null,
        avoid_ingredients: avoidIngredientsValue,
        updated_at: new Date().toISOString(),
      };
      
      // Update user_profile to mark onboarding as complete
      const profileUpdate = {
        id: user.id,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      };

      // Execute both updates in parallel
      const [healthUpsertResult, profileUpsertResult] = await Promise.all([
        supabase.from('user_health_data').upsert(healthDataUpdate, { onConflict: 'user_id' }),
        supabase.from('user_profile').upsert(profileUpdate, { onConflict: 'id' })
      ]);

      if (healthUpsertResult.error) {
        console.error('[Onboarding Eating Style] Supabase health data upsert error:', healthUpsertResult.error);
        throw healthUpsertResult.error; 
      }
      
      if (profileUpsertResult.error) {
        console.error('[Onboarding Eating Style] Supabase profile upsert error:', profileUpsertResult.error);
        throw profileUpsertResult.error; 
      }

      console.log('[Onboarding Eating Style] Data saved successfully, navigating...');
      
      // Use window.location for a full page navigation to ensure clean routing
      window.location.href = '/home';
      // As a fallback in case there's an issue with the above
      // router.push('/home');

    } catch (err: any) {
      console.error('[Onboarding Eating Style] Save and navigate failed:', err);
      setError(err.message || 'Failed to save preferences.');
    } finally {
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
        
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}
       
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
                        className={`${inputStyle} ${inputPlaceholderStyle} w-48`}
                    />
                )}
            </div>
          ))}
        </div>
        
        <hr className="border-off-white/30 my-6" />
        
        <div>
            <h2 id="dislikes-label" className="text-lg sm:text-xl font-light text-center mb-4 text-off-white">Foods or ingredients you strongly dislike?</h2>
            <textarea
              id="dislikes"
              aria-labelledby="dislikes-label"
              rows={1}
              value={foodDislikes}
              onChange={(e) => setFoodDislikes(e.target.value)}
              placeholder="e.g., cilantro, mushrooms, very spicy food..."
              className={`${textareaStyle} ${textareaPlaceholderStyle}`}
            />
        </div>

        {/* Container for success message AND button, managing space between them */}
        <div className="pt-6">
            {/* Success Message appears based on validity not previous save */}
            {shouldShowSuccess && (
                 <div className={successBoxStyle}>
                    <CheckCircle size={18} className="mr-2 flex-shrink-0"/>
                    <span>{firstName ? `${firstName}, everything` : 'Everything'} is set up! Let's start scanning.</span>
                </div>
            )}
            
            {/* Button always calls combined save and navigate function */}
            <button 
              type="button" 
              onClick={handleSaveAndNavigate}
              disabled={isLoading || !isStyleValid}
              className={buttonStyle}
            >
              {isLoading ? 'Saving...' : (shouldShowSuccess ? 'Start Scanning Menus' : 'Finish Setup')}
            </button>
        </div>
    </OnboardingLayout>
  );
} 