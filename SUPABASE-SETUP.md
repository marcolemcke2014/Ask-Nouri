# Supabase Integration for NutriFlow

## Issues Identified

After extensive testing, we've identified the following issues with our Supabase integration:

1. **API Key Permissions**:
   - We were using an anonymous (`anon`) API key, which has limited permissions
   - For server-side operations, we need to use a `service_role` key

2. **Database Constraints**:
   - The `menu_scan` table has a foreign key constraint to the `user_profile` table
   - We need a valid user profile entry before we can insert scan data

3. **Row Level Security (RLS)**:
   - RLS policies are properly configured but blocking our test inserts
   - The service role key can bypass these policies

## Solution

To make our OCR pipeline work with Supabase, we need to:

1. **Use the service_role key**:
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the `service_role` key (NOT the anon key)
   - Update the `.env.local` file with this key:
     ```
     SUPABASE_SERVICE_KEY=your-service-role-key-here
     ```