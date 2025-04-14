/**
 * This script creates the necessary tables in Supabase for testing
 * Run this script before running the end-to-end OCR test
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

// Log with colors
function log(level, message, details = null) {
  const timestamp = new Date().toISOString();
  const COLOR = {
    INFO: '\x1b[36m%s\x1b[0m',    // Cyan
    SUCCESS: '\x1b[32m%s\x1b[0m',  // Green
    WARN: '\x1b[33m%s\x1b[0m',     // Yellow
    ERROR: '\x1b[31m%s\x1b[0m',    // Red
    SQL: '\x1b[35m%s\x1b[0m'       // Purple
  };
  
  console.log(COLOR[level] || COLOR.INFO, `[${timestamp}] [${level}]`, message);
  if (details) {
    if (typeof details === 'object') {
      console.log(JSON.stringify(details, null, 2));
    } else {
      console.log(details);
    }
  }
}

// Execute SQL with Supabase
async function executeSQL(statement, params = {}) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_statement: statement,
      params: params
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    // Check if the exec_sql function doesn't exist
    if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
      // Fall back to direct queries (less safe but might work for simple DDL)
      log('WARN', 'exec_sql function not found, attempting direct query (limited functionality)');
      
      try {
        // For CREATE TABLE queries, we can't use the Supabase JS client directly
        // Instead, we'll try to use a different approach
        log('WARN', 'To create tables, please run the SQL scripts directly in the Supabase SQL editor');
        log('SQL', statement);
        
        return { 
          success: false, 
          manual: true, 
          sql: statement,
          error: 'Tables need to be created manually in Supabase SQL editor'
        };
      } catch (directError) {
        log('ERROR', 'Failed to execute SQL directly', directError);
        return { success: false, error: directError };
      }
    }
    
    log('ERROR', 'Failed to execute SQL', error);
    return { success: false, error };
  }
}

// Check if a table exists
async function tableExists(tableName) {
  try {
    // Direct query to check if table exists
    const { data, error } = await supabase.rpc('table_exists', {
      table_name: tableName
    });
    
    if (error) {
      // RPC function doesn't exist, try a different approach
      log('WARN', `Function table_exists not found, trying alternative check for ${tableName}`);
      
      // Try a simple select with limit 0 to see if table exists
      const { error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (selectError && (selectError.code === '42P01' || selectError.message?.includes('does not exist'))) {
        return false;
      } else if (selectError) {
        // Could be permissions issue, but table exists
        log('WARN', `Error checking ${tableName}, but table may exist`, selectError);
        return true;
      }
      
      return true;
    }
    
    return data;
  } catch (error) {
    // If any exception happens, assume table doesn't exist
    log('WARN', `Exception checking if table ${tableName} exists, assuming it doesn't`, error);
    return false;
  }
}

// Create the tables
async function createTables() {
  log('INFO', '=== CREATING TEST TABLES IN SUPABASE ===');
  
  // Check Supabase connection
  try {
    // Simple check that doesn't rely on any specific table
    const { data, error } = await supabase.rpc('current_database');
    if (error) {
      log('ERROR', 'Failed to connect to Supabase', error);
      return false;
    }
    log('SUCCESS', 'Connected to Supabase database:', data);
  } catch (error) {
    // Try a different approach
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        log('ERROR', 'Failed to connect to Supabase', error);
        return false;
      }
      log('SUCCESS', 'Connected to Supabase');
    } catch (error) {
      log('ERROR', 'Failed to connect to Supabase', error);
      return false;
    }
  }
  
  // Create user_profile table if it doesn't exist
  if (!(await tableExists('user_profile'))) {
    log('INFO', 'Creating user_profile table');
    
    const createUserProfileSQL = `
    CREATE TABLE IF NOT EXISTS public.user_profile (
      id UUID PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE
    );
    
    ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own profile"
    ON public.user_profile
    FOR SELECT
    USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profile"
    ON public.user_profile
    FOR UPDATE
    USING (auth.uid() = id);
    `;
    
    const userProfileResult = await executeSQL(createUserProfileSQL);
    if (!userProfileResult.success && !userProfileResult.manual) {
      log('ERROR', 'Failed to create user_profile table');
      return false;
    }
    
    if (userProfileResult.manual) {
      log('WARN', 'Please create the user_profile table manually using the SQL above');
    } else {
      log('SUCCESS', 'Created user_profile table');
    }
  } else {
    log('INFO', 'user_profile table already exists');
  }
  
  // Create menu_scan table if it doesn't exist
  if (!(await tableExists('menu_scan'))) {
    log('INFO', 'Creating menu_scan table');
    
    const createMenuScanSQL = `
    CREATE TABLE IF NOT EXISTS public.menu_scan (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES public.user_profile(id),
      menu_raw_text TEXT,
      scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      restaurant_name TEXT,
      location TEXT,
      health_score NUMERIC,
      ocr_method TEXT,
      scan_method TEXT,
      device_type TEXT,
      ai_summary TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE public.menu_scan ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own scans"
    ON public.menu_scan
    FOR SELECT
    USING (auth.uid() = user_id);
    `;
    
    const menuScanResult = await executeSQL(createMenuScanSQL);
    if (!menuScanResult.success && !menuScanResult.manual) {
      log('ERROR', 'Failed to create menu_scan table');
      return false;
    }
    
    if (menuScanResult.manual) {
      log('WARN', 'Please create the menu_scan table manually using the SQL above');
    } else {
      log('SUCCESS', 'Created menu_scan table');
    }
  } else {
    log('INFO', 'menu_scan table already exists');
  }
  
  // Create dish table if it doesn't exist
  if (!(await tableExists('dish'))) {
    log('INFO', 'Creating dish table');
    
    const createDishSQL = `
    CREATE TABLE IF NOT EXISTS public.dish (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    const dishResult = await executeSQL(createDishSQL);
    if (!dishResult.success && !dishResult.manual) {
      log('ERROR', 'Failed to create dish table');
      return false;
    }
    
    if (dishResult.manual) {
      log('WARN', 'Please create the dish table manually using the SQL above');
    } else {
      log('SUCCESS', 'Created dish table');
    }
  } else {
    log('INFO', 'dish table already exists');
  }
  
  // Create save_menu_scan database function
  log('INFO', 'Creating save_menu_scan database function');
  
  const createFunctionSQL = `
  CREATE OR REPLACE FUNCTION public.save_menu_scan(
    p_scan_id UUID,
    p_user_id UUID,
    p_menu_raw_text TEXT,
    p_restaurant_name TEXT,
    p_restaurant_location TEXT,
    p_ocr_method TEXT,
    p_categories JSONB
  ) RETURNS JSONB AS $$
  DECLARE
    v_category JSONB;
    v_dish JSONB;
    v_dish_id UUID;
    v_category_name TEXT;
    v_dish_count INT := 0;
    v_result JSONB;
  BEGIN
    -- Insert the scan record
    INSERT INTO public.menu_scan (
      id, 
      user_id, 
      menu_raw_text, 
      scanned_at,
      restaurant_name,
      location,
      ocr_method
    ) VALUES (
      p_scan_id,
      p_user_id,
      p_menu_raw_text,
      NOW(),
      p_restaurant_name,
      p_restaurant_location,
      p_ocr_method
    );
    
    -- Insert each dish
    FOR v_category_index IN 0..jsonb_array_length(p_categories) - 1 LOOP
      v_category := p_categories->v_category_index;
      v_category_name := v_category->>'name';
      
      -- Process dishes in this category
      FOR v_dish_index IN 0..jsonb_array_length(v_category->'dishes') - 1 LOOP
        v_dish := v_category->'dishes'->v_dish_index;
        
        -- Insert dish
        INSERT INTO public.dish (
          scan_id,
          name,
          description,
          price,
          category,
          dietary_tags,
          created_at
        ) VALUES (
          p_scan_id,
          v_dish->>'name',
          COALESCE(v_dish->>'description', ''),
          (v_dish->>'price')::NUMERIC,
          v_category_name,
          CASE 
            WHEN jsonb_array_length(v_dish->'dietary_tags') > 0 
            THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_dish->'dietary_tags')), ',')
            ELSE NULL
          END,
          NOW()
        )
        RETURNING id INTO v_dish_id;
        
        v_dish_count := v_dish_count + 1;
      END LOOP;
    END LOOP;
    
    -- Prepare result
    v_result := jsonb_build_object(
      'scan_id', p_scan_id,
      'dish_count', v_dish_count,
      'success', true
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'scan_id', p_scan_id
      );
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const functionResult = await executeSQL(createFunctionSQL);
  if (!functionResult.success && !functionResult.manual) {
    log('ERROR', 'Failed to create save_menu_scan function');
  } else if (functionResult.manual) {
    log('WARN', 'Please create the save_menu_scan function manually using the SQL above');
  } else {
    log('SUCCESS', 'Created save_menu_scan function');
  }
  
  // Create function_exists helper function
  log('INFO', 'Creating function_exists helper function');
  
  const helperFunctionSQL = `
  CREATE OR REPLACE FUNCTION public.function_exists(function_name TEXT)
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = function_name
    );
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const helperResult = await executeSQL(helperFunctionSQL);
  if (!helperResult.success && !helperResult.manual) {
    log('ERROR', 'Failed to create function_exists helper function');
  } else if (helperResult.manual) {
    log('WARN', 'Please create the function_exists helper function manually using the SQL above');
  } else {
    log('SUCCESS', 'Created function_exists helper function');
  }
  
  log('INFO', '=== TABLE CREATION COMPLETE ===');
  log('INFO', 'If any tables or functions needed to be created manually, please do so before running the test');
  
  return true;
}

// Main function
async function main() {
  try {
    const success = await createTables();
    
    if (success) {
      log('SUCCESS', 'Table setup successful! You can now run the OCR test.');
    } else {
      log('ERROR', 'Table setup had issues. Please review the errors above.');
    }
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    log('ERROR', 'Unexpected error during table setup', error);
    process.exit(1);
  }
}

// Run the script
main(); 