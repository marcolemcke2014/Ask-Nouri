'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { Minus, Plus } from 'lucide-react';
import PillButton from '../../components/onboarding/PillButton';

// --- Styles (Adapted for new components) ---
const labelStyle = "block text-xs font-normal text-off-white/90 mb-1.5";
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const errorBoxStyle = "mt-1 p-2.5 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-xs text-center";
const inputStyle = "w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-sm font-['Poppins',sans-serif]";
const inputPlaceholderStyle = "placeholder-gray-400/80";
const smallInputStyle = `${inputStyle} w-16 text-center px-1`; // For DOB fields
const numberDisplayContainerStyle = "flex items-center justify-between w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm";
const numberDisplayText = "text-sm text-gray-900 font-['Poppins',sans-serif] cursor-pointer";
const plusMinusButton = "p-1 rounded-full text-gray-600 hover:bg-black/10 active:bg-black/20 transition-colors";
const unitToggleContainerStyle = "flex space-x-1 bg-white/10 p-0.5 rounded-full ml-2";
const unitToggleStyle = "px-2.5 py-0.5 text-xs rounded-full cursor-pointer transition-colors";
const activeUnitStyle = "bg-green-200 text-green-800 font-medium";
const inactiveUnitStyle = "bg-gray-500 text-gray-100 hover:bg-gray-600";
const selectStyle = `${inputStyle} appearance-none`;
// ---

// Updated and grouped DAILY_HABITS
const HABITS_ROW_1 = ['Mostly Sitting', 'Moderately Active', 'Very Sporty'];
const HABITS_ROW_2 = ['Often Rushed', 'Flexible Schedule'];
const HABITS_ROW_3 = ['Irregular Eating', 'Often Stressed', 'Low Energy'];
const HABITS_ROW_4 = ['Eat Out Often', 'Night Owl / Shift Worker', 'None'];
const ALL_HABITS = [...HABITS_ROW_1, ...HABITS_ROW_2, ...HABITS_ROW_3, ...HABITS_ROW_4];

// Helper to format date parts
const formatTwoDigits = (num: number | '') => num === '' ? '' : String(num).padStart(2, '0');

