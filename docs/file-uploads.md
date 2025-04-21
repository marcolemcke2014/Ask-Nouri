# File Uploads with Next.js on Vercel

This document outlines best practices for handling file uploads in a Next.js application deployed to Vercel.

## Recommended Approaches

### 1. Use `busboy` for File Parsing

We recommend using `busboy` instead of other file parsing libraries like `formidable` or `multer` for Vercel deployments because:

- It's lightweight and has minimal dependencies
- It's stream-based, which is more memory-efficient
- It's compatible with serverless environments
- It doesn't rely on disk access, which is problematic in serverless functions

```javascript
import busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const result = { fields: {}, files: {} };
    const bb = busboy({ headers: req.headers });
    
    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        result.files[name] = {
          data: Buffer.concat(chunks),
          // other properties...
        };
      });
    });
    
    bb.on('field', (name, val) => {
      result.fields[name] = val;
    });
    
    bb.on('close', () => resolve(result));
    bb.on('error', (err) => reject(err));
    
    req.pipe(bb);
  });
}
```

### 2. Memory Considerations

Serverless functions have memory limits. For larger files, consider:

- Direct upload to storage services (S3, Supabase Storage, etc.)
- Use signed URLs for direct browser-to-storage uploads
- Set reasonable file size limits (typically < 5MB for serverless)

### 3. API Route Configuration

Always disable the default body parser in API routes that handle file uploads:

```javascript
export const config = {
  api: {
    bodyParser: false,
  },
};
```

### 4. Temporary Storage

Vercel's serverless functions don't support persistent local file storage:

- Don't write files to disk using `fs` module
- Process files in memory and/or upload directly to cloud storage
- For images, use libraries like `sharp` that can process images in memory

## Example Implementation

Our application uses the following pattern for file uploads:

1. Client sends multipart form data to API route
2. API route uses `busboy` to parse the data in memory
3. Files are processed in memory (e.g., image manipulation with `sharp`)
4. Processed data is either:
   - Sent to external APIs (e.g., OCR services)
   - Stored in database or cloud storage
   - Returned in the response (for small results)

See `/pages/api/save-scan.js` for a full implementation example.

## Common Issues and Solutions

### "Cannot find module 'formidable'"

If using `formidable`:
- Add to `package.json` dependencies
- Consider migrating to `busboy` for better serverless compatibility

### "EROFS: read-only file system, open '/tmp/...'"

This indicates an attempt to write to the filesystem:
- Process files in memory instead
- Use cloud storage for file persistence

### Memory Limit Exceeded

If hitting memory limits:
- Implement client-side file size validation
- Process files in smaller chunks
- Use streaming where possible
- Consider direct-to-storage upload approaches 