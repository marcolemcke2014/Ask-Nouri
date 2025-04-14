/**
 * Test script for OCR fallback chain with OpenRouter
 * 
 * This script tests the cost-optimized model fallback chain for OCR
 * by trying to extract text from a menu image using each model in sequence.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Define the model chain to test
const modelChain = [
  { id: "meta-llama/llama-3.2-11b-vision-instruct:free", name: "Llama 3.2 Vision (Free)" },
  { id: "qwen/qwen-2.5-vl-7b-instruct:free", name: "Qwen 2.5 VL (Free)" },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" }
];

// Console.log with colors and formatting
function log(level, message, details = null) {
  const timestamp = new Date().toISOString();
  const COLOR = {
    INFO: '\x1b[36m%s\x1b[0m',    // Cyan
    SUCCESS: '\x1b[32m%s\x1b[0m',  // Green
    WARN: '\x1b[33m%s\x1b[0m',     // Yellow
    ERROR: '\x1b[31m%s\x1b[0m'     // Red
  };
  
  console.log(COLOR[level], `[${timestamp}] [${level}]`, message);
  if (details) {
    console.log(details);
  }
}

/**
 * Test a specific model on the fallback chain
 */
async function testModel(model, imageBase64) {
  log('INFO', `Testing model: ${model.name} (${model.id})`);
  
  try {
    // Prepare request payload
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
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    };
    
    // Get API key
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      log('ERROR', 'OpenRouter API key missing');
      return { success: false, error: 'API key missing' };
    }
    
    // Set timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    // Send request to OpenRouter
    log('INFO', 'Sending request to OpenRouter...');
    const startTime = Date.now();
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://paquapp.vercel.app",
        "X-Title": "PaquappOCRTest"
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Calculate response time
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log('INFO', `Response received in ${responseTime}s`);
    
    // Check for API errors
    if (!response.ok) {
      const errorText = await response.text();
      log('ERROR', `API request failed: ${response.status} ${response.statusText}`, errorText.substring(0, 300));
      return { 
        success: false, 
        error: `API error: ${response.status} ${response.statusText}`,
        responseTime
      };
    }
    
    // Parse response
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content;
    
    // Validate text
    if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length < 20) {
      log('ERROR', 'Insufficient text returned', { 
        textLength: extractedText?.length || 0,
        textSample: extractedText?.substring(0, 50) || 'empty' 
      });
      return { 
        success: false, 
        error: 'Insufficient text returned',
        responseTime
      };
    }
    
    // Success!
    log('SUCCESS', `Extracted ${extractedText.length} characters of text`);
    log('INFO', 'Sample:', extractedText.substring(0, 200) + '...');
    
    // Save result to file
    const filename = `${model.id.replace(/\//g, '-')}.txt`;
    const outputPath = path.join(resultsDir, filename);
    fs.writeFileSync(outputPath, extractedText);
    log('INFO', `Full text saved to: ${outputPath}`);
    
    // Return success
    return {
      success: true,
      text: extractedText,
      model: model.id,
      responseTime,
      outputPath
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      log('ERROR', `Request timed out after 45 seconds`);
      return { success: false, error: 'Timeout' };
    } else {
      log('ERROR', `Exception: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Run the full fallback chain test
 */
async function runFallbackChainTest() {
  log('INFO', '=== OCR FALLBACK CHAIN TEST ===');
  log('INFO', `Testing ${modelChain.length} vision models in sequence\n`);
  
  // Find the image to test with
  const sampleMenuPath = path.join(__dirname, '..', 'public', 'sample-menus', 'sample-menu.jpg');
  if (!fs.existsSync(sampleMenuPath)) {
    log('ERROR', `Test image not found at: ${sampleMenuPath}`);
    log('INFO', 'Please add a sample menu image to the public/sample-menus directory');
    return false;
  }
  
  // Load and encode the image
  try {
    log('INFO', `Loading image from: ${sampleMenuPath}`);
    const imageBuffer = fs.readFileSync(sampleMenuPath);
    const imageBase64 = imageBuffer.toString('base64');
    log('INFO', `Image loaded (${Math.round(imageBase64.length / 1024)} KB)`);
    
    // Try each model in the chain
    let firstSuccessful = null;
    for (const model of modelChain) {
      const result = await testModel(model, imageBase64);
      
      if (result.success) {
        log('SUCCESS', `Model ${model.name} successfully extracted text!`);
        log('INFO', `Response time: ${result.responseTime}s`);
        
        // Save the first successful result
        if (!firstSuccessful) {
          firstSuccessful = {
            model: model.name,
            id: model.id,
            responseTime: result.responseTime,
            outputPath: result.outputPath
          };
          
          // In a real fallback chain, we would stop here
          log('INFO', `In production, the fallback chain would stop here and use this result.`);
          
          // Uncomment this to stop at first success like the real implementation
          // break;
        }
      } else {
        log('WARN', `Model ${model.name} failed: ${result.error}`);
      }
      
      // Add a delay between tests
      if (model !== modelChain[modelChain.length - 1]) {
        const delay = 2;
        log('INFO', `Waiting ${delay}s before trying next model...`);
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
    }
    
    // Report results
    if (firstSuccessful) {
      log('SUCCESS', `\n=== TEST PASSED ===`);
      log('INFO', `First successful model: ${firstSuccessful.model}`);
      log('INFO', `Response time: ${firstSuccessful.responseTime}s`);
      log('INFO', `Result saved to: ${firstSuccessful.outputPath}`);
      return true;
    } else {
      log('ERROR', `\n=== TEST FAILED ===`);
      log('ERROR', 'All models in the fallback chain failed to extract valid text.');
      return false;
    }
    
  } catch (error) {
    log('ERROR', `Unhandled error: ${error.message}`, error);
    return false;
  }
}

// Run the test
runFallbackChainTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log('ERROR', `Fatal error: ${error.message}`, error);
    process.exit(1);
  }); 