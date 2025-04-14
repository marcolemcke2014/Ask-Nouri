console.log('--- test-full-ocr-flow.js starting ---'); // Top-level entry log

/**
 * End-to-End Test Script for OCR and Supabase Integration
 * 
 * This script tests the complete flow:
 * 1. Load a menu image
 * 2. Process with OCR fallback chain
 * 3. Structure the extracted text
 * 4. Save structured data to Supabase
 * 5. Verify data persistence.
 */

// --- SETUP & CONFIGURATION ---
require('dotenv').config({ path: '.env.local' }); 

// --- Debug: Log loaded env vars (masked) ---
function maskValue(key, value) {
  if (!value || typeof value !== 'string') return value;
  if (key.includes('KEY') || key.includes('SECRET')) {
    return `${value.slice(0, 5)}...${value.slice(-4)}`;
  }
  return value;
}
console.log('--- Loaded Environment Variables (Masked) ---');
const maskedEnv = {};
const importantEnvKeys = [
    'TEST_USER_ID', 'TEST_IMAGE_PATH', 
    'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY', 
    'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_PUBLIC', 
    'OPENAI_TEXT_EMBEDDING_API_KEY'
];
for (const key in process.env) {
  if (key.startsWith('NEXT_') || importantEnvKeys.includes(key)) {
    maskedEnv[key] = maskValue(key, process.env[key]);
  }
}
console.log(JSON.stringify(maskedEnv, null, 2));
console.log('--------------------------------------------');
// --- End Debug ---

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); 
const chalk = require('chalk');
const stableStringify = require('fast-json-stable-stringify');
const util = require('util'); // For logging fallback
const OpenAI = require('openai');

// --- GLOBAL CONSTANTS & CONFIG ---
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000';
const TEST_IMAGE_PATH = process.env.TEST_IMAGE_PATH || path.join(__dirname, '..', 'public', 'sample-menus', 'sample-menu.jpg');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const RESULTS_DIR = path.join(__dirname, '..', 'test-results'); // Store results path

// Fallback chain for OCR models
const OCR_MODEL_CHAIN = [
  { id: "meta-llama/llama-3.2-11b-vision-instruct:free", name: "Llama 3.2 Vision (Free)" },
  { id: "qwen/qwen-2.5-vl-7b-instruct:free", name: "Qwen 2.5 VL (Free)" },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" }
];
const STRUCTURING_MODEL = "openai/gpt-4o-mini";

// --- GLOBAL SUPABASE CLIENT (Lazy Initialized) ---
let supabase;

// --- LOGGING FUNCTION ---
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: chalk.blue,
    SUCCESS: chalk.green,
    WARN: chalk.yellow,
    ERROR: chalk.red,
    DATABASE: chalk.magenta,
    DEBUG: chalk.gray,
    TEST: chalk.cyan
  };
  const color = levelColors[level] || chalk.white;
  console.log(`${color(`[${timestamp}] [${level}]`)} ${message}`);
  if (data) {
    try {
        // Use util.inspect for better object logging, limiting depth
        console.log(util.inspect(data, { depth: 4, colors: true })); 
    } catch (e) {
        console.log('[Logging Error: Could not inspect data]', e.message);
    }
  }
}

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    log('INFO', `Created results directory: ${RESULTS_DIR}`);
}

// --- HELPER & CORE LOGIC FUNCTIONS ---

/**
 * Initializes and returns the Supabase client instance.
 * @returns {SupabaseClient} The initialized Supabase client.
 */
function getSupabaseClient() {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      log('ERROR', '❌ ERROR: Missing Supabase environment variables');
      log('ERROR', '  Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
      throw new Error('Missing Supabase environment variables'); 
    }
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        log('INFO', 'Supabase client initialized.');
    } catch (e) {
        log('ERROR', 'Failed to initialize Supabase client', e);
        throw e; 
    }
  }
  return supabase;
}

/**
 * Calculates the SHA256 hash of a buffer.
 * @param {Buffer} buffer - The input buffer.
 * @returns {string} The hex-encoded SHA256 hash.
 */
function calculateSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Normalizes a string for metadata comparison (restaurant name, location).
 * Converts to lowercase, removes punctuation, standardizes common abbreviations, trims whitespace.
 * @param {string|null} text - The input string.
 * @returns {string|null} The normalized string or null.
 */
