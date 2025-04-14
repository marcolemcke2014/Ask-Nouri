/**
 * Single OCR test for evaluating the fallback chain
 * This script tests the OCR extraction with the provided sample image
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

/**
 * Log entries - collect all logs for final report
 */
const logEntries = [];

/**
 * Custom logger that captures log entries
 */
function log(level, message, details = null) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    details: details ? JSON.stringify(details) : null
  };
  
  logEntries.push(entry);
  
  // Color codes for console output
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
 * Execute an OCR extraction using our fallback chain
 */
async function runOcrWithFallbackChain(imageBase64) {
  log('INFO', '--- STARTING OCR EXTRACTION WITH FALLBACK CHAIN ---');
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    log('ERROR', 'OpenRouter API key is missing');
    return { success: false, error: 'OpenRouter API key is missing' };
  }
  
  // Try each model in sequence
  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    log('INFO', `Attempting OCR with model ${i+1}/${modelChain.length}: ${model.name}`, {
      modelId: model.id
    });
    
    try {
      // Create request payload for vision model
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
      
      log('INFO', `Sending request to OpenRouter with ${model.name}`, {
        model: model.id,
        imageSize: Math.round(imageBase64.length / 1024) + 'KB'
      });
      
      // Set timeout for API call (45 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      // Execute API request
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
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      log('INFO', `Response received from ${model.name} in ${responseTime}s`);
      
      // Check if request succeeded
      if (!response.ok) {
        const errorText = await response.text();
        log('ERROR', `${model.name} API request failed, will try next model`, {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText.substring(0, 200)
        });
        // Continue to the next model
        continue;
      }
      
      // Parse the response
      const result = await response.json();
      const extractedText = result.choices?.[0]?.message?.content;
      
      // Validate that we got meaningful text
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length < 20) {
        log('ERROR', `${model.name} returned insufficient text, will try next model`, {
          textLength: extractedText?.length || 0,
          textSample: extractedText?.substring(0, 50) || 'empty'
        });
        // Continue to the next model
        continue;
      }
      
      // Success! We have valid OCR text
      log('SUCCESS', `Successfully extracted text with ${model.name}`, {
        textLength: extractedText.length,
        textSample: extractedText.substring(0, 100) + '...'
      });
      
      // Save the extracted text to a file
      const outputPath = path.join(resultsDir, `ocr-result-${model.id.replace(/\//g, '-')}.txt`);
      fs.writeFileSync(outputPath, extractedText);
      log('INFO', `Full text saved to: ${outputPath}`);
      
      return {
        success: true,
        text: extractedText,
        method: model.id,
        modelName: model.name,
        responseTime,
        outputPath
      };
      
    } catch (error) {
      // Handle errors with this model attempt
      if (error.name === 'AbortError') {
        log('ERROR', `${model.name} request timed out after 45 seconds, will try next model`);
      } else {
        log('ERROR', `Exception during ${model.name} API call, will try next model`, {
          error: error.message
        });
      }
      // Continue to the next model
    }
  }
  
  // If we reach here, all models failed
  log('ERROR', 'All OCR models failed. No text could be extracted from the image.');
  
  return {
    success: false,
    error: 'OCR failed – all models failed to extract valid text from the image.',
    details: 'Attempted 6 different vision models without success.'
  };
}

/**
 * Generate a summary report of the OCR test
 */
function generateReport(result, testImagePath) {
  console.log('\n' + '='.repeat(80));
  console.log('OCR FALLBACK CHAIN TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Test Image: ${testImagePath}`);
  console.log(`Image Size: ${result.imageSize} KB`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('-'.repeat(80));
  
  if (result.success) {
    console.log(`✅ OCR SUCCESSFUL with model: ${result.modelName}`);
    console.log(`Response Time: ${result.responseTime}s`);
    console.log(`Text Length: ${result.text.length} characters`);
    console.log(`Output File: ${result.outputPath}`);
    console.log('\nEXTRACTED TEXT SAMPLE:');
    console.log('-'.repeat(40));
    console.log(result.text.substring(0, 500) + (result.text.length > 500 ? '...' : ''));
  } else {
    console.log(`❌ OCR FAILED: ${result.error}`);
    console.log(result.details || '');
  }
  
  console.log('-'.repeat(80));
  console.log('MODEL ATTEMPT SEQUENCE:');
  
  // Find all model attempts in the logs
  const attempts = [];
  let attemptedModels = 0;
  
  for (const entry of logEntries) {
    if (entry.message.includes("Attempting OCR with model")) {
      attemptedModels++;
      attempts.push({
        model: entry.message.split(': ')[1],
        status: 'Attempted'
      });
    } else if (entry.message.includes("API request failed")) {
      attempts[attempts.length-1].status = 'Failed - API Error';
      attempts[attempts.length-1].reason = entry.message;
    } else if (entry.message.includes("returned insufficient text")) {
      attempts[attempts.length-1].status = 'Failed - Invalid Response';
      attempts[attempts.length-1].reason = entry.message;
    } else if (entry.message.includes("request timed out")) {
      attempts[attempts.length-1].status = 'Failed - Timeout';
      attempts[attempts.length-1].reason = entry.message;
    } else if (entry.message.includes("Exception during")) {
      attempts[attempts.length-1].status = 'Failed - Exception';
      attempts[attempts.length-1].reason = entry.message;
    } else if (entry.message.includes("Successfully extracted text with")) {
      attempts[attempts.length-1].status = '✅ SUCCESS';
      attempts[attempts.length-1].reason = entry.message;
    }
  }
  
  attempts.forEach((attempt, i) => {
    console.log(`${i+1}. ${attempt.model}: ${attempt.status}`);
    if (attempt.reason && attempt.status !== '✅ SUCCESS') {
      console.log(`   Reason: ${attempt.reason}`);
    }
  });
  
  console.log('-'.repeat(80));
  console.log(`Models Attempted: ${attemptedModels} of ${modelChain.length}`);
  console.log(`Final Outcome: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
  console.log('='.repeat(80) + '\n');
  
  return {
    success: result.success,
    modelsTried: attemptedModels,
    finalResult: result.success ? result.modelName : 'Failed',
    outputPath: result.outputPath
  };
}

/**
 * Main test function
 */
async function main() {
  // Test image path
  const testImagePath = path.join(__dirname, '..', 'public', 'sample-menus', 'sample-menu.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    console.error(`Error: Test image not found at ${testImagePath}`);
    process.exit(1);
  }
  
  try {
    // Read and encode the image
    log('INFO', `Loading test image: ${testImagePath}`);
    const imageBuffer = fs.readFileSync(testImagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const imageSize = Math.round(imageBase64.length / 1024);
    log('INFO', `Image loaded successfully (${imageSize} KB)`);
    
    // Run the OCR with fallback chain
    const startTime = Date.now();
    const result = await runOcrWithFallbackChain(imageBase64);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    result.imageSize = imageSize;
    result.totalTime = totalTime;
    
    // Generate the report
    const reportSummary = generateReport(result, testImagePath);
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    log('ERROR', `Unhandled error during test: ${error.message}`, {
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the test
main(); 