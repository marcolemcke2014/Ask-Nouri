import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Input from '../components/auth/Input'; // Uncommented
import SocialLoginButton from '../components/auth/SocialLoginButton'; // Uncommented
import { supabase } from '../lib/supabase'; // Uncommented for test

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState(''); // Uncommented
  const [passwordError, setPasswordError] = useState(''); // Uncommented
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Uncommented

  // Check if user is already logged in (Uncommented)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          // User is already logged in, redirect to scan page
          router.replace('/scan');
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuthStatus();
  }, [router]);

  // Show minimal loading state while checking auth (Uncommented)
  if (isCheckingAuth) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted (Supabase call UNCOMMENTED)');
    setErrorMessage(''); // Uncommented
    setPasswordError(''); // Uncommented
    
    // Basic validation
    if (!email) {
      console.log('Validation: Please enter email');
      setErrorMessage('Please enter your email address'); // Uncommented
      return;
    }
    if (!password) {
      console.log('Validation: Please enter password');
      setPasswordError('Please enter your password'); // Uncommented
      return;
    }
    
    setIsLoading(true); // Uncommented
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password }); // Uncommented
      if (error) { throw error; } // Uncommented
      if (data?.user) { router.push('/scan'); } // Uncommented
    } catch (error: any) {
      console.error('Login error:', error.message); // Keep console log
      if (error.message.includes('credentials')) { setErrorMessage('The email or password you entered is incorrect. Please try again.'); } // Uncommented
      else { setErrorMessage(error.message || 'Failed to sign in. Please try again later.'); } // Uncommented
    } finally {
      setIsLoading(false); // Uncommented
    }
  };

  const handleEmailChange = (value: string) => {
    console.log('Setting email to:', value);
    setEmail(value);
    if (errorMessage) setErrorMessage(''); // Uncommented
  };

  const handlePasswordChange = (value: string) => {
    console.log('Setting password to:', value);
    setPassword(value);
    if (passwordError) setPasswordError(''); // Uncommented
  };

  const handleSocialLogin = async (provider: 'google') => {
    console.log('Social login clicked (Supabase call UNCOMMENTED)'); // Updated log
    try {
      setIsSocialLoading(true); // Uncommented
      setErrorMessage(''); // Keep uncommented (clears previous errors)
      const { data, error } = await supabase.auth.signInWithOAuth({ // Uncommented
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) { throw error; } // Uncommented
    } catch (error: any) {
      console.error(`${provider} login error:`, error.message); // Keep console log
      setErrorMessage(`Failed to sign in with ${provider}. ${error.message}`); // Uncommented
    } finally { // Add finally block if missing
      setIsSocialLoading(false); // Uncommented
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif]">
      <Head>
        <title>Login - NutriFlow</title>
        <meta name="description" content="Login to your NutriFlow account" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-8 sm:px-6">
        {/* Logo */}
        <div className="mb-8 h-20 w-64">
          <img 
            src="/images/Forkcast_Logo.svg" 
            alt="Forkcast Logo" 
            className="h-full w-full"
          />
        </div>
        
        <div className="w-full max-w-[325px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5">
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-light text-off-white text-center">Welcome Back</h1>
          </div>

          {/* Show general error message at the top if needed (Uncommented) */}
          {errorMessage && (errorMessage.includes('try again later') || errorMessage.includes('Failed to sign in with')) && (
            <div className="mb-3 p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="w-full space-y-3">
             {/* Using Custom Input components now */}
             <Input
               id="email"
               label="Email address"
               type="email"
               placeholder="Your email"
               value={email}
               onChange={handleEmailChange}
               error={errorMessage && !errorMessage.includes('Failed to sign in with') ? errorMessage : ''} // Use error state
               autoFocus={true}
             />

             <Input
               id="password"
               label="Password"
               type="password"
               placeholder="Password"
               value={password}
               onChange={handlePasswordChange}
               error={passwordError} // Use error state
             />
             
            {/* Standard inputs removed 
             <div>...</div>
             <div>...</div> 
            */}

            <button
              type="submit"
              disabled={isLoading} // Use isLoading state
              className="w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors mt-7 flex items-center justify-center shadow-md text-sm"
            >
             {isLoading ? ( // Use isLoading state
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Loading...
               </>
             ) : (
               'Log in'
             )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-off-white/30"></div>
            <span className="px-3 text-xs text-off-white/90">Or</span>
            <div className="flex-1 h-px bg-off-white/30"></div>
          </div>

          {/* Social Login Button - Google only (Uncommented) */}
           <div className="w-full">
             <SocialLoginButton
               provider="google"
               onClick={() => handleSocialLogin('google')}
               isLoading={isSocialLoading} // Use isSocialLoading state
             />
           </div>

          {/* Sign Up Link and Forgot Password together with consistent styling */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-[#84F7AC]">
              Don't have an account?{' '}
              <Link href="/signup">
                <a className="font-normal hover:underline">
                  Sign up
                </a>
              </Link>
            </p>
            
            <Link href="/forgot-password">
              <a className="text-xs text-[#84F7AC] hover:underline transition-colors">
                Forgot password?
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 