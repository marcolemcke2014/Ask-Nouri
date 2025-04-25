import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep?: number;
}

// Total number of steps in the onboarding process
const TOTAL_STEPS = 7;

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children, currentStep: providedStep }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(providedStep || 1);

  // If no currentStep is provided, try to determine from the route
  useEffect(() => {
    if (providedStep) {
      setCurrentStep(providedStep);
    } else {
      // Map common paths to step numbers (fallback)
      const pathToStepMap: Record<string, number> = {
        '/onboarding/step1': 1,
        '/onboarding/step2': 2,
        '/onboarding/step-dietary-lens': 3,
        '/onboarding/step-health-check': 4,
        '/onboarding/step-muscle': 5,
        '/onboarding/step-weight': 5,
        '/onboarding/step-energy': 5,
        '/onboarding/step-lifestyle': 6,
        '/onboarding/step-final': 7,
      };
      
      const path = router.pathname;
      if (pathToStepMap[path]) {
        setCurrentStep(pathToStepMap[path]);
      }
    }
  }, [router.pathname, providedStep]);

  // Memoize the progress dots rendering function
  const renderProgressDots = useCallback(() => {
    return (
      <div className="flex justify-center space-x-2 mb-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index + 1 === currentStep 
                ? 'bg-white w-3 h-3' 
                : index + 1 < currentStep 
                  ? 'bg-white/80' 
                  : 'bg-white/30'
            }`}
          ></div>
        ))}
      </div>
    );
  }, [currentStep]); // Only re-create when currentStep changes

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#145328]">
      <Head>
        <title>Onboarding - NutriFlow</title>
        <meta name="description" content="Complete your NutriFlow profile setup" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Progress indicator */}
      <div className="w-full pt-10">
        {renderProgressDots()}
        <p className="text-white/70 text-sm text-center">Step {currentStep} of {TOTAL_STEPS}</p>
      </div>

      {/* Main content container */}
      <main className="flex-1 flex flex-col w-full max-w-md px-4 py-6 mt-4">
        {children}
      </main>

      {/* Optional footer area */}
      <footer className="w-full max-w-md px-4 py-6 text-center text-white/70 text-sm">
        <p>© {new Date().getFullYear()} NutriFlow</p>
      </footer>
    </div>
  );
};

export default OnboardingLayout; 