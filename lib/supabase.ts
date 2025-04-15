import { createClient } from '@supabase/supabase-js';

// Extract environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.SUPABASE_KEY!; // INCORRECT: This uses the service key, unsafe for frontend!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // CORRECT: Use the public anon key for the frontend client

// Log configuration details for debugging
console.log('[Supabase] Initializing client with URL:', supabaseUrl);
console.log(`[Supabase Debug] Value of supabaseKey before createClient: --${supabaseKey}--`);
// console.log('[Supabase] API key defined:', !!supabaseKey); // Less useful now
// console.log('[Supabase] API key starts with:', supabaseKey?.substring(0, 12)); // Less useful now

// Set client options for improved stability
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'nutriflow-api',
    },
  }
};

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Test connection
(async () => {
  try {
    const { error } = await supabase.from('menu_scan').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
    } else {
      console.log('[Supabase] Connection test successful!');
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Supabase] Connection test exception:', error.message);
  }
})(); 