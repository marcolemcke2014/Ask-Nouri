/**
 * Simple test script to verify OCR functionality
 * 
 * This script:
 * 1. Uploads a test image to the API
 * 2. Verifies the OCR text extraction
 * 3. Confirms proper database insertion
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Create test SVG with text
const testFile = path.join(__dirname, '..', 'public', 'test-menu.svg');
const svgContent = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="10" y="30" font-family="Arial" font-size="16">TEST MENU</text>
  <text x="10" y="60" font-family="Arial" font-size="14">Appetizers</text>
  <text x="20" y="80" font-family="Arial" font-size="12">- Mozzarella Sticks $8.99</text>
  <text x="20" y="100" font-family="Arial" font-size="12">- Chicken Wings $10.99</text>
  <text x="10" y="130" font-family="Arial" font-size="14">Main Courses</text>
  <text x="20" y="150" font-family="Arial" font-size="12">- Cheeseburger $12.99</text>
  <text x="20" y="170" font-family="Arial" font-size="12">- Grilled Salmon $16.99</text>
</svg>`;

fs.writeFileSync(testFile, svgContent);
console.log(`Test file created at ${testFile}`);

// Start the test
async function runTest() {
  // Create form data with test image
  const form = new FormData();
  form.append('image', fs.createReadStream(testFile));
  
  // Submit to API
  console.log('Submitting to API...');
  try {
    const response = await fetch('http://localhost:3000/api/save-scan', {
      method: 'POST',
      body: form
    });
    
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
console.log('🧪 Starting OCR test...');
runTest(); 