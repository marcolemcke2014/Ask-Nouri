/**
 * Test script that directly tests the MenuStructurer agent
 * with a mocked callAI function to verify the integration
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Mock the callAI function that would be used by the agent
// This will simulate a successful API response with structured menu items
const mockCallAI = async (prompt) => {
  console.log('📝 Mock callAI received prompt:', prompt.substring(0, 100) + '...');
  
  // Simulate a successful response with sample menu items
  return {
    items: [
      {
        name: "Guacamole",
        tags: ["Appetizer", "Vegetarian", "Gluten-Free"],
        score: 8,
        flags: ["SMALLS"],
        improvements: []
      },
      {
        name: "Salmon Crudo",
        tags: ["Raw", "Seafood", "Gluten-Free"],
        score: 9,
        flags: ["SMALLS"],
        improvements: []
      },
      {
        name: "Roasted Salmon",
        tags: ["Entree", "Seafood", "Gluten-Free"],
        score: 9,
        flags: ["ENTREES"],
        improvements: []
      }
    ]
  };
};

// Create a simple test function
async function testMenuStructurer() {
  console.log('🧪 Testing MenuStructurer with mocked API responses\n');
  
  // Import the MenuStructurer class but inject our mocked callAI function
  const { MenuStructurer } = require('../lib/agents/MenuStructurer');
  // Replace the imported callAI with our mock
  require('../lib/ai').callAI = mockCallAI;
  
  // Sample OCR text
  const ocrText = `DINNER

SMALLS
    Guacamole taro chips (pf) (gf)
    Crispy Maitake rosemary, lemon, truffle (pv) (gf)
    Salmon Crudo cucumber, chili, mint, olive oil (gf)

ENTREES
    Roasted Salmon bok choy, ginger, lemon, chili (gf)
    Grilled Octopus nduja, beans, rosemary, lemon (gf)
    Grilled Seabass artichoke, tomato, olive, garlic`;

  try {
    // Create a new MenuStructurer instance
    const menuStructurer = new MenuStructurer();
    
    // Process the OCR text
    const structuredItems = await menuStructurer.process({
      text: ocrText,
      confidence: 0.9
    });
    
    console.log(`\n✅ Processed ${structuredItems.length} menu items`);
    
    // Display the structured items
    console.log('\nStructured Menu Items:');
    console.log(JSON.stringify(structuredItems, null, 2));
    
    // Save the result to a file
    const outputDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'menu-structurer-test.json'),
      JSON.stringify(structuredItems, null, 2)
    );
    
    console.log('\n✅ Test completed successfully!');
    console.log('✅ Results saved to: menu-structurer-test.json');
    
    // Now that we've verified MenuStructurer works with a mocked API,
    // we can proceed to create a solution for the API endpoint
    
    console.log('\n🔄 Next steps:');
    console.log('1. Update the OpenAI API route to better handle JSON responses');
    console.log('2. Modify the callAI function to handle the specific response format needed by the agents');
    console.log('3. Test the entire multi-agent system with these fixes');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testMenuStructurer(); 