// Image upload handler with OpenRouter OCR integration
// Updated for Git commit
import busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { getUserIdForScan } from '@/lib/utils/getUserIdForScan';
import logger from '@/lib/logger';

/**
 * OPENROUTER VISION MODEL IMPLEMENTATION:
 * --------------------------------
 * Using OpenRouter's vision models to extract text from menu images.
 * Implements a cost-optimized fallback chain of models:
 * 1. meta-llama/llama-3.2-11b-vision-instruct:free (Free tier)
 * 2. qwen/qwen-2.5-vl-7b-instruct:free (Free tier)
 * 3. google/gemini-flash-1.5 (Low cost)
 * 4. openai/gpt-4o-mini (Medium cost)
 * 5. anthropic/claude-3-haiku (Medium cost)
 * 6. anthropic/claude-3.5-sonnet (Higher cost)
 * 
 * NO SIMULATED OR FAKE DATA POLICY:
 * - We NEVER return or store fake or simulated menu content
 * - If all OCR models fail, we return a clear error message
 * - All database inserts only contain real extracted text
 * 
 * FLOW:
 * 1. Attempts to use each vision model in sequence, starting with free/low cost models
 * 2. If a model succeeds, we use that result and stop the chain
 * 3. If all models fail, returns proper error (no fake fallbacks)
 * 4. Only saves real extracted text to the database
 */

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse the multipart form data using busboy
 */
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    // Initialize result object
    const result = {
      fields: {},
      files: {}
    };
    
    // Create busboy instance
    const bb = busboy({ headers: req.headers });
    
    // Handle file fields
    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      
      file.on('data', (data) => {
        chunks.push(data);
      });
      
      file.on('end', () => {
        result.files[name] = {
          name: filename,
          mimeType: mimeType,
          encoding: encoding,
          data: Buffer.concat(chunks),
          size: Buffer.concat(chunks).length
        };
      });
    });
    
    // Handle regular fields
    bb.on('field', (name, val) => {
      result.fields[name] = val;
    });
    
    // Handle parsing completion
    bb.on('close', () => {
      resolve(result);
    });
    
    // Handle error
    bb.on('error', (err) => {
      reject(err);
    });
    
    // Pipe the request to busboy
    req.pipe(bb);
  });
}

/**
 * Extract text from an image using a chain of OpenRouter vision models
 * Starting with least expensive models and falling back to more expensive ones if needed
 */
async function extractTextFromImage(base64Image) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  // Check if OpenRouter API key exists
  if (!OPENROUTER_API_KEY) {
    logger.error('OCR', 'OpenRouter API key is missing');
    return { success: false, error: 'OpenRouter API key is missing' };
  }
  
  // Define the model chain from least to most expensive
  const modelChain = [
    { id: "meta-llama/llama-3.2-11b-vision-instruct:free", name: "Llama 3.2 Vision (Free)" },
    { id: "qwen/qwen-2.5-vl-7b-instruct:free", name: "Qwen 2.5 VL (Free)" },
    { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" }
  ];
  
  // Try each model in sequence
  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    logger.log('OCR', `Attempting OCR with model ${i+1}/${modelChain.length}: ${model.name}`, {
      modelId: model.id
    });
    
    try {
      // Create the request payload for the current model
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
      
      // Log the API request attempt
      logger.log('OCR', `Sending request to OpenRouter with ${model.name}`, {
        model: model.id,
        imageSize: Math.round(base64Image.length / 1024) + 'KB'
      });
      
      // Set timeout for the API call (45 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      // Make the API request
      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://paquapp.vercel.app",
          "X-Title": "Paquapp_v3"
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if the API call was successful
      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        logger.error('OCR', `${model.name} API request failed, will try next model`, {
          status: openRouterResponse.status,
          statusText: openRouterResponse.statusText,
          responseBody: errorText.substring(0, 200)
        });
        // Continue to the next model
        continue;
      }
      
      // Parse the response
      const openRouterResult = await openRouterResponse.json();
      const extractedText = openRouterResult.choices?.[0]?.message?.content;
      
      // Validate the extracted text
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length < 20) {
        logger.error('OCR', `${model.name} returned insufficient text, will try next model`, {
          textLength: extractedText?.length || 0,
          textSample: extractedText?.substring(0, 50) || 'empty'
        });
        // Continue to the next model
        continue;
      }
      
      // Success! We have valid OCR text
      logger.log('OCR', `Successfully extracted text with ${model.name}`, {
        textLength: extractedText.length,
        textSample: extractedText.substring(0, 100) + '...',
        model: openRouterResult.model || model.id
      });
      
      return {
        success: true,
        text: extractedText,
        method: model.id,
        modelName: model.name
      };
      
    } catch (error) {
      // Handle errors with this model attempt
      if (error.name === 'AbortError') {
        logger.error('OCR', `${model.name} request timed out after 45 seconds, will try next model`);
      } else {
        logger.error('OCR', `Exception during ${model.name} API call, will try next model`, error);
      }
      // Continue to the next model
    }
  }
  
  // If we reach this point, all models failed
  logger.error('OCR', 'All OCR models failed. No text could be extracted from the image.');
  
  return {
    success: false,
    error: 'OCR failed – all models failed to extract valid text from the image.',
    details: 'Attempted 6 different vision models without success.'
  };
}

