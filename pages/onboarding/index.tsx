import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function OnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the welcome page on component mount
    router.replace('/onboarding/welcome');
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div className="flex items-center justify-center">
      <p className="text-white">Loading onboarding...</p>
    </div>
  );
} 