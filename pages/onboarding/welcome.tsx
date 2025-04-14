import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import SelectionCard from '@/components/SelectionCard';
import OnboardingHeader from '@/components/OnboardingHeader';

// Define the goals options
const PRIMARY_GOALS = [
  { id: 'lose_weight', title: 'Lose Weight', description: 'Reduce body fat while maintaining muscle mass' },
  { id: 'maintain_weight', title: 'Maintain Weight', description: 'Keep your current weight while improving health' },
  { id: 'gain_muscle', title: 'Gain Muscle', description: 'Build muscle mass and strength' },
  { id: 'improve_health', title: 'Improve Health', description: 'Focus on overall health and well-being' },
  { id: 'improve_performance', title: 'Improve Performance', description: 'Enhance athletic performance and endurance' }
];

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function OnboardingWelcome({ user }: { user: User | null }) {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check authentication status and onboarding status
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[ONBOARDING UI] No user session found, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if user is coming from profile page (editing)
      if (router.query.edit === 'true') {
        setIsEditing(true);
        console.log('[ONBOARDING UI] User is editing preferences');
        return;
      }

      // Check if user has already completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`[ERROR] Failed to check onboarding status: ${profileError.message}`);
      } else if (profile?.onboarding_complete) {
        console.log('[ROUTE] User already onboarded, redirecting to profile');
        router.push('/profile');
      }

      // Load existing goal if available
      loadExistingGoal(session.user.id);
    };
    
    checkAuthAndOnboarding();
  }, [router]);

  // Load existing goal for the user
  const loadExistingGoal = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_goals_and_diets')
        .select('primary_goal')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error(`[ERROR] Failed to load existing goal: ${error.message}`);
      } else if (data?.primary_goal) {
        console.log(`[ONBOARDING UI] Found existing goal: ${data.primary_goal}`);
        setSelectedGoal(data.primary_goal);
      }
    } catch (err: any) {
      console.error(`[ERROR] Error loading existing goal: ${err.message}`);
    }
  };

  console.log('[ONBOARDING UI] Rendering welcome step');

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedGoal) {
      setError('Please select a goal to continue');
      return;
    }

    if (!user) {
      setError('Please log in to continue');
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[SUPABASE] Saving primary_goal=${selectedGoal} for user ${user.id}`);
      
      // Check if user already has an entry in user_goals_and_diets
      const { data: existingData, error: fetchError } = await supabase
        .from('user_goals_and_diets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }

      // Insert or update based on whether data exists
      let error;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_goals_and_diets')
          .update({ primary_goal: selectedGoal, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_goals_and_diets')
          .insert({ 
            user_id: user.id, 
            primary_goal: selectedGoal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        error = insertError;
      }

      if (error) {
        throw error;
      }

      console.log(`[SUPABASE] Successfully saved primary_goal for user ${user.id}`);
      
      // If editing preferences, redirect to profile
      if (isEditing) {
        console.log('[ROUTE] Returning to profile after editing');
        router.push('/profile');
        return;
      }
      
      // Otherwise continue to next onboarding step
      router.push('/onboarding/diet-type');
    } catch (err: any) {
      console.error(`[ERROR] Failed to save primary_goal: ${err.message}`);
      setError(`Failed to save your goal: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{isEditing ? 'Edit Preferences' : 'Welcome'} - NutriFlow</title>
      </Head>

      <div className="max-w-md mx-auto px-4 py-8">
        <OnboardingHeader 
          currentStep={1} 
          totalSteps={3} 
          hideBackButton={!isEditing}
        />
        
        <h1 className="text-2xl font-bold text-center mb-2">
          What's your primary goal?
        </h1>
        <p className="text-gray-600 text-center mb-8">
          We'll tailor your nutrition recommendations based on your goal.
        </p>

        <div className="space-y-1 mb-8">
          {PRIMARY_GOALS.map((goal) => (
            <SelectionCard
              key={goal.id}
              id={goal.id}
              title={goal.title}
              description={goal.description}
              selected={selectedGoal === goal.id}
              onSelect={() => handleGoalSelect(goal.id)}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={isLoading || !selectedGoal}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white
            ${(!selectedGoal || isLoading) 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Continue'}
        </button>
      </div>
    </div>
  );
} 