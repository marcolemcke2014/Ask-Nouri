import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function Onboarding({ user }: { user: User | null }) {
  const router = useRouter();
  
  // Check authentication and redirect to first onboarding step
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      console.log('[ONBOARDING UI] Checking auth status before redirecting');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[ONBOARDING UI] No user session found, redirecting to login');
        router.push('/login');
      } else {
        console.log('[ONBOARDING UI] User authenticated, redirecting to welcome step');
        router.push('/onboarding/welcome');
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Getting Started - NutriFlow</title>
      </Head>
      
      <div className="text-center">
        <div className="animate-pulse text-xl text-gray-600">Setting up your profile...</div>
      </div>
    </div>
  );
} 