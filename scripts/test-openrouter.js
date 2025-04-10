// Test script for OpenRouter API connectivity
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Get API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log(`API Key starts with: ${OPENROUTER_API_KEY?.substring(0, 10)}...`);

async function testOpenRouter() {
  console.log('Testing OpenRouter API connectivity...');
  
  try {
    // First test - Get models list
    console.log('\nTest 1: Fetching models list');
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://nutriflow.vercel.app'
      }
    });
    
    console.log(`Status: ${modelsResponse.status}`);
    if (modelsResponse.ok) {
      console.log('SUCCESS: Models list fetched');
      const data = await modelsResponse.json();
      console.log(`Found ${data.data?.length || 0} models`);
    } else {
      console.error('FAILED: ', await modelsResponse.text());
    }
    
    // Second test - Basic chat completion
    console.log('\nTest 2: Basic chat completion');
    const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://nutriflow.vercel.app',
        'X-Title': 'NutriFlow Test'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say hello' }
        ]
      })
    });
    
    console.log(`Status: ${chatResponse.status}`);
    if (chatResponse.ok) {
      console.log('SUCCESS: Chat completion successful');
      const data = await chatResponse.json();
      console.log('Response:', data.choices?.[0]?.message?.content);
    } else {
      console.error('FAILED: ', await chatResponse.text());
    }
    
    // Third test - Using a different model
    console.log('\nTest 3: Using anthropic/claude-3-haiku-20240307');
    const altModelResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://nutriflow.vercel.app',
        'X-Title': 'NutriFlow Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku-20240307',
        messages: [
          { role: 'user', content: 'Say hello' }
        ]
      })
    });
    
    console.log(`Status: ${altModelResponse.status}`);
    if (altModelResponse.ok) {
      console.log('SUCCESS: Alternative model chat completion successful');
      const data = await altModelResponse.json();
      console.log('Response:', data.choices?.[0]?.message?.content);
    } else {
      console.error('FAILED: ', await altModelResponse.text());
    }
    
    // Fourth test - With different auth header format (without "Bearer")
    console.log('\nTest 4: Without Bearer prefix');
    const noBearer = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': OPENROUTER_API_KEY,
        'HTTP-Referer': 'https://nutriflow.vercel.app',
        'X-Title': 'NutriFlow Test'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say hello' }
        ]
      })
    });
    
    console.log(`Status: ${noBearer.status}`);
    if (noBearer.ok) {
      console.log('SUCCESS: No-Bearer auth successful');
      const data = await noBearer.json();
      console.log('Response:', data.choices?.[0]?.message?.content);
    } else {
      console.error('FAILED: ', await noBearer.text());
    }
    
    // Fifth test - More detailed configuration with all possible headers
    console.log('\nTest 5: Complete header set');
    const completeHeaderTest = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://nutriflow.vercel.app',
        'X-Title': 'NutriFlow Test',
        'User-Agent': 'NutriFlow/1.0.0',
        'OR-SITE-URL': 'https://nutriflow.vercel.app',
        'OR-APP-NAME': 'NutriFlow Menu OCR',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-instant-1.2',
        messages: [
          { role: 'user', content: 'Say hello' }
        ],
        max_tokens: 50
      })
    });
    
    console.log(`Status: ${completeHeaderTest.status}`);
    if (completeHeaderTest.ok) {
      console.log('SUCCESS: Complete header test successful');
      const data = await completeHeaderTest.json();
      console.log('Response:', data.choices?.[0]?.message?.content);
    } else {
      console.error('FAILED: ', await completeHeaderTest.text());
    }
    
    // Sixth test - Using raw key (without any processing)
    console.log('\nTest 6: Raw API key');
    const rawKey = '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';
    const rawKeyTest = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawKey}`,
        'HTTP-Referer': 'https://nutriflow.vercel.app'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-instant-1.2',
        messages: [
          { role: 'user', content: 'Say hello' }
        ]
      })
    });
    
    console.log(`Status: ${rawKeyTest.status}`);
    if (rawKeyTest.ok) {
      console.log('SUCCESS: Raw key test successful');
      const data = await rawKeyTest.json();
      console.log('Response:', data.choices?.[0]?.message?.content);
    } else {
      console.error('FAILED: ', await rawKeyTest.text());
    }
    
    // Add a specific test for vision models with a base64 image
    console.log('\nTest 7: Testing vision model with base64 image');
    // Create a small red square as base64 (using a known working format)
    const smallRedSquare = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAEklEQVR42mP8z8BQz0AEYBxVSF+FABJADveWzx+SAAAAAElFTkSuQmCC';
    
    const visionTest = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://nutriflow.vercel.app',
        'X-Title': 'NutriFlow Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What do you see in this image?' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${smallRedSquare}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });
    
    console.log(`Status: ${visionTest.status}`);
    if (visionTest.ok) {
      console.log('SUCCESS: Vision model test successful');
      const data = await visionTest.json();
      console.log('Response content:', data?.choices?.[0]?.message?.content || 'No content in response');
      console.log('Full response data:', JSON.stringify(data, null, 2));
    } else {
      console.error('FAILED: ', await visionTest.text());
    }
    
  } catch (error) {
    console.error('Error during API tests:', error.message);
  }
}

// Run the tests
testOpenRouter().catch(console.error); 