function normalizeMetadataString(text) {
  if (!text || typeof text !== 'string') { return null; }
  let normalized = text.toLowerCase().trim();
  normalized = normalized.replace(/[.,#!$%^&*;:{}=\`~()]/g, ''); // Remove common punctuation
  // Normalize common street type abbreviations (add more as needed)
  normalized = normalized.replace(/\bstreet\b/g, 'st').replace(/\broad\b/g, 'rd').replace(/\bavenue\b/g, 'ave');
  normalized = normalized.replace(/\s\s+/g, ' ').trim(); // Condense whitespace
  return normalized || null;
}

/**
 * Normalizes a dish name specifically for generating the content signature hash.
 * Converts to lowercase, removes all whitespace and non-alphanumeric characters.
 * @param {string|null} name - The dish name.
 * @returns {string} The normalized dish name string.
 */
function normalizeDishNameForSignature(name) {
  if (!name || typeof name !== 'string') { return ''; }
  return name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

/**
 * Calculates a content signature hash based on sorted, normalized dish names.
 * This hash aims to be stable against minor OCR errors in descriptions/prices 
 * but sensitive to changes in the set of dishes.
 * @param {object} structuredData - The structured menu data from the LLM.
 * @returns {{hash: string|null, signatureString: string|null}} The signature hash and the string it was based on.
 */
function calculateContentSignatureHash(structuredData) {
  if (!structuredData || !structuredData.categories) {
    return { hash: null, signatureString: null };
  }
  
  const dishNames = [];
  // Extract and normalize dish names
  structuredData.categories.forEach(category => {
    if (category.dishes && Array.isArray(category.dishes)) {
      category.dishes.forEach(dish => {
        if (dish.name) {
          const normalizedName = normalizeDishNameForSignature(dish.name);
          if (normalizedName) { 
            dishNames.push(normalizedName);
          }
        }
      });
    }
  });
  
  if (dishNames.length === 0) {
    log('WARN', 'No valid dish names found to calculate content signature hash.');
    return { hash: null, signatureString: null };
  }
  
  // Sort names for stability
  dishNames.sort();
  // Create a stable string representation
  const signatureString = dishNames.join('|');
  // Calculate hash
  const hash = calculateSHA256(Buffer.from(signatureString, 'utf8'));
  log('DEBUG', `Generated content signature string (sample): ${signatureString.substring(0, 100)}...`);
  return { hash, signatureString }; // Return both hash and the string
}

/**
 * Calculates a hash based on the fully normalized and stably stringified menu structure.
 * This hash is sensitive to almost any change (names, descriptions, prices, order).
 * @param {object} structuredData - The structured menu data.
 * @returns {string} The hex-encoded SHA256 hash.
 */
function calculateFullStructureHash(structuredData) {
  // Deep copy to avoid modifying the original object
  const normalizedData = JSON.parse(JSON.stringify(structuredData));
  const normalizeString = (str) => { if (!str) return ''; return str.toString().toLowerCase().trim().replace(/\s\s+/g, ' '); };
  
  // Normalize restaurant info
  if (normalizedData.restaurant) {
    if (normalizedData.restaurant.name) { normalizedData.restaurant.name = normalizeString(normalizedData.restaurant.name); }
    if (normalizedData.restaurant.location) { normalizedData.restaurant.location = normalizeString(normalizedData.restaurant.location); }
  }
  
  // Normalize categories and dishes
  if (normalizedData.categories) {
    normalizedData.categories.forEach(category => {
      if (category.name) { category.name = normalizeString(category.name); }
      if (category.dishes && Array.isArray(category.dishes)) {
        category.dishes.forEach(dish => {
          if (dish.name) { dish.name = normalizeString(dish.name); }
          if (dish.description) { dish.description = normalizeString(dish.description); }
          // Normalize and sort tags for stability
          if (dish.dietary_tags && Array.isArray(dish.dietary_tags)) {
            dish.dietary_tags = dish.dietary_tags.map(tag => normalizeString(tag)).sort();
          }
        });
        // Sort dishes within categories by name for stability
        category.dishes.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
    });
    // Sort categories by name for stability
    normalizedData.categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  
  // Generate a stable JSON string representation
  const stableString = stableStringify(normalizedData);
  
  // Optionally log the pre-hash string for debugging
  const logFilePath = path.join(RESULTS_DIR, `full-structure-hash-input-${Date.now()}.txt`);
  try {
    fs.writeFileSync(logFilePath, stableString);
  } catch (error) { log('WARN', `Failed to log full structure pre-hash JSON string: ${error.message}`); }
  
  // Calculate hash
  return calculateSHA256(Buffer.from(stableString, 'utf8'));
}

/**
 * Checks if a specific user has already scanned an image with the same hash.
 * @param {string} userId - The user's UUID.
 * @param {string} imageHash - The SHA256 hash of the image.
 * @returns {object|null} The existing scan record or null.
 */
async function checkForExistingUserScan(userId, imageHash) {
  if (!userId || !imageHash) return null;
  log('DATABASE', 'Checking for existing user scan (image hash match)', { userId, imageHash });
  const db = getSupabaseClient();
  try {
    const { data, error } = await db.from('menu_scan')
                              .select('id, restaurant_name, scanned_at')
                              .eq('user_id', userId)
                              .eq('image_hash', imageHash)
                              .limit(1);
                              
    if (error) { 
      log('ERROR', 'Error checking for existing user scan (Supabase Error)', error); 
      return null; 
    }
    
    const existingScan = data && data.length > 0 ? data[0] : null;
    log('INFO', existingScan ? 'Existing scan found for this user and image hash.' : 'No existing scan found for this user and image hash.');
    return existingScan;
  } catch (error) { 
    log('ERROR', 'Exception caught in checkForExistingUserScan', error); 
    return null; 
  }
}

/**
 * Ensures a user profile exists for the given test user ID, creating one if necessary.
 * @param {string} userId - The user's UUID.
 */
async function ensureUserExists(userId) {
  const db = getSupabaseClient();
  try {
    const { data, error } = await db
      .from('user_profile')
      .select('id')
      .eq('id', userId)
      .limit(1);
    
    if (error) {
      log('ERROR', `Error checking for user ${userId}`, error);
      throw error; 
    }
    
    if (!data || data.length === 0) {
      log('INFO', `Test user ${userId} not found, creating test user profile`);
      const { error: insertError } = await db
        .from('user_profile')
        .insert({ id: userId, email: `${userId}@test.com`, name: `Test User ${userId.substring(0, 4)}` }); 
        
      if (insertError) {
        log('ERROR', `Failed to create test user profile ${userId}`, insertError);
        throw insertError; 
      } else {
        log('SUCCESS', `Created test user profile: ${userId}`);
      }
    } else {
      log('INFO', `Test user ${userId} found`);
    }
  } catch (error) {
    log('ERROR', `Exception during user existence check for ${userId}`, error);
    throw error; 
  }
}

/**
 * Inserts a new menu_scan record into the database.
 */
async function insertMenuScan(scanId, userId, canonicalId, imageHash, ocrResultText, ocrModelId, restaurantName, location) {
  log('DATABASE', 'Inserting menu_scan...', { scanId, userId, canonicalId });
  const db = getSupabaseClient();
  try {
    const { data, error } = await db.from('menu_scan').insert({ 
        id: scanId, 
        user_id: userId, 
        menu_raw_text: ocrResultText, 
        scanned_at: new Date().toISOString(), 
        restaurant_name: restaurantName, // Original name from structure step
        location: location, // Original location from structure step
        ocr_method: ocrModelId, 
        image_hash: imageHash, 
        canonical_menu_id: canonicalId 
    }).select('id').single();
    if (error) { log('ERROR', 'Failed to insert scan', error); throw new Error(`Scan insert failed: ${error.message}`); }
    log('SUCCESS', `Created scan: ${scanId}`);
    return data;
  } catch (error) { log('ERROR', 'Exception during scan insert', error); throw error; }
}

/**
 * Inserts a new canonical_menus record.
 */
async function insertCanonicalMenu(normalizedName, normalizedLocation, signatureHash, fullHash, dishCount, embeddingVector) {
  log('DATABASE', 'Inserting new canonical_menus record', { normalizedName, normalizedLocation, signatureHash: signatureHash?.substring(0, 10), fullHash: fullHash?.substring(0,10), hasEmbedding: !!embeddingVector });
  const supabase = getSupabaseClient();
  try {
    const insertData = {
        normalized_restaurant_name: normalizedName,
        normalized_location: normalizedLocation,
        content_signature_hash: signatureHash,
        full_structure_hash: fullHash,
        dish_count: dishCount,
        created_at: new Date().toISOString()
        // first_scan_id is set later due to FK constraints
    };
    
    // Only include embedding if it's not null
    if (embeddingVector !== null) {
      insertData.embedding = embeddingVector;
    } else {
      log('INFO', 'Embedding vector is null, omitting from insert.');
    }

    const { data, error } = await supabase
      .from('canonical_menus')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      log('ERROR', 'Failed to insert canonical menu record', error);
      // Attempt to provide more context on constraint violations
      if (error.message.includes('duplicate key value violates unique constraint')) {
          if (error.message.includes('canonical_menus_full_structure_hash_key')) {
              log('ERROR', 'Potential race condition or duplicate full_structure_hash encountered.', { fullHash });
          }
           if (error.message.includes('canonical_menus_content_signature_hash_key')) {
              log('ERROR', 'Potential race condition or duplicate content_signature_hash encountered.', { signatureHash });
          }
      }
      throw new Error(`Canonical menu insert failed: ${error.message}`);
    }
    log('SUCCESS', `Created new canonical menu with ID: ${data.id}`);
    return data;
  } catch (error) {
    log('ERROR', 'Exception during canonical_menus insert', error);
    throw error;
  }
}

/**
 * Updates the first_scan_id for a newly created canonical menu.
 */
async function updateCanonicalMenuFirstScanId(canonicalId, scanId) {
  log('DATABASE', 'Updating first_scan_id...', { canonicalId, scanId });
  const db = getSupabaseClient();
  try {
    const { error } = await db.from('canonical_menus').update({ first_scan_id: scanId }).eq('id', canonicalId);
    if (error) { log('WARN', 'Failed to update first_scan_id', error); }
    else { log('INFO', `Updated canonical menu ${canonicalId} with first_scan_id ${scanId}`); }
  } catch (error) { log('WARN', 'Exception updating first_scan_id', error); }
}

/**
 * Inserts dishes associated with a canonical menu in batches.
 */
async function insertDishes(canonicalId, structuredData) {
  const dishesToInsert = [];
  if (structuredData.categories) {
    structuredData.categories.forEach(category => {
      if (category.dishes && Array.isArray(category.dishes)) {
        category.dishes.forEach(dish => {
          // Basic validation for essential dish data
          if (dish.name) { 
            dishesToInsert.push({
              canonical_menu_id: canonicalId,
              dish_name: dish.name,
              description: dish.description,
              price: dish.price,
              category: category.name,
              tags: dish.dietary_tags || [],
            });
          } else {
            log('WARN', 'Skipping dish insert due to missing name', { category: category.name, dishData: dish });
          }
        });
      }
    });
  }
  if (dishesToInsert.length === 0) { log('INFO', 'No dishes to insert.'); return 0; }
  log('DATABASE', `Inserting ${dishesToInsert.length} dishes...`, { canonicalId });
  const db = getSupabaseClient();
  let insertedCount = 0;
  const BATCH_SIZE = 100;
  try {
    for (let i = 0; i < dishesToInsert.length; i += BATCH_SIZE) {
      const batch = dishesToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await db.from('menu_dishes').insert(batch);
      if (error) { 
        log('ERROR', `Dish batch insert failed (index ${i})`, error); 
        // Consider if failure here should halt the process or just be logged
        throw new Error(`Dish insert failed: ${error.message}`); 
      }
      else { 
          insertedCount += batch.length; 
          log('INFO', `Inserted dish batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length}`); 
      }
    }
    log('SUCCESS', `Inserted ${insertedCount} dishes.`);
    return insertedCount;
  } catch (error) { 
      log('ERROR', 'Exception during dish insertion', error); 
      throw error; // Re-throw critical errors
  }
}

/**
 * Runs OCR extraction using a fallback chain of models via OpenRouter.
 * @param {string} imageBase64 - Base64 encoded image data.
 * @returns {Promise<object>} Object containing success status, extracted text, and model used.
 */
async function runOcrWithFallbackChain(imageBase64) {
  log('INFO', '--- STARTING OCR EXTRACTION WITH FALLBACK CHAIN ---');
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) { throw new Error('OpenRouter API key missing'); }
  
  for (let i = 0; i < OCR_MODEL_CHAIN.length; i++) {
    const model = OCR_MODEL_CHAIN[i];
    log('INFO', `Attempting OCR with model ${i+1}/${OCR_MODEL_CHAIN.length}: ${model.name}`, { modelId: model.id });
    try {
      const requestPayload = {
         model: model.id, 
         messages: [
           { 
             role: "user", 
             content: [
               { type: "text", text: "Extract all text from this restaurant menu image." }, 
               { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
              ]
            }
          ]
        };
        
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      const startTime = Date.now();
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { 
          method: "POST", 
          headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              // Recommended headers for OpenRouter identification
              "HTTP-Referer": process.env.SITE_URL || "https://paquapp.vercel.app", // Use actual site URL if available
              "X-Title": process.env.APP_NAME || "PaquappTest" // Use actual app name if available
            },
          body: JSON.stringify(requestPayload), 
          signal: controller.signal 
        });
        
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
      clearTimeout(timeoutId);
      log('INFO', `Response received from ${model.name} in ${responseTime}s`);

      if (!response.ok) {
        const errorText = await response.text();
        log('ERROR', `${model.name} API request failed`, { status: response.status, responseBody: errorText.substring(0, 200) });
        continue; // Try next model
      }
      
      const result = await response.json();
      const extractedText = result.choices?.[0]?.message?.content;
      const MIN_TEXT_LENGTH = 20; // Minimum plausible text length for a menu
      
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length < MIN_TEXT_LENGTH) {
        log('ERROR', `${model.name} returned insufficient text`, { textLength: extractedText?.trim().length || 0 });
        continue; // Try next model
      }
      
      log('SUCCESS', `Successfully extracted text with ${model.name}`, { textLength: extractedText.length });
      
      // Save raw OCR result for debugging/review
      try {
        const outputPath = path.join(RESULTS_DIR, `ocr-result-${model.id.replace(/[:\/]/g, '-')}-${Date.now()}.txt`);
        fs.writeFileSync(outputPath, extractedText);
      } catch(e) { log('WARN', 'Failed to save OCR result file', e); }
      
      // Return success with text and model info
      return { success: true, text: extractedText, model: { id: model.id, name: model.name } };
      
    } catch (error) {
      if (error.name === 'AbortError') {
         log('ERROR', `${model.name} request timed out`);
      } else {
          log('ERROR', `Exception during ${model.name} API call`, { error: error.message });
      }
      // Continue to next model on error
    }
  }
  
  // If loop finishes without success
  log('ERROR', 'All OCR models in the fallback chain failed.');
  throw new Error('OCR failed – all models failed');
}

/**
 * Structures raw OCR text into JSON format using an LLM via OpenRouter.
 * Includes fallback logic to extract location if missed by the LLM.
 * @param {string} ocrText - The raw text extracted by OCR.
 * @returns {Promise<{success: boolean, data: object|null, error?: Error}>} Result object.
 */
async function structureOcrData(ocrText) {
  log('INFO', '--- STRUCTURING OCR DATA ---');
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) { throw new Error('OpenRouter API key missing'); }
  
  try {
    log('INFO', `Using ${STRUCTURING_MODEL} to structure OCR text`);
    
    // Refined prompt with specific instructions and examples
    const prompt = `\\nYou are an expert AI specializing in extracting structured information from noisy OCR text of restaurant menus.\\nYour task is to meticulously analyze the provided OCR text and generate a VALID JSON object representing the menu structure.\\n\\nThe required JSON format is:\\n{\\n  \\\"restaurant\\\": {\\n    \\\"name\\\": \\\"RESTAURANT_NAME_OR_NULL\\\", \\n    \\\"location\\\": \\\"RESTAURANT_ADDRESS_STREET_CITY_OR_NULL\\\" \\n  },\\n  \\\"categories\\\": [ /* ... categories and dishes ... */ ]\\n}\\n\\n**ABSOLUTELY CRITICAL INSTRUCTIONS:**\\n1.  **Restaurant Info is MANDATORY:** ALWAYS include the \\\"restaurant\\\" object with \\\"name\\\" and \\\"location\\\" keys.\\n2.  **Finding the Name:** The restaurant name is often at the VERY TOP of the menu, sometimes in ALL CAPS or larger font. Look carefully for it there.\\n3.  **Finding the Location:** Look for a street address, cross-streets, neighborhood, or city. Capture the most specific location info available. Even a single street name is useful if that's all present.\\n4.  **Use null for Unknowns:** If the restaurant name or its location/address CANNOT be reliably identified in the text, you MUST use the JSON value null for that specific key. DO NOT omit the keys.\\n    *   Example 1 (Full): \\\"restaurant\\\": { \\\"name\\\": \\\"Central Perk\\\", \\\"location\\\": \\\"123 Main St, Anytown\\\" }\\n    *   Example 2 (Partial): \\\"restaurant\\\": { \\\"name\\\": \\\"BEUSTER BAR\\\", \\\"location\\\": \\\"Weserstr.\\\" } \\n    *   Example 3 (Name Only): \\\"restaurant\\\": { \\\"name\\\": \\\"The Diner\\\", \\\"location\\\": null }\\n5.  **Dish Details:** Extract categories, dish names, descriptions, prices (numbers or null), dietary tags (e.g., \\\"v\\\", \\\"gf\\\"; use [] if none).\\n6.  **Valid Dishes:** Every dish MUST have a \\\"name\\\". Omit dishes without a clear name.\\n7.  **Clean Output:** Output ONLY the raw, valid JSON object. No introductory text, explanations, comments, or markdown formatting.\\n\\nOCR Text to Parse:\\n------\\n${ocrText}\\n------\\n\\\\nJSON Output:\\n`;
            
    const requestPayload = { 
      model: STRUCTURING_MODEL, 
      messages: [{ role: "user", content: prompt }], 
      temperature: 0.1, // Low temperature for more deterministic output
      response_format: { type: "json_object" } // Request JSON object output
    };
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for structuring
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { 
        method: "POST", 
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000", 
            "X-Title": process.env.APP_NAME || "PaquappTest"
        },
        body: JSON.stringify(requestPayload), 
        signal: controller.signal 
    });
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      log('ERROR', 'Failed to structure OCR data via OpenRouter', { status: response.status, errorText: errorText.substring(0, 500) });
      // Return error status
      return { success: false, error: new Error(`Structuring failed: ${response.statusText}`) };
    }
    
    const result = await response.json();
    const structuredText = result.choices?.[0]?.message?.content;
    if (!structuredText) { 
        log('ERROR', 'No structured data text content received from LLM', result); 
        return { success: false, error: new Error('Structuring failed: Empty response content') }; 
    }
    
    let structuredData;
    try {
      structuredData = JSON.parse(structuredText);
      log('DEBUG', 'Raw structured data received (restaurant part):', structuredData.restaurant);
      
      // --- Post-processing Fallback for Location ---
      // Attempt this only if the LLM provided a name but missed the location.
      if (structuredData.restaurant && 
          structuredData.restaurant.name && 
          (!structuredData.restaurant.location || structuredData.restaurant.location.trim() === '')) {
          
          log('INFO', 'LLM missed location, attempting fallback extraction from raw OCR text...');
          let foundLocation = null;
          const lines = ocrText.split(/\r?\n/); // Split raw OCR text into lines
          
          // Regex patterns for address components (adjust for locale if needed)
          const addressKeywords = /\b(straße|strasse|str|platz|damm|allee|weg|ufer|gasse|chaussee|markt|ring|gmbh)\b/i;
          const cityPostalPatterns = /\b(berlin|\d{5})\b/i; // Look for Berlin or 5-digit postal code
          const likelyNumber = /\b\d{1,4}[a-zA-Z]?\b/; // Look for a house number pattern
          
          let bestCandidateLine = null;
          let bestCandidateScore = 0;

          // --- Heuristic Search Logic --- 
          // Iterate through lines to find the most likely address line based on keywords/patterns
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length < 5 || trimmedLine.length > 100) continue; // Basic line filtering

            let score = 0;
            if (addressKeywords.test(trimmedLine)) score += 2;
            if (cityPostalPatterns.test(trimmedLine)) score += 2;
            if (likelyNumber.test(trimmedLine)) score += 1;

            // Prioritize lines with multiple clues
            if (score >= 3 && score > bestCandidateScore) { 
                bestCandidateScore = score;
                bestCandidateLine = trimmedLine;
            }
          }
          
          // If no high-scoring line found, try lower score threshold (street or city/postal)
          if (!bestCandidateLine) {
              for (const line of lines) {
                  const trimmedLine = line.trim();
                  if (trimmedLine.length < 5 || trimmedLine.length > 100) continue;
                  let score = 0;
                  if (addressKeywords.test(trimmedLine)) score += 1;
                  if (cityPostalPatterns.test(trimmedLine)) score += 1;
                  
                  if (score > 0 && score > bestCandidateScore) {
                      bestCandidateScore = score;
                      bestCandidateLine = trimmedLine;
                  }
              }
          }
          // --- End Heuristic Search Logic ---

          if (bestCandidateLine) {
            foundLocation = bestCandidateLine; 
            log('INFO', `Fallback location extractor found potential address line: \"${foundLocation}\"`);
            structuredData.restaurant.location = foundLocation; // Update the location in the object
            log('DEBUG', 'Updated structured data with fallback location:', structuredData.restaurant);
          } else {
            log('INFO', 'Fallback location extractor did not find a likely candidate line.');
          }
      }
      // --- End Post-processing Fallback ---
      
      const dishCount = structuredData.categories?.reduce((sum, cat) => sum + (cat.dishes?.length || 0), 0) || 0;
      log('SUCCESS', `Structured OCR data in ${responseTime}s`, { categoriesCount: structuredData.categories?.length || 0, dishesCount: dishCount });
      
      // Save structured data to a file for review
      try {
        const outputPath = path.join(RESULTS_DIR, `structured-menu-data-${Date.now()}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(structuredData, null, 2));
        log('INFO', `Structured data saved to: ${outputPath}`);
      } catch(e) { log('WARN', 'Failed to save structured data file', e); }
      
      // Return success with structured data
      return { success: true, data: structuredData };
      
    } catch (error) { 
        log('ERROR', 'Failed to parse JSON from LLM', { error: error.message, receivedText: structuredText.substring(0, 500) }); 
        // Return error status
        return { success: false, error: new Error(`JSON parse failed: ${error.message}`) }; 
    }
  } catch (error) {
    if (error.name === 'AbortError') {
         log('ERROR', `Structuring timed out`);
         return { success: false, error: new Error('Structuring timed out') }; 
    } else {
         log('ERROR', 'Error during structuring process', { error: error.message });
         return { success: false, error };
    }
  }
}

// --- EMBEDDING GENERATION --- 
/**
 * Generate a 1536-dimension embedding for the given text using the direct OpenAI API.
 * @param {string} textToEmbed - The text to embed.
 * @returns {Promise<Array<number>|null>} The embedding vector or null if an error occurs.
 */
async function generateMenuEmbedding(textToEmbed) {
  log('INFO', '--- generateMenuEmbedding (Using OpenAI API Directly) ---'); 

  const apiKey = process.env.OPENAI_API_KEY; // Use the primary OpenAI key
  
  if (!apiKey) {
    log('ERROR', 'OpenAI API key not found in environment variables (checked process.env.OPENAI_API_KEY). Cannot generate embedding.');
    throw new Error('OpenAI API key missing in environment variables.'); 
  }
  
  const maskedKey = apiKey.startsWith('sk-') ? `${apiKey.slice(0, 5)}...${apiKey.slice(-4)}` : 'API Key (format not recognized for masking)';
  log('DEBUG', `OpenAI API Key read: ${maskedKey}`);

  if (!textToEmbed || typeof textToEmbed !== 'string' || textToEmbed.trim().length === 0) {
    log('WARN', 'generateMenuEmbedding called with invalid or empty text.');
    return null;
  }

  const model = 'text-embedding-ada-002'; // OpenAI standard embedding model
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });
    
    log('INFO', `Generating embedding via OpenAI API (model: ${model}) for text length: ${textToEmbed.length}`);
    log('DEBUG', `Embedding input sample: "${textToEmbed.substring(0, 70)}..."`);

    // --- Sending Request ---
    log('DEBUG', `--- Sending Request to OpenAI Embeddings API (model: ${model}) ---`);
    const startTime = Date.now();
    const response = await openai.embeddings.create({
      model: model,
      input: textToEmbed,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('DEBUG', `--- Received Response from OpenAI Embeddings API in ${duration}s ---`);
    // --- End Request ---

    // Check OpenAI's expected response structure
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].embedding && Array.isArray(response.data[0].embedding)) {
      const embedding = response.data[0].embedding;
      log('SUCCESS', 'Successfully generated embedding via OpenAI API.');
      log('INFO', `Embedding dimensions: ${embedding.length}`); // Promote dimensions to INFO
      
      // Ensure it's the expected dimension (1536 for ada-002)
      if (embedding.length !== 1536) {
          log('WARN', `Generated embedding has unexpected dimensions: ${embedding.length} (expected 1536)`);
          return null; // Return null if dimensions mismatch
      }
      
      return embedding; // Return the full 1536-dimensional embedding
    } else {
      log('ERROR', 'Failed to generate embedding - Invalid response format from OpenAI API.', response);
      return null;
    }
  } catch (error) {
    log('ERROR', 'Exception occurred during OpenAI embedding generation API call.');
    if (error instanceof OpenAI.APIError) {
        log('ERROR', `OpenAI API Error Details: Status=${error.status}, Code=${error.code}, Type=${error.type}, Message=${error.message}`);
        log('ERROR', `Error Headers: ${JSON.stringify(error.headers)}`);
    } else {
        log('ERROR', `Non-API Error: ${error.message}`, { stack: error.stack });
    }
    return null;
  }
}

// --- SAVING TO SUPABASE --- Includes Vector Search ---

/**
 * Saves OCR results to Supabase, performing deduplication checks.
 * Workflow:
 * 1. Structure OCR text (with location fallback).
 * 2. Calculate hashes (content signature, full structure).
 * 3. Check 0: Handled in main() - checks for user/image_hash duplicate.
 * 4. Check 2: Global Content Signature Hash Match - Search entire DB for matching signature.
 * 5. Check 2.5: Global Vector Similarity Match - If no signature match, generate embedding and search globally for similar vectors.
 * 6. Check 3: Create New Canonical Menu - If no duplicates found.
 * 7. Insert menu_scan record, linking to existing or new canonical menu.
 * @param {object} ocrResult - Result from runOcrWithFallbackChain ({ success, text, model }).
 * @param {string} userId - The user's UUID.
 * @param {string} imageHash - The SHA256 hash of the image file.
 * @returns {Promise<object>} Object summarizing the save operation result.
 */
async function saveToSupabase(ocrResult, userId, imageHash) {
  log('INFO', '--- SAVING DATA (Workflow with Vector Search - Global Checks) ---');
  const supabase = getSupabaseClient();

  // --- Prepare Data for Checks & Saving ---
  // Structure OCR Text (includes potential fallback for location)
  const { data: structuredData, error: structureError } = await structureOcrData(ocrResult.text);
  if (structureError || !structuredData) { 
      log('ERROR', 'Structuring failed before save', structureError || 'No structured data returned'); 
      throw structureError || new Error('Structuring failed'); 
  }
  
  const restaurantName = structuredData.restaurant?.name; // Can be null after LLM+fallback
  const location = structuredData.restaurant?.location; // Can be null or fallback value
  const normalizedName = normalizeMetadataString(restaurantName);
  const normalizedLocation = normalizeMetadataString(location);
  
  // Calculate content signature hash (based on dish names)
  const { hash: signatureHash, signatureString } = calculateContentSignatureHash(structuredData);
  
  // Calculate full structure hash (based on entire normalized structure)
  const fullHash = calculateFullStructureHash(structuredData);
  
  // Count dishes
  const dishCount = structuredData.categories?.reduce((sum, cat) => sum + (cat.dishes?.length || 0), 0) || 0;

  // Define text for embedding (using normalized metadata + dish signature string)
  // Still useful even if name/location are null for vector search and creating new entries
  const text_for_embedding = `${normalizedName || ''} ${normalizedLocation || ''} ${signatureString || ''}`.trim();

  log('INFO', 'Generated Hashes/Metadata for Deduplication Checks:', {
    normalizedName,
    normalizedLocation,
    signatureHash: signatureHash?.substring(0,10) + '...',
    fullHash: fullHash?.substring(0,10) + '...',
    dishCount,
    embeddingTextSample: text_for_embedding.substring(0, 100) + '...'
  });

  // --- New Deduplication Workflow ---
  let existingCanonicalId = null;
  let reuseMethod = null;
  let currentEmbedding = null; // Store embedding if generated during checks

  // --- Check 2: Global Content Signature Hash Match ---
  if (!signatureHash) {
    log('WARN', 'CHECK 2: Skipping global signature check - content_signature_hash is null/empty.');
  } else {
    log('DATABASE', 'CHECK 2: Querying globally for content_signature_hash...', { signatureHash: signatureHash.substring(0,10) + '...' });
    try {
      const { data: signatureMatchData, error: signatureError } = await supabase
        .from('canonical_menus')
        .select('id') // Select only needed columns
        .eq('content_signature_hash', signatureHash)
        .limit(1);

      if (signatureError) {
        log('ERROR', 'CHECK 2: Error querying for global signature hash', signatureError);
        // Proceed to vector check despite error? Or throw? Let's proceed for now.
      } else if (signatureMatchData && signatureMatchData.length > 0) {
        existingCanonicalId = signatureMatchData[0].id;
        reuseMethod = 'content_signature_reuse';
        log('INFO', `CHECK 2: DUPLICATE DETECTED (Global Content Signature Match). Reusing canonical menu ID: ${existingCanonicalId}`);
      } else {
        log('INFO', 'CHECK 2: Passed. No matching global content signature found.');
      }
    } catch (e) {
      log('ERROR', 'CHECK 2: Exception during global signature check query.', e);
    }
  }

  // --- Check 2.5: Global Vector Similarity Search (if Check 2 failed) ---
  if (!existingCanonicalId) {
    log('INFO', 'CHECK 2.5: Attempting Global Vector Similarity Search...');
    if (!text_for_embedding) {
        log('WARN', 'CHECK 2.5: Skipping vector search - text_for_embedding is empty.');
    } else {
        // Generate embedding for the current menu
        currentEmbedding = await generateMenuEmbedding(text_for_embedding);

        if (currentEmbedding === null) {
          log('WARN', 'CHECK 2.5: Skipping vector search - Embedding generation failed or returned null.');
        } else {
          log('DATABASE', 'Performing global vector similarity search via RPC...');
          try {
            const embeddingString = `[${currentEmbedding.join(',')}]`; // Format for Supabase
            const VECTOR_SIMILARITY_THRESHOLD = 0.90; // Define similarity threshold
            const distanceThreshold = 1 - VECTOR_SIMILARITY_THRESHOLD; // Convert to distance for '<=>'

            // Call the Supabase RPC function
            const { data: similarMenus, error: vectorError } = await supabase
               .rpc('match_closest_canonical_menu', { 
                  query_embedding: embeddingString,
                  match_threshold: distanceThreshold, // Pass distance threshold
                  match_count: 1 // We only need the closest one
               });

            if (vectorError) {
              log('ERROR', 'CHECK 2.5: Error during global vector similarity search RPC', vectorError);
            } else if (similarMenus && similarMenus.length > 0) {
              const closestMatch = similarMenus[0]; 
              const similarity = 1 - closestMatch.distance; // Calculate similarity

              log('INFO', `CHECK 2.5: Closest global vector match found: ID=${closestMatch.id}, Similarity=${similarity.toFixed(4)}`);

              // Check if the similarity meets our threshold 
              if (similarity >= VECTOR_SIMILARITY_THRESHOLD) { 
                log('INFO', `CHECK 2.5: DUPLICATE DETECTED (Global Vector Similarity Match >= ${VECTOR_SIMILARITY_THRESHOLD}). Reusing canonical menu ID: ${closestMatch.id}`);
                existingCanonicalId = closestMatch.id;
                reuseMethod = 'vector_similarity_reuse';
              } else {
                 log('INFO', 'CHECK 2.5: Closest global vector match similarity below threshold. Proceeding to create new.');
              }
            } else {
              log('INFO', 'CHECK 2.5: No sufficiently similar menus found via global vector search.');
            }
          } catch(e) {
              log('ERROR', 'CHECK 2.5: Exception during global vector similarity search step', e);
          }
        }
    }
  } // End of Check 2.5

  // --- Final Save/Update Logic ---
  const scanId = uuidv4(); 
  try {
    // Ensure user exists (should be done earlier ideally, but definitely before insert)
    await ensureUserExists(userId);

    if (existingCanonicalId) {
      // Scenario: Reuse existing canonical menu (found via Global Signature or Global Vector Match)
      await insertMenuScan(scanId, userId, existingCanonicalId, imageHash, ocrResult.text, ocrResult.model.id, restaurantName, location);
      log('SUCCESS', `Reused canonical menu ${existingCanonicalId} via ${reuseMethod}. Created new scan ${scanId}.`);
      
      // Fetch details of the reused menu for final result reporting
      const { data: existingMenuData, error: menuError } = await supabase
            .from('canonical_menus')
            .select('dish_count, content_signature_hash, full_structure_hash')
            .eq('id', existingCanonicalId)
            .single();
            
      const existingDishCount = menuError ? null : existingMenuData?.dish_count;
      
      // Return result indicating reuse
      return { 
          scanId: scanId,
          method: reuseMethod,
          canonicalId: existingCanonicalId,
          isDuplicate: true, // Indicates content duplicate
          dishCount: existingDishCount,
          contentSignatureHash: existingMenuData?.content_signature_hash, 
          fullStructureHash: existingMenuData?.full_structure_hash, 
          imageHash: imageHash
      };
    } else {
      // Scenario: Create New Canonical Menu (No global match found)
      log('INFO', 'CHECK 3: Creating new canonical menu and associated records.');
      
      // Generate embedding now if it wasn't generated during Check 2.5
      let embeddingToInsert = currentEmbedding; // Reuse if already generated
      if (!embeddingToInsert && text_for_embedding) { 
        log('INFO', 'CHECK 3: Generating embedding for new canonical menu...');
        embeddingToInsert = await generateMenuEmbedding(text_for_embedding);
      } else if (!text_for_embedding) {
        log('WARN', 'CHECK 3: Cannot generate embedding for new canonical menu: text_for_embedding is empty.');
      }
      
      // Insert the new canonical menu record
      const canonicalResult = await insertCanonicalMenu(normalizedName, normalizedLocation, signatureHash, fullHash, dishCount, embeddingToInsert);
      const newCanonicalId = canonicalResult.id;
      
      // Insert the scan record linking to the new canonical menu
      await insertMenuScan(scanId, userId, newCanonicalId, imageHash, ocrResult.text, ocrResult.model.id, restaurantName, location);
      
      // Update the canonical menu with its first scan ID
      await updateCanonicalMenuFirstScanId(newCanonicalId, scanId);
      
      // Insert associated dishes
      const finalDishCount = await insertDishes(newCanonicalId, structuredData);
      
      log('SUCCESS', `Created new canonical menu ${newCanonicalId}. New scan ${scanId}. Inserted ${finalDishCount} dishes.`);
      
      // Return result indicating new menu creation
      return { 
          scanId: scanId,
          method: 'new_canonical_menu',
          canonicalId: newCanonicalId,
          dishCount: finalDishCount, 
          isDuplicate: false,
          contentSignatureHash: signatureHash, 
          fullStructureHash: fullHash, 
          imageHash: imageHash
      };
    }
  } catch (error) { 
      log('ERROR', 'Error during final save operation', error); 
      // Re-throw critical errors after logging
      throw new Error(`Final save failed: ${error.message}`); 
  }
}

// --- MAIN EXECUTION LOGIC --- 
async function main() {
  const startTime = Date.now();
  let imageHash = null; 
  let saveResult = null;
  try {
    log('INFO', '=== STARTING END-TO-END OCR & SUPABASE TEST ===');
    log('INFO', `Test image: ${TEST_IMAGE_PATH}`);
    log('INFO', `Test user: ${TEST_USER_ID}`);
    
    if (!fs.existsSync(TEST_IMAGE_PATH)) { 
        log('ERROR', `Test image not found at: ${TEST_IMAGE_PATH}`); 
        throw new Error('Test image not found');
    }
    
    log('INFO', 'Loading test image');
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const imageBase64 = imageBuffer.toString('base64'); 
    log('INFO', `Image loaded (${Math.round(imageBase64.length / 1024)} KB)`);
    
    // Calculate image hash
    imageHash = calculateSHA256(imageBuffer); 
    log('INFO', `Calculated image hash: ${imageHash.substring(0, 16)}...`);
    
    // Check 0: Check for user image duplicate FIRST
    const existingUserScan = await checkForExistingUserScan(TEST_USER_ID, imageHash);

    if (existingUserScan) {
       // Scenario: Image hash duplicate found for this user
       log('INFO', `CHECK 0: DUPLICATE DETECTED (Image Hash). User ${TEST_USER_ID} already scanned this image.`);
       saveResult = {
         scanId: existingUserScan.id,
         method: 'duplicate_image_hash',
         isDuplicate: true,
         canonicalId: null, // Not applicable
         dishCount: null, // Not applicable
         contentSignatureHash: null, // Not calculated
         fullStructureHash: null, // Not calculated
         imageHash: imageHash
       };
    } else {
       // Scenario: No image hash duplicate, proceed with OCR and saving
       log('INFO', 'CHECK 0: Passed. No duplicate image hash found for this user.');
       log('INFO', 'Starting OCR extraction');
       const ocrResponse = await runOcrWithFallbackChain(imageBase64); 
       if (!ocrResponse || !ocrResponse.success) { 
         throw new Error('OCR extraction failed before saving.');
       }
       
       // Perform the save operation (includes deduplication checks)
       saveResult = await saveToSupabase(ocrResponse, TEST_USER_ID, imageHash);
    }

    // --- Test summary ---
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log('SUCCESS', `\n=== TEST COMPLETED SUCCESSFULLY IN ${totalTime}s ===`);
    
    // Construct final result object for output marker
    const finalResultData = { 
        scanId: saveResult?.scanId || null,
        method: saveResult?.method || 'unknown',
        canonicalId: saveResult?.canonicalId || null,
        dishCount: saveResult?.dishCount,
        isDuplicate: saveResult?.isDuplicate || false,
        contentSignatureHash: saveResult?.contentSignatureHash || null,
        fullStructureHash: saveResult?.fullStructureHash || null,
        imageHash: imageHash
    };
    // Output final result marker for parsing by the test suite runner
    console.log(`FINAL_RESULT::${JSON.stringify(finalResultData)}`);

    return finalResultData;

  } catch (error) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log('ERROR', `\n=== TEST FAILED AFTER ${totalTime}s ===`);
    log('ERROR', error.message);
    if (error.stack) { console.error(error.stack); }
    
    // Log failure marker with available details
    console.log(`FINAL_RESULT::${JSON.stringify({ 
        success: false, 
        error: error.message, 
        method: saveResult?.method, // Include method if available
        scanId: saveResult?.scanId, // Include scanId if available
        imageHash: imageHash // Include imageHash if available
    })}`);
    process.exit(1); // Exit with error code
  }
}

// --- SCRIPT EXECUTION --- 
(async () => {
  try {
    // Validate essential Env Vars needed *before* Supabase client initialization or main() call
    if (!process.env.OPENROUTER_API_KEY) {
        log('ERROR', '❌ ERROR: Missing OPENROUTER_API_KEY environment variable.');
        process.exit(1);
    }
     if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
       log('ERROR', '❌ ERROR: Missing Supabase environment variables');
       log('ERROR', '  Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
       process.exit(1);
     }
      if (!process.env.OPENAI_API_KEY) {
       log('ERROR', '❌ ERROR: Missing OPENAI_API_KEY environment variable (needed for embeddings).');
       process.exit(1);
     }
     
    // Execute the main test flow
    await main();
    
  } catch (error) {
    // Catch top-level errors (e.g., during setup)
    log('ERROR', 'TOP LEVEL EXECUTION ERROR in test-full-ocr-flow.js:', error);
    console.log(`FINAL_RESULT::${JSON.stringify({ success: false, error: error.message || 'Unknown top-level error' })}`);
    process.exit(1); 
  }
})();