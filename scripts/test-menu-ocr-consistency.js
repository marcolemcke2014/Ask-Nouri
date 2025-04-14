/**
 * Menu OCR Consistency Test
 * 
 * This script runs the OCR process 3 times consecutively on the same menu image
 * to verify consistent extraction results across multiple runs.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Validation constants
const MIN_VALID_TEXT_LENGTH = 150; // Minimum character count to consider extraction successful

// Use LLaMA 3.2 Vision model as primary
const MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free";
const MIME_TYPE = "image/jpeg";

// Similarity threshold for consistency check (percentage)
const SIMILARITY_THRESHOLD = 80;

// Number of consecutive tests to run
const TEST_COUNT = 3;

// Test menu image path (we'll save the image to this location)
const TEST_MENU_PATH = path.join(__dirname, '..', 'attached_assets', 'restaurant-menu.jpg');

// Logger utility function with color
function log(type, message, data = null) {
  const timestamp = new Date().toISOString();
  let prefix;
  
  switch(type) {
    case 'ERROR':
      prefix = '\x1b[31m[MENU-TEST]\x1b[0m'; // Red
      break;
    case 'WARN':
      prefix = '\x1b[33m[MENU-TEST]\x1b[0m'; // Yellow
      break;
    case 'SUCCESS':
      prefix = '\x1b[32m[MENU-TEST]\x1b[0m'; // Green
      break;
    default:
      prefix = '\x1b[36m[MENU-TEST]\x1b[0m'; // Cyan
  }
  
  console.log(`${prefix} ${timestamp} - ${message}`);
  if (data) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

/**
 * Extracts text from an image using OpenRouter and the specified model
 */
async function extractTextWithModel(base64Image, testNumber) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  log('INFO', `[Test ${testNumber}] Running OCR with model: ${MODEL}`);
  
  // Prepare the API request
  const requestPayload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all menu text from this image. Return it as clean, structured text, preserving categories, dishes, ingredients, and prices where possible."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${MIME_TYPE};base64,${base64Image}`
            }
          }
        ]
      }
    ]
  };
  
  log('INFO', `[Test ${testNumber}] Sending request to OpenRouter`);
  
  try {
    const startTime = Date.now();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://paquapp.vercel.app",
        "X-Title": "Paquapp_v3",
        "X-Debug": `Menu OCR Consistency Test #${testNumber}`
      },
      body: JSON.stringify(requestPayload)
    });
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    
    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      log('ERROR', `[Test ${testNumber}] OpenRouter API request failed: ${response.status} ${response.statusText}`, 
        errorText.substring(0, 300));
      return { success: false, error: errorText, testNumber };
    }
    
    // Parse the response
    const result = await response.json();
    log('INFO', `[Test ${testNumber}] Received response from OpenRouter`, {
      model: result.model || MODEL,
      promptTokens: result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
      responseTimeMs: responseTimeMs
    });
    
    // Extract the text
    const extractedText = result.choices?.[0]?.message?.content;
    
    if (!extractedText || typeof extractedText !== 'string') {
      log('ERROR', `[Test ${testNumber}] Failed to extract text from response`, result);
      return { success: false, error: "No valid text content in response", testNumber };
    }
    
    log('SUCCESS', `[Test ${testNumber}] Successfully extracted text (${extractedText.length} chars)`, 
      extractedText.length > 200 ? `${extractedText.substring(0, 200)}...` : extractedText);
    
    return {
      success: true,
      text: extractedText,
      model: result.model || MODEL,
      responseTimeMs,
      testNumber,
      tokenUsage: result.usage || { prompt_tokens: 0, completion_tokens: 0 }
    };
  } catch (error) {
    log('ERROR', `[Test ${testNumber}] Exception during OpenRouter API call: ${error.message}`, error);
    return { success: false, error: error.message, testNumber };
  }
}

/**
 * Calculates the similarity between three extracted text results
 */
function calculateConsistency(results) {
  // Check if we have valid results to compare
  const validResults = results.filter(r => r.success);
  if (validResults.length < 2) {
    return {
      consistent: false,
      reason: "Not enough successful results to compare"
    };
  }
  
  // Calculate character count similarity percentages between each pair of results
  const lengthComparisons = [];
  const wordCountComparisons = [];
  
  for (let i = 0; i < validResults.length; i++) {
    for (let j = i + 1; j < validResults.length; j++) {
      const text1 = validResults[i].text;
      const text2 = validResults[j].text;
      
      // Character count similarity
      const longerLength = Math.max(text1.length, text2.length);
      const shorterLength = Math.min(text1.length, text2.length);
      const lengthSimilarity = Math.round((shorterLength / longerLength) * 100);
      
      // Word count similarity
      const words1 = text1.split(/\s+/).filter(w => w.length > 0);
      const words2 = text2.split(/\s+/).filter(w => w.length > 0);
      const wordCountMax = Math.max(words1.length, words2.length);
      const wordCountMin = Math.min(words1.length, words2.length);
      const wordCountSimilarity = Math.round((wordCountMin / wordCountMax) * 100);
      
      lengthComparisons.push({
        test1: validResults[i].testNumber,
        test2: validResults[j].testNumber,
        similarity: lengthSimilarity
      });
      
      wordCountComparisons.push({
        test1: validResults[i].testNumber,
        test2: validResults[j].testNumber,
        similarity: wordCountSimilarity
      });
    }
  }
  
  // Calculate average similarities
  const avgLengthSimilarity = lengthComparisons.reduce((acc, comp) => acc + comp.similarity, 0) / lengthComparisons.length;
  const avgWordSimilarity = wordCountComparisons.reduce((acc, comp) => acc + comp.similarity, 0) / wordCountComparisons.length;
  
  // Determine if results are consistent
  const isConsistent = avgLengthSimilarity >= SIMILARITY_THRESHOLD && avgWordSimilarity >= SIMILARITY_THRESHOLD;
  
  return {
    consistent: isConsistent,
    avgLengthSimilarity: Math.round(avgLengthSimilarity),
    avgWordSimilarity: Math.round(avgWordSimilarity),
    lengthComparisons,
    wordCountComparisons,
    threshold: SIMILARITY_THRESHOLD
  };
}

