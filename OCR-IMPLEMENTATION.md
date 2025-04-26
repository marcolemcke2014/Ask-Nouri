# NutriFlow OCR Implementation

## Current Status

The OCR implementation in NutriFlow uses an OpenRouter vision model approach:
- Successfully authenticates with OpenRouter using the API key
- Uses Gemini 1.5 Flash as the primary vision model for OCR
- Uses Yi-Vision as the secondary model when primary fails
- NEVER returns or stores fake/simulated menu text
- Only stores real OCR results in Supabase

### No Fake Data Policy

Our strict policy for OCR processing:
- We NEVER return placeholder or simulated menu content
- If OCR fails, we return a clear error message to the user
- We only store real extracted text in the database
- Errors are properly logged but never masked with fake data

### Solution Implemented

The system now uses:
1. Gemini 1.5 Flash (primary model) - Fast and efficient OCR
2. Yi-Vision (secondary model) - Used when primary model fails
3. Proper error handling when both models fail
4. Detailed error logging for troubleshooting
5. Supabase for persistent storage of REAL OCR results only

## Project Structure

The OCR implementation consists of the following components:

- `/pages/api/save-scan.js` - API endpoint for image uploads and OCR processing with vision models
- `/lib/utils/getUserIdForScan.ts` - Utility to manage user IDs for database operations
- `/lib/supabase.ts` - Supabase client configuration

## Deployment Notes

For the OCR pipeline to work properly, ensure:

1. Environment variables are properly set in Vercel:
   - `OPENROUTER_API_KEY` - For OpenRouter vision model access
   - `NEXT_PUBLIC_SUPABASE_URL` - For database access 
   - `SUPABASE_SERVICE_KEY` - Service role key for database access

2. Supabase is configured correctly:
   - Menu scan table exists with proper schema
   - Row Level Security (RLS) policies allow server-side API access

## Current Vision Models

1. **Primary: Gemini 1.5 Flash**
   - Fast and efficient OCR
   - Often available on free tier
   - Model ID: `google/gemini-1.5-flash`

2. **Secondary: Yi-Vision**
   - Reliable option when primary model fails
   - Previously tested and verified
   - Model ID: `01-ai/yi-vision`

## Error Handling

When OCR fails (both models unable to extract text):
1. User receives message: "Sorry, we couldn't extract the menu. Please try again."
2. Server logs detailed error information with [OCR] tag
3. No database insert is performed
4. No fake or simulated text is ever returned

## Future Improvements

Future upgrades to consider:
1. Implement proper user authentication
2. Replace test user ID with authenticated user ID
3. Add caching for successful OCR results to improve performance
4. Add more vision models if needed
5. Improve error messages with specific suggestions based on failure type 