import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // Use service key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Ensure RLS is enabled on user_profile table
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      return res.status(500).json({ error: rlsError.message });
    }

    // 2. Create selection policy for user_profile
    const { error: selectPolicyError } = await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          -- Drop existing policy if exists to recreate it
          DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
          
          -- Create the policy 
          CREATE POLICY "Users can view their own profile" 
          ON public.user_profile 
          FOR SELECT 
          USING (auth.uid() = id);
        END
        $$;
      `
    });

    if (selectPolicyError) {
      console.error('Error creating select policy:', selectPolicyError);
      return res.status(500).json({ error: selectPolicyError.message });
    }

    // 3. Create update policy for user_profile
    const { error: updatePolicyError } = await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          -- Drop existing policy if exists to recreate it
          DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
          
          -- Create the policy
          CREATE POLICY "Users can update their own profile" 
          ON public.user_profile 
          FOR UPDATE 
          USING (auth.uid() = id);
        END
        $$;
      `
    });

    if (updatePolicyError) {
      console.error('Error creating update policy:', updatePolicyError);
      return res.status(500).json({ error: updatePolicyError.message });
    }

    // 4. Create insert policy for user_profile (if needed)
    const { error: insertPolicyError } = await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          -- Drop existing policy if exists to recreate it
          DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
          
          -- Create the policy
          CREATE POLICY "Users can insert their own profile" 
          ON public.user_profile 
          FOR INSERT 
          WITH CHECK (auth.uid() = id);
        END
        $$;
      `
    });

    if (insertPolicyError) {
      console.error('Error creating insert policy:', insertPolicyError);
      return res.status(500).json({ error: insertPolicyError.message });
    }

    // 5. Add plan_type column if it doesn't exist
    const { error: columnError } = await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          -- Add plan_type column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_profile' 
            AND column_name = 'plan_type'
          ) THEN
            ALTER TABLE public.user_profile ADD COLUMN plan_type TEXT;
          END IF;
        END
        $$;
      `
    });

    if (columnError) {
      console.error('Error adding plan_type column:', columnError);
      return res.status(500).json({ error: columnError.message });
    }

    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'RLS policies created successfully for user_profile table' 
    });
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return res.status(500).json({ error: error.message });
  }
} 