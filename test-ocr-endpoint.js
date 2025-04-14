const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

async function testImageUpload() {
  try {
    console.log("🧪 Testing image upload to /api/save-scan...");
    
    // Load test image file
    const imagePath = path.join(__dirname, 'attached_assets', 'test-menu.jpg');
    console.log(`Loading image from: ${imagePath}`);
    
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📷 Image loaded (Buffer size: ${Math.round(imageBuffer.length / 1024)} KB)`);
    
    // Create FormData and append the image
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-menu.jpg',
      contentType: 'image/jpeg'
    });
    
    // Add test development mode flag to simulate authenticated user
    // Send as a regular field first
    formData.append('test_dev_mode', 'true');
    console.log("💡 Using development test mode with auto-generated test user");
    
    console.log("📤 Sending image to /api/save-scan...");
    
    // Send request including the test_dev_mode in URL as well to ensure it's received
    const start = Date.now();
    const response = await fetch('http://localhost:3001/api/save-scan?test_dev_mode=true', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Test-Dev-Mode': 'true' // Also try as a header
      }
    });
    const duration = Date.now() - start;
    
    console.log(`Response received in ${duration}ms, status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('API Response:', result);
      console.log(`✅ Image upload test successful`);
    } else {
      console.error(`❌ Image upload test failed: Status ${response.status}`);
      try {
        const errorText = await response.text();
        console.error('Error response:', errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
    }
  } catch (error) {
    console.error(`❌ Script error:`, error);
  }
}

testImageUpload(); 