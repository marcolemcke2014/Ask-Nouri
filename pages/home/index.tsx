'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { User, History, Home, ScanLine, ChevronLeft } from 'lucide-react';
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
// ---

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

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
        // Add a fallback UI for authentication errors
        setError('Authentication error. Please try logging in again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // Toggle scanner view
  const handleStartScan = () => {
    setShowScanner(true);
  };

  // Return to home view
  const handleBackToHome = () => {
    setShowScanner(false);
  };

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

  // Show scanner view when activated
  if (showScanner) {
    return (
      <div className="min-h-screen flex flex-col bg-black font-['Poppins',sans-serif] text-off-white">
        <Head>
          <title>NutriFlow - Scan</title>
        </Head>

        {/* Back Button */}
        <button 
          onClick={handleBackToHome}
          className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 text-white"
          aria-label="Back to home"
        >
          <ChevronLeft size={24} />
        </button>
        
        <ScanScreen />
        
        {/* Footer stays consistent */}
        <footer className="sticky bottom-0 left-0 right-0 bg-[#0A4923]/80 backdrop-blur-sm border-t border-off-white/15 py-2 px-2 z-50">
          <nav className="flex justify-around items-center max-w-md mx-auto">
            <button
              onClick={handleBackToHome} 
              className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
            >
              <Home size={20} />
              <span className="mt-1">Home</span>
            </button>
            <button
              onClick={() => {}} // Already in scan view
              className="flex flex-col items-center text-xs p-2 rounded-md text-off-white font-medium" // Active state
            >
              <ScanLine size={20} />
              <span className="mt-1">Scan</span>
            </button>
            <button
              onClick={() => router.push('/history/index')}
              className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
            >
              <History size={20} />
              <span className="mt-1">History</span>
            </button>
            <button
              onClick={() => router.push('/profile/index')}
              className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
            >
              <User size={20} />
              <span className="mt-1">Profile</span>
            </button>
          </nav>
        </footer>
      </div>
    );
  }

  // Home view (default)
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      <Head>
        <title>NutriFlow - Home</title>
      </Head>

      <main className="flex-grow flex flex-col px-4 py-6 sm:py-10"> 
        {/* Header */}
        <header className="flex justify-between items-center mb-8 w-full max-w-md mx-auto">
          <h1 className="text-2xl font-light">NutriFlow</h1>
          <button
            onClick={() => router.push('/profile/index')}
            className="p-2 rounded-full text-off-white hover:bg-white/10 transition-colors"
            aria-label="Profile"
          >
            <User size={24} />
          </button>
        </header>

        {/* Content Area */} 
        <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md mx-auto">
            {/* Personal message card */}
            <div className={`${cardStyle} w-full mb-8`}>
              <h2 className="text-xl font-medium mb-2">Hello{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!</h2>
              <p className="text-off-white/80 text-sm">
                Ready to find the healthiest menu options? Scan a restaurant menu to get personalized nutritional insights.
              </p>
            </div>

            {/* Main Scan Action */}
            <div className="text-center mb-10">
              <div className="mb-6 text-6xl">📷</div>
              <h2 className="text-2xl font-light mb-4">Scan a Menu</h2>
              <p className="text-off-white/80 text-sm mb-10">
                Point your camera at a restaurant menu to get instant nutritional insights.
              </p>
              
              {/* Buttons */}
              <div className="w-full space-y-4 max-w-xs mx-auto">
                <button
                  onClick={handleStartScan}
                  className={buttonPrimaryStyle}
                >
                  Start Camera
                </button>
                
                <button
                  onClick={() => router.push('/history/index')}
                  className={buttonSecondaryStyle}
                >
                  View Scan History
                </button>
              </div>
            </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="max-w-md mx-auto mt-6 p-4 bg-red-800/30 border border-red-500/30 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}
      </main>

      {/* Footer menu */}
      <footer className="sticky bottom-0 left-0 right-0 bg-[#0A4923]/80 backdrop-blur-sm border-t border-off-white/15 py-2 px-2 z-50">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => {}} // Already on home 
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white font-medium" // Active for home
          >
            <Home size={20} />
            <span className="mt-1">Home</span>
          </button>
          <button
            onClick={handleStartScan}
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
          >
            <ScanLine size={20} />
            <span className="mt-1">Scan</span>
          </button>
          <button
            onClick={() => router.push('/history/index')}
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
          >
            <History size={20} />
            <span className="mt-1">History</span>
          </button>
          <button
            onClick={() => router.push('/profile/index')}
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
          >
            <User size={20} />
            <span className="mt-1">Profile</span>
          </button>
        </nav>
      </footer>
    </div>
  );
} 