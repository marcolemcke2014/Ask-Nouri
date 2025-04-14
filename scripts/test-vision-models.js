/**
 * Test script for OpenRouter Vision Models
 * 
 * This script tests OCR extraction using both Gemini 1.5 Flash and Yi-Vision models.
 * It loads an image from the test-results directory and sends it to both models.
 * 
 * Usage:
 * node scripts/test-vision-models.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Models to test
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
    log('INFO', `Successfully extracted text with ${model.name}`, {
      textLength: extractedText.length,
      textSample: extractedText.substring(0, 100) + '...',
      model: result.model || requestPayload.model,
      usage: result.usage
    });
    
    // Save result to file
    const outputPath = path.join('test-results', `${model.id.replace('/', '-')}-result.txt`);
    fs.writeFileSync(outputPath, extractedText);
    log('INFO', `Saved extracted text to ${outputPath}`);
    
    return {
      success: true,
      text: extractedText,
      method: model.id,
      model: result.model || requestPayload.model
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
 * Main test function
 */
async function runTest() {
  try {
    // Check if test-results directory exists, if not create it
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }
    
    // Load test image
    const testImagePath = path.join('test-results', 'test-menu.jpg');
    if (!fs.existsSync(testImagePath)) {
      log('ERROR', `Test image not found at ${testImagePath}. Please place a test image there.`);
      return;
    }
    
    log('INFO', `Loading test image from ${testImagePath}`);
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Test each model
    for (const model of MODELS) {
      log('INFO', `Testing model: ${model.name}`);
      const result = await extractTextWithModel(base64Image, model);
      
      if (result.success) {
        log('SUCCESS', `${model.name} test completed successfully`);
      } else {
        log('ERROR', `${model.name} test failed`, {
          error: result.error
        });
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('INFO', 'All tests completed');
  } catch (error) {
    log('FATAL', 'Unhandled exception in test', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Run the test
runTest(); 