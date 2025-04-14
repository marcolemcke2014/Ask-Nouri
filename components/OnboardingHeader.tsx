import React from 'react';
import { useRouter } from 'next/router';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  hideBackButton?: boolean;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  currentStep,
  totalSteps,
  hideBackButton = false,
}) => {
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <div className="w-full mb-8">
      {/* Progress indicator */}
      <div className="flex justify-between items-center mb-6">
        {!hideBackButton ? (
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div></div>
        )}
        <div className="text-sm text-gray-500">
          {currentStep === totalSteps ? 'Complete' : `Step ${currentStep} of ${totalSteps}`}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default OnboardingHeader; 