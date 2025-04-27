'use client'; // Ensure present

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User as AuthUser } from '@supabase/supabase-js';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout'; // Reusing layout for consistency
import { LogOut } from 'lucide-react';

// --- Styles from STYLE_GUIDE.md ---
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5";
const buttonPrimaryStyle = "h-12 px-6 rounded-lg bg-[#34A853] text-off-white font-normal hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed";
// ---

export default function EditProfilePage({ user }: { user: AuthUser | null }) {
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
        // Simpler check assuming layout/app handles actual session state
        if (!user) { // If user prop is somehow null
             const { data: { session } } = await supabase.auth.getSession();
             if (!session?.user) {
                console.log('[Edit Profile] No user session found, redirecting.');
                router.replace('/auth/login');
             }
        }
    };
    checkAuth();
  }, [user, router]);

  const handleBack = () => {
    router.push('/profile/index'); // Use explicit index path
  };
  
  const handleLogout = async () => {
    console.log('[Edit Profile] User signing out...');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      <Head>
        <title>Edit Profile - NutriFlow</title>
      </Head>
      
      {/* Header */}
       <header className="sticky top-0 z-10 bg-[#14532D]/80 backdrop-blur-sm border-b border-off-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-light text-off-white">Edit Profile</h1>
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
            <h2 className="text-xl font-light text-off-white mb-6">Edit Profile</h2>
            
            <div className="p-8 mb-8">
                <p className="text-off-white/80 mb-4">
                Profile editing functionality will be available in a future update.
                </p>
                <p className="text-off-white/70 text-sm mb-6">
                Currently, you can edit your preferences through the main profile page.
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
} 