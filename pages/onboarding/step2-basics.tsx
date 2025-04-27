'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
// TODO: Import or create components for DatePicker, UnitInput, Dropdown

export default function OnboardingBasics() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dob, setDob] = useState<string>(''); // Store as YYYY-MM-DD string
  const [height, setHeight] = useState<number | ''>('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm');
  const [weight, setWeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [gender, setGender] = useState<string>('');
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
        router.replace('/auth/login'); // Redirect if not logged in
      }
    };
    fetchUser();
  }, [router]);

  // --- Input Handlers ---
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
     // Basic conversion example (Refine as needed)
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
      // Basic conversion example (Refine as needed)
     if (weight !== '') {
        if (unit === 'kg' && weightUnit === 'lbs') {
           setWeight(Math.round(weight * 0.453592 * 10) / 10); // round to 1 decimal
        } else if (unit === 'lbs' && weightUnit === 'kg') {
            setWeight(Math.round(weight / 0.453592 * 10) / 10); // round to 1 decimal
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
      setError('User session not found. Please log in again.');
      return;
    }
    // Basic Validation
    if (!dob || !height || !weight || !gender) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    // Convert height/weight to standard units (cm/kg) for DB storage
    const heightInCm = heightUnit === 'inches' ? Math.round(height * 2.54) : height;
    const weightInKg = weightUnit === 'lbs' ? Math.round(weight * 0.453592 * 10) / 10 : weight;

    const updateData = {
      date_of_birth: dob,
      height_cm: heightInCm,
      weight_kg: weightInKg,
      gender: gender,
      updated_at: new Date().toISOString(),
    };

    try {
      console.log('[Onboarding Basics] Updating profile for user:', user.id, updateData);
      const { error: updateError } = await supabase // Use regular supabase client
        .from('user_profile')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[Onboarding Basics] Profile updated successfully.');
      router.push('/onboarding/step3-mission'); // Navigate to the next step

    } catch (err: any) {
      console.error('[Onboarding Basics] Update failed:', err);
      setError(err.message || 'Failed to save basic information.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Placeholder simple styles - Adapt using existing UI components/Tailwind
  const inputStyle = "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const unitToggleStyle = "px-3 py-1 text-xs rounded-full cursor-pointer";
  const activeUnitStyle = "bg-green-200 text-green-800";
  const inactiveUnitStyle = "bg-gray-200 text-gray-600";

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>Onboarding: Basics - NutriFlow</title>
      </Head>

      {/* TODO: Add Progress Indicator (e.g., Dots: Step 1 of 6) */}
      
      <main className="w-full max-w-[450px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 mt-10">
        <h1 className="text-xl sm:text-2xl font-medium text-center mb-6">
          First, some quick basics 📋
        </h1>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className={labelStyle}>Date of Birth</label>
            <input 
              type="date" 
              id="dob" 
              value={dob} 
              onChange={handleDobChange} 
              className={inputStyle}
              max={new Date().toISOString().split("T")[0]} // Prevent future dates
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
                    className={`${inputStyle} flex-grow`} 
                    placeholder={heightUnit === 'cm' ? 'e.g., 175' : 'e.g., 69'}
                    step={heightUnit === 'cm' ? 1 : 0.1}
                    min="1"
                    required 
                />
                <div className="flex space-x-1">
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
                    className={`${inputStyle} flex-grow`} 
                    placeholder={weightUnit === 'kg' ? 'e.g., 70' : 'e.g., 154'}
                    step={weightUnit === 'kg' ? 0.1 : 0.1}
                    min="1"
                    required
                 />
                <div className="flex space-x-1">
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
              className={inputStyle} 
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-300 text-sm text-center">{error}</p>
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
      </main>
    </div>
  );
} 