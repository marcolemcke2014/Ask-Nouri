'use client';

import React from 'react';
import Head from 'next/head';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;       // For the Head title
  currentStep: number; // e.g., 1
  totalSteps: number;  // e.g., 6 (Basics to Personalize)
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  title, 
  currentStep,
  totalSteps 
}) => {

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>{title} - NutriFlow Onboarding</title>
      </Head>

      {/* Progress Indicator (Simple Dots) */}
      <div className="flex justify-center space-x-2 my-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index + 1 <= currentStep ? 'bg-green-300' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      <main className="w-full max-w-[600px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 sm:p-8 mt-4">
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout; 