import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once when the page loads
    const handleCallback = async () => {
      try {
        // Check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // If we have a session, the user is authenticated
        if (session) {
          console.log('User authenticated successfully:', session.user.id);
          
          // Redirect to scan page instead of dashboard
          router.push('/scan');
        } else {
          // Handle case where there's no session (might be an error or the auth process was canceled)
          console.warn('No session found in callback. Auth might have been canceled by the user.');
          setError('Authentication was canceled or failed. Please try again.');
          
          // After a delay, redirect back to login
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Auth callback error:', error.message);
        setError(`Authentication error: ${error.message}`);
        
        // After a delay, redirect back to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    // Only run the callback handling if we're in the browser
    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#145328] p-4">
      <Head>
        <title>Completing Login - NutriFlow</title>
      </Head>
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        {error ? (
          <div className="text-red-600 mb-4">
            <h1 className="text-xl font-semibold mb-2">Authentication Error</h1>
            <p>{error}</p>
            <p className="mt-4 text-sm text-gray-600">Redirecting you back to login...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-10 w-10 text-[#34A853]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Completing Sign In</h1>
            <p className="text-gray-600">Please wait while we finish setting up your account...</p>
          </>
        )}
      </div>
    </div>
  );
} 