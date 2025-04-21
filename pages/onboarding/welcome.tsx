import React from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function WelcomePage() {
  const router = useRouter();
  
  const handleContinue = () => {
    router.push('/onboarding/diet-preferences');
  };
  
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold text-white mb-6">Welcome to NutriFlow</h1>
      
      <div className="bg-white rounded-lg p-6 w-full mb-8">
        <p className="text-gray-800 mb-4">
          Let's set up your profile to get personalized nutrition recommendations.
        </p>
        <p className="text-gray-600 mb-6">
          This will only take a few minutes. You can always update your preferences later.
        </p>
        
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <div className="bg-[#34A853] h-8 w-8 rounded-full flex items-center justify-center text-white mr-3">
              1
            </div>
            <p className="text-gray-800">Tell us about your dietary preferences</p>
          </div>
          
          <div className="flex items-center">
            <div className="bg-[#34A853] h-8 w-8 rounded-full flex items-center justify-center text-white mr-3">
              2
            </div>
            <p className="text-gray-800">Share basic health information</p>
          </div>
          
          <div className="flex items-center">
            <div className="bg-[#34A853] h-8 w-8 rounded-full flex items-center justify-center text-white mr-3">
              3
            </div>
            <p className="text-gray-800">Set your nutrition goals</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleContinue}
        className="w-full h-14 rounded-lg bg-[#34A853] text-white font-medium hover:bg-[#2c9247] transition-colors"
      >
        Let's Get Started
      </button>
    </div>
  );
} 