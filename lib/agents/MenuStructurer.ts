/**
 * Agent 1: Menu Structurer
 * Converts OCR text blob into structured menu items
 */

import { Agent, OCRResult, StructuredMenuItem } from './types';
import { AIProvider } from '@/types/ai';
import { callAI } from '@/lib/ai';

export class MenuStructurer implements Agent<OCRResult, StructuredMenuItem[]> {
  /**
   * Get the prompt for the menu structurer
   */
  getPrompt(input: OCRResult): string {
    return `
You are a menu extraction agent. Given OCR output from a restaurant image, structure each item into a clean format.

Raw OCR Text:
${input.text}

Please:
1. Identify distinct menu items
2. For each item, extract: title, description, price, and section (if available)
3. Organize by sections (appetizers, entrees, etc.) if apparent
4. Ignore any non-menu text like restaurant info, hours, etc.
5. Return a valid JSON array of menu items with this structure:
[
  {
    "title": "Item Name",
    "description": "Description text (if available)",
    "price": "$XX.XX (if available)",
    "section": "Section name (if available)"
  },
  ...
]

Make sure to include ALL dishes from the menu. If a field is not present, omit it from the JSON.
`;
  }

  /**
   * Process OCR text into structured menu items
   */
  async process(
    input: OCRResult,
    provider: AIProvider = AIProvider.OPENAI
  ): Promise<StructuredMenuItem[]> {
    try {
      const prompt = this.getPrompt(input);
      
      // Call the AI service
      const response = await callAI(prompt, provider);
      
      if (response.error) {
        console.error('Menu structurer error:', response.error);
        return [];
      }
      
      // The AI response should be an array of items
      // We need to adapt from the existing response format to our format
      const menuItems: StructuredMenuItem[] = response.items.map(item => {
        return {
          title: item.name,
          description: item.tags.join(', '), // Use tags as description temporarily
          price: item.score ? `$${item.score}` : undefined, // Use score as price temporarily
          section: item.flags.length > 0 ? item.flags[0] : undefined // Use first flag as section temporarily
        };
      });
      
      return menuItems;
    } catch (error) {
      console.error('Error in MenuStructurer:', error);
      return [];
    }
  }
}
