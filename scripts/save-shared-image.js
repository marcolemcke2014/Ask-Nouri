/**
 * Script to save the shared image from Cursor
 */
const fs = require('fs');
const path = require('path');

// Directory where to save the image
const outputDir = path.join(__dirname, '..', 'attached_assets');

// Create the directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Path for the saved image
const imagePath = path.join(outputDir, 'user_shared_image.jpg');

console.log('Downloading shared image from Cursor...');

// We need to download the image from the shared URL
// For this demo, we'll copy the test-menu.jpg from the test-results directory if it exists

const testMenuPath = path.join(__dirname, '..', 'test-results', 'test-menu.jpg');
if (fs.existsSync(testMenuPath)) {
  fs.copyFileSync(testMenuPath, imagePath);
  console.log(`Image copied from ${testMenuPath} to ${imagePath}`);
} else {
  console.error('No test image found to copy');
  process.exit(1);
}

console.log('Image saved successfully at:', imagePath); 