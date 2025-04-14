/**
 * This script sets up a test menu image
 */
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const sampleMenusDir = path.join(__dirname, '..', 'public', 'sample-menus');
if (!fs.existsSync(sampleMenusDir)) {
  fs.mkdirSync(sampleMenusDir, { recursive: true });
}

// Path to save the menu image
const menuImagePath = path.join(sampleMenusDir, 'sample-menu.jpg');
console.log(`Writing menu image to ${menuImagePath}`);

// Since we can't paste the image directly, we need to ask the user to manually copy
// the image from the cursor interface and save it to the location above
console.log(`
=============================================
IMPORTANT: Manual step required
=============================================

The OCR test needs a menu image file to test with.

Please manually:
1. Right-click and save the menu image shared in the conversation
2. Save it to: ${menuImagePath}
3. Then run: node scripts/test-vision-models-simple.js

=============================================
`);

// Create an empty file as a placeholder
fs.writeFileSync(menuImagePath, '');
console.log(`Created placeholder file at ${menuImagePath}`);
console.log(`Please replace this with the actual menu image.`); 