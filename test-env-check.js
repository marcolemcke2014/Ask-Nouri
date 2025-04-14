/**
 * Simple environment variable check script
 */
require('dotenv').config({ path: '.env.local' });

console.log('=== Environment Variables ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`USE_FAKE_OCR: ${process.env.USE_FAKE_OCR || 'undefined'}`);
console.log(`USE_LOCAL_OCR_FALLBACK: ${process.env.USE_LOCAL_OCR_FALLBACK || 'undefined'}`);
console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'defined' : 'undefined'}`);
console.log('==========================='); 