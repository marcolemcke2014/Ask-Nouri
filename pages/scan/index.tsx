import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ScanScreen from '../../components/screens/ScanScreen';
import { supabase } from '../../lib/supabase';

// Define user type
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function ScanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showScanScreen, setShowScanScreen] = useState(false);

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.push('/login');
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
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 text-white">
      <main className="max-w-md mx-auto px-4 py-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold">NutriFlow</h1>
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </header>

        {/* Personal message card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-2">Hello{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!</h2>
          <p className="text-white/80">
            Ready to find the healthiest menu options? Scan a restaurant menu to get personalized nutritional insights.
          </p>
        </div>

        {/* Main content */}
        <div className="flex-grow flex flex-col justify-center items-center text-center mb-10">
          <div className="mb-6 text-6xl">📷</div>
          <h2 className="text-2xl font-bold mb-4">Scan a Menu</h2>
          <p className="text-white/80 mb-10">
            Point your camera at a restaurant menu to get instant nutritional insights.
          </p>
          
          {/* Buttons */}
          <div className="w-full space-y-4">
            <button
              onClick={handleStartScan}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 rounded-xl transition"
            >
              Start Camera
            </button>
            
            <button
              onClick={() => router.push('/history')}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-4 px-6 rounded-xl transition"
            >
              View Scan History
            </button>
          </div>
        </div>
        
        {/* Footer menu */}
        <footer className="py-4 px-2">
          <nav className="flex justify-between items-center">
            <button
              onClick={() => router.push('/')}
              className="flex flex-col items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </button>
            
            <button
              onClick={() => setShowScanScreen(true)}
              className="flex flex-col items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1">Scan</span>
            </button>
            
            <button
              onClick={() => router.push('/results')}
              className="flex flex-col items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-xs mt-1">Results</span>
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </nav>
        </footer>
      </main>
    </div>
  );
} 