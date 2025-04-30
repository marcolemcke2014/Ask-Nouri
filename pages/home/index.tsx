'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { User, History, Home, ScanLine, FileText, Settings } from 'lucide-react';

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
        setUser(data.session.user as User);
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // Navigate to scan page
  const handleStartScan = () => {
    router.push('/home/scan');
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
      </main>

      {/* Footer menu */}
      <footer className="sticky bottom-0 left-0 right-0 bg-[#0A4923]/80 backdrop-blur-sm border-t border-off-white/15 py-2 px-2 z-50">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => router.push('/home')} 
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white font-medium" // Active for home
          >
            <Home size={20} />
            <span className="mt-1">Home</span>
          </button>
          <button
            onClick={() => router.push('/home/scan')}
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