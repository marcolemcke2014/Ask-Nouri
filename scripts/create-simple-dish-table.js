/**
 * This script creates a simplified dish table for testing using the Supabase API
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

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Main function
async function main() {
  try {
    console.log('Setting up test environment for OCR test...');
    
    // Step 1: Check if we can access menu_scan table
    console.log('Testing access to menu_scan table...');
    const { error: scanError } = await supabase
      .from('menu_scan')
      .select('id')
      .limit(1);
    
    if (scanError && scanError.code === '42P01') {
      console.error('❌ ERROR: menu_scan table does not exist');
      console.error('Please set up the menu_scan table first');
      return false;
    }
    
    console.log('✅ menu_scan table is accessible');
    
    // Step 2: Check if the dish table exists
    console.log('Checking if dish table exists...');
    const { error: dishError } = await supabase
      .from('dish')
      .select('id')
      .limit(1);
    
    // If dish table already exists
    if (!dishError || dishError.code !== '42P01') {
      console.log('✅ dish table already exists');
      
      // Skip the rest of the tests
      return true;
    }
    
    console.log('❌ dish table does not exist');
    console.log('To create the dish table, please run the following SQL in the Supabase dashboard SQL editor:');
    
    const createTableSQL = `
    -- Create extension for UUID support
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create a simple dish table for testing
    CREATE TABLE public.dish (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      scan_id UUID NULL, -- Allow NULL for easier testing
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC,
      category TEXT,
      dietary_tags TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add a foreign key reference to menu_scan, but allow it to be NULL
    ALTER TABLE public.dish 
    ADD CONSTRAINT dish_scan_id_fkey 
    FOREIGN KEY (scan_id) 
    REFERENCES public.menu_scan(id) 
    ON DELETE SET NULL;
    
    -- Enable row level security but with a very permissive policy for testing
    ALTER TABLE public.dish ENABLE ROW LEVEL SECURITY;
    
    -- Policy that allows selection of all dishes for testing
    CREATE POLICY "Allow all operations for testing"
    ON public.dish
    FOR ALL
    USING (true)
    WITH CHECK (true);
    
    -- Create a test dish to ensure table works
    INSERT INTO public.dish (name, description, price, category)
    VALUES ('Test Dish', 'This is a test dish', 9.99, 'TEST');
    `;
    
    console.log('\n----------------------------');
    console.log(createTableSQL);
    console.log('----------------------------\n');
    
    // Since we can't directly create tables with the JavaScript SDK,
    // we need to rely on the user executing the SQL
    
    console.log('Once you have created the dish table, run the OCR test again.');
    return false;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Run the main function
main()
  .then(success => {
    if (success) {
      console.log('✅ Test environment is ready!');
      console.log('You can now run the OCR test with:');
      console.log('  npm run test:e2e-ocr');
    } else {
      console.log('❌ Test environment setup incomplete.');
      console.log('Please follow the instructions above to complete setup.');
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 