/**
 * Save base64 image data to a file
 */
function saveBase64ImageToFile(base64Data, filePath) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    log('INFO', `Image saved to ${filePath}`);
    return true;
  } catch (error) {
    log('ERROR', `Failed to save image: ${error.message}`);
    return false;
  }
}

/**
 * Extract base64 data from an image URL
 */
function extractBase64FromImageUrl(dataUrl) {
  const matches = dataUrl.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
}

/**
 * Main function to run multiple OCR tests
 */
async function runConsistencyTests(imageBase64) {
  log('INFO', `Starting ${TEST_COUNT} consecutive OCR tests on the restaurant menu`);
  
  // 1. Check API key
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    log('ERROR', 'OpenRouter API key missing. Please add it to .env.local');
    process.exit(1);
  }
  
  // 2. Run tests sequentially
  const results = [];
  
  log('INFO', `Running ${TEST_COUNT} tests sequentially`);
  for (let i = 1; i <= TEST_COUNT; i++) {
    log('INFO', `Starting test #${i} of ${TEST_COUNT}`);
    const result = await extractTextWithModel(imageBase64, i);
    results.push(result);
    
    // Add a small delay between tests
    if (i < TEST_COUNT) {
      log('INFO', `Waiting 2 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 3. Analyze success rate
  const successfulTests = results.filter(r => r.success).length;
  const successRate = Math.round((successfulTests / TEST_COUNT) * 100);
  
  log('INFO', `Test complete. Success rate: ${successRate}% (${successfulTests}/${TEST_COUNT})`);
  
  // 4. Check consistency of results
  const consistencyResults = calculateConsistency(results);
  
  if (consistencyResults.consistent) {
    log('SUCCESS', `✅ CONSISTENCY CHECK PASSED: Results are consistent across tests`, consistencyResults);
  } else {
    log('WARN', `⚠️ CONSISTENCY CHECK FAILED: Results vary significantly between tests`, consistencyResults);
  }
  
  // 5. Display detailed results
  log('INFO', 'Detailed test results:');
  results.forEach(result => {
    if (result.success) {
      log(
        'SUCCESS', 
        `Test #${result.testNumber}: Extracted ${result.text.length} chars in ${result.responseTimeMs}ms`,
        {
          charCount: result.text.length,
          wordCount: result.text.split(/\s+/).filter(w => w.length > 0).length,
          responseTimeMs: result.responseTimeMs,
          tokenUsage: result.tokenUsage
        }
      );
    } else {
      log('ERROR', `Test #${result.testNumber}: Failed - ${result.error}`);
    }
  });
  
  // 6. Final determination
  if (successRate === 100 && consistencyResults.consistent) {
    log('SUCCESS', '✅ VALIDATION PASSED: LLaMA 3.2 Vision OCR is working consistently!');
    // Print first result as sample
    if (results[0]?.success) {
      log('INFO', 'Sample extraction from first test:');
      console.log('\n' + results[0].text.substring(0, 500) + (results[0].text.length > 500 ? '...' : '') + '\n');
    }
  } else if (successRate > 0) {
    log('WARN', '⚠️ PARTIAL SUCCESS: OCR works but may have reliability or consistency issues');
  } else {
    log('ERROR', '❌ VALIDATION FAILED: OCR failed across all test runs');
  }
}

// Main execution
(async () => {
  try {
    // Extract base64 data from the data URL if it's included
    const imageDataUrl = `data:${MIME_TYPE};base64,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`;
    
    // Extract base64 without data URL
    const base64Data = imageDataUrl.split(';base64,')[1];
    
    // Save the image for reference
    if (base64Data) {
      saveBase64ImageToFile(base64Data, TEST_MENU_PATH);
      // Run the tests with the base64 data
      await runConsistencyTests(base64Data);
    } else {
      log('ERROR', 'Failed to extract base64 data from image');
      process.exit(1);
    }
  } catch (error) {
    log('ERROR', `Unhandled exception: ${error.message}`, error);
    process.exit(1);
  }
})(); 