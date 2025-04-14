/**
 * This script will pull actual menu data from memory
 * and save it as an image file for testing.
 */
const fs = require('fs');
const path = require('path');

// Define the base64 image data for the menu (to be copy/pasted here)
const base64Data = `
[THIS IS WHERE THE BASE64 DATA WOULD GO]
`;

// Path for the output file
const outputPath = path.join(__dirname, '..', 'test-house-miami-menu.jpg');

// Convert base64 to buffer and save
try {
  // Clean up the base64 data (remove line breaks, etc.)
  const cleanBase64 = base64Data.trim();
  
  if (cleanBase64 === '[THIS IS WHERE THE BASE64 DATA WOULD GO]') {
    console.error('This is just a template - you need to copy the real base64 data here');
    process.exit(1);
  }
  
  // Convert to buffer
  const imageBuffer = Buffer.from(cleanBase64, 'base64');
  
  // Save to file
  fs.writeFileSync(outputPath, imageBuffer);
  
  console.log(`✅ Saved menu image to: ${outputPath}`);
} catch (error) {
  console.error('Error saving image:', error);
  process.exit(1);
} 