'use client'; // Ensure this is present

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ScanScreen from '../../components/screens/ScanScreen';
import { supabase } from '../../lib/supabase';
import { User, History, Home, ScanLine, FileText, Settings } from 'lucide-react'; // Added more icons

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
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5"; // Use p-5 based on auth card padding
// ---

export default function ScanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showScanScreen, setShowScanScreen] = useState(false);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.push('/auth/login');
      } else {
        setUser(data.session.user as User);
      }
    };
    
    checkUser();
  }, [router]);

  // Start scanning handler
  const handleStartScan = () => {
    setShowScanScreen(true);
  };

  // If showing scan screen, render just that component
  if (showScanScreen) {
    return <ScanScreen />;
  }

  // Otherwise show the intro screen with options
  return (
    // Apply background and font from guide
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      {/* Removed max-w-md from main, applying to content sections */}
      <main className="flex-grow flex flex-col px-4 py-6 sm:py-10"> 
        {/* Header */}
        <header className="flex justify-between items-center mb-8 w-full max-w-md mx-auto">
          <h1 className="text-2xl font-light">NutriFlow</h1> { /* Match guide font */}
          <button
            onClick={() => router.push('/profile/index')}
            className="p-2 rounded-full text-off-white hover:bg-white/10 transition-colors"
            aria-label="Profile"
          >
            <User size={24} /> { /* Slightly larger icon */}
          </button>
        </header>

        {/* Content Area */} 
        <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md mx-auto">
            {/* Personal message card - Apply guide style */}
            <div className={`${cardStyle} w-full mb-8`}>
              <h2 className="text-xl font-medium mb-2">Hello{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!</h2> { /* Use guide font weight */}
              <p className="text-off-white/80 text-sm">
                Ready to find the healthiest menu options? Scan a restaurant menu to get personalized nutritional insights.
              </p>
            </div>

            {/* Main Scan Action */}
            <div className="text-center mb-10">
              <div className="mb-6 text-6xl">📷</div> { /* Keep emoji for now */}
              <h2 className="text-2xl font-light mb-4">Scan a Menu</h2>
              <p className="text-off-white/80 text-sm mb-10">
                Point your camera at a restaurant menu to get instant nutritional insights.
              </p>
              
              {/* Buttons - Apply guide styles */}
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
      {/* Footer menu - Keep structure, adjust styling slightly */}
      <footer className="sticky bottom-0 left-0 right-0 bg-[#0A4923]/80 backdrop-blur-sm border-t border-off-white/15 py-2 px-2 z-50">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          {/* Example Footer Item - Apply to others */}
          <button
            onClick={() => router.push('/')} 
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
          >
            <Home size={20} />
            <span className="mt-1">Home</span>
          </button>
          <button
            onClick={() => setShowScanScreen(true)}
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white font-medium" // Active state styling?
          >
            <ScanLine size={20} />
            <span className="mt-1">Scan</span>
          </button>
          <button
            onClick={() => router.push('/results/index')}
            className="flex flex-col items-center text-xs p-2 rounded-md text-off-white/70 hover:bg-white/10 transition-colors"
          >
            <FileText size={20} />
            <span className="mt-1">Results</span>
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