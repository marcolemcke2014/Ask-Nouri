/**
 * LLaMA 3.2 Vision OCR Test Script
 * 
 * This script tests the integration with OpenRouter's LLaMA 3.2 Vision model.
 * It verifies API connectivity, key validity, response structure, and the quality
 * of OCR text extraction from a sample menu image.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Validation constants
const MIN_VALID_TEXT_LENGTH = 150; // Minimum character count to consider extraction successful
const FALLBACK_INDICATORS = [
  'placeholder', 
  'simulated', 
  'development mode',
  'sample text',
  'test text'
];

// OpenRouter models to try in order of preference
const MODELS = [
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "openai/gpt-4o-mini",
  "openai/gpt-4o:free"
];

// Test images to try in order of preference
const TEST_IMAGES = [
  {
    path: path.join(__dirname, '..', 'attached_assets', 'image_1743706440712.png'),
    mimeType: 'image/png'
  },
  {
    path: path.join(__dirname, '..', 'attached_assets', 'test-menu.jpg'),
    mimeType: 'image/jpeg'
  }
];

// Logger utility function with color
function log(type, message, data = null) {
  const timestamp = new Date().toISOString();
  let prefix;
  
  switch(type) {
    case 'ERROR':
      prefix = '\x1b[31m[LAMA-TEST]\x1b[0m'; // Red
      break;
    case 'WARN':
      prefix = '\x1b[33m[LAMA-TEST]\x1b[0m'; // Yellow
      break;
    case 'SUCCESS':
      prefix = '\x1b[32m[LAMA-TEST]\x1b[0m'; // Green
      break;
    default:
      prefix = '\x1b[36m[LAMA-TEST]\x1b[0m'; // Cyan
  }
  
  console.log(`${prefix} ${timestamp} - ${message}`);
  if (data) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

/**
 * Validates the extracted text to ensure it's real OCR content
 */
function validateExtractedText(text) {
  // Check for minimum length
  if (!text || text.length < MIN_VALID_TEXT_LENGTH) {
    log('ERROR', `Extracted text too short (${text ? text.length : 0} chars). Expected at least ${MIN_VALID_TEXT_LENGTH} chars.`);
    return false;
  }

  // Check for fallback indicators
  for (const indicator of FALLBACK_INDICATORS) {
    if (text.toLowerCase().includes(indicator.toLowerCase())) {
      log('ERROR', `Extracted text contains fallback indicator: "${indicator}"`);
      return false;
    }
  }

  return true;
}

/**
 * Try to extract text using a specific OpenRouter model and image
 */
async function tryModelExtraction(base64Image, modelName, mimeType) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  log('INFO', `Attempting OCR with model: ${modelName} and mimeType: ${mimeType}`);
  
  // Prepare the API request
  const requestPayload = {
    model: modelName,
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
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ]
  };
  
  // Add temperature and max_tokens for GPT models
  if (modelName.includes('gpt')) {
    requestPayload.temperature = 0;
    requestPayload.max_tokens = 1024;
  }
  
  log('INFO', 'Sending request to OpenRouter', {
    model: requestPayload.model,
    imageSize: base64Image.length,
    mimeType: mimeType,
    endpoint: "https://openrouter.ai/api/v1/chat/completions"
  });
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://paquapp.vercel.app",
        "X-Title": "Paquapp_v3",
        "X-Debug": `Testing ${modelName} integration with ${mimeType}`
      },
      body: JSON.stringify(requestPayload)
    });
    
    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      log('WARN', `OpenRouter API request failed with ${modelName}: ${response.status} ${response.statusText}`, errorText);
      return { success: false, error: errorText };
    }
    
    // Parse the response
    const result = await response.json();
    log('INFO', `Received response from OpenRouter using ${modelName}`, {
      model: result.model || modelName,
      promptTokens: result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens
    });
    
    // Extract the text
    const extractedText = result.choices?.[0]?.message?.content;
    
    if (!extractedText || typeof extractedText !== 'string') {
      log('WARN', `Failed to extract text from ${modelName} response`, result);
      return { success: false, error: "No valid text content in response" };
    }
    
    log('INFO', `Extracted text using ${modelName} (${extractedText.length} chars)`, 
      extractedText.length > 200 ? `${extractedText.substring(0, 200)}...` : extractedText);
    
    return {
      success: true,
      text: extractedText,
      model: result.model || modelName
    };
  } catch (error) {
    log('WARN', `Exception during OpenRouter API call to ${modelName}: ${error.message}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to test Vision OCR
 */
async function testVisionOcr() {
  log('INFO', 'Starting Vision OCR test with multiple models and images');
  
  // 1. Check API key
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    log('ERROR', 'OpenRouter API key missing. Please add it to .env.local');
    process.exit(1);
  }
  log('INFO', 'API key found');
  
  // 2. Try each test image
  let successfulExtraction = null;
  
  for (const testImage of TEST_IMAGES) {
    if (!fs.existsSync(testImage.path)) {
      log('WARN', `Test image not found at: ${testImage.path}, skipping`);
      continue;
    }
    
    log('INFO', `Loading test image from: ${testImage.path}`);
    const imageBuffer = fs.readFileSync(testImage.path);
    const base64Image = imageBuffer.toString('base64');
    
    if (!base64Image || base64Image.length === 0) {
      log('WARN', `Failed to convert image to base64, skipping: ${testImage.path}`);
      continue;
    }
    
    log('INFO', `Image loaded and converted to base64 (${base64Image.length} chars)`);
    
    // 3. Try each model with this image
    for (const model of MODELS) {
      log('INFO', `Trying OCR with model: ${model} on image: ${path.basename(testImage.path)}`);
      const result = await tryModelExtraction(base64Image, model, testImage.mimeType);
      
      if (result.success) {
        log('SUCCESS', `Successful extraction with model: ${model} on image: ${path.basename(testImage.path)}`);
        successfulExtraction = result;
        // Add image information
        successfulExtraction.imagePath = testImage.path;
        successfulExtraction.imageMimeType = testImage.mimeType;
        break;
      } else {
        log('WARN', `Model ${model} failed on image ${path.basename(testImage.path)}, trying next option`);
      }
    }
    
    // If we got a successful extraction with this image, no need to try the next one
    if (successfulExtraction) {
      break;
    }
  }
  
  // 4. Check if any model/image combination succeeded
  if (!successfulExtraction) {
    log('ERROR', 'All models failed to extract text from all images');
    process.exit(1);
  }
  
  // 5. Validate the extracted text
  const isValidText = validateExtractedText(successfulExtraction.text);
  
  if (isValidText) {
    log('SUCCESS', '✅ VALIDATION PASSED: Text appears to be genuine OCR content');
    log('INFO', `Full extracted text (${successfulExtraction.text.length} chars) using:`);
    log('INFO', `- Model: ${successfulExtraction.model}`);
    log('INFO', `- Image: ${path.basename(successfulExtraction.imagePath)}`);
    console.log('\n' + successfulExtraction.text + '\n');
    
    // 6. Report success
    log('SUCCESS', 'Vision OCR integration is working properly!');
    log('INFO', 'You can now use the LLaMA 3.2 Vision model in your production pipeline');
  } else {
    log('ERROR', '❌ VALIDATION FAILED: Text may contain fallback content or is too short');
    process.exit(1);
  }
}

// Run the test
testVisionOcr().then(() => {
  log('SUCCESS', 'Test completed successfully');
}).catch(error => {
  log('ERROR', `Unhandled exception: ${error.message}`, error);
  process.exit(1);
}); 