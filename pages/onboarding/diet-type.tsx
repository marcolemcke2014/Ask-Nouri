import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import OnboardingHeader from '../../components/OnboardingHeader';
import SelectionCard from '../../components/SelectionCard';

// Define the diet type options
const DIET_PREFERENCES = [
  { id: 'balanced', title: 'Balanced', description: 'A mix of all food groups with moderate portions' },
  { id: 'low_carb', title: 'Low-Carb', description: 'Reduced carbohydrates, higher protein and fat' },
  { id: 'high_protein', title: 'High-Protein', description: 'Protein-focused diet to support muscle growth and recovery' },
  { id: 'vegetarian', title: 'Vegetarian', description: 'Plant-based foods with dairy and eggs' },
  { id: 'vegan', title: 'Vegan', description: 'Exclusively plant-based foods' }
];

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function OnboardingDietType({ user }: { user: User | null }) {
  const router = useRouter();
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
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
        loadExistingDiet(session.user.id);
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
      } else {
        // Load existing diet preference if available
        loadExistingDiet(session.user.id);
      }
    };
    
    checkAuthAndOnboarding();
  }, [router]);

  // Load existing diet preference for the user
  const loadExistingDiet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_goals_and_diets')
        .select('diet_preference')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error(`[ERROR] Failed to load existing diet preference: ${error.message}`);
      } else if (data?.diet_preference) {
        console.log(`[ONBOARDING UI] Found existing diet preference: ${data.diet_preference}`);
        setSelectedDiet(data.diet_preference);
      }
    } catch (err: any) {
      console.error(`[ERROR] Error loading existing diet preference: ${err.message}`);
    }
  };

  console.log('[ONBOARDING UI] Rendering diet preference step');

  const handleDietSelect = (dietId: string) => {
    setSelectedDiet(dietId);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedDiet) {
      setError('Please select a diet preference to continue');
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
      console.log(`[SUPABASE] Saving diet_preference=${selectedDiet} for user ${user.id}`);
      
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
          .update({ diet_preference: selectedDiet, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_goals_and_diets')
          .insert({ 
            user_id: user.id, 
            diet_preference: selectedDiet,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        error = insertError;
      }

      if (error) {
        throw error;
      }

      console.log(`[SUPABASE] Successfully saved diet_preference for user ${user.id}`);
      
      // If editing preferences, redirect to profile
      if (isEditing) {
        console.log('[ROUTE] Returning to profile after editing');
        router.push('/profile');
        return;
      }
      
      // Otherwise continue to completion page
      console.log('[ROUTE] Proceeding to completion page');
      router.push('/onboarding/complete');
    } catch (err: any) {
      console.error(`[ERROR] Failed to save diet_preference: ${err.message}`);
      setError(`Failed to save your diet preference: ${err.message}`);
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
        <title>{isEditing ? 'Edit Preferences' : 'Diet Preferences'} - NutriFlow</title>
      </Head>

      <div className="max-w-md mx-auto px-4 py-8">
        <OnboardingHeader 
          currentStep={2} 
          totalSteps={3} 
          hideBackButton={false}
        />
        
        <h1 className="text-2xl font-bold text-center mb-2">
          What's your preferred diet type?
        </h1>
        <p className="text-gray-600 text-center mb-8">
          This helps us suggest appropriate meal options for you.
        </p>

        <div className="space-y-1 mb-8">
          {DIET_PREFERENCES.map((diet) => (
            <SelectionCard
              key={diet.id}
              id={diet.id}
              title={diet.title}
              description={diet.description}
              selected={selectedDiet === diet.id}
              onSelect={() => handleDietSelect(diet.id)}
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
          disabled={isLoading || !selectedDiet}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white
            ${(!selectedDiet || isLoading) 
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