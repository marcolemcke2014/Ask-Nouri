/**
 * Test script for the multi-agent menu analysis system
 * 
 * This script makes a direct call to the analyze-menu API endpoint
 * with real OCR data from a restaurant menu and a sample user profile
 */

// Import required dependencies
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testMultiAgentSystem() {
  console.log('🧪 Testing Multi-Agent Menu Analysis System\n');
  
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

  // Sample user profiles
  const userProfiles = [
    {
      name: "Muscle Gain + Low Sodium",
      data: {
        goals: ["muscle gain", "increase protein", "low sodium"],
        restrictions: ["limit dairy", "no processed foods"],
        recentPatterns: ["regular exercise", "post-workout meal"]
      }
    },
    {
      name: "Weight Loss + Vegetarian",
      data: {
        goals: ["weight loss", "balanced nutrition", "reduce carbs"],
        restrictions: ["vegetarian", "no alcohol"],
        recentPatterns: ["sedentary day", "late dinner"]
      }
    }
  ];

  // Test each user profile
  for (const profile of userProfiles) {
    console.log(`\n🧪 Testing with profile: ${profile.name}`);

    try {
      // Create the API request payload
      const requestPayload = {
        ocrText: ocrText,
        ocrConfidence: 0.92,
        userGoals: profile.data.goals,
        userRestrictions: profile.data.restrictions,
        recentPatterns: profile.data.recentPatterns,
        provider: 'openai'
      };

      console.log('🔄 Calling API endpoint...');
      
      // Call the API endpoint directly
      const response = await fetch('http://localhost:3000/api/analyze-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      // Parse the response
      const result = await response.json();
      
      // Check if there was an error
      if (result.error) {
        console.error('❌ API returned an error:', result.error);
        continue;
      }

      // Save the response to a file for inspection
      const outputDir = path.join(__dirname, '../test-results');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      const fileName = `menu-analysis-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
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
      console.log(`  ⚖️ Balanced: ${result.topDishes.balanced.title} (Score: ${result.topDishes.balanced.score})`);
      console.log(`  🍔 Indulgent: ${result.topDishes.indulgent.title} (Score: ${result.topDishes.indulgent.score})`);
      
      console.log(`\n💾 Full results saved to: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Test failed with error:', error.message);
    }
  }
}

// Run the test
testMultiAgentSystem().catch(console.error); 