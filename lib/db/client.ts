/**
 * Database client initialization and configuration
 */
import { createClient } from '@supabase/supabase-js';
import { Tables, DbError } from '@/types/db';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validation to prevent empty credentials
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Convert error to a standardized format
 */
export function handleDbError(error: any): DbError {
  console.error('Database error:', error);

  return {
    code: error.code || 'unknown_error',
    message: error.message || 'An unknown database error occurred',
    details: error.details || undefined,
  };
}

/**
 * Check if Supabase connection is working
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Get all table names
 */
export function getTableNames(): string[] {
  return Object.values(Tables);
}

/**
 * Get a query builder for a specific table with type safety
 */
export function table<T>(tableName: Tables) {
  return supabase.from<T>(tableName);
}

// Export the client as default and named export
export { supabase };
export default supabase; 