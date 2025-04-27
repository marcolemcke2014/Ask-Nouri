'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Import layout

export default function OnboardingSuccess() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleNavigate = () => {
    console.log('[Onboarding Success] Navigating to scan page...');
    setIsLoading(true);
    try {
        router.push('/scan/index');
    } catch (navError) {
        console.error('[Onboarding Success] Navigation failed:', navError);
        setIsLoading(false); // Stop loading if navigation fails
        // Optionally set an error state to display to the user
    }
  };

  // Placeholder styles
  const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    // Using layout, but setting currentStep > totalSteps effectively hides progress or shows all filled
    <OnboardingLayout title="Onboarding Complete!" currentStep={7} totalSteps={6}> 
        {/* Content is centered by layout's main tag, adding text-center here */}
        <div className="text-center">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
               <CheckCircle className="w-16 h-16 text-green-300" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-medium mb-4 text-off-white">
              All set! Let's find your perfect meals 🔥
            </h1>

            {/* Body Text */}
            <p className="text-off-white/90 text-sm mb-8">
              Based on your profile, we've prepared the best meal suggestions for you. Let's eat smarter!
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <button 
                type="button" 
                onClick={handleNavigate}
                disabled={isLoading}
                className={buttonStyle}
              >
                {isLoading ? 'Loading...' : 'Scan Menus'}
              </button>
            </div>
        </div>
    </OnboardingLayout>
  );
} 