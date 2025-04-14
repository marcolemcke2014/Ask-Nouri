/**
 * Test script for OCR pipeline with attached image
 * 
 * This script tests our OpenRouter vision models with a menu image
 * and logs the results.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Models to test
const MODELS = [
  {
    name: "Gemini 1.5 Flash (Primary)",
    id: "google/gemini-1.5-flash",
  },
  {
    name: "Yi-Vision (Secondary)",
    id: "01-ai/yi-vision",
  }
];

// Helper function for logging
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(logEntry, null, 2));
}

/**
 * Extract text from an image using an OpenRouter vision model
 */
async function extractTextWithModel(base64Image, model) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    log('ERROR', 'OpenRouter API key is missing');
    return { success: false, error: 'OpenRouter API key is missing' };
  }
  
  try {
    // Create request payload for the vision model
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
    
    log('INFO', `Sending request to ${model.name} model`, {
      model: requestPayload.model,
      imageSize: Math.round(base64Image.length / 1024) + 'KB'
    });
    
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
    
    // Check if the request succeeded
    if (!response.ok) {
      const errorText = await response.text();
      log('ERROR', `${model.name} API request failed`, {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText.substring(0, 200)
      });
      
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        details: errorText
      };
    }
    
    // Parse the response
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content;
    
    // Validate response
    if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
      log('ERROR', `${model.name} returned empty or invalid response`, {
        response: JSON.stringify(result).substring(0, 200)
      });
      
      return {
        success: false,
        error: 'Model did not return any valid text',
        details: result
      };
    }
    
    // Log success
    log('SUCCESS', `Successfully extracted text with ${model.name}`, {
      textLength: extractedText.length,
      textSample: extractedText.substring(0, 100) + '...',
      model: result.model || requestPayload.model,
      usage: result.usage
    });
    
    // Save result to file
    const outputPath = path.join('test-results', `${model.id.replace('/', '-')}-result-${Date.now()}.txt`);
    fs.writeFileSync(outputPath, extractedText);
    log('INFO', `Saved extracted text to ${outputPath}`);
    
    return {
      success: true,
      text: extractedText,
      method: model.id,
      model: result.model || requestPayload.model,
      outputPath
    };
  } catch (error) {
    log('ERROR', `Exception during ${model.name} API call`, {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: `API call failed: ${error.message}`,
      details: error
    };
  }
}

/**
 * Validate the OCR result for menu content
 */
function validateMenuContent(text) {
  if (!text || text.length < 100) {
    return { valid: false, reason: 'Text too short' };
  }
  
  // Check for common menu sections
  const menuSections = ['DINNER', 'SMALLS', 'APPETIZERS', 'SALADS', 'ENTREES'];
  const foundSections = menuSections.filter(section => 
    text.toUpperCase().includes(section)
  );
  
  // Check for common menu items
  const menuItems = ['Guacamole', 'Salmon', 'Chicken', 'Pasta', 'Fries', 'Salad'];
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

/**
 * Save image from buffer
 */
function saveImage(imageBuffer, filename) {
  const outputPath = path.join('test-results', filename);
  fs.writeFileSync(outputPath, imageBuffer);
  return outputPath;
}

/**
 * Main test function - runs multiple tests
 */
async function runTests(imageBuffer, testCount = 3) {
  try {
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Save a copy of the test image
    const imagePath = saveImage(imageBuffer, 'test-menu.jpg');
    log('INFO', `Saved test image to ${imagePath}`);
    
    let allTestsSuccessful = true;
    
    // Run the specified number of tests
    for (let i = 1; i <= testCount; i++) {
      log('INFO', `--- Starting Test ${i} of ${testCount} ---`);
      
      // Test with primary model (Gemini 1.5 Flash)
      log('INFO', `Testing with primary model: ${MODELS[0].name}`);
      const primaryResult = await extractTextWithModel(base64Image, MODELS[0]);
      
      if (!primaryResult.success) {
        log('INFO', `Primary model failed, testing with secondary model: ${MODELS[1].name}`);
        // If primary fails, try secondary model
        const secondaryResult = await extractTextWithModel(base64Image, MODELS[1]);
        
        if (!secondaryResult.success) {
          // Both models failed
          log('ERROR', 'Both OCR models failed for this test', {
            primaryError: primaryResult.error,
            secondaryError: secondaryResult.error
          });
          allTestsSuccessful = false;
          break;
        } else {
          // Validate secondary result
          const validation = validateMenuContent(secondaryResult.text);
          log('INFO', `Secondary OCR validation: ${validation.valid ? 'PASSED' : 'FAILED'}`, validation);
          
          if (!validation.valid) {
            allTestsSuccessful = false;
            break;
          }
        }
      } else {
        // Validate primary result
        const validation = validateMenuContent(primaryResult.text);
        log('INFO', `Primary OCR validation: ${validation.valid ? 'PASSED' : 'FAILED'}`, validation);
        
        if (!validation.valid) {
          allTestsSuccessful = false;
          break;
        }
      }
      
      // Add a small delay between tests
      if (i < testCount) {
        log('INFO', 'Waiting before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (allTestsSuccessful) {
      log('SUCCESS', `✅ All ${testCount} tests completed successfully!`);
      return true;
    } else {
      log('ERROR', '❌ Not all tests completed successfully');
      return false;
    }
  } catch (error) {
    log('FATAL', 'Unhandled exception in test', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Get the attached image from the attached_assets directory
const testImagePath = path.join('attached_assets', 'user_shared_image.jpg');
if (!fs.existsSync(testImagePath)) {
  log('ERROR', `Test image not found at ${testImagePath}. Please save the attached image there.`);
  process.exit(1);
}

// Load and run tests with the image
log('INFO', `Loading test image from ${testImagePath}`);
const imageBuffer = fs.readFileSync(testImagePath);
runTests(imageBuffer, 3)
  .then(success => {
    if (success) {
      log('INFO', '✓ OCR pipeline validated successfully with 3 consecutive tests');
      process.exit(0);
    } else {
      log('INFO', '✗ OCR pipeline validation failed');
      process.exit(1);
    }
  })
  .catch(err => {
    log('FATAL', 'Error running tests', err);
    process.exit(1);
  }); 