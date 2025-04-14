/**
 * Script to save the menu image
 */
const fs = require('fs');
const path = require('path');

// The base64 encoded image data will be provided as the first argument
const base64Image = process.argv[2];

if (!base64Image) {
  console.error('No image data provided');
  process.exit(1);
}

// Directory where to save the image
const outputDir = path.join(__dirname, '..', 'attached_assets');

// Create the directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  console.log(`Creating directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

// Path for the saved image
const imagePath = path.join(outputDir, 'user_shared_image.jpg');

try {
  // Decode the base64 string to a buffer
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  // Save the buffer to a file
  fs.writeFileSync(imagePath, imageBuffer);
  
  console.log('Image saved successfully at:', imagePath);
} catch (error) {
  console.error('Error saving image:', error);
  process.exit(1);
} 