import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// --- Styles from STYLE_GUIDE.md ---
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6 max-w-md w-full text-center";
const errorColor = "text-red-300"; // Adjusted for dark bg
const successColor = "text-green-300";
const textColor = "text-off-white/90";
// ---

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
          
          const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // Ignore 'no rows found'
            throw profileError;
          }

          if (profile?.onboarding_complete) {
            router.push('/scan/index'); // Update scan path
          } else {
            // Redirect to onboarding if profile exists but onboarding isn't complete, or if profile doesn't exist yet
            console.warn('Profile exists but onboarding is not complete. Redirecting to onboarding.');
            router.push('/onboarding');
          }
        } else {
          // Handle case where there's no session (might be an error or the auth process was canceled)
          console.warn('No session found in callback. Auth might have been canceled by the user.');
          setError('Authentication was canceled or failed. Please try again.');
          
          // After a delay, redirect back to login
          setTimeout(() => {
            router.push('/auth/login'); // Update login path
          }, 3000);
        }
      } catch (error: any) {
        console.error('Auth callback error:', error.message);
        setError(`Authentication error: ${error.message}`);
        
        // After a delay, redirect back to login
        setTimeout(() => {
          router.push('/auth/login'); // Update login path
        }, 3000);
      }
    };

    // Only run the callback handling if we're in the browser
    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] p-4">
      <Head>
        <title>Processing... - NutriFlow</title>
      </Head>
      
      <div className={cardStyle}>
        {error ? (
          <div className={`${errorColor}`}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-xl font-light mb-2">Authentication Error</h1>
            <p className="text-sm mb-4">{error}</p>
            <p className="mt-4 text-xs text-off-white/70">Redirecting you back to login...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <svg className={`animate-spin h-10 w-10 ${successColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className={`text-xl font-light mb-2 ${textColor}`}>Processing Sign In</h1>
            <p className={`text-sm ${textColor}`}>Please wait, this shouldn't take long...</p>
          </>
        )}
      </div>
    </div>
  );
} 