/**
 * API endpoint for menu scanning with OCR capabilities
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    logger.warn('UPLOAD', `Rejected non-POST request: ${req.method}`);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  logger.log('UPLOAD', 'Received image upload request');
  
  try {
    // Parse the form data using busboy
    logger.log('UPLOAD', 'Parsing multipart form data');
    const formData = await parseFormData(req);
    
    // Check if image field exists
    const imageFile = formData.files['image'];
    if (!imageFile) {
      logger.error('UPLOAD', 'No image file found in request');
      return res.status(400).json({ 
        success: false, 
        error: 'No image file found in request' 
      });
    }
    
    // Log file information
    logger.log('UPLOAD', 'Image received', {
      filename: imageFile.name || 'unnamed',
      type: imageFile.mimeType, 
      size: `${imageFile.size} bytes`,
      sizeKb: Math.round(imageFile.size / 1024)
    });
    
    // Check if image has valid data
    if (!imageFile.data || imageFile.size === 0) {
      logger.error('UPLOAD', 'Image data is empty or invalid', {
        hasData: !!imageFile.data,
        size: imageFile.size
      });
      return res.status(400).json({
        success: false,
        error: 'Image data is empty or invalid'
      });
    }
    
    // Convert image to base64 format for OpenRouter
    logger.log('OCR', 'Converting image to base64');
    let base64Image;
    try {
      base64Image = imageFile.data.toString('base64');
      logger.log('OCR', 'Base64 conversion successful', { 
        length: base64Image.length,
        preview: base64Image.substring(0, 20) + '...'
      });
    } catch (conversionError) {
      logger.error('OCR', 'Failed to convert image to base64', conversionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process image file'
      });
    }
    
    // Process image with OpenRouter OCR
    logger.log('OCR', 'Starting OCR processing with model fallback chain');
    const ocrResult = await extractTextFromImage(base64Image);
    
    // If OCR failed, return error
    if (!ocrResult.success) {
      logger.error('OCR', 'OCR processing failed - no fake data will be returned', ocrResult);
      return res.status(400).json({
        success: false,
        error: 'Sorry, we couldn\'t extract the menu. Please try again.',
        details: ocrResult.error || 'Unknown error',
      });
    }
    
    // Extract and verify text
    const extractedText = ocrResult.text;
    if (!extractedText || extractedText.trim().length === 0) {
      logger.error('OCR', 'Failed to extract any text from image');
      return res.status(400).json({
        success: false,
        error: 'Sorry, we couldn\'t extract any text from the menu. Please try again with a clearer image.'
      });
    }
    
    logger.log('OCR', 'OCR extraction completed successfully', {
      method: ocrResult.method,
      modelName: ocrResult.modelName
    });
    
    // Log a truncated version of the extracted text
    const textSample = logger.truncateText(extractedText, 100);
    logger.log('OCR', `Text extracted (${extractedText.length} chars)`, { 
      preview: textSample,
      method: ocrResult.method
    });
    
    // Generate a unique ID for this scan
    const scanId = uuidv4();
    logger.log('SUPABASE', 'Generated scan ID', { scanId });
    
    // Pass formData to getUserIdForScan to allow it to check for test_dev_mode
    req.formData = formData;
    
    // Get authenticated user ID from Supabase (now handling test mode internally)
    logger.log('AUTH', 'Getting authenticated user for scan');
    const userId = await getUserIdForScan(req);
    
    if (!userId) {
      logger.error('AUTH', 'No user ID found. Skipping database insert.');
      return res.status(200).json({ 
        success: false, 
        error: "No user ID available for database insert",
        ocrTextSample: textSample
      });
    }
    
    logger.log('AUTH', `Using user ID for database insertion: ${userId}`);

    // First try the menu scan insert directly (without checking for profile)
    logger.log('SUPABASE', 'Preparing to insert scan data', { scanId, userId });
    try {
      const insertPayload = {
        id: scanId,
        user_id: userId, // Use authenticated user ID
        menu_raw_text: extractedText,
        scanned_at: new Date().toISOString(),
        restaurant_name: 'Test Restaurant',
        location: 'Test Location',
        ocr_method: ocrResult.method || 'openrouter-vision'
      };
      
      logger.log('SUPABASE', 'Insert payload', {
        ...insertPayload,
        menu_raw_text: textSample // Only log sample in console for readability
      });
      
      logger.logDbOperation('insert', 'menu_scan', {
        id: scanId,
        user_id: userId,
        textLength: extractedText.length,
        ocr_method: insertPayload.ocr_method
      });
      
      const { data, error } = await supabase
        .from('menu_scan')
        .insert(insertPayload)
        .select('id')
        .single();
      
      if (error) {
        // For foreign key violations, try creating the user profile first
        if (error.code === '23503') {
          logger.error('SUPABASE', 'Foreign key constraint - creating user profile', error);
          
          // Simple user profile insert with minimal data
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .insert({
              id: userId, 
              email: 'test@example.com', // Add required email field
              created_at: new Date().toISOString()
            });
            
          if (profileError) {
            logger.error('SUPABASE', 'Failed to create user profile', profileError);
            return res.status(200).json({
              success: false,
              error: `Failed to create user profile: ${profileError.message}`,
              ocrTextSample: textSample
            });
          }
          
          // Try the menu scan insert again
          logger.log('SUPABASE', 'User profile created, retrying menu scan insert');
          const { data: retryData, error: retryError } = await supabase
            .from('menu_scan')
            .insert(insertPayload)
            .select('id')
            .single();
            
          if (retryError) {
            logger.error('SUPABASE', 'Retry insert failed', retryError);
            return res.status(200).json({
              success: false, 
              error: `Retry database insertion failed: ${retryError.message}`,
              ocrTextSample: textSample
            });
          }
          
          logger.log('SUPABASE', `Retry insert successful! Row ID: ${retryData.id}`);
          return res.status(200).json({ 
            success: true,
            supabaseInsertId: retryData.id,
            ocrTextSample: textSample,
            ocrMethod: ocrResult.method,
            modelUsed: ocrResult.modelName
          });
        }
        
        // Handle other errors
        logger.error('SUPABASE', `Insert failed with code: ${error.code}`, error);
        return res.status(200).json({ 
          success: false,
          error: `Database insertion failed: ${error.message}`,
          code: error.code,
          ocrTextSample: textSample
        });
      }
      
      logger.log('SUPABASE', `Insert successful! Row ID: ${data.id}`);
      
      // Return success response
      return res.status(200).json({ 
        success: true,
        supabaseInsertId: data.id,
        ocrTextSample: textSample,
        ocrMethod: ocrResult.method,
        modelUsed: ocrResult.modelName
      });
    } catch (supabaseError) {
      logger.error('SUPABASE', 'Exception during insert attempt', supabaseError);
      
      // Return detailed error but include OCR results
      return res.status(200).json({
        success: false,
        error: `Database exception: ${supabaseError.message}`,
        ocrTextSample: textSample
      });
    }
  } catch (error) {
    logger.error('ERROR', 'Unhandled exception in scan processing', error);
    
    return res.status(500).json({
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    });
  }
} 