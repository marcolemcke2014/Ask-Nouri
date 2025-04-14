# Logging Implementation Guide

This guide outlines how to implement consistent, structured logging across the NutriFlow application to improve traceability and debugging.

## Logger Utility

We've created a logger utility at `/lib/logger.ts` that provides consistent logging functions. Use this instead of directly using `console.log()`:

```typescript
import logger from '@/lib/logger';

// Basic logging
logger.log('AUTH', 'User logged in successfully', { userId: '123' });
logger.error('ERROR', 'Failed to process image', error);
logger.warn('UPLOAD', 'Image size exceeds recommended limit', { size: '5MB' });

// Utility functions
logger.truncateText('Very long text...', 100); // Returns truncated text with "..."
logger.logDbOperation('insert', 'menu_scan', { id: 'abc123', user_id: '456' });
```

## Logging Standards by Component

### 1. Authentication (`[AUTH]` tag)
```typescript
// Session loading
logger.log('AUTH', 'Checking user session status');

// Session success
logger.log('AUTH', `User authenticated: ${session.user.id}`);

// Session error
logger.error('AUTH', 'Error retrieving session', sessionError);

// Missing user
logger.log('AUTH', 'No authenticated user found, redirecting to login');

// Sign out
logger.log('AUTH', 'User signing out');
```

### 2. Onboarding Status (`[ONBOARDING]` tag)
```typescript
// Start check
logger.log('ONBOARDING', 'Checking onboarding status for user', { userId });

// Passed
logger.log('ONBOARDING', 'User has completed onboarding');

// Failed
logger.log('ONBOARDING', 'User has not completed onboarding');

// Redirect
logger.log('ONBOARDING', 'Redirecting user to onboarding flow');
```

### 3. OCR Upload Flow (`/api/save-scan.js`)

#### Upload phase (`[UPLOAD]` tag)
```typescript
// File received
logger.log('UPLOAD', 'Image received', { filename, type: mimeType, size: fileSize });

// Missing file
logger.error('UPLOAD', 'No image file found in request');
```

#### OCR phase (`[OCR]` tag)
```typescript
// Start OCR
logger.log('OCR', 'Starting OCR processing');

// Fallback used
logger.log('OCR', 'Using fallback OCR method due to API unavailability');

// Text extracted
logger.log('OCR', `Text extracted (${text.length} chars)`, { 
  preview: logger.truncateText(text, 100) 
});
```

#### Database phase (`[SUPABASE]` tag)
```typescript
// Start insertion
logger.log('SUPABASE', 'Preparing to insert scan data', { scanId });

// User ID check
logger.log('SUPABASE', `Using user ID: ${userId}`);
// or
logger.error('SUPABASE', 'No user ID available for database insert');

// Insert payload
logger.log('SUPABASE', 'Insert payload', {
  ...payload,
  menu_raw_text: logger.truncateText(payload.menu_raw_text) // Truncate long text
});

// Success
logger.log('SUPABASE', `Insert successful! Row ID: ${data.id}`);

// Error handling
logger.error('SUPABASE', 'Insert failed: RLS policy violation', error);
logger.error('SUPABASE', 'Insert failed: Foreign key constraint', error);
```

#### Error handling (`[ERROR]` tag)
```typescript
try {
  // code that might fail
} catch (err) {
  logger.error('ERROR', 'Unhandled exception in OCR process', err);
  // Include stack trace automatically
}
```

### 4. Scan History Page (`[SCAN-HISTORY]` tag)
```typescript
// Fetch start
logger.log('SCAN-HISTORY', `Fetching scan history for user: ${userId}`);

// Results
logger.log('SCAN-HISTORY', `Retrieved ${scans.length} scans for user ${userId}`);

// No scans
logger.log('SCAN-HISTORY', 'No scans found for user');

// Fetch error
logger.error('SCAN-HISTORY', 'Failed to fetch scan history', error);
```

### 5. Scan Detail Page (`[DETAILS]` tag)
```typescript
// Fetch start
logger.log('DETAILS', `Fetching scan data for ID: ${scanId}`);

// Results
logger.log('DETAILS', `Successfully retrieved scan ${scanId}`);

// Not found
logger.log('DETAILS', `Scan not found with ID: ${scanId}`);

// Access denied
logger.error('DETAILS', `Access denied: Scan belongs to user ${scanUserId}, but current user is ${currentUserId}`);

// Query error
logger.error('DETAILS', `Query error: ${errorCode} - ${errorMessage}`, error);
```

## Implementation Checklist

- [ ] Replace direct `console.log` calls with logger utility functions
- [ ] Add appropriate tags based on the component
- [ ] Include relevant context data with each log
- [ ] Ensure errors include enough information to diagnose issues
- [ ] Truncate large text fields to prevent log bloat
- [ ] Add navigation tracking logs
- [ ] Add authentication status logs
- [ ] Add database operation logs

## Example Implementation

Here's an example of a completely implemented component:

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import logger from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export default function ExampleComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchData = async () => {
      logger.log('AUTH', 'Checking authentication');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.error('AUTH', 'Session error', sessionError);
        return;
      }
      
      if (!session?.user) {
        logger.log('AUTH', 'No authenticated user, redirecting to login');
        router.push('/login');
        return;
      }
      
      logger.log('AUTH', `User authenticated: ${session.user.id}`);
      
      try {
        logger.log('COMPONENT', 'Fetching data');
        // Fetch data...
        
        logger.log('COMPONENT', 'Data fetched successfully', { dataCount: result.length });
        setData(result);
      } catch (err) {
        logger.error('ERROR', 'Failed to fetch data', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Rest of component...
}
```

By following these standards, you'll have a consistent logging system that makes troubleshooting much easier. 