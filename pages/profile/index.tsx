import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

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
  onboarding_complete: boolean;
  created_at: string;
  updated_at?: string;
}

interface UserGoals {
  primary_goal?: string;
  diet_preference?: string;
}

export default function Profile({ user }: { user: User | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[PROFILE] No user session found, redirecting to login');
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`[PROFILE] Loading data for user ${user.id}`);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error(`[ERROR] Failed to load profile: ${profileError.message}`);
          setError(`Failed to load profile data`);
        } else {
          console.log(`[PROFILE] Profile data loaded: ${JSON.stringify(profileData || {})}`);
          setProfile(profileData || { 
            id: user.id,
            onboarding_complete: false, 
            created_at: new Date().toISOString() 
          });
        }
        
        // Fetch user goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals_and_diets')
          .select('primary_goal, diet_preference')
          .eq('user_id', user.id)
          .single();
        
        if (goalsError && goalsError.code !== 'PGRST116') {
          console.error(`[ERROR] Failed to load goals: ${goalsError.message}`);
          setError(`Failed to load preferences data`);
        } else {
          console.log(`[PROFILE] Goal preferences loaded: ${JSON.stringify(goalsData || {})}`);
          setGoals(goalsData || {});
        }
        
        console.log('[PROFILE] Successfully loaded user data');
      } catch (err: any) {
        console.error(`[ERROR] Error loading user data: ${err.message}`);
        setError(`Error loading your profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const handleEditPreferences = () => {
    router.push('/onboarding/welcome?edit=true');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatGoal = (goal?: string) => {
    if (!goal) return 'Not set';
    return goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!user) {
    return null; // Don't render if not authenticated
  }

  const renderProfileContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-4">
          <p className="text-gray-600">[LOADING] Loading profile data...</p>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
      );
    }

    if (!profile && !goals) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-600">No profile data found. Please complete the onboarding process.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Start Onboarding
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="space-y-6">
          {/* User Account Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">User ID</span>
                <span className="text-sm font-medium text-gray-700">{user.id.substring(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-700">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Onboarding Status</span>
                <span className={`text-sm font-medium ${profile?.onboarding_complete ? 'text-green-600' : 'text-orange-500'}`}>
                  {profile?.onboarding_complete ? 'Completed' : 'Not Completed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Profile Created</span>
                <span className="text-sm font-medium text-gray-700">{formatDate(profile?.created_at)}</span>
              </div>
              {profile?.updated_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Updated</span>
                  <span className="text-sm font-medium text-gray-700">{formatDate(profile.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* User Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Your Preferences</h3>
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <p className="text-sm text-gray-500">Primary Goal</p>
                <p className="font-medium">{formatGoal(goals?.primary_goal)}</p>
              </div>
              
              <div className="border rounded-md p-4">
                <p className="text-sm text-gray-500">Diet Preference</p>
                <p className="font-medium">{formatGoal(goals?.diet_preference)}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleEditPreferences}
                  className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md text-sm font-medium hover:bg-blue-50"
                >
                  Edit Preferences
                </button>
                
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Your Profile - NutriFlow</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">NutriFlow</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                supabase.auth.signOut();
                router.push('/login');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Profile header */}
          <div className="bg-blue-700 px-6 py-8">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                {user.user_metadata?.full_name ? 
                  user.user_metadata.full_name.charAt(0).toUpperCase() : 
                  user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4 text-white">
                <h2 className="text-xl font-bold">{user.user_metadata?.full_name || 'User'}</h2>
                <p className="text-blue-200">{user.email}</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-6">
            {renderProfileContent()}
          </div>
        </div>
        
        {/* App features section */}
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => router.push('/scan')}
                className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900">Scan Food</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Scan food labels to get nutritional insights
                </p>
              </div>
              
              <div 
                onClick={() => router.push('/scan/history')}
                className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900">Meal History</h4>
                <p className="text-sm text-gray-500 mt-1">
                  View your meal history and nutrition data
                </p>
              </div>
              
              <div 
                onClick={() => router.push('/results')}
                className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900">Recommendations</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Get personalized food recommendations
                </p>
              </div>
              
              <div 
                onClick={() => router.push('/profile/settings')}
                className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
              >
                <h4 className="font-medium text-gray-900">Settings</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your app preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 