/**
 * Quick OCR test with Claude 3 Opus
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('Starting quick OCR test with Claude 3 Opus...');

// Path to the menu image
const menuPath = path.join(__dirname, '..', 'public', 'sample-menus', 'sample-menu.jpg');
if (!fs.existsSync(menuPath)) {
  console.error(`Test image not found at: ${menuPath}`);
  process.exit(1);
}

console.log(`Found menu image at: ${menuPath}`);

// Read the image file
const imageBuffer = fs.readFileSync(menuPath);
const base64Image = imageBuffer.toString('base64');
console.log(`Image loaded: ${Math.round(base64Image.length / 1024)} KB`);

// Get API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('OpenRouter API key is missing. Set OPENROUTER_API_KEY in .env.local');
  process.exit(1);
}

// Test with Claude 3 Opus
async function testOcr() {
  try {
    console.log('Preparing request to Claude 3 Opus...');
    
    const requestPayload = {
      model: "anthropic/claude-3-opus:beta",
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
    
    console.log('Sending request to OpenRouter...');
    const startTime = Date.now();
    
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
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Response received in ${processingTime}s`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      console.error(`Error: ${errorText.substring(0, 500)}`);
      return false;
    }
    
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content;
    
    if (!extractedText) {
      console.error('No text extracted from the image');
      return false;
    }
    
    console.log(`Success! Extracted ${extractedText.length} characters of text`);
    console.log('\nSample of extracted text:');
    console.log('----------------------------');
    console.log(extractedText.substring(0, 500) + '...');
    console.log('----------------------------');
    
    // Save the extracted text to a file
    const outputPath = path.join(__dirname, '..', 'test-results', 'ocr-result.txt');
    fs.writeFileSync(outputPath, extractedText);
    console.log(`Full text saved to: ${outputPath}`);
    
    // Validate the content for common menu sections and items
    const menuSections = ['DINNER', 'SMALLS', 'APPETIZERS', 'SALADS', 'ENTREES', 'SIDES'];
    const foundSections = menuSections.filter(section => 
      extractedText.toUpperCase().includes(section)
    );
    
    const menuItems = ['Guacamole', 'Salmon', 'Chicken', 'Maitake', 'Fries', 'Salad'];
    const foundItems = menuItems.filter(item => 
      extractedText.includes(item)
    );
    
    console.log('\nContent validation:');
    console.log(`Found ${foundSections.length}/${menuSections.length} expected sections: ${foundSections.join(', ')}`);
    console.log(`Found ${foundItems.length}/${menuItems.length} expected items: ${foundItems.join(', ')}`);
    
    if (foundSections.length >= 3 && foundItems.length >= 3) {
      console.log('\n✅ TEST PASSED: OCR pipeline is working correctly!');
      return true;
    } else {
      console.log('\n❌ TEST FAILED: Not enough expected content found');
      return false;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Run the test
testOcr()
  .then(success => {
    if (success) {
      console.log('\nOCR pipeline is working correctly with Claude 3 Opus.');
      process.exit(0);
    } else {
      console.log('\nOCR pipeline test failed with Claude 3 Opus.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }); 