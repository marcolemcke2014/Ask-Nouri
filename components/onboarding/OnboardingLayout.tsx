'use client';

import React from 'react';
import Head from 'next/head';
import { ChevronLeft } from 'lucide-react'; // Import icon for back button

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;       // For the Head title
  currentStep: number; // e.g., 1
  totalSteps: number;  // e.g., 6 (Basics to Personalize)
  showBackButton?: boolean; // Optional prop to show back button
  onBack?: () => void;      // Optional handler for back button click
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  title, 
  currentStep,
  totalSteps,
  showBackButton = false, // Default to false
  onBack = () => {},       // Default empty handler
}) => {

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white p-4">
      <Head>
        <title>{title} - NutriFlow Onboarding</title>
      </Head>

      {/* Header Area with optional Back Button and Progress */}
      <div className="w-full max-w-md relative h-10 mb-2 z-10"> {/* Container for positioning */}
        {showBackButton && (
          <button 
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-off-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors z-20"
            aria-label="Go back"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        )}
        {/* Progress Indicator */} 
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center space-x-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index + 1 <= currentStep ? 'bg-green-300' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <main className="w-full max-w-sm bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5 mt-4">
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout; 