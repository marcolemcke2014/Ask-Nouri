/**
 * Script to download a menu image for testing
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Directory where to save the image
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Path for the saved image
const imagePath = path.join(testResultsDir, 'house-miami-menu.jpg');

// URL of the image (replace with a valid URL from the web)
const imageUrl = 'https://example.com/menu.jpg';

console.log(`Downloading menu image from: ${imageUrl}`);
console.log(`Will save to: ${imagePath}`);

// Simple http download
const file = fs.createWriteStream(imagePath);
https.get(imageUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`);
    fs.unlinkSync(imagePath); // Delete the file if download failed
    process.exit(1);
  }
  
  response.pipe(file);
  
  file.on('finish', () => {
    file.close();
    console.log('Image downloaded successfully');
  });
}).on('error', (err) => {
  fs.unlinkSync(imagePath); // Delete the file if there's an error
  console.error(`Error downloading image: ${err.message}`);
  process.exit(1);
}); 