export default function OnboardingBasics() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // DOB state
  const [dobDay, setDobDay] = useState<number | ''>('');
  const [dobMonth, setDobMonth] = useState<number | ''>('');
  const [dobYear, setDobYear] = useState<number | ''>('');
  // Height/Weight state
  const [height, setHeight] = useState<number | ''>('');
  const [isEditingHeight, setIsEditingHeight] = useState(false);
  const heightInputRef = useRef<HTMLInputElement>(null);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm');
  const [weight, setWeight] = useState<number | ''>('');
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  // Gender state
  const [gender, setGender] = useState<string>('');
  // General state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  // Focus input when editing starts for Height/Weight
  useEffect(() => {
    if (isEditingHeight && heightInputRef.current) {
      heightInputRef.current.focus();
      heightInputRef.current.select(); // Select text for easy replacement
    }
  }, [isEditingHeight]);
  useEffect(() => {
    if (isEditingWeight && weightInputRef.current) {
      weightInputRef.current.focus();
      weightInputRef.current.select();
    }
  }, [isEditingWeight]);

  // --- Fetch User and Pre-fill ---
  useEffect(() => {
    const fetchUserAndData = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.error('[Onboarding Basics] No user session, redirecting.');
                router.replace('/auth/login');
                return;
            }
            setUser(session.user);

            const { data: profile, error: profileError } = await supabase
                .from('user_profile')
                .select('date_of_birth, height_cm, weight_kg, gender, daily_habits')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) {
                console.error('[Onboarding Basics] Error fetching profile:', profileError);
            } else if (profile) {
                if (profile.date_of_birth) {
                    const [year, month, day] = profile.date_of_birth.split('-');
                    setDobYear(Number(year));
                    setDobMonth(Number(month));
                    setDobDay(Number(day));
                }
                if (profile.height_cm) { setHeight(profile.height_cm); setHeightUnit('cm'); }
                if (profile.weight_kg) { setWeight(profile.weight_kg); setWeightUnit('kg'); }
                if (profile.gender) setGender(profile.gender);
                if (profile.daily_habits && Array.isArray(profile.daily_habits)) {
                    setSelectedHabits(profile.daily_habits);
                }
            }
        } catch (fetchError) {
            console.error('[Onboarding Basics] Fetch error:', fetchError);
            setError('Could not load step. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    };
    fetchUserAndData();
  }, [router]);

  // --- Input Handlers ---
  const handleDobPartChange = (part: 'day' | 'month' | 'year', value: string) => {
    setError('');
    const num = value === '' ? '' : parseInt(value, 10);
    if (num === '' || (!isNaN(num) && num >= 0)) { // Allow empty or non-negative numbers
      if (part === 'day') setDobDay(num);
      else if (part === 'month') setDobMonth(num);
      else if (part === 'year') setDobYear(num);
    }
  };

  const handleHeightChange = (increment: number) => {
    setError('');
    setHeight(prev => {
        const current = Number(prev) || (heightUnit === 'cm' ? 150 : 60); // Default if empty
        const newValue = current + increment;
        return Math.max(1, newValue); // Ensure height is at least 1
    });
  };
  const handleManualHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setHeight(val === '' ? '' : Number(val));
  };
  const handleHeightBlur = () => {
     if (height === '' || (typeof height === 'number' && height < 1)) {
         // Reset to a default or previous valid value if needed, or show error
         // For now, just exit editing mode
     }
     setIsEditingHeight(false);
  };

  const handleHeightUnitChange = (unit: 'cm' | 'inches') => {
      if (height !== '') {
          if (unit === 'cm' && heightUnit === 'inches') {
              setHeight(Math.round(height * 2.54));
          } else if (unit === 'inches' && heightUnit === 'cm') {
              setHeight(Math.round(height / 2.54));
          }
      }
      setHeightUnit(unit);
  };

  const handleWeightChange = (increment: number) => {
    setError('');
    setWeight(prev => {
        const current = Number(prev) || (weightUnit === 'kg' ? 60 : 130);
        const newValue = current + increment;
        return Math.max(1, newValue);
    });
  };
  const handleManualWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setWeight(val === '' ? '' : Number(val));
  };
   const handleWeightBlur = () => {
     if (weight === '' || (typeof weight === 'number' && weight < 1)) {
        // Reset or show error
     }
     setIsEditingWeight(false);
  };

  const handleWeightUnitChange = (unit: 'kg' | 'lbs') => {
      if (weight !== '') {
          if (unit === 'kg' && weightUnit === 'lbs') {
              setWeight(Math.round(weight * 0.453592 * 10) / 10);
          } else if (unit === 'lbs' && weightUnit === 'kg') {
              setWeight(Math.round(weight / 0.453592 * 10) / 10);
          }
      }
      setWeightUnit(unit);
  };
  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setGender(e.target.value);
      setError('');
  };
  // Updated handler for multi-select habits to include "None"
  const handleHabitToggle = (habit: string) => {
    setError('');
    setSelectedHabits(prev => {
      let newState = [...prev];
      if (habit === 'None') {
          // Selecting 'None' deselects everything else and selects only 'None',
          // or deselects 'None' if it was already the only one selected.
          return prev.length === 1 && prev[0] === 'None' ? [] : ['None'];
      } else {
          // Remove 'None' if selecting something specific
          newState = newState.filter(h => h !== 'None'); 
          // Toggle the selected habit
          if (newState.includes(habit)) {
              newState = newState.filter(h => h !== habit); 
          } else {
              newState.push(habit);
          }
          return newState;
      }
    });
  };
  // --- End Input Handlers ---

  // --- Validation ---
  const validateDob = (): string | null => {
      if (dobDay === '' || dobMonth === '' || dobYear === '') return 'Please enter a complete date of birth.';
      const day = Number(dobDay); const month = Number(dobMonth); const year = Number(dobYear);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return 'Invalid date format.';
      if (month < 1 || month > 12) return 'Invalid month (1-12).';
      if (day < 1 || day > 31) return 'Invalid day (1-31).'; // Basic check, not accounting for month length/leap year
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) return `Year must be between 1900 and ${currentYear}.`;
      // TODO: Add more robust date validation (days in month, leap year)
      return null; // Valid
  };
  // ---

  const handleNext = async () => {
    if (!user) {
      console.error('[Onboarding Basics] handleNext called without user.');
      setError('User session not found. Please log in again.');
      return;
    }

    const dobError = validateDob();
    if (dobError) {
      setError(dobError);
      return;
    }
    if (!height || (typeof height === 'number' && height < 1)) {
      setError('Please enter a valid height.');
      return;
    }
    if (!weight || (typeof weight === 'number' && weight < 1)) {
      setError('Please enter a valid weight.');
      return;
    }
    if (!gender) {
      setError('Please select a gender.');
      return;
    }
    if (selectedHabits.length === 0) {
         setError('Please select at least one daily habit that describes you.');
         return;
     }
    
    setError('');
    setIsLoading(true);

    const formattedDob = `${dobYear}-${formatTwoDigits(dobMonth)}-${formatTwoDigits(dobDay)}`;
    const heightInCm = heightUnit === 'inches' && height ? Math.round(height * 2.54) : height;
    const weightInKg = weightUnit === 'lbs' && weight ? Math.round(weight * 0.453592 * 10) / 10 : weight;

    const updateData = {
      date_of_birth: formattedDob,
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
        <h2 className="text-base sm:text-lg font-light text-center mb-6 text-off-white">
          Tell us a little about you:
        </h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
          {/* Date of Birth - Force no-wrap, allow shrinking */}
          <div>
            <label className={labelStyle}>Date of Birth</label>
            <div className="flex flex-nowrap items-center space-x-1.5">
                <input
                    type="number" inputMode="numeric" pattern="[0-9]*"
                    id="dobDay"
                    value={dobDay}
                    onChange={(e) => handleDobPartChange('day', e.target.value)}
                    placeholder="DD" maxLength={2}
                  className={`${smallInputStyle} ${inputPlaceholderStyle} flex-shrink`}
                    required
                />
                <input
                    type="number" inputMode="numeric" pattern="[0-9]*"
                    id="dobMonth"
                    value={dobMonth}
                    onChange={(e) => handleDobPartChange('month', e.target.value)}
                    placeholder="MM" maxLength={2}
                  className={`${smallInputStyle} ${inputPlaceholderStyle} flex-shrink`}
                    required
                />
                 <input
                    type="number" inputMode="numeric" pattern="[0-9]*"
                    id="dobYear"
                    value={dobYear}
                    onChange={(e) => handleDobPartChange('year', e.target.value)}
                    placeholder="YYYY" maxLength={4}
                    className={`${inputStyle} ${inputPlaceholderStyle} flex-grow`}
                    required
                />
            </div>
          </div>

          {/* Height - Adjust flex properties */}
          <div>
             <label htmlFor="heightDisplay" className={labelStyle}>Height</label>
             <div className={numberDisplayContainerStyle}>
                <button type="button" onClick={() => handleHeightChange(-1)} className={plusMinusButton} aria-label="Decrease height">
                    <Minus size={18}/>
                </button>
                <div className="flex-grow text-center mx-2">
                   {isEditingHeight ? (
                    <input
                        ref={heightInputRef}
                        type="number"
                        value={height}
                        onChange={handleManualHeightChange}
                        onBlur={handleHeightBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleHeightBlur()}
                         className={`${inputStyle.replace('focus:ring-2 focus:ring-green-600', '').replace('focus:bg-white', '')} w-full max-w-[80px] text-center px-1`}
                        step={heightUnit === 'cm' ? 1 : 0.1}
                        min="1"
                    />
                   ) : (
                     <span onClick={() => setIsEditingHeight(true)} className={numberDisplayText}>
                       {height || '--'} {heightUnit}
                    </span>
                    )}
                </div>
                <button type="button" onClick={() => handleHeightChange(1)} className={plusMinusButton} aria-label="Increase height">
                    <Plus size={18}/>
                </button>
                <div className={`${unitToggleContainerStyle} flex-shrink-0`}>
                   <button type="button" onClick={() => handleHeightUnitChange('cm')} className={`${unitToggleStyle} ${heightUnit === 'cm' ? activeUnitStyle : inactiveUnitStyle}`}>cm</button>
                   <button type="button" onClick={() => handleHeightUnitChange('inches')} className={`${unitToggleStyle} ${heightUnit === 'inches' ? activeUnitStyle : inactiveUnitStyle}`}>in</button>
                </div>
             </div>
          </div>

          {/* Weight - Adjust flex properties */}
           <div>
             <label htmlFor="weightDisplay" className={labelStyle}>Weight</label>
             <div className={numberDisplayContainerStyle}>
                <button type="button" onClick={() => handleWeightChange(-0.5)} className={plusMinusButton} aria-label="Decrease weight">
                     <Minus size={18}/>
                 </button>
                <div className="flex-grow text-center mx-2">
                   {isEditingWeight ? (
                         <input
                            ref={weightInputRef}
                            type="number"
                            value={weight}
                            onChange={handleManualWeightChange}
                            onBlur={handleWeightBlur}
                            onKeyDown={(e) => e.key === 'Enter' && handleWeightBlur()}
                            className={`${inputStyle.replace('focus:ring-2 focus:ring-green-600', '').replace('focus:bg-white', '')} w-full max-w-[80px] text-center px-1`}
                            step={0.1}
                            min="1"
                        />
                    ) : (
                         <span onClick={() => setIsEditingWeight(true)} className={numberDisplayText}>
                           {weight || '--'} {weightUnit}
                        </span>
                    )}
                </div>
                <button type="button" onClick={() => handleWeightChange(0.5)} className={plusMinusButton} aria-label="Increase weight">
                     <Plus size={18}/>
                 </button>
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
              className={`${selectStyle} bg-off-white/80`}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {/* Custom dropdown arrow overlay - Ensure z-10 */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 z-10">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* Add Divider */}
          <hr className="border-off-white/30 my-6" />

          {/* Daily Habits Section */}
          <div>
             <label className="block text-base sm:text-lg font-light text-center mb-6 text-off-white">Best describe your daily routine:</label> 
             <div className="space-y-2">
                 {/* Row 1 - Added justify-center, adjusted gap */}
                 <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center">{HABITS_ROW_1.map((habit) => (<PillButton key={habit} text={habit} isSelected={selectedHabits.includes(habit)} onClick={() => handleHabitToggle(habit)}/>))}</div>
                 {/* Row 2 - Added justify-center, adjusted gap */}
                 <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center">{HABITS_ROW_2.map((habit) => (<PillButton key={habit} text={habit} isSelected={selectedHabits.includes(habit)} onClick={() => handleHabitToggle(habit)}/>))}</div>
                 {/* Row 3 - Added justify-center, adjusted gap */}
                 <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center">{HABITS_ROW_3.map((habit) => (<PillButton key={habit} text={habit} isSelected={selectedHabits.includes(habit)} onClick={() => handleHabitToggle(habit)}/>))}</div>
                 {/* Row 4 - Added justify-center, adjusted gap */}
                 <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center">{HABITS_ROW_4.map((habit) => (<PillButton key={habit} text={habit} isSelected={selectedHabits.includes(habit)} onClick={() => handleHabitToggle(habit)}/>))}</div>
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
              disabled={isLoading}
              className={buttonStyle}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
    </OnboardingLayout>
  );
} 