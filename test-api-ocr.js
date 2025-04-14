/**
 * Test script for OCR via the API
 * 
 * This script tests the OCR pipeline by directly calling the OpenRouter API
 * with our configured models (Gemini 1.5 Flash and Yi-Vision).
 */

const dotenv = require('dotenv');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configure models
const MODELS = [
  {
    name: "Gemini 1.5 Flash",
    id: "google/gemini-1.5-flash",
  },
  {
    name: "Yi-Vision",
    id: "01-ai/yi-vision",
  }
];

// Test menu content - strings we expect to find in the extracted text
const EXPECTED_MENU_SECTIONS = ['DINNER', 'SMALLS', 'APPETIZERS', 'SALADS', 'ENTREES', 'SIDES'];
const EXPECTED_MENU_ITEMS = ['Guacamole', 'Salmon', 'Maitake', 'Chicken', 'Fries'];

// Configure test
const TEST_COUNT = 3; // Number of consecutive tests to run
let overallSuccess = true;
let currentTest = 1;

// Prompt for OCR
const OCR_PROMPT = "Extract all menu text from this image. Return it as clean, structured text, preserving categories, dishes, and prices where possible.";

/**
 * Test OCR with a specific model
 */
async function testOcr(model, imageBase64) {
  console.log(`\n=== Testing ${model.name} (${model.id}) ===`);
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API key missing. Set OPENROUTER_API_KEY in .env.local');
    return { success: false, error: 'API key missing' };
  }

  try {
    console.log(`🔄 Sending request to OpenRouter with ${model.name}...`);
    const payload = {
      model: model.id,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            { 
              type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }
      ]
    };

    const startTime = Date.now();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://paquapp.vercel.app",
        "X-Title": "Paquapp_OCR_Test"
      },
      body: JSON.stringify(payload)
    });
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${await response.text()}`);
      return { success: false, error: `API error: ${response.statusText}` };
    }

    const result = await response.json();
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('❌ Invalid response format from API');
      return { success: false, error: 'Invalid response format' };
    }
    
    const extractedText = result.choices[0].message.content;
    console.log(`✅ OCR completed in ${processingTime}s`);
    
    // Validate extracted text
    const validationResult = validateExtractedText(extractedText);
    if (validationResult.valid) {
      console.log(`✅ Content validation passed:`);
      console.log(`   • Found ${validationResult.sectionsFound.length}/${EXPECTED_MENU_SECTIONS.length} expected sections`);
      console.log(`   • Found ${validationResult.itemsFound.length}/${EXPECTED_MENU_ITEMS.length} expected items`);
      
      // Save the extracted text to a file
      const resultsDir = path.join(__dirname, 'test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      const filename = `${model.id.replace(/\//g, '-')}-test${currentTest}.txt`;
      fs.writeFileSync(path.join(resultsDir, filename), extractedText);
      console.log(`📝 Saved extracted text to: test-results/${filename}`);
      
      return { 
        success: true, 
        text: extractedText,
        validationResult 
      };
    } else {
      console.error('❌ Content validation failed:');
      console.error(`   • Found only ${validationResult.sectionsFound.length}/${EXPECTED_MENU_SECTIONS.length} expected sections`);
      console.error(`   • Found only ${validationResult.itemsFound.length}/${EXPECTED_MENU_ITEMS.length} expected items`);
      return { 
        success: false, 
        error: 'Content validation failed',
        validationResult 
      };
    }
  } catch (error) {
    console.error(`❌ Error during OCR with ${model.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Validate the extracted text against expected content
 */
function validateExtractedText(text) {
  // Check for minimum content
  if (!text || text.length < 100) {
    return { 
      valid: false, 
      sectionsFound: [], 
      itemsFound: [],
      reason: 'Text too short'
    };
  }
  
  // Check for expected menu sections
  const sectionsFound = EXPECTED_MENU_SECTIONS.filter(section => 
    text.toUpperCase().includes(section)
  );
  
  // Check for expected menu items
  const itemsFound = EXPECTED_MENU_ITEMS.filter(item => 
    text.includes(item)
  );
  
  // Valid if we found at least 3 sections and 3 items
  const valid = sectionsFound.length >= 3 && itemsFound.length >= 3;
  
  return { 
    valid, 
    sectionsFound,
    itemsFound,
    reason: valid ? 'Passed validation' : 'Not enough content matched'
  };
}

/**
 * Run a complete OCR test once
 */
async function runSingleTest(imageBase64) {
  console.log(`\n🔄 STARTING TEST #${currentTest}`);
  
  // Try primary model first
  const primaryResult = await testOcr(MODELS[0], imageBase64);
  
  if (primaryResult.success) {
    console.log(`\n✅ TEST #${currentTest} PASSED with primary model (${MODELS[0].name})`);
    return true;
  }
  
  console.log(`\n⚠️ Primary model failed, trying secondary model...`);
  
  // If primary fails, try secondary
  const secondaryResult = await testOcr(MODELS[1], imageBase64);
  
  if (secondaryResult.success) {
    console.log(`\n✅ TEST #${currentTest} PASSED with secondary model (${MODELS[1].name})`);
    return true;
  }
  
  console.log(`\n❌ TEST #${currentTest} FAILED with both models`);
  return false;
}

/**
 * Run all OCR tests
 */
async function runAllTests() {
  // Read test image
  let imageBase64;
  try {
    console.log('Loading test image...');
    const imagePath = path.join(__dirname, 'test-house-miami-menu.jpg');
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Test image not found at: ${imagePath}`);
      console.error('Please place a menu image at this location and try again.');
      process.exit(1);
    }
    imageBase64 = fs.readFileSync(imagePath, 'base64');
    console.log(`✅ Loaded test image (${Math.round(imageBase64.length / 1024)} KB)`);
  } catch (error) {
    console.error(`❌ Error loading test image: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`\n🔄 RUNNING ${TEST_COUNT} CONSECUTIVE OCR TESTS\n`);
  console.log('Content validation will check for these menu elements:');
  console.log(`• Sections: ${EXPECTED_MENU_SECTIONS.join(', ')}`);
  console.log(`• Items: ${EXPECTED_MENU_ITEMS.join(', ')}`);
  
  // Run tests consecutively
  for (currentTest = 1; currentTest <= TEST_COUNT; currentTest++) {
    const testSuccess = await runSingleTest(imageBase64);
    
    if (!testSuccess) {
      overallSuccess = false;
      break;
    }
    
    // Add delay between tests
    if (currentTest < TEST_COUNT) {
      const delay = 3;
      console.log(`\nWaiting ${delay} seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
  }
  
  // Report final results
  console.log('\n==================================');
  if (overallSuccess) {
    console.log(`✅ SUCCESS: All ${TEST_COUNT} OCR tests passed!`);
    console.log('The OCR pipeline is working correctly.');
  } else {
    console.log(`❌ FAILURE: OCR tests didn't complete successfully`);
    console.log(`Tests completed: ${currentTest - 1} of ${TEST_COUNT}`);
    console.log('The OCR pipeline needs investigation.');
  }
  console.log('==================================\n');
  
  return overallSuccess;
}

// Execute the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`❌ Unhandled error: ${error.message}`);
    process.exit(1);
  }); 