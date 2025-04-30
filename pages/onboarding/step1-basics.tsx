'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import PillButton from '../../components/onboarding/PillButton';

// --- Updated Styles ---
const labelStyle = "block text-sm font-normal text-off-white/90 mb-2";
const inputStyle = "w-full h-12 px-4 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-base font-['Poppins',sans-serif]";
const inputPlaceholderStyle = "placeholder-gray-400/80";
const selectStyle = `${inputStyle} appearance-none`;
const buttonStyle = "w-full min-h-[48px] h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-base disabled:opacity-50 disabled:cursor-not-allowed";
const unitToggleContainerStyle = "flex space-x-1 bg-white/10 p-1 rounded-full ml-2";
const unitToggleStyle = "min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-1 text-base rounded-full cursor-pointer transition-colors";
const activeUnitStyle = "bg-green-200 text-green-800 font-medium border border-green-400 shadow-sm";
const inactiveUnitStyle = "bg-gray-500 text-gray-100 hover:bg-gray-600";
const errorBoxStyle = "mt-4 p-3 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-sm text-center";
const helperTextStyle = "text-sm text-off-white/70 mb-2 text-center";
// ---

// Updated and grouped DAILY_HABITS
const HABITS_ROW_1 = ['Mostly Sitting', 'Moderately Active', 'Very Sporty'];
const HABITS_ROW_2 = ['Often Rushed', 'Flexible Schedule'];
const HABITS_ROW_3 = ['Irregular Eating', 'Often Stressed', 'Low Energy'];
const HABITS_ROW_4 = ['Eat Out Often', 'Night Owl / Shift Worker', 'None'];
// Consolidated list for rendering
const ALL_HABITS = [
    'Mostly Sitting', 'Moderately Active', 'Very Sporty', 
    'Often Rushed', 'Flexible Schedule', 
    'Irregular Eating', 'Often Stressed', 'Low Energy', 
    'Eat Out Often', 'Night Owl / Shift Worker', 
    'None'
];

// Helper to format date parts
const formatTwoDigits = (num: number | '') => num === '' ? '' : String(num).padStart(2, '0');

