/**
 * Validation script for menu analysis structure
 * This directly validates our mock data without making API calls
 */

const fs = require('fs');
const path = require('path');

// Load the mock data file
const mockDataPath = path.join(__dirname, '../test-results/mock-analysis-results.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

/**
 * Validate the structure of the data
 */
function validateStructure(data) {
  console.log('🧪 Validating Menu Analysis structure\n');
  
  // Check for top-level properties
  const hasAverageScore = typeof data.averageMenuScore === 'number';
  const hasMenuCategory = typeof data.menuCategory === 'string';
  const hasTopDishes = data.topDishes && 
                       data.topDishes.healthiest && 
                       data.topDishes.balanced && 
                       data.topDishes.indulgent;
  
  console.log(`✅ Has average menu score: ${hasAverageScore ? 'YES' : 'NO'}`);
  console.log(`✅ Has menu category: ${hasMenuCategory ? 'YES' : 'NO'}`);
  console.log(`✅ Has all top dishes: ${hasTopDishes ? 'YES' : 'NO'}`);
  
  if (hasTopDishes) {
    // Check each dish for required properties
    const dishes = [
      { name: 'Healthiest', dish: data.topDishes.healthiest },
      { name: 'Balanced', dish: data.topDishes.balanced },
      { name: 'Indulgent', dish: data.topDishes.indulgent }
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
  
  // Validate response for muscle gain + low sodium goals
  validateMuscleGainLowSodium(data);
  
  // Overall verification
  const isValid = hasAverageScore && hasMenuCategory && hasTopDishes;
  console.log(`\n${isValid ? '✅ STRUCTURE IS VALID' : '❌ STRUCTURE IS INVALID'}`);
  
  return isValid;
}

/**
 * Validate if the recommendations are appropriate for muscle gain + low sodium goals
 */
function validateMuscleGainLowSodium(data) {
  console.log('\n🎯 VALIDATING FOR MUSCLE GAIN + LOW SODIUM GOALS:');
  
  // Check if healthiest option has high protein
  const healthiestDish = data.topDishes.healthiest;
  const hasHighProtein = healthiestDish.macros.protein === 'High';
  console.log(`✅ Healthiest dish has high protein: ${hasHighProtein ? 'YES' : 'NO'}`);
  
  // Check if healthiest option mentions low sodium
  const mentionsLowSodium = 
    healthiestDish.summary.toLowerCase().includes('sodium') || 
    healthiestDish.health_prediction.short_term.toLowerCase().includes('sodium') ||
    healthiestDish.health_prediction.long_term.toLowerCase().includes('sodium');
  console.log(`✅ Healthiest dish mentions sodium considerations: ${mentionsLowSodium ? 'YES' : 'NO'}`);
  
  // Check if indulgent option warns about sodium
  const indulgentDish = data.topDishes.indulgent;
  const warnsAboutSodium = 
    indulgentDish.summary.toLowerCase().includes('sodium') || 
    indulgentDish.health_prediction.short_term.toLowerCase().includes('sodium');
  console.log(`✅ Indulgent dish warns about sodium: ${warnsAboutSodium ? 'YES' : 'NO'}`);
  
  // Check if all dishes mention protein or muscle
  const allMentionMuscle = Object.values(data.topDishes).every(dish => {
    return dish.summary.toLowerCase().includes('protein') || 
           dish.summary.toLowerCase().includes('muscle') ||
           dish.health_prediction.short_term.toLowerCase().includes('muscle') ||
           dish.health_prediction.long_term.toLowerCase().includes('muscle');
  });
  console.log(`✅ All dishes address muscle/protein needs: ${allMentionMuscle ? 'YES' : 'NO'}`);
  
  // Overall validation for the custom goals
  const isRelevant = hasHighProtein && mentionsLowSodium && warnsAboutSodium && allMentionMuscle;
  console.log(`\n${isRelevant ? '✅ RECOMMENDATIONS ALIGNED WITH GOALS' : '❌ RECOMMENDATIONS NOT ALIGNED WITH GOALS'}`);
}

// Run the validation
try {
  validateStructure(mockData);
  console.log('\n✅ Validation completed successfully!');
} catch (error) {
  console.error('❌ Validation failed:', error);
} 