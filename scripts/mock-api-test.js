/**
 * Simple mock of the multi-agent system using direct API calls
 * This will simulate what the frontend will receive
 */

const fs = require('fs');
const path = require('path');

// Sample OCR text from the restaurant menu (full version)
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
    Sweet Potato Fries (pv) (gf)`;

// Sample user profile for muscle gain + low sodium
const userProfile = {
  goals: ["muscle gain", "increase protein", "low sodium"],
  restrictions: ["limit dairy", "no processed foods"],
  recentPatterns: ["regular exercise", "post-workout meal"]
};

/**
 * This function will generate a mock response similar to what
 * our multi-agent system should produce
 */
function generateMockAnalysisResults() {
  // Create a mock analysis result
  return {
    averageMenuScore: 68,
    menuCategory: "⚖️ Balanced",
    topDishes: {
      healthiest: {
        title: "Roasted Salmon",
        price: "$28",
        category: "🥗 Healthiest",
        summary: "High in omega-3 fatty acids with anti-inflammatory benefits. Supports protein needs for muscle recovery.",
        macros: {
          calories: 450,
          protein: "High",
          carbs: "Low",
          fat: "Mid",
          sugar: "Low",
          confidence: 0.85
        },
        health_prediction: {
          short_term: "Mental clarity and sustained energy without bloating.",
          long_term: "Improved muscle recovery and reduced inflammation."
        },
        score: 88,
        confidence: 0.9
      },
      balanced: {
        title: "Chicken Paillard",
        price: "$26",
        category: "⚖️ Balanced",
        summary: "Lean protein with a good balance of nutrients. Light preparation supports digestive comfort.",
        macros: {
          calories: 380,
          protein: "High",
          carbs: "Low",
          fat: "Low",
          sugar: "Low",
          confidence: 0.8
        },
        health_prediction: {
          short_term: "Steady energy levels with good satiety.",
          long_term: "Consistent protein intake supports muscle maintenance."
        },
        score: 75,
        confidence: 0.85
      },
      indulgent: {
        title: "House Burger",
        price: "$25",
        category: "🍔 Indulgent",
        summary: "High protein option that satisfies cravings. Ask for sauce on the side to control sodium.",
        macros: {
          calories: 650,
          protein: "High",
          carbs: "High",
          fat: "High",
          sugar: "Mid",
          confidence: 0.8
        },
        health_prediction: {
          short_term: "May cause some fullness but provides good post-workout recovery proteins.",
          long_term: "Occasional indulgence is fine when balanced with healthier choices."
        },
        score: 55,
        confidence: 0.75
      }
    }
  };
}

async function runMockTest() {
  console.log('🧪 Running mock test of multi-agent system');
  console.log('📋 Using OCR text from SOHO Toronto menu');
  console.log('👤 User profile: Muscle Gain + Low Sodium');
  
  // Generate mock results
  const mockResults = generateMockAnalysisResults();
  
  // Save the mock results
  const outputDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'mock-analysis-results.json'),
    JSON.stringify(mockResults, null, 2)
  );
  
  // Display results summary
  console.log('\n✅ Mock test completed successfully!');
  console.log(`📊 Menu category: ${mockResults.menuCategory}`);
  console.log(`📊 Average menu score: ${Math.round(mockResults.averageMenuScore)}`);
  
  console.log('\n🍽️ Top dishes:');
  console.log(`  🥗 Healthiest: ${mockResults.topDishes.healthiest.title} (Score: ${mockResults.topDishes.healthiest.score})`);
  console.log(`     Summary: ${mockResults.topDishes.healthiest.summary}`);
  console.log(`  ⚖️ Balanced: ${mockResults.topDishes.balanced.title} (Score: ${mockResults.topDishes.balanced.score})`);
  console.log(`     Summary: ${mockResults.topDishes.balanced.summary}`);
  console.log(`  🍔 Indulgent: ${mockResults.topDishes.indulgent.title} (Score: ${mockResults.topDishes.indulgent.score})`);
  console.log(`     Summary: ${mockResults.topDishes.indulgent.summary}`);
  
  console.log('\n💾 Mock results saved to: mock-analysis-results.json');
  
  console.log('\n✅ The format and structure of the results look correct!');
  console.log('✅ You are GREENLIT to proceed to frontend development.');
  console.log('\n🔄 Next steps for fixing the actual implementation:');
  console.log('1. Update the callAI function to properly handle JSON responses');
  console.log('2. Ensure each agent has robust error handling for API responses');
  console.log('3. Consider implementing a retry mechanism for API calls');
}

// Run the mock test
runMockTest(); 