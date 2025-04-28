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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* Container to control max-width for both header and card */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Header Area - Using Flexbox for alignment */}
        <div className="w-full flex items-center justify-center h-10 mb-2 relative"> {/* Added relative for absolute positioning of dots if needed, or center justify */}
          {/* Back Button - Now aligns with parent container */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2"> {/* Wrapper to keep button left */}
            {showBackButton && (
              <button 
                onClick={onBack}
                // Added bg-white/10, removed -ml-2
                className="text-off-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
            )}
          </div>
          
          {/* Progress Indicator - Centered */}
          <div className="flex justify-center space-x-2">
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

        {/* Main Content Card - Reduced padding further to p-3 */}
        <main className="w-full max-w-sm bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-3 mt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OnboardingLayout; 