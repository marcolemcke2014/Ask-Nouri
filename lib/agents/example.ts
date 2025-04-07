/**
 * Example usage of the multi-agent architecture
 * This file is just for demonstration purposes
 */

import { AgentOrchestrator } from './orchestrator';
import { AIProvider } from '@/types/ai';

/**
 * Example function showing how to use the agent orchestrator
 */
async function exampleUsage() {
  // Sample OCR text from a menu
  const ocrText = `
SOHO Toronto
Toronto Downtown

PASTAS
Rigatoni alla Vodka - House made pasta with vodka sauce, pancetta, onions, chili flakes 28
Tagliatelle Carbonara - Pancetta, egg, pecorino, black pepper 26
Cacio e Pepe - Pecorino Romano, black pepper 24

ENTREES
Grilled Salmon - Seasonal vegetables, lemon butter sauce 34
Chicken Milanese - Arugula, cherry tomato, parmigiano 30
Filet Mignon - 8oz prime beef, garlic mashed potatoes, red wine jus 45

DESSERTS
Tiramisu - Classic Italian dessert with espresso, mascarpone 12
Panna Cotta - Vanilla cream, seasonal berries 10
`;

  // Sample user profile
  const userProfile = {
    goals: ['increase protein', 'reduce inflammation', 'maintain energy'],
    restrictions: ['no dairy', 'limit red meat'],
    recentPatterns: ['high stress week', 'poor sleep']
  };

  // Create the orchestrator
  const orchestrator = new AgentOrchestrator();

  try {
    // Run the analysis
    console.log('Starting multi-agent analysis...');
    
    const results = await orchestrator.analyze({
      ocrResult: {
        text: ocrText,
        confidence: 0.92
      },
      userProfile,
      provider: AIProvider.OPENAI
    });
    
    // Display the results
    console.log('\n✅ Analysis complete!');
    console.log(`\nMenu overview: ${results.menuCategory} (Score: ${Math.round(results.averageMenuScore)})`);
    
    // Show top dishes
    console.log('\n🥗 HEALTHIEST OPTION:');
    console.log(`${results.topDishes.healthiest.title} - $${results.topDishes.healthiest.price}`);
    console.log(`Score: ${results.topDishes.healthiest.score}`);
    console.log(`Summary: ${results.topDishes.healthiest.summary}`);
    console.log(`Macros: ${results.topDishes.healthiest.macros.calories} cal, Protein: ${results.topDishes.healthiest.macros.protein}, Carbs: ${results.topDishes.healthiest.macros.carbs}`);
    console.log(`Health Impact: ${results.topDishes.healthiest.health_prediction.short_term}`);
    
    console.log('\n⚖️ BALANCED OPTION:');
    console.log(`${results.topDishes.balanced.title} - $${results.topDishes.balanced.price}`);
    console.log(`Score: ${results.topDishes.balanced.score}`);
    console.log(`Summary: ${results.topDishes.balanced.summary}`);
    
    console.log('\n🍔 INDULGENT OPTION:');
    console.log(`${results.topDishes.indulgent.title} - $${results.topDishes.indulgent.price}`);
    console.log(`Score: ${results.topDishes.indulgent.score}`);
    console.log(`Summary: ${results.topDishes.indulgent.summary}`);
    
    return results;
  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Only run this example if this file is executed directly (not imported)
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export { exampleUsage }; 