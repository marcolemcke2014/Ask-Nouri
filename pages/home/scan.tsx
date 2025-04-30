'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ScanScreen from '@/components/screens/ScanScreen';
import { supabase } from '@/lib/supabase';

export default function ScanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          router.push('/auth/login');
          return;
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

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