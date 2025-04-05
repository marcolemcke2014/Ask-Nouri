import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint to analyze menu text using AI
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    
    // Validate the request
    if (!body.menuText) {
      return res.status(400).json({ error: 'Menu text is required' });
    }
    
    if (!body.userGoals || !Array.isArray(body.userGoals) || body.userGoals.length === 0) {
      return res.status(400).json({ error: 'At least one user goal is required' });
    }
    
    // Mock analysis results for demonstration
    const mockAnalysis = {
      items: [
        {
          name: "Grilled Salmon",
          score: 9.2,
          tags: ["High Protein", "Low Carb"],
          flags: [],
          improvements: ["Ask for no butter"]
        },
        {
          name: "Vegetable Stir Fry",
          score: 8.5,
          tags: ["Plant-Based", "High Fiber"],
          flags: [],
          improvements: ["Ask for low sodium sauce"]
        },
        {
          name: "Chicken Parmesan",
          score: 5.8,
          tags: ["High Protein"],
          flags: ["High Sodium"],
          improvements: ["Remove breading", "Ask for sauce on the side"]
        }
      ]
    };
    
    // Return the analysis with a unique ID and timestamp
    return res.status(200).json({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      items: mockAnalysis.items,
      rawText: body.menuText,
      userGoals: body.userGoals,
      dietaryRestrictions: body.dietaryRestrictions || []
    });
    
  } catch (error) {
    console.error('Error in menu analysis endpoint:', error);
    return res.status(500).json({ error: 'Failed to analyze menu' });
  }
} 