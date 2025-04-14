/**
 * Test script to verify OpenRouter OCR with the Yi Vision model
 * This script directly tests the OCR functionality without using the API endpoint
 */
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Load .env.local file for API keys
require('dotenv').config({ path: '.env.local' });

async function testOpenRouterOcr() {
  try {
    console.log("🧪 Testing OpenRouter OCR with Yi Vision model...");
    
    // Load test image file
    const imagePath = path.join(__dirname, 'attached_assets', 'test-menu.jpg');
    console.log(`Loading image from: ${imagePath}`);
    
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Test image not found at ${imagePath}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📷 Image loaded (Buffer size: ${Math.round(imageBuffer.length / 1024)} KB)`);
    
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    console.log(`🔄 Converted image to base64 (${Math.round(base64Image.length / 1024)} KB)`);
    
    // Check for OpenRouter API key
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.error("❌ OpenRouter API key is missing. Please add OPENROUTER_API_KEY to .env.local");
      return;
    }
    
    console.log("🔑 Found OpenRouter API key");
    
    // Create payload for OpenRouter API
    console.log("📤 Preparing OpenRouter request with GPT-4o Vision model...");
    const requestPayload = {
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text visible in this image of a restaurant menu. Format the text as you see it, preserving sections and layout as much as possible. Only include text you can clearly see in the image. Just return the text content without additional commentary."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0
    };
    
    console.log("🌐 Sending request to OpenRouter...");
    const start = Date.now();
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://nutriflow.vercel.app",
        "X-Title": "NutriFlow OCR Test"
      },
      body: JSON.stringify(requestPayload)
    });
    
    const duration = Date.now() - start;
    console.log(`⏱️ Response received in ${duration}ms, status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ OpenRouter API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return;
    }
    
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content;
    
    if (!extractedText) {
      console.error("❌ No text extracted from the image");
      console.error("Response:", JSON.stringify(result, null, 2));
      return;
    }
    
    console.log("✅ Successfully extracted text using OpenRouter Yi Vision model!");
    console.log("\n--- Extracted Text Preview (first 500 chars) ---\n");
    console.log(extractedText.substring(0, 500) + "...");
    console.log("\n--- End of Preview ---\n");
    
    // Save the extracted text to a file for reference
    const outputPath = path.join(__dirname, 'test-results', 'ocr-output.txt');
    
    // Create the directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, extractedText);
    console.log(`📝 Full extracted text saved to ${outputPath}`);
    
    // Check if text looks like real menu content or placeholder
    const isFallbackContent = extractedText.includes("[Menu items extracted locally") ||
                             extractedText.includes("DEVELOPMENT MODE SIMULATED TEXT");
    
    if (isFallbackContent) {
      console.error("❌ WARNING: Extracted text appears to be simulated/fallback content, not real OCR!");
    } else {
      console.log("✅ Text appears to be real OCR content (not fallback text)");
    }
    
    // Verify the model that was used
    console.log(`🤖 Model used: ${result.model || 'Unknown'}`);
    
    // Summary
    console.log("\n=== OCR Test Summary ===");
    console.log(`Status: ${response.ok ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`Response Time: ${duration}ms`);
    console.log(`Text Length: ${extractedText.length} characters`);
    console.log(`Real OCR: ${!isFallbackContent ? "✅ YES" : "❌ NO (fallback detected)"}`);
    console.log("=======================\n");
    
  } catch (error) {
    console.error(`❌ Test failed with error:`, error);
  }
}

// Run the test
testOpenRouterOcr(); 