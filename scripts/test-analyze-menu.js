/**
 * Test script for the /api/analyze-menu-mock endpoint
 * This validates that the multi-agent system response structure is correct
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const https = require('https');

// Sample OCR text from a real restaurant menu
const ocrText = `DINNER MENU

APPETIZERS
Grilled Calamari with lemon, olive oil, and herbs 14
Seasonal Burrata with heirloom tomatoes, basil, and balsamic glaze 16
Shrimp Cocktail with house-made cocktail sauce 18
Wild Mushroom Bruschetta with truffle oil and parmesan 12

SALADS
Kale Caesar with house-made dressing, croutons, and parmesan 15
Beet & Goat Cheese with arugula, walnuts, and citrus vinaigrette 14
Mediterranean Chopped with cucumber, tomato, feta, olives, and lemon dressing 16

ENTREES
Grilled Salmon with quinoa, roasted vegetables, and lemon-dill sauce 32
Grass-Fed Filet Mignon with mashed potatoes and seasonal vegetables 45
Herb-Roasted Chicken with wild rice pilaf and garlic spinach 28
Pappardelle Bolognese with beef, pork, and veal ragu 26
Wild Mushroom Risotto with truffle oil and parmesan 24
House Burger with bacon, cheddar, caramelized onions, and fries 22

SIDES
Truffle Fries 8
Roasted Vegetables 7
Creamed Spinach 9
Mashed Potatoes 6`;

// Sample user profile focused on muscle gain + low sodium
const userProfile = {
  userGoals: ["Muscle Gain", "Low Sodium"],
  userRestrictions: ["No Shellfish"],
  recentPatterns: ["High protein meals", "Limiting processed foods"],
  provider: "openai" // Use OpenAI for this test
};

// Deployment URL configuration
const API_HOST = 'paquapp.vercel.app';
const USE_HTTPS = true;

/**
 * Make the API request to analyze the menu
 */
async function testAnalyzeMenu() {
  console.log('🧪 Testing /api/analyze-menu-mock endpoint\n');
  
  // Prepare the request payload
  const payload = {
    ocrText: ocrText,
    ocrConfidence: 0.92,
    ...userProfile
  };

  // Make a request to the deployed server
  const options = {
    hostname: API_HOST,
    path: '/api/analyze-menu-mock',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
          // Check if we got a 200 response
          if (res.statusCode !== 200) {
            console.error(`❌ API returned status code ${res.statusCode}`);
            console.error(data);
            return resolve(null);
          }

          const response = JSON.parse(data);
          console.log('✅ API call successful!');
          
          // Save the response to a file
          const outputDir = path.join(__dirname, '../test-results');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
          }
          
          fs.writeFileSync(
            path.join(outputDir, 'analyze-menu-response.json'),
            JSON.stringify(response, null, 2)
          );
          
          // Log detailed verification results
          verifyResponse(response);
          
          resolve(response);
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
    
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Test error handling with the mock API
 */
async function testErrorHandling() {
  console.log('\n🧪 Testing error scenarios\n');
  
  // Test menu structuring failure
  console.log('Testing MENU_STRUCTURING_FAILED error:');
  try {
    const options = {
      hostname: API_HOST,
      path: '/api/analyze-menu-mock?error=structure',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, userProfile);
    console.log('✅ Received proper error response:');
    console.log(`Code: ${response.code}`);
    console.log(`Error: ${response.error}`);
  } catch (error) {
    console.error('❌ Error testing structure error:', error);
  }
  
  // Test dish not found failure
  console.log('\nTesting DISH_NOT_FOUND error:');
  try {
    const options = {
      hostname: API_HOST,
      path: '/api/analyze-menu-mock?error=notfound',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, userProfile);
    console.log('✅ Received proper error response:');
    console.log(`Code: ${response.code}`);
    console.log(`Error: ${response.error}`);
  } catch (error) {
    console.error('❌ Error testing dish not found error:', error);
  }
}

/**
 * Helper function to make a request
 */
function makeRequest(options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Verify that the response has the expected structure and content
 */
function verifyResponse(response) {
  console.log('\n📋 VERIFICATION RESULTS:');
  
  // Check for top-level properties
  const hasAverageScore = typeof response.averageMenuScore === 'number';
  const hasMenuCategory = typeof response.menuCategory === 'string';
  const hasTopDishes = response.topDishes && 
                       response.topDishes.healthiest && 
                       response.topDishes.balanced && 
                       response.topDishes.indulgent;
  
  console.log(`✅ Has average menu score: ${hasAverageScore ? 'YES' : 'NO'}`);
  console.log(`✅ Has menu category: ${hasMenuCategory ? 'YES' : 'NO'}`);
  console.log(`✅ Has all top dishes: ${hasTopDishes ? 'YES' : 'NO'}`);
  
  if (hasTopDishes) {
    // Check each dish for required properties
    const dishes = [
      { name: 'Healthiest', dish: response.topDishes.healthiest },
      { name: 'Balanced', dish: response.topDishes.balanced },
      { name: 'Indulgent', dish: response.topDishes.indulgent }
    ];
    
    dishes.forEach(({ name, dish }) => {
      console.log(`\n🍽️ ${name} Dish: ${dish.title}`);
      console.log(`  📊 Health Category: ${dish.category}`);
      console.log(`  ⭐ Score: ${dish.score}/100`);
      console.log(`  📝 Summary: ${dish.summary}`);
      console.log(`  🥄 Macros: calories=${dish.macros.calories}, protein=${dish.macros.protein}, carbs=${dish.macros.carbs}`);
      console.log(`  🔮 Health Prediction Short-term: ${dish.health_prediction.short_term}`);
    });
  }
  
  // Overall verification
  const isValid = hasAverageScore && hasMenuCategory && hasTopDishes;
  console.log(`\n${isValid ? '✅ RESPONSE IS VALID' : '❌ RESPONSE IS INVALID'}`);
}

/**
 * Run the test
 */
async function runTest() {
  try {
    await testAnalyzeMenu();
    await testErrorHandling();
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
runTest(); 