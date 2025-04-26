# Using the Service Role Key for Supabase

For server-side API routes that need to bypass RLS (Row Level Security) policies, you need to use a **service_role** key instead of the anonymous key.

## Important Security Information

⚠️ **WARNING**: The `service_role` key has full admin access to your database. It can:
- Bypass all RLS policies
- Read and write any table
- Execute any SQL operation

## Steps to Update Your API

1. **Get the service_role key**:
   - Go to the [Supabase Dashboard](https://app.supabase.com/)
   - Navigate to Project Settings → API
   - Copy the `service_role` key (NOT the `anon` key)

2. **Update your `.env.local` file**:
   ```
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

3. **Add the key to your deployment environment**:
   - For Vercel: Go to Project Settings → Environment Variables
   - Add the `SUPABASE_SERVICE_KEY` with your service_role key
   - Make sure to re-deploy after adding the key

## Security Best Practices

- **Never expose the service_role key in frontend code**
- Only use it in server-side API routes (.js/.ts files in the `/api` directory)
- Keep RLS policies in place for all tables to protect your data
- Consider adding extra validation in your API routes

## Testing

After updating your key, run:

```bash
node scripts/test-direct-insert.js
```

You should see a successful insert into the database. Then you can run the full pipeline test:

```bash
node scripts/test-full-pipeline.js
```

## Cleaning Up

Once your test is complete, you can re-enable RLS:

```sql
ALTER TABLE menu_scan ENABLE ROW LEVEL SECURITY;
```

This ensures your data is protected when you deploy to production. 