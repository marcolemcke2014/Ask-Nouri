import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Input from '../components/auth/Input';
import SocialLoginButton from '../components/auth/SocialLoginButton';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign up form submitted');
    
    // Clear previous errors
    setErrorMessage('');
    setFirstNameError('');
    setLastNameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    
    // Basic validation
    if (!firstName) {
      setFirstNameError('Please enter your first name');
      return;
    }
    
    if (!lastName) {
      setLastNameError('Please enter your last name');
      return;
    }
    
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!password) {
      setPasswordError('Please enter a password');
      return;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    
    if (!termsAccepted) {
      setTermsError('You must accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Attempting to sign up user with email:', email);
      console.log('Supabase object exists:', !!supabase);
      console.log('Supabase auth object exists:', !!supabase.auth);
      
      // Combine first and last name for display_name
      const displayName = `${firstName} ${lastName}`.trim();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: displayName
          }
        }
      });

      console.log('Signup response data:', data);
      
      if (error) {
        console.error('Supabase signup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (data?.user) {
        console.log('User created successfully:', data.user.id);
        console.log('User email confirmation status:', data.user.email_confirmed_at ? 'Confirmed' : 'Not confirmed');
        console.log('User metadata:', data.user.user_metadata);
        
        // Explicitly log that we're about to redirect
        console.log('Redirecting to choose-plan page with user ID...');
        
        // Pass the user ID as a query parameter
        router.replace(`/choose-plan?new_user_id=${data.user.id}`);
      } else {
        console.warn('No user returned from signup call, but no error either');
      }
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      // User-friendly error messages
      if (error.message.includes('already registered')) {
        setErrorMessage('This email is already registered. Try logging in instead.');
      } else if (error.message.includes('password')) {
        setPasswordError(error.message || 'Invalid password');
      } else {
        setErrorMessage(error.message || 'Failed to sign up. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    console.log('Setting email to:', value);
    setEmail(value);
    if (errorMessage) setErrorMessage('');
  };

  const handleFirstNameChange = (value: string) => {
    console.log('Setting first name to:', value);
    setFirstName(value);
    if (firstNameError) setFirstNameError('');
  };

  const handleLastNameChange = (value: string) => {
    console.log('Setting last name to:', value);
    setLastName(value);
    if (lastNameError) setLastNameError('');
  };

  const handlePasswordChange = (value: string) => {
    console.log('Setting password to:', value);
    setPassword(value);
    if (passwordError) setPasswordError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    console.log('Setting confirm password to:', value);
    setConfirmPassword(value);
    if (confirmPasswordError) setConfirmPasswordError('');
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setIsSocialLoading(true);
      setErrorMessage('');
      
      console.log(`Initiating sign up with ${provider}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }
      
      // Supabase will redirect the user to the provider's login page
      
    } catch (error: any) {
      console.error(`${provider} sign up error:`, error.message);
      setErrorMessage(`Failed to sign up with ${provider}. ${error.message}`);
      setIsSocialLoading(false);
    }
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
    if (termsError) setTermsError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif]">
      <Head>
        <title>Sign Up - Forkcast</title>
        <meta name="description" content="Create your Forkcast account" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-10 sm:px-6">
        {/* Logo removed as requested */}
        
        <div className="w-full max-w-[370px] bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-6">
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-light text-off-white text-center">Create Your Profile</h1>
          </div>

          {/* Show general error message at the top if needed */}
          {errorMessage && (errorMessage.includes('try again later') || errorMessage.includes('Failed to sign up with')) && (
            <div className="mb-3 p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="w-full space-y-3">
            {/* First Name and Last Name fields side by side */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  id="firstName"
                  label="First Name"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={handleFirstNameChange}
                  error={firstNameError}
                  autoFocus={true}
                />
              </div>
              <div className="flex-1">
                <Input
                  id="lastName"
                  label="Last Name"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={handleLastNameChange}
                  error={lastNameError}
                />
              </div>
            </div>

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={handleEmailChange}
              error={errorMessage && !errorMessage.includes('Failed to sign up with') ? errorMessage : ''}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={handlePasswordChange}
              error={passwordError}
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={confirmPasswordError}
            />

            {/* Terms and Conditions Checkbox */}
            <div className="mt-1">
              <div className="flex items-start">
                <div className="flex items-center h-4 mt-0.5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={handleTermsChange}
                    className="w-3.5 h-3.5 border-0 rounded bg-off-white/80 checked:bg-[#34A853] backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-green-600 focus:bg-white transition-all"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="terms" className="text-[10px] text-off-white/60 leading-tight block">
                    By checking this you agree to our <Link href="/terms"><a className="text-[#84F7AC]/70 hover:underline">Terms of Service</a></Link> and <Link href="/privacy"><a className="text-[#84F7AC]/70 hover:underline">Privacy Policy</a></Link>, and consent to receive emails and/or SMS with product updates, personalized offers, and service notifications. You can unsubscribe anytime.
                  </label>
                  {termsError && <p className="text-[10px] text-red-200/80 mt-0.5">{termsError}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors mt-7 flex items-center justify-center shadow-md text-sm"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-off-white/30"></div>
            <span className="px-3 text-xs text-off-white/90">Or</span>
            <div className="flex-1 h-px bg-off-white/30"></div>
          </div>

          {/* Social Login Button - Google only */}
          <div className="w-full">
            <SocialLoginButton
              provider="google"
              onClick={() => handleSocialLogin('google')}
              isLoading={isSocialLoading}
            />
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#84F7AC]">
              Already have an account?{' '}
              <Link href="/login">
                <a className="font-normal hover:underline">
                  Log in
                </a>
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 