'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { CheckCircle } from 'lucide-react'; // Assuming lucide-react for icons

export default function OnboardingSuccess() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false); // Optional loading state for button

  const handleNavigate = () => {
    setIsLoading(true);
    // Navigate to the main scan page or dashboard
    router.push('/scan'); 
    // Alternatively: router.push('/dashboard'); if that exists
  };

  // Placeholder styles
  const buttonStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>Onboarding Complete! - NutriFlow</title>
      </Head>

      {/* TODO: Add Progress Indicator (Step 6 of 6 - All done!) */}

      <main className="w-full max-w-[450px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 text-center">
        
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
           <CheckCircle className="w-16 h-16 text-green-300" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-medium mb-4">
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
      </main>
    </div>
  );
} 