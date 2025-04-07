/**
 * Test script that directly calls OpenAI to validate the underlying API works
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const https = require('https');

// Check if OpenAI API key exists in environment
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set.');
  console.log('Please set it before running this script:');
  console.log('export OPENAI_API_KEY=your_api_key_here');
  process.exit(1);
}

/**
 * Simple menu structuring test - this is similar to what Agent 1 does
 */
async function testMenuStructuring() {
  console.log('🧪 Testing direct API call to OpenAI for menu structuring\n');
  
  // Sample OCR text from the restaurant menu (using a shorter version for the test)
  const ocrText = `DINNER

SMALLS
    Guacamole taro chips (pf) (gf)
    Crispy Maitake rosemary, lemon, truffle (pv) (gf)
    Salmon Crudo cucumber, chili, mint, olive oil (gf)

ENTREES
    Roasted Salmon bok choy, ginger, lemon, chili (gf)
    Grilled Octopus nduja, beans, rosemary, lemon (gf)
    Grilled Seabass artichoke, tomato, olive, garlic`;

  // Prepare OpenAI API request
  const prompt = `
You are a menu extraction agent. Given OCR output from a restaurant image, structure each item into a clean format.

Raw OCR Text:
${ocrText}

Please:
1. Identify distinct menu items
2. For each item, extract: title, description, price, and section (if available)
3. Organize by sections (appetizers, entrees, etc.) if apparent
4. Return a valid JSON array of menu items with this structure:
[
  {
    "title": "Item Name",
    "description": "Description text (if available)",
    "price": "$XX.XX (if available)",
    "section": "Section name (if available)"
  }
]`;

  const requestBody = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that specializes in structuring menu data."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
    max_tokens: 2000
  };

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API call successful!');
          
          // Get the content from response
          const content = response.choices && response.choices[0] && 
                          response.choices[0].message && 
                          response.choices[0].message.content;
          
          if (!content) {
            console.error('❌ No content in response');
            console.error(JSON.stringify(response, null, 2));
            return resolve(null);
          }
          
          console.log('\nAPI Response Content:\n');
          console.log(content);
          
          try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              const menuItems = JSON.parse(jsonMatch[0]);
              console.log('\n✅ Successfully parsed JSON response!');
              console.log(`Found ${menuItems.length} menu items`);
              
              // Save the response to a file
              const outputDir = path.join(__dirname, '../test-results');
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
              }
              
              fs.writeFileSync(
                path.join(outputDir, 'direct-api-response.json'),
                JSON.stringify(menuItems, null, 2)
              );
              
              resolve(menuItems);
            } else {
              console.error('❌ Could not extract JSON from response');
              resolve(null);
            }
          } catch (error) {
            console.error('❌ Error parsing JSON from response:', error);
            resolve(null);
          }
        } catch (error) {
          console.error('❌ Error parsing API response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

/**
 * Run the tests
 */
async function runTests() {
  try {
    await testMenuStructuring();
    console.log('\n✅ API test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests(); 