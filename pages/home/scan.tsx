'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ScanScreen from '@/components/screens/ScanScreen';
import { supabase } from '@/lib/supabase';

export default function ScanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        console.log('Scan page: Checking authentication status');
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          console.log('Scan page: No authenticated user, redirecting to login');
          router.push('/auth/login');
          return;
        }
        console.log('Scan page: User authenticated');
      } catch (error) {
        console.error("Scan page: Auth error:", error);
        setError('Authentication error. Please try reloading the page.');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // Display loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]">
        <div className="text-white text-center">
          <p className="mb-2">Loading scanner...</p>
          <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Display error state if any
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]">
        <div className="max-w-md mx-auto p-5 bg-red-800/30 border border-red-500/30 rounded-lg text-red-200 text-center">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 bg-[#34A853] text-white rounded-lg text-sm hover:bg-[#2c9247]"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Render the ScanScreen component
  return (
    <>
      <Head>
        <title>NutriFlow - Scan</title>
      </Head>
      <ScanScreen />
    </>
  );
} 