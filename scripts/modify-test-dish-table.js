/**
 * This script modifies the dish table to allow testing
 * It makes the scan_id column nullable to allow for simple tests
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// --- SUPABASE CONFIGURATION ---
// Read environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: Missing Supabase environment variables');
  console.error('  Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('Modifying dish table for testing...');

// Modify the dish table
(async () => {
  try {
    // Create a test dish to verify if the table exists and is accessible
    console.log('Testing if dish table exists and is accessible...');
    
    // Insert a test dish with NULL scan_id
    const { data, error } = await supabase
      .from('dish')
      .insert({
        name: 'Test Dish for Validation',
        description: 'This dish was created to test table access',
        price: 9.99,
        category: 'TEST',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      if (error.code === '23502' && error.message.includes('null value in column "scan_id"')) {
        // This is good - table exists but scan_id is NOT NULL, so we need to modify it
        console.log('Dish table exists but scan_id is NOT NULL. Modifying table...');
        
        // Show SQL to modify the table
        const alterTableSQL = `
        -- Make scan_id nullable for testing
        ALTER TABLE public.dish ALTER COLUMN scan_id DROP NOT NULL;
        
        -- Add a test dish
        INSERT INTO public.dish (
          name, 
          description, 
          price, 
          category, 
          created_at
        ) VALUES (
          'Test Dish',
          'This is a test dish that does not belong to any scan',
          9.99,
          'TEST',
          NOW()
        );
        `;
        
        console.log('\nPlease run the following SQL in the Supabase dashboard SQL editor:');
        console.log('\n----------------------------');
        console.log(alterTableSQL);
        console.log('----------------------------\n');
        
        console.log('\nAfter running the SQL, you can run the OCR test.');
      } else if (error.code === '42P01' && error.message.includes('relation "dish" does not exist')) {
        // Table doesn't exist
        console.error('❌ ERROR: The dish table does not exist!');
        console.error('Please run the create-dish-table.js script first');
      } else {
        // Some other error
        console.error('❌ ERROR:', error.message);
      }
    } else {
      // Insert succeeded, which means scan_id is already nullable
      console.log('✅ Dish table is properly configured for testing!');
      console.log(`Created test dish with ID: ${data[0].id}`);
      console.log('You can now run the OCR test.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
})(); 