import React from 'react';
import { AppProps } from 'next/app';
import OnboardingLayout from './layout';

// This custom App component applies the OnboardingLayout to all pages in the /onboarding directory
function OnboardingApp({ Component, pageProps }: AppProps) {
  return (
    <OnboardingLayout>
      <Component {...pageProps} />
    </OnboardingLayout>
  );
}

export default OnboardingApp; 