export default function OnboardingBasics() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dob, setDob] = useState<string>('');
  const [height, setHeight] = useState<number | ''>('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm');
  const [weight, setWeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [gender, setGender] = useState<string>('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Pre-fill logic (needs update for single DOB input)
  useEffect(() => {
    const fetchUserAndData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { router.replace('/auth/login'); return; }
        setUser(session.user);

        const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .select('date_of_birth, height_cm, weight_kg, gender, daily_habits')
            .eq('id', session.user.id)
            .maybeSingle();

        if (profileError) { console.error('[OB Basics] Error fetching profile:', profileError); }
        else if (profile) {
            if (profile.date_of_birth) setDob(profile.date_of_birth);
            if (profile.height_cm) { setHeight(profile.height_cm); setHeightUnit('cm'); }
            if (profile.weight_kg) { setWeight(profile.weight_kg); setWeightUnit('kg'); }
            if (profile.gender) setGender(profile.gender);
            if (profile.daily_habits) setSelectedHabits(profile.daily_habits);
        }
      } catch (fetchError) {
        console.error('[OB Basics] Fetch error:', fetchError);
        setError('Could not load step. Please refresh.');
      } finally { setIsLoading(false); }
    };
    fetchUserAndData();
  }, [router]);

  // --- Input Handlers ---
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDob(e.target.value);
    setError('');
  };
  
  // Height/Weight direct input handlers
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHeight(val === '' ? '' : Number(val));
    setError('');
  };
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWeight(val === '' ? '' : Number(val));
    setError('');
  };
  
  // Unit change handlers (keep conversion logic)
  const handleHeightUnitChange = (unit: 'cm' | 'inches') => {
    if (height !== '' && heightUnit !== unit) {
      const currentHeight = Number(height);
      setHeight(unit === 'cm' ? Math.round(currentHeight * 2.54) : Math.round(currentHeight / 2.54));
    }
    setHeightUnit(unit);
  };
  const handleWeightUnitChange = (unit: 'kg' | 'lbs') => {
     if (weight !== '' && weightUnit !== unit) {
      const currentWeight = Number(weight);
      setWeight(unit === 'kg' ? Math.round(currentWeight * 0.453592 * 10)/10 : Math.round(currentWeight / 0.453592 * 10)/10);
    }
    setWeightUnit(unit);
  };
  
  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setGender(e.target.value);
      setError('');
  };
  const handleHabitToggle = (habit: string) => {
    setError('');
    setSelectedHabits(prev => {
      let newState = [...prev];
      if (habit === 'None') {
          return prev.length === 1 && prev[0] === 'None' ? [] : ['None'];
      } else {
          newState = newState.filter(h => h !== 'None'); 
          if (newState.includes(habit)) {
              newState = newState.filter(h => h !== habit); 
          } else {
              newState.push(habit);
          }
          return newState;
      }
    });
  };
  // ---

  // --- Validation ---
  const isFormValid = dob && height && weight && gender && selectedHabits.length > 0;
  // ---

  const handleNext = async () => {
    if (!isFormValid) {
      setError('Please complete all fields to continue.');
      return;
    }
    if (!user) {
      console.error('[Onboarding Basics] handleNext called without user.');
      setError('User session not found. Please log in again.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const heightInCm = heightUnit === 'inches' && height ? Math.round(Number(height) * 2.54) : height;
    const weightInKg = weightUnit === 'lbs' && weight ? Math.round(Number(weight) * 0.453592 * 10) / 10 : weight;

    const updateData = {
      date_of_birth: dob,
      height_cm: heightInCm,
      weight_kg: weightInKg,
      gender: gender,
      daily_habits: selectedHabits.length > 0 ? selectedHabits : null,
      updated_at: new Date().toISOString(),
    };
    try {
      console.log('[Onboarding Basics] Updating profile for user:', user.id);
      const { error: updateError } = await supabase.from('user_profile').update(updateData).eq('id', user.id);
      if (updateError) {
        console.error('[Onboarding Basics] Supabase update error:', updateError);
        throw updateError;
      }
      console.log('[Onboarding Basics] Profile updated successfully.');
      router.push('/onboarding/step2-mission');
    } catch (err: any) {
      console.error('[Onboarding Basics] Update failed:', err);
      setError(err.message || 'Failed to save basic information.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) { 
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout title="Quick Basics" currentStep={1} totalSteps={4}>
        <h2 className="text-lg sm:text-xl font-light text-center mb-6 text-off-white">
          Tell us a little about you:
        </h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
          {/* Date of Birth - Single Native Input */}
          <div>
            <label htmlFor="dob" className={labelStyle}>Date of Birth</label>
            <input
              type="date"
              id="dob"
              value={dob}
              onChange={handleDobChange}
              className={`${inputStyle} ${inputPlaceholderStyle}`}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Height - Direct Input + Styled Toggles */}
          <div>
             <label htmlFor="height" className={labelStyle}>Height</label>
             <div className="flex items-center space-x-2">
                <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={handleHeightChange}
                    className={`${inputStyle} ${inputPlaceholderStyle} flex-grow`}
                    placeholder={heightUnit === 'cm' ? 'e.g., 175' : 'e.g., 69'}
                    step={heightUnit === 'cm' ? 1 : 0.1}
                    min="1"
                    required
                />
                <div className={`${unitToggleContainerStyle} flex-shrink-0`}>
                   <button type="button" onClick={() => handleHeightUnitChange('cm')} className={`${unitToggleStyle} ${heightUnit === 'cm' ? activeUnitStyle : inactiveUnitStyle}`}>cm</button>
                   <button type="button" onClick={() => handleHeightUnitChange('inches')} className={`${unitToggleStyle} ${heightUnit === 'inches' ? activeUnitStyle : inactiveUnitStyle}`}>in</button>
                </div>
             </div>
          </div>

          {/* Weight - Direct Input + Styled Toggles */}
           <div>
             <label htmlFor="weight" className={labelStyle}>Weight</label>
             <div className="flex items-center space-x-2">
                 <input
                    type="number"
                    id="weight"
                    value={weight}
                    onChange={handleWeightChange}
                    className={`${inputStyle} ${inputPlaceholderStyle} flex-grow`}
                    placeholder={weightUnit === 'kg' ? 'e.g., 70' : 'e.g., 154'}
                    step={0.1}
                    min="1"
                    required
                 />
                 <div className={`${unitToggleContainerStyle} flex-shrink-0`}>
                   <button type="button" onClick={() => handleWeightUnitChange('kg')} className={`${unitToggleStyle} ${weightUnit === 'kg' ? activeUnitStyle : inactiveUnitStyle}`}>kg</button>
                   <button type="button" onClick={() => handleWeightUnitChange('lbs')} className={`${unitToggleStyle} ${weightUnit === 'lbs' ? activeUnitStyle : inactiveUnitStyle}`}>lbs</button>
                </div>
            </div>
          </div>

          {/* Gender */}
          <div className="relative">
            <label htmlFor="gender" className={labelStyle}>Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={handleGenderChange}
              className={selectStyle}
              required
            >
              <option value="" disabled>Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 z-10">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* Add Divider */}
          <hr className="border-off-white/30 my-6" />

          {/* Daily Habits Section */}
          <div>
             <label className="block text-lg sm:text-xl font-light text-center mb-6 text-off-white">Best describe your daily routine:</label> 
             <div className="space-y-2">
                 {ALL_HABITS.map((habit) => (
                     <PillButton 
                         key={habit} 
                         text={habit} 
                         isSelected={selectedHabits.includes(habit)} 
                         onClick={() => handleHabitToggle(habit)}
                     />
                 ))}
             </div>
          </div>
          
          {/* Error Message Box */}
          {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={buttonStyle}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
    </OnboardingLayout>
  );
} 