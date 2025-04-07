/**
 * Direct test of the AgentOrchestrator to debug integration issues
 */

// Import the orchestrator, agents, and required types directly
const { AgentOrchestrator } = require('../lib/agents/orchestrator');
const { MenuStructurer } = require('../lib/agents/MenuStructurer');
const { AIProvider } = require('../types/ai');
const fs = require('fs');
const path = require('path');

// Test function
async function testOrchestrator() {
  console.log('🧪 Testing Multi-Agent Menu Analysis System\n');
  
  // Sample OCR text from the restaurant menu
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

  try {
    // Create the orchestrator input
    const input = {
      ocrResult: {
        text: ocrText,
        confidence: 0.92
      },
      userProfile,
      provider: AIProvider.OPENAI
    };

    console.log('📋 Created input for orchestrator');
    
    // First, test just the MenuStructurer agent directly (not via orchestrator)
    console.log('🔬 Testing MenuStructurer agent directly...');
    const menuStructurer = new MenuStructurer();
    const structuredMenuItems = await menuStructurer.process(input.ocrResult);
    console.log(`✅ MenuStructurer returned ${structuredMenuItems.length} items`);
    
    if (structuredMenuItems.length === 0) {
      console.error('❌ MenuStructurer returned no items, cannot proceed');
      return;
    }

    // Log a few items to verify they're structured correctly
    console.log('\nSample menu items:');
    structuredMenuItems.slice(0, 3).forEach((item, index) => {
      console.log(`Item ${index + 1}: ${item.title}${item.price ? ` - ${item.price}` : ''}`);
    });

    // Now try running the full orchestration
    console.log('\n🔄 Running full orchestration...');
    const orchestrator = new AgentOrchestrator();
    const results = await orchestrator.analyze(input);
    
    console.log('✅ Orchestration completed successfully!');
    console.log(`📊 Menu category: ${results.menuCategory}`);
    console.log(`📊 Average menu score: ${Math.round(results.averageMenuScore)}`);
    
    console.log('\n🍽️ Top dishes:');
    console.log(`  🥗 Healthiest: ${results.topDishes.healthiest.title} (Score: ${results.topDishes.healthiest.score})`);
    console.log(`     Summary: ${results.topDishes.healthiest.summary}`);
    console.log(`  ⚖️ Balanced: ${results.topDishes.balanced.title} (Score: ${results.topDishes.balanced.score})`);
    console.log(`     Summary: ${results.topDishes.balanced.summary}`);
    console.log(`  🍔 Indulgent: ${results.topDishes.indulgent.title} (Score: ${results.topDishes.indulgent.score})`);
    console.log(`     Summary: ${results.topDishes.indulgent.summary}`);
    
    // Save results to a file
    const outputDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const fileName = 'menu-analysis-direct-test.json';
    fs.writeFileSync(
      path.join(outputDir, fileName),
      JSON.stringify(results, null, 2)
    );
    console.log(`\n💾 Full results saved to: ${fileName}`);
    
    // Verify that all expected properties are present
    let allPropertiesPresent = true;
    const requiredProperties = ['title', 'macros', 'health_prediction', 'score', 'category', 'summary'];
    
    for (const category of ['healthiest', 'balanced', 'indulgent']) {
      const dish = results.topDishes[category];
      for (const prop of requiredProperties) {
        if (!dish[prop]) {
          console.error(`❌ Missing property ${prop} in ${category} dish`);
          allPropertiesPresent = false;
        }
      }
    }
    
    if (allPropertiesPresent) {
      console.log('\n✅ All agents are functioning correctly!');
      console.log('✅ You are GREENLIT to proceed to frontend development.');
    } else {
      console.error('\n❌ Some required properties are missing. Check the output file for details.');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('\nStack trace:', error.stack);
  }
}

// Run the test
testOrchestrator(); 