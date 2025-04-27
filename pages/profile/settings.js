import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
// Assuming user context is handled higher up or via session check
import { LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Import supabase for logout

// --- Styles from STYLE_GUIDE.md ---
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5";
const buttonPrimaryStyle = "h-12 px-6 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
// ---

const SettingsPage = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/profile/index'); // Go back to profile index
  };

  const handleLogout = async () => {
    console.log('[Settings] User signing out...');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Add useEffect for auth check if necessary, similar to edit.tsx

  return (
     <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      <Head>
        <title>Settings - NutriFlow</title>
      </Head>
      
       {/* Header */}
       <header className="sticky top-0 z-10 bg-[#14532D]/80 backdrop-blur-sm border-b border-off-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-light text-off-white">Settings</h1>
           <button
              onClick={handleLogout}
              className="p-1.5 rounded-full text-off-white/80 hover:bg-white/10 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut size={20} />
          </button>
        </div>
      </header>
      
      {/* Using OnboardingLayout just for the centered card effect */}
      <div className="flex-grow flex items-center justify-center p-4">
          <main className={`w-full max-w-md ${cardStyle} text-center`}>
            <h2 className="text-xl font-light text-off-white mb-6">Settings</h2>
            
            <div className="p-8 mb-8">
                <p className="text-off-white/80 mb-4">
                 Settings page is under construction.
                </p>
                <p className="text-off-white/70 text-sm mb-6">
                  More options will be available soon.
                </p>
                <button
                  onClick={handleBack}
                  className={buttonPrimaryStyle + " mx-auto"} // Center button
                >
                  Back to Profile
                </button>
            </div>
          </main>
      </div>
    </div>
  );
};

export default SettingsPage; 