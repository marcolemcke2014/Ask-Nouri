'use client'; // Ensure present

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import { User as AuthUser } from '@supabase/supabase-js'; // Rename to avoid clash
import { User as UserIcon, Edit3, Settings, ScanLine, History as HistoryIcon, FileText, LogOut, Info } from 'lucide-react'; // Added icons

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  id: string;
  created_at: string;
  email: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  auth_provider?: string | null;
  plan_type?: string | null;
  updated_at?: string | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  scan_count_this_period?: number | null;
  scan_period_start_date?: string | null;
  onboarding_complete: boolean;
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  gender?: string | null;
  health_conditions?: string[] | null;
  food_avoidances?: string[] | null;
  food_dislikes?: string | null;
  eating_habits?: string | null;
  activity_level?: string | null;
}

interface UserGoals {
  primary_goal?: string | null;
  eating_styles?: string[] | null;
}

// --- Styles from STYLE_GUIDE.md ---
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5"; 
const buttonSecondaryStyle = "px-4 py-2 border border-off-white/30 text-off-white/80 rounded-lg text-sm hover:bg-off-white/10 transition-colors";
const featureCardStyle = "block w-full p-4 border rounded-lg text-left transition-colors duration-150 bg-off-white/10 border-off-white/20 text-off-white/80 hover:bg-off-white/20";
const errorBoxStyle = "mt-4 p-4 bg-red-700/20 border border-red-500/30 text-red-200 rounded-lg text-sm";
// ---

