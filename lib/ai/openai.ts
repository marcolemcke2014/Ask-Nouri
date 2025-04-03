// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// Do not change this unless explicitly requested by the user

// Helper function to call our API route
async function callOpenAIAPI(prompt: string, maxTokens?: number, responseFormat?: string) {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
        responseFormat,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error calling OpenAI API route:', error);
    throw error;
  }
}

// Function to analyze a menu and provide recommendations based on health goals
export async function analyzeMenu(
  menuText: string, 
  healthGoals: string[],
  dietaryRestrictions: string[]
): Promise<{
  menuItems: Array<{
    name: string;
    description: string;
    suitable: boolean;
    healthScore: number;
    comment: string;
  }>
}> {
  try {
    const prompt = `
    Analyze the following menu text and identify individual menu items.
    For each menu item, determine if it's suitable for someone with the following health goals: ${healthGoals.join(', ')}.
    They also have these dietary restrictions: ${dietaryRestrictions.join(', ')}.
    
    Provide a health score from 1-10 for each item (10 being the healthiest) and a brief comment explaining why it is or isn't suitable.
    
    Menu text:
    ${menuText}
    
    Return results as a JSON array of menu items with the following structure:
    { 
      "menuItems": [
        {
          "name": "Item name",
          "description": "Item description if available",
          "suitable": true/false,
          "healthScore": 1-10,
          "comment": "Brief explanation"
        },
      ]
    }
    `;

    const response = await callOpenAIAPI(prompt, 1500, "json_object");
    const content = response.choices[0].message.content || '{"menuItems":[]}';
    const result = JSON.parse(content);
    return result;
  } catch (error: any) {
    console.error("Error analyzing menu:", error);
    throw new Error("Failed to analyze menu: " + (error?.message || 'Unknown error'));
  }
}

// Function to extract menu text from OCR results and clean it up
export async function cleanMenuText(rawText: string): Promise<string> {
  try {
    const prompt = `
    The following text was extracted from a restaurant menu using OCR. 
    Please clean up the text, correct obvious OCR errors, and format it in a readable way.
    
    Raw OCR text:
    ${rawText}
    
    Return only the cleaned text, no additional commentary.
    `;

    const response = await callOpenAIAPI(prompt, 1000);
    return response.choices[0].message.content || rawText;
  } catch (error: any) {
    console.error("Error cleaning menu text:", error);
    // If there's an error, return the original text
    return rawText;
  }
}