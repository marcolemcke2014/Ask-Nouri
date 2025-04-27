'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

// --- Styles (Matching auth pages) ---
const inputBaseStyle = "w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500";
const inputTextStyle = "text-gray-800 bg-white placeholder-gray-500"; // Style for text inputs
const inputSelectStyle = "text-gray-800 bg-white"; // Style for select
const labelStyle = "block text-sm font-medium text-off-white mb-1";
const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const unitToggleContainerStyle = "flex space-x-1 bg-white/10 p-1 rounded-full";
const unitToggleStyle = "px-3 py-1 text-xs rounded-full cursor-pointer transition-colors";
const activeUnitStyle = "bg-green-200 text-green-800 font-medium";
const inactiveUnitStyle = "bg-gray-500 text-gray-100 hover:bg-gray-600";
const errorBoxStyle = "mb-3 p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm text-center";
// ---

export default function OnboardingBasics() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dob, setDob] = useState<string>('');
  const [height, setHeight] = useState<number | ''>('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm');
  const [weight, setWeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [gender, setGender] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profile, error: profileError } = await supabase
              .from('user_profile')
              .select('date_of_birth, height_cm, weight_kg, gender')
              .eq('id', session.user.id)
              .maybeSingle();
          
          if (profileError) {
              console.error('[Onboarding Basics] Error fetching profile for pre-fill:', profileError);
              // Optional: Set an error state for the user?
          } else if (profile) {
              if (profile.date_of_birth) setDob(profile.date_of_birth);
              if (profile.height_cm) { setHeight(profile.height_cm); setHeightUnit('cm'); }
              if (profile.weight_kg) { setWeight(profile.weight_kg); setWeightUnit('kg'); }
              if (profile.gender) setGender(profile.gender);
          }
        } else {
          console.error('[Onboarding Basics] No user session found, redirecting.');
          router.replace('/auth/login');
        }
      } catch (fetchError) {
          console.error('[Onboarding Basics] Error in initial data fetch:', fetchError);
          setError('Could not load onboarding step. Please refresh.'); // More user-friendly error
      } finally {
         setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, [router]);

  // --- Input Handlers (Remain the same) ---
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDob(e.target.value);
      setError('');
  };
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setHeight(val === '' ? '' : Number(val));
      setError('');
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
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setWeight(val === '' ? '' : Number(val));
      setError('');
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
  // --- End Input Handlers ---

  const handleNext = async () => {
     if (!user) {
      console.error('[Onboarding Basics] handleNext called without user.');
      setError('User session not found. Please log in again.');
      return;
    }
    if (!dob || !height || !weight || !gender) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    const heightInCm = heightUnit === 'inches' && height ? Math.round(height * 2.54) : height;
    const weightInKg = weightUnit === 'lbs' && weight ? Math.round(weight * 0.453592 * 10) / 10 : weight;
    const updateData = {
      date_of_birth: dob,
      height_cm: heightInCm,
      weight_kg: weightInKg,
      gender: gender,
      updated_at: new Date().toISOString(),
    };
    try {
      console.log('[Onboarding Basics] Updating profile for user:', user.id);
      const { error: updateError } = await supabase
        .from('user_profile')
        .update(updateData)
        .eq('id', user.id);
      if (updateError) { 
          console.error('[Onboarding Basics] Supabase update error:', updateError);
          throw updateError; 
      }
      console.log('[Onboarding Basics] Profile updated successfully.');
      router.push('/onboarding/step3-mission');
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
    <OnboardingLayout title="Quick Basics" currentStep={1} totalSteps={6}>
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-6 text-off-white">
          First, some quick basics 📋
        </h1>
        
        {/* Display Error Box */} 
        {error && (
            <div className={errorBoxStyle}>
              {error}
            </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className={labelStyle}>Date of Birth</label>
            <input
              type="date"
              id="dob"
              value={dob}
              onChange={handleDobChange}
              className={`${inputBaseStyle} ${inputTextStyle}`}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Height */}
          <div>
             <label htmlFor="height" className={labelStyle}>Height</label>
             <div className="flex items-center space-x-2">
                <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={handleHeightChange}
                    className={`${inputBaseStyle} ${inputTextStyle} flex-grow`}
                    placeholder={heightUnit === 'cm' ? 'e.g., 175' : 'e.g., 69'}
                    step={heightUnit === 'cm' ? 1 : 0.1}
                    min="1"
                    required
                />
                <div className={unitToggleContainerStyle}>
                   <button type="button" onClick={() => handleHeightUnitChange('cm')} className={`${unitToggleStyle} ${heightUnit === 'cm' ? activeUnitStyle : inactiveUnitStyle}`}>cm</button>
                   <button type="button" onClick={() => handleHeightUnitChange('inches')} className={`${unitToggleStyle} ${heightUnit === 'inches' ? activeUnitStyle : inactiveUnitStyle}`}>in</button>
                </div>
             </div>
          </div>

          {/* Weight */}
          <div>
             <label htmlFor="weight" className={labelStyle}>Weight</label>
             <div className="flex items-center space-x-2">
                 <input
                    type="number"
                    id="weight"
                    value={weight}
                    onChange={handleWeightChange}
                    className={`${inputBaseStyle} ${inputTextStyle} flex-grow`}
                    placeholder={weightUnit === 'kg' ? 'e.g., 70' : 'e.g., 154'}
                    step={weightUnit === 'kg' ? 0.1 : 0.1}
                    min="1"
                    required
                 />
                 <div className={unitToggleContainerStyle}>
                   <button type="button" onClick={() => handleWeightUnitChange('kg')} className={`${unitToggleStyle} ${weightUnit === 'kg' ? activeUnitStyle : inactiveUnitStyle}`}>kg</button>
                   <button type="button" onClick={() => handleWeightUnitChange('lbs')} className={`${unitToggleStyle} ${weightUnit === 'lbs' ? activeUnitStyle : inactiveUnitStyle}`}>lbs</button>
                </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className={labelStyle}>Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={handleGenderChange}
              className={`${inputBaseStyle} ${inputSelectStyle}`}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

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