# NutriFlow OCR and Database Integration Testing

This document provides instructions for testing the full OCR and database insertion pipeline in the NutriFlow application.

## Prerequisites

1. Ensure you have your local development server running: `npm run dev`
2. Make sure your `.env.local` file contains the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase API key (anon key for development)
   - `TEST_USER_ID` - A UUID for testing (default: `11111111-1111-1111-1111-111111111111`)

## Setting Up Supabase Row Level Security (RLS)

Before running the tests, you need to configure the Row Level Security policy for the `menu_scan` table:

1. Go to the [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to: **SQL Editor** in the left sidebar
4. Create a new query
5. Copy and paste the contents of `scripts/setup-rls.sql` into the editor
6. Click **Run** to apply the RLS policy

This policy will allow database inserts only if the `user_id` matches the `TEST_USER_ID` from your `.env.local` file.

## Running the Full End-to-End Test

The test script will:
1. Upload a test image to the API
2. Extract text using OCR
3. Insert the data into Supabase
4. Verify the entire process worked correctly

### Install Dependencies

First, install any missing dependencies:

```bash
npm install form-data node-fetch --save-dev
```

### Run the Test

```bash
node scripts/test-full-pipeline.js
```

### Verifying Results

After running the test, you should:

1. Check the console output for success messages and the extracted OCR text
2. Verify in the Supabase Dashboard that a new row was added to the `menu_scan` table
3. Confirm that the row contains the correct OCR text and test user ID

## Troubleshooting

If the test fails with an RLS policy error:
- Make sure you've applied the SQL in `scripts/setup-rls.sql`
- Verify that the `TEST_USER_ID` in `.env.local` matches the one in the SQL policy
- Check the Supabase dashboard for any permission issues

## Production Considerations

⚠️ **IMPORTANT**: The RLS policy created for testing is for development purposes only:

- It should be replaced with a proper user-based policy before deploying to production
- The `TEST_USER_ID` environment variable should be removed from production
- The code includes safeguards to warn if test code is detected in production 