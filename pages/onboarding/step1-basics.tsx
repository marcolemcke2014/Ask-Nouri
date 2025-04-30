'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { Minus, Plus, CalendarIcon } from 'lucide-react';
import PillButton from '../../components/onboarding/PillButton';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Styles ---
const labelStyle = "block text-xs font-normal text-off-white/90 mb-1.5";
const buttonStyle = "w-full min-h-[48px] h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-base disabled:opacity-50 disabled:cursor-not-allowed";
const errorBoxStyle = "mt-4 p-3 bg-red-700/20 border border-red-500/30 text-red-200 rounded-md text-sm text-center";
const inputStyle = "w-full h-12 px-4 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all text-base font-['Poppins',sans-serif]";
const inputPlaceholderStyle = "placeholder-gray-400/80";
const smallInputStyle = `${inputStyle} w-16 text-center px-1`;
// Styles for +/- stepper
const numberDisplayContainerStyle = "flex items-center justify-between w-full h-12 px-3.5 py-1.5 rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm";
const numberDisplayText = "text-base text-gray-900 font-['Poppins',sans-serif]";
const plusMinusButton = "p-1 rounded-full text-gray-600 hover:bg-black/10 active:bg-black/20 transition-colors";
const unitToggleContainerStyle = "flex space-x-1 bg-white/10 p-0.5 rounded-full ml-2";
const unitToggleStyle = "min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-1 text-base rounded-full cursor-pointer transition-colors";
const activeUnitStyle = "bg-green-200 text-green-800 font-medium border border-green-400 shadow-sm";
const inactiveUnitStyle = "bg-gray-500 text-gray-100 hover:bg-gray-600";
const selectStyle = `${inputStyle} appearance-none`;
const selectTriggerStyle = `${inputStyle} text-left justify-start [&>span]:text-gray-400/80 data-[placeholder]:font-normal`;
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
    'Eat Out Often', 'Night Owl',
    'None'
];

export default function OnboardingBasics() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dob, setDob] = useState<Date | undefined>(undefined);
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

        const { data: healthData, error: healthDataError } = await supabase
            .from('user_health_data')
            .select('date_of_birth, height_cm, weight_kg, gender, lifestyle_tags')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (healthDataError) { console.error('[OB Basics] Error fetching health data:', healthDataError); }
        else if (healthData) {
            if (healthData.date_of_birth) setDob(new Date(healthData.date_of_birth));
            if (healthData.height_cm) { setHeight(healthData.height_cm); setHeightUnit('cm'); }
            if (healthData.weight_kg) { setWeight(healthData.weight_kg); setWeightUnit('kg'); }
            if (healthData.gender) setGender(healthData.gender);
            if (healthData.lifestyle_tags) setSelectedHabits(healthData.lifestyle_tags);
        }
      } catch (fetchError) {
        console.error('[OB Basics] Fetch error:', fetchError);
        setError('Could not load step. Please refresh.');
      } finally { setIsLoading(false); }
    };
    fetchUserAndData();
  }, [router]);

  // --- Input Handlers ---
  const handleDobChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
        setDob(selectedDate);
        setError('');
    }
  };
  
  // Restore +/- handlers
  const handleHeightChange = (increment: number) => {
    setError('');
    setHeight(prev => {
        const current = Number(prev) || (heightUnit === 'cm' ? 150 : 60); 
        const newValue = current + increment;
        return Math.max(1, newValue); 
    });
  };
  const handleWeightChange = (increment: number) => {
    setError('');
    setWeight(prev => {
        const current = Number(prev) || (weightUnit === 'kg' ? 60 : 130);
        const newValue = current + (increment > 0 ? 0.5 : -0.5); 
        return Math.max(1, parseFloat(newValue.toFixed(1)));
    });
  };
  
  // Unit change handlers
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
      setWeight(unit === 'kg' ? parseFloat((currentWeight * 0.453592).toFixed(1)) : parseFloat((currentWeight / 0.453592).toFixed(1)));
    }
    setWeightUnit(unit);
  };
  
  const handleGenderChange = (value: string) => {
      setGender(value);
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
    if (!user || !dob) {
      console.error('[Onboarding Basics] handleNext called without user or dob.');
      setError('User session not found. Please log in again.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const formattedDob = format(dob, "yyyy-MM-dd");
    const heightInCm = heightUnit === 'inches' && height ? Math.round(Number(height) * 2.54) : height;
    const weightInKg = weightUnit === 'lbs' && weight ? Math.round(Number(weight) * 0.453592 * 10) / 10 : weight;

    const healthData = {
      user_id: user.id,
      date_of_birth: formattedDob,
      height_cm: heightInCm,
      weight_kg: weightInKg,
      gender: gender,
      lifestyle_tags: selectedHabits.length > 0 ? selectedHabits : null,
      updated_at: new Date().toISOString(),
    };
    try {
      console.log('[Onboarding Basics] Upserting health data for user:', user.id);
      const { error: upsertError } = await supabase
        .from('user_health_data')
        .upsert(healthData, { onConflict: 'user_id' });
        
      if (upsertError) {
        console.error('[Onboarding Basics] Supabase upsert error:', upsertError);
        throw upsertError;
      }
      console.log('[Onboarding Basics] Health data saved successfully.');
      router.push('/onboarding/step2-mission');
    } catch (err: any) {
      console.error('[Onboarding Basics] Update failed:', err);
      setError(err.message || 'Failed to save health information.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) { 
      return <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]"><p className="text-white">Loading...</p></div>;
  }

  return (
    <OnboardingLayout title="Quick Basics" currentStep={1} totalSteps={4}>
        <h2 className="text-xl sm:text-2xl font-light text-center mb-6 text-off-white">
          Tell us a little about you:
        </h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
          {/* Date of Birth - Shadcn DatePicker */}
          <div>
            <label className={labelStyle}>Date of Birth</label>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      inputStyle,
                      "w-full justify-start text-left font-normal",
                      !dob && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {dob ? format(dob, "PPP") : <span className={inputPlaceholderStyle}>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={handleDobChange}
                    disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
          </div>

          {/* Height - Reverted to +/- Controls */}
          <div>
             <label className={labelStyle}>Height</label>
             <div className={numberDisplayContainerStyle}>
                <button type="button" onClick={() => handleHeightChange(-1)} className={plusMinusButton} aria-label="Decrease height">
                    <Minus size={18}/>
                </button>
                <span className={numberDisplayText}>
                    {height || '--'} {heightUnit}
                </span>
                <button type="button" onClick={() => handleHeightChange(1)} className={plusMinusButton} aria-label="Increase height">
                    <Plus size={18}/>
                </button>
                <div className={`${unitToggleContainerStyle} flex-shrink-0`}>
                   <button type="button" onClick={() => handleHeightUnitChange('cm')} className={`${unitToggleStyle} ${heightUnit === 'cm' ? activeUnitStyle : inactiveUnitStyle}`}>cm</button>
                   <button type="button" onClick={() => handleHeightUnitChange('inches')} className={`${unitToggleStyle} ${heightUnit === 'inches' ? activeUnitStyle : inactiveUnitStyle}`}>in</button>
                </div>
             </div>
          </div>

          {/* Weight - Reverted to +/- Controls */}
           <div>
             <label className={labelStyle}>Weight</label>
             <div className={numberDisplayContainerStyle}>
                 <button type="button" onClick={() => handleWeightChange(-1)} className={plusMinusButton} aria-label="Decrease weight">
                     <Minus size={18}/>
                 </button>
                 <span className={numberDisplayText}>
                    {weight || '--'} {weightUnit}
                 </span>
                 <button type="button" onClick={() => handleWeightChange(1)} className={plusMinusButton} aria-label="Increase weight">
                     <Plus size={18}/>
                 </button>
                 <div className={`${unitToggleContainerStyle} flex-shrink-0`}>
                   <button type="button" onClick={() => handleWeightUnitChange('kg')} className={`${unitToggleStyle} ${weightUnit === 'kg' ? activeUnitStyle : inactiveUnitStyle}`}>kg</button>
                   <button type="button" onClick={() => handleWeightUnitChange('lbs')} className={`${unitToggleStyle} ${weightUnit === 'lbs' ? activeUnitStyle : inactiveUnitStyle}`}>lbs</button>
                </div>
            </div>
          </div>

          {/* Gender - Using Shadcn Select */}
          <div>
            <label htmlFor="gender-trigger" className={labelStyle}>Gender</label> 
            <Select 
                value={gender} 
                onValueChange={handleGenderChange}
                required
            >
              <SelectTrigger 
                  id="gender-trigger"
                  className={selectTriggerStyle}
                  aria-label="Select gender"
              >
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Divider */}
          <hr className="border-off-white/30 my-6" />

          {/* Daily Habits Section */}
          <div>
             <label className="block text-xl sm:text-2xl font-light text-center mb-6 text-off-white">Describe your daily routine:</label> 
             <div className="flex flex-wrap gap-2 justify-center">
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

          {/* CTA Button - Use Shadcn Button */}
          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isLoading || !isFormValid}
              className={buttonStyle}
              variant="default"
            >
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
    </OnboardingLayout>
  );
} 