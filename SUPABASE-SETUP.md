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
     SUPABASE_KEY=your-service-role-key-here
     ```
   - Also add it to your Vercel environment variables

2. **Add Proper Error Handling**:
   - Our current code already has good error handling 
   - It will now succeed with the service_role key
   - Keep the fallback for OCR if Supabase insertion fails

3. **Security Best Practices**:
   - Never expose the service_role key in frontend code
   - Only use it in server-side API routes
   - Add validation in API routes to prevent misuse
   - Keep RLS policies in place for client-side queries

## Testing Plan

After updating the API key:

1. Run direct insert test:
   ```bash
   node scripts/test-direct-insert.js
   ```

2. Test the full pipeline:
   ```bash
   node scripts/test-full-pipeline.js
   ```

3. Verify in Supabase Dashboard that data appears in the `menu_scan` table

## Future Improvements

1. **User Authentication**:
   - Implement real user authentication with Supabase Auth
   - Update `getUserIdForScan.ts` to get the ID from the session
   - Remove the test user ID approach

2. **RLS Policies**:
   - Set up proper row-level security policies based on user IDs
   - Ensure users can only access their own data

3. **Data Validation**:
   - Add validation for menu scan data
   - Implement more comprehensive error handling 