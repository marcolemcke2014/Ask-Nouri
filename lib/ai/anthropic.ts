import Anthropic from '@anthropic-ai/sdk';

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Function to analyze a menu and provide recommendations based on health goals using Claude
export async function analyzeMenuWithClaude(
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
    
    Return results as a JSON array of menu items with the following format:
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

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      system: "You are a nutrition expert that analyzes restaurant menus and provides health insights. Always respond in JSON format.",
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // Parse the response content into JSON
    const result = JSON.parse(message.content[0].text);
    return result;
  } catch (error: any) {
    console.error("Error analyzing menu with Claude:", error);
    throw new Error("Failed to analyze menu with Claude: " + (error?.message || 'Unknown error'));
  }
}

// Function to extract menu text from OCR results and clean it up using Claude
export async function cleanMenuTextWithClaude(rawText: string): Promise<string> {
  try {
    const prompt = `
    The following text was extracted from a restaurant menu using OCR. 
    Please clean up the text, correct obvious OCR errors, and format it in a readable way.
    
    Raw OCR text:
    ${rawText}
    
    Return only the cleaned text, no additional commentary.
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      system: "You are an OCR text correction specialist. Clean up text from scanned menus to make it more readable.",
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    return message.content[0].text;
  } catch (error: any) {
    console.error("Error cleaning menu text with Claude:", error);
    // If there's an error, return the original text
    return rawText;
  }
}