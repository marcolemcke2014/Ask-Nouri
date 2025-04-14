/**
 * Simple test script for OpenRouter vision models
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Ensure test results directory exists
const resultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Define the models to test - Updated with currently available models
const MODELS = [
  {
    name: "Claude 3 Opus (Primary)",
    id: "anthropic/claude-3-opus:beta",
  },
  {
    name: "GPT-4 Vision (Secondary)",
    id: "openai/gpt-4-vision-preview",
  }
];

// Function to test a model
async function testModel(model, testImagePath) {
  console.log(`\nTesting model: ${model.name}`);
  
  // Check OpenRouter API key
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error('Error: OpenRouter API key is missing. Set OPENROUTER_API_KEY in .env.local');
    return false;
  }
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    console.log(`Image loaded: ${Math.round(base64Image.length / 1024)} KB`);
    
    // Create API request
    const requestPayload = {
      model: model.id,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all menu text from this image. Return it as clean, structured text, preserving categories, dishes, and prices where possible."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ]
    };
    
    console.log(`Sending request to OpenRouter with ${model.name}...`);
    
    // Send the request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://paquapp.vercel.app",
        "X-Title": "Paquapp_v3_Test"
      },
      body: JSON.stringify(requestPayload)
    });
    
    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText.substring(0, 500)}`);
      return false;
    }
    
    // Process the response
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content;
    
    // Validate response
    if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
      console.error(`Model returned empty or invalid response`);
      return false;
    }
    
    // Log success
    console.log(`Success! Extracted ${extractedText.length} characters of text`);
    console.log(`Sample: ${extractedText.substring(0, 100)}...`);
    
    // Save result to file
    const outputPath = path.join(resultsDir, `${model.id.replace(/\//g, '-')}-result.txt`);
    fs.writeFileSync(outputPath, extractedText);
    console.log(`Saved extracted text to: ${outputPath}`);
    
    // Validate the content
    const validation = validateMenuContent(extractedText);
    if (validation.valid) {
      console.log(`Content validation: PASSED`);
      console.log(`Found sections: ${validation.foundSections.join(', ')}`);
      console.log(`Found items: ${validation.foundItems.join(', ')}`);
      return true;
    } else {
      console.error(`Content validation: FAILED`);
      console.error(`Reason: ${validation.reason}`);
      console.error(`Found only ${validation.foundSections.length} expected sections`);
      console.error(`Found only ${validation.foundItems.length} expected items`);
      return false;
    }
  } catch (error) {
    console.error(`Error testing ${model.name}: ${error.message}`);
    return false;
  }
}

/**
 * Validate the OCR result for menu content
 */
function validateMenuContent(text) {
  if (!text || text.length < 100) {
    return { valid: false, reason: 'Text too short' };
  }
  
  // Check for expected menu sections
  const menuSections = ['DINNER', 'SMALLS', 'APPETIZERS', 'SALADS', 'ENTREES', 'SIDES'];
  const foundSections = menuSections.filter(section => 
    text.toUpperCase().includes(section)
  );
  
  // Check for expected menu items
  const menuItems = ['Guacamole', 'Salmon', 'Chicken', 'Maitake', 'Fries', 'Salad'];
  const foundItems = menuItems.filter(item => 
    text.includes(item)
  );
  
  // Valid if we found at least 3 sections and 3 items
  const valid = foundSections.length >= 3 && foundItems.length >= 3;
  
  return { 
    valid, 
    foundSections,
    foundItems,
    reason: valid ? 'Menu content validated' : 'Not enough menu sections or items found'
  };
}

// Main function
async function main() {
  // Path to sample image - first check if there's a test image
  let testImagePath = path.join(__dirname, '..', 'test-house-miami-menu.jpg');
  
  // If no custom test image, use a sample menu image
  if (!fs.existsSync(testImagePath)) {
    // Check if we have a sample image to use
    const sampleImagesDir = path.join(__dirname, '..', 'public', 'sample-menus');
    const sampleImagePath = path.join(sampleImagesDir, 'sample-menu.jpg');
    
    if (fs.existsSync(sampleImagePath)) {
      testImagePath = sampleImagePath;
      console.log(`Using sample menu image: ${testImagePath}`);
    } else {
      console.error('No test image found. Please provide a menu image at:', testImagePath);
      console.error('Or add sample menus to public/sample-menus/');
      return false;
    }
  } else {
    console.log(`Using custom test image: ${testImagePath}`);
  }
  
  // Test both models
  let testResults = [];
  
  // Test the primary model
  console.log('\n=== Testing Primary Model ===');
  const primaryResult = await testModel(MODELS[0], testImagePath);
  testResults.push({ model: MODELS[0].name, success: primaryResult });
  
  // Test the secondary model
  console.log('\n=== Testing Secondary Model ===');
  const secondaryResult = await testModel(MODELS[1], testImagePath);
  testResults.push({ model: MODELS[1].name, success: secondaryResult });
  
  // Report results
  console.log('\n=== Test Results ===');
  testResults.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.model}: SUCCESS`);
    } else {
      console.log(`❌ ${result.model}: FAILED`);
    }
  });
  
  // Return true if at least one model succeeded
  return testResults.some(result => result.success);
}

// Run the tests
console.log('Starting OCR test for vision models...');
main()
  .then(success => {
    if (success) {
      console.log('\n✅ TEST PASSED: At least one OCR model is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ TEST FAILED: No OCR model is working correctly.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 