export default function ProfilePage({ user: authUserProp }: { user: AuthUser | null }) { 
  const router = useRouter();
  // Use state for user, fetch if not passed or null
  const [user, setUser] = useState<AuthUser | null>(authUserProp);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user session if not passed as prop (or potentially refresh)
  useEffect(() => {
    const fetchUser = async () => {
      if (user) { // Already have user from prop or previous fetch
          setLoading(false);
          return; 
      }
      console.log('[Profile] Fetching user session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user as AuthUser);
      } else {
        console.error('[Profile] No user session found, redirecting.');
        router.replace('/auth/login');
      }
      // Keep loading true until data fetch also completes
    };
    fetchUser();
  }, [user, router]); // Re-run if user prop changes?

  // Fetch user data (profile, goals)
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return; // Only run if user state is set
      
      setLoading(true);
      setError(null);
      try {
        console.log(`[Profile] Loading data for user ${user.id}`);
        // Fetch profile and goals in parallel
        const [profileResult, goalsResult] = await Promise.all([
            supabase.from('user_profile').select('*').eq('id', user.id).maybeSingle(),
            supabase.from('user_goals_and_diets').select('primary_goal, eating_styles').eq('user_id', user.id).maybeSingle()
        ]);

        if (profileResult.error && profileResult.error.code !== 'PGRST116') {
             console.error('[Profile] Error loading profile:', profileResult.error);
             setError('Failed to load profile data.');
        } else {
             setProfile(profileResult.data);
        }

        if (goalsResult.error && goalsResult.error.code !== 'PGRST116') {
             console.error('[Profile] Error loading goals:', goalsResult.error);
             // Don't overwrite profile error if it occurred
             if (!error) setError('Failed to load preferences data.');
        } else {
             setGoals(goalsResult.data);
        }
        console.log('[Profile] Successfully loaded user data');
      } catch (err: any) {
        console.error(`[Profile] Error loading user data: ${err.message}`);
        setError(`Error loading your profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user]); // Re-run when user state is available

  const handleEditPreferences = () => {
    router.push('/onboarding/welcome?edit=true');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatGoal = (goal?: string | null) => {
    if (!goal) return 'Not set';
    return goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatList = (list?: string[] | null): string => {
    if (!list || list.length === 0) return 'Not set';
    return list.join(', ');
  };

  const handleLogout = async () => {
    console.log('[Profile] User signing out...');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Loading State
  if (loading) {
       return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] text-off-white p-4">
              <div className="w-10 h-10 border-t-2 border-b-2 border-green-300 rounded-full animate-spin mb-4"></div>
              <p>Loading profile...</p>
          </div>
      );
  }

  // Handle case where user is null after loading (shouldn't happen if redirect works)
  if (!user) {
       return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] text-off-white p-4">
             <p>User not found. Redirecting...</p>
          </div>
      );
  }

  return (
     // Apply guide background and font
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      <Head>
        <title>Your Profile - NutriFlow</title>
      </Head>
      
      {/* Header - Simplified & Styled */}
      <header className="sticky top-0 z-10 bg-[#14532D]/80 backdrop-blur-sm border-b border-off-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-light text-off-white">Your Profile</h1>
          <button
              onClick={handleLogout}
              className="p-1.5 rounded-full text-off-white/80 hover:bg-white/10 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <main className="flex-grow max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full">
        <div className="space-y-6">
            {/* Profile Header Card */} 
             <div className={`${cardStyle} flex items-center space-x-4`}>
                 <div className="h-16 w-16 rounded-full bg-green-700 flex items-center justify-center text-white text-2xl font-medium flex-shrink-0">
                    {user.user_metadata?.full_name ? 
                    user.user_metadata.full_name.charAt(0).toUpperCase() : 
                    user.email?.charAt(0).toUpperCase() || '?'}
                 </div>
                 <div className="flex-grow overflow-hidden">
                    <h2 className="text-lg font-medium text-off-white truncate">{user.user_metadata?.full_name || 'User'}</h2>
                    <p className="text-sm text-off-white/70 truncate">{user.email}</p>
                 </div>
                 <button 
                    onClick={() => router.push('/profile/edit')} 
                    className={buttonSecondaryStyle + " flex-shrink-0"} // Use secondary style
                    aria-label="Edit Profile"
                 >
                     <Edit3 size={16} className="mr-1"/> Edit
                 </button>
             </div>

            {/* Error Display */}
            {error && (
                <div className={errorBoxStyle}>
                  <Info size={18} className="inline-block mr-2"/> {error}
                </div>
            )}

            {/* Preferences Card */} 
            <div className={cardStyle}>
                <h3 className="text-lg font-light text-off-white mb-4">Your Preferences</h3>
                <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-off-white/70">Primary Goal:</span>
                        <span className="font-medium text-off-white/90 text-right">{formatGoal(goals?.primary_goal)}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-off-white/70">Eating Styles:</span>
                        <span className="font-medium text-off-white/90 text-right">{formatList(goals?.eating_styles)}</span>
                     </div>
                     { /* Add more profile details from user_profile here if needed */ }
                     <div className="flex justify-between">
                        <span className="text-off-white/70">Food Dislikes:</span>
                        <span className="font-medium text-off-white/90 text-right">{profile?.food_dislikes || 'Not set'}</span>
                     </div>
                      <div className="flex justify-between">
                        <span className="text-off-white/70">Eating Habits:</span>
                        <span className="font-medium text-off-white/90 text-right">{profile?.eating_habits || 'Not set'}</span>
                     </div>
                      <div className="flex justify-between">
                        <span className="text-off-white/70">Activity Level:</span>
                        <span className="font-medium text-off-white/90 text-right">{profile?.activity_level || 'Not set'}</span>
                     </div>
                      <div className="flex justify-between">
                        <span className="text-off-white/70">Onboarding:</span>
                        <span className={`font-medium ${profile?.onboarding_complete ? 'text-green-300' : 'text-orange-400'}`}>{profile?.onboarding_complete ? 'Completed' : 'Not Completed'}</span>
                     </div>
                     {/* Add DOB, height, weight, gender if desired */}
                </div>
                <div className="mt-4">
                     <button 
                        onClick={() => router.push('/onboarding/step2-basics')} 
                        className={buttonSecondaryStyle + " w-full"}
                    > 
                        <Edit3 size={16} className="mr-1"/> Edit Preferences
                    </button>
                </div>
            </div>

            {/* App Features Card */}
            <div className={cardStyle}>
                <h3 className="text-lg font-light text-off-white mb-4">App Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[ 
                    { label: 'Scan Food', icon: ScanLine, path: '/scan/index' },
                    { label: 'Meal History', icon: HistoryIcon, path: '/history/index' },
                    { label: 'Recommendations', icon: FileText, path: '/results/index' },
                    { label: 'Settings', icon: Settings, path: '/profile/settings' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                         <button key={item.path} onClick={() => router.push(item.path)} className={featureCardStyle}>
                            <Icon size={20} className="mb-1.5 text-green-300"/>
                            <h4 className="font-medium text-sm text-off-white/90">{item.label}</h4>
                         </button>
                    );
                  })}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
} 