/**
 * This script creates just the dish table needed for the tests
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// --- SUPABASE CONFIGURATION ---
// Read environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: Missing Supabase environment variables');
  console.error('  Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('Creating dish table in Supabase...');

// Simple function to run raw SQL
async function runSQL(sql) {
  try {
    // For Supabase JavaScript client, we'll use the REST API to run SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      console.error(`Failed to execute SQL: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

// Run the function to create the dish table
(async () => {
  try {
    console.log('Checking if dish table exists...');
    
    // First use to_regclass to check if table exists (safer than information_schema in some setups)
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/to_regclass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        args: {
          rel: 'public.dish'
        }
      })
    });
    
    if (!checkResponse.ok) {
      console.error('Error checking if dish table exists, will attempt to create anyway');
    } else {
      const result = await checkResponse.json();
      if (result) {
        console.log('Dish table already exists, skipping creation');
        process.exit(0);
      }
    }
    
    // Table doesn't exist, create it
    console.log('Creating dish table...');
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.dish (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scan_id UUID REFERENCES public.menu_scan(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC,
      category TEXT,
      dietary_tags TEXT,
      health_score NUMERIC,
      ai_analysis TEXT,
      nutrition_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE
    );
    
    ALTER TABLE public.dish ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view dishes from their own scans"
    ON public.dish
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.menu_scan ms
      WHERE ms.id = dish.scan_id
      AND ms.user_id = auth.uid()
    ));
    `;
    
    // Use Supabase dashboard SQL editor to run this SQL
    console.log('Please run the following SQL in the Supabase dashboard SQL editor:');
    console.log('\n----------------------------');
    console.log(createTableSQL);
    console.log('----------------------------\n');
    
    // Attempt to create the table using the REST API
    console.log('Trying to create dish table via REST API (may not work)...');
    
    try {
      // For REST API, we need to split the SQL statements
      const createTableResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: createTableSQL
        })
      });
      
      if (createTableResponse.ok) {
        console.log('✅ Successfully created dish table!');
      } else {
        console.error('❌ Failed to create dish table via REST API');
        console.error('Please use the SQL above in the Supabase dashboard SQL editor');
      }
    } catch (error) {
      console.error('Error creating dish table:', error);
      console.error('Please use the SQL above in the Supabase dashboard SQL editor');
    }
    
    console.log('\nFor the test to work, please make sure the dish table exists!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
})(); 