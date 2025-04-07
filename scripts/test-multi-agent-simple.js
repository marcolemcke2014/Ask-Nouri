/**
 * Simple test script for the multi-agent menu analysis system
 * This version doesn't rely on external dependencies and can be run directly
 */

// Use built-in modules
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// OCR text from the SOHO Toronto menu image
const ocrText = `DINNER

SMALLS
    Guacamole taro chips (pf) (gf)
    Crispy Maitake rosemary, lemon, truffle (pv) (gf)
    Salmon Crudo cucumber, chili, mint, olive oil (gf)
    Beef Carpaccio coffee crusted tenderloin, watercress, horseradish (gf)

APPETIZERS
    Prosciutto young pecorino, garlic, aged balsamic (gf)
    Burrata smoked tomato jam, basil, arugula (gf)
    Minestrone Soup squash, white beans, kale, carrots, onion, celery (pv) (gf)
    Calamari lemon, paprika, chili
    Shishito Peppers lime, chili, miso (pv) (gf)
    Chicken Parmigiana basil, heirloom cherry tomato, parmigiana

FROM POOL
HOUSE MIAMI
    Langoustine Congelados mango, pineapple, salsa roja

SALADS
    add: chicken 12 | salmon 14 | avocado 5
    Arugula & Grapes parmigiano, balsamic, lemon (v) (gf)
    Butter Lettuce Salad avocado, sherry vinaigrette, basil, chive (pv) (gf)
    Vegan Caesar crispy chickpea, pickled onion, hemp seed (pv) (gf)
    Harvest Salad quinoa, squash, apple, castelfranco, pepitas (pv) (gf)

ENTREES
    Roasted Salmon bok choy, ginger, lemon, chili (gf)
    Grilled Octopus nduja, beans, rosemary, lemon (gf)
    Grilled Seabass artichoke, tomato, olive, garlic
    Brick Chicken mushrooms, spinach, marsala jus (gf)
    Shogun Maitake sunchoke puree, chips, truffle aioli (pv) (gf)
    Chicken Paillard cherry tomato, arugula, salmoriglio (gf)
    House Burger havarti cheese, lettuce, tomato, pickle, sauce, fries
    Dirty Vegan Burger secret sauce, vegan cheddar, lettuce, tomato (pv)
    Club Steak fries, sauce au poivre (gf)
    Tenderloin hand cut frites, choice of Salmoriglio or Steak au Poivre

FRESH PASTA
    Funghi Cavatelli porcini crema, maitake, chives
    Pomodoro di Buratta burrata, chili, basil, tonnarelli
    Cavatelli Pomodoro heirloom tomato pomodoro, garlic, basil, sunflower seed cheese (pv)
    Rigatoni bolognese, parmigiano, parsley

OVEN BAKED
PIZZAS
    Arugula & Mortadella fior di latte,truffle honey, parmigiano
    Chorizo hot honey, pickled jalapeno, tomato
    Mozzarella mozzarella, parmigiano, basil (v)
    Spicy Salame mushroom, mozzarella, oregano
    Puttanesca olive, capers, basil, garlic, red onion
    Funghi taleggio, porcini, maitake, chives

SIDES
    Rapini garlic, chili, parmesan (v) (gf)
    Olives citrus, caraway, chili (pv) (gf)
    Fingerling Potatoes lemon, chili, garlic, basil (pv) (gf)
    French Fries (pv) (gf)
    Truffle Fries (v) (gf)
    Sweet Potato Fries (pv) (gf)

v: vegetarian, pv: plant based, gf: gluten-free
Please let us know if you have any allergies or dietary requirements, our dishes are made here and may contain trace ingredients.
Consuming raw or undercooked meats, poultry, seafood, shellfish or eggs may increase your risk of foodborne illness.`;

// Sample user profile for muscle gain + low sodium
const userProfile = {
  goals: ["muscle gain", "increase protein", "low sodium"],
  restrictions: ["limit dairy", "no processed foods"],
  recentPatterns: ["regular exercise", "post-workout meal"]
};

// Create the request payload
const payload = JSON.stringify({
  ocrText: ocrText,
  ocrConfidence: 0.92,
  userGoals: userProfile.goals, 
  userRestrictions: userProfile.restrictions,
  recentPatterns: userProfile.recentPatterns,
  provider: 'openai'
});

// Request options
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze-menu',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('🧪 Testing Multi-Agent System with "Muscle Gain + Low Sodium" profile\n');
console.log('🔄 Sending request to API endpoint...');

// Make the request
const req = http.request(options, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`❌ API returned status code ${res.statusCode}`);
      console.error(data);
      return;
    }

    try {
      const result = JSON.parse(data);
      
      // Check if there was an error
      if (result.error) {
        console.error('❌ API returned an error:', result.error);
        return;
      }

      // Save the response to a file for inspection
      const outputDir = path.join(__dirname, '../test-results');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      const fileName = 'menu-analysis-muscle-gain-low-sodium.json';
      fs.writeFileSync(
        path.join(outputDir, fileName),
        JSON.stringify(result, null, 2)
      );

      // Display a summary of the results
      console.log('✅ Test completed successfully!');
      console.log(`📊 Menu category: ${result.menuCategory}`);
      console.log(`📊 Average menu score: ${Math.round(result.averageMenuScore)}`);
      
      console.log('\n🍽️ Top dishes:');
      console.log(`  🥗 Healthiest: ${result.topDishes.healthiest.title} (Score: ${result.topDishes.healthiest.score})`);
      console.log(`     Summary: ${result.topDishes.healthiest.summary}`);
      console.log(`  ⚖️ Balanced: ${result.topDishes.balanced.title} (Score: ${result.topDishes.balanced.score})`);
      console.log(`     Summary: ${result.topDishes.balanced.summary}`);
      console.log(`  🍔 Indulgent: ${result.topDishes.indulgent.title} (Score: ${result.topDishes.indulgent.score})`);
      console.log(`     Summary: ${result.topDishes.indulgent.summary}`);
      
      console.log(`\n💾 Full results saved to: ${fileName}`);
      
      // Verify if all agents are returning expected output
      let allAgentsWorking = true;
      
      // Check if all dishes have the required properties
      const dishes = [result.topDishes.healthiest, result.topDishes.balanced, result.topDishes.indulgent];
      
      for (const dish of dishes) {
        if (!dish.macros || !dish.health_prediction || !dish.score || !dish.category) {
          console.error(`❌ Missing data in dish: ${dish.title}`);
          allAgentsWorking = false;
        }
      }
      
      if (allAgentsWorking) {
        console.log('\n✅ All agents are functioning correctly!');
        console.log('✅ You are GREENLIT to proceed to frontend development.');
      } else {
        console.log('\n⚠️ Some agents may not be functioning correctly. Check the output file for details.');
      }
      
    } catch (error) {
      console.error('❌ Error parsing response:', error);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

// Write data to request body
req.write(payload);
req.end(); 