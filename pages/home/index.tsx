'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { User, History, Home, ScanLine, HelpCircle } from 'lucide-react';
import ScanScreen from '@/components/screens/ScanScreen';

// Define user type
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

// --- Styles from STYLE_GUIDE.md ---
const buttonPrimaryStyle = "w-full h-12 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm";
const buttonSecondaryStyle = "w-full h-12 rounded-lg bg-off-white/20 border border-off-white/30 hover:bg-off-white/30 text-off-white font-normal flex items-center justify-center shadow-md text-sm transition-colors";
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5";
const footerStyle = "sticky bottom-0 left-0 right-0 bg-[#0A4923]/80 backdrop-blur-sm border-t border-off-white/15 py-2 px-2 z-50";
const footerNavItemStyle = "flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors";
const footerNavItemActiveStyle = "flex flex-col items-center text-xs p-2 rounded-md text-off-white font-medium";
const iconButtonStyle = "absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors";
// ---

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        console.log('Home page: Checking authentication status');
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          console.log('Home page: No authenticated user, redirecting to login');
          router.push('/auth/login');
          return;
        }
        console.log('Home page: User authenticated, setting user state');
        setUser(data.session.user as User);
      } catch (error) {
        console.error("Home page: Auth error:", error);
        setAuthError('Authentication error. Please try logging in again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#14532D] to-[#0A4923]">
        <div className="text-white text-center">
          <p className="mb-2">Loading...</p>
          <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Authentication Error State
  if (authError) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] p-4">
        <div className="max-w-md mx-auto p-6 bg-red-800/30 border border-red-500/30 rounded-lg text-red-200 text-center shadow-lg">
          <h2 className="text-xl font-medium mb-3">Authentication Error</h2>
          <p className="text-sm mb-4">{authError}</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-[#34A853] text-white rounded-lg text-sm hover:bg-[#2c9247] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Render Scanner Interface Directly
  return (
    <div className="min-h-screen flex flex-col bg-black font-['Poppins',sans-serif] text-off-white relative">
      <Head>
        <title>NutriFlow - Scan Menu</title>
      </Head>

      {/* Help Button Overlay */}
      <button 
        onClick={() => {/* Add help modal logic here */}}
        className={iconButtonStyle}
        aria-label="Help"
      >
        <HelpCircle size={20} /> 
      </button>
      
      {/* Render ScanScreen component with user name */}
      <ScanScreen userName={user?.user_metadata?.full_name}/>
      
      {/* Footer stays persistent */} 
      <footer className={footerStyle}>
        <nav className="flex justify-around items-center max-w-md mx-auto">
          {/* Home/Scan button (active) */}
          <button
            onClick={() => {}} // Already on scan page
            className={footerNavItemActiveStyle} 
          >
            <ScanLine size={20} />
            <span className="mt-1">Scan</span>
          </button>
          {/* History button */}
          <button
            onClick={() => router.push('/history/index')}
            className={footerNavItemStyle}
          >
            <History size={20} />
            <span className="mt-1">History</span>
          </button>
          {/* Profile button */}
          <button
            onClick={() => router.push('/profile/index')}
            className={footerNavItemStyle}
          >
            <User size={20} />
            <span className="mt-1">Profile</span>
          </button>
        </nav>
      </footer>
    </div>
  );
} 