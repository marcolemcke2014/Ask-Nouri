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
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const { code } = router.query;

    async function processOAuthCode() {
      setIsProcessing(true);
      
      try {
        // Get hash from URL
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.slice(1)); // Remove leading # 
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const expiresIn = urlParams.get('expires_in');
        
        // If we have an access token, we have a successful OAuth login - persist it
        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) throw sessionError;
          
          // Check if user exists and has onboarding flag
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) throw userError;
          
          // Check if user has completed onboarding
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('onboarding_complete, id')
            .eq('id', userData.user.id)
            .maybeSingle();
            
          if (profileError) throw profileError;
          
          // If no profile, or onboarding not complete, redirect to onboarding
          if (!profileData || !profileData.onboarding_complete) {
            router.push('/onboarding/step1-basics');
          } else {
            // Otherwise go to the scan page
            router.push('/home'); // Updated path to home
          }
        } else if (code) {
          // Process OAuth code flow (optional based on your provider)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);
          if (exchangeError) throw exchangeError;
          
          // Redirect to scan page after successful code exchange
          router.push('/home'); // Updated path to home
        } else {
          // No token or code found
          throw new Error('No access token or authorization code found in URL');
        }
      } catch (err: any) {
        console.error('Error processing OAuth callback:', err);
        setError(err.message);
        // Wait 3 seconds, then redirect to login page
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    }

    if (router.isReady) {
      processOAuthCode();
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] p-4">
      <Head>
        <title>Processing... - NutriFlow</title>
      </Head>
      
      <div className={cardStyle}>
        {isProcessing ? (
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
        ) : error ? (
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