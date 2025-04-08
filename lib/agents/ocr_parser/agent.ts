/**
 * Agent 1: OCR + Text Extractor
 * Handles menu image parsing and structured extraction of menu items
 */

import { Agent, OCRResult, MenuItem } from '../types';
import { AIProvider } from '@/types/ai';

export class OCRParser implements Agent<OCRResult, MenuItem[]> {
  /**
   * Parses OCR text into structured menu items
   */
  async process(
    input: OCRResult,
    provider?: AIProvider
  ): Promise<MenuItem[]> {
    try {
      const text = input.text;
      
      // Skip empty input
      if (!text || text.trim() === '') {
        return [];
      }
      
      // Extract restaurant info (not implementing full logic here)
      // In a real implementation, would extract from header/footer
      const restaurantInfo = this.extractRestaurantInfo(text);
      
      // Extract menu sections and items
      const sections = this.extractMenuSections(text);
      
      // Extract individual menu items from each section
      const items: MenuItem[] = [];
      
      for (const section of sections) {
        const sectionItems = this.extractItemsFromSection(section.content, section.name);
        items.push(...sectionItems);
      }
      
      return items;
    } catch (error) {
      console.error('Error in OCRParser:', error);
      return [];
    }
  }
  
  /**
   * Extract restaurant name and location from OCR text
   * Basic implementation - would be enhanced in production
   */
  private extractRestaurantInfo(text: string): { name?: string; location?: string } {
    // Split into lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Simple heuristic: first line is often restaurant name
    const name = lines.length > 0 ? lines[0].trim() : undefined;
    
    // Look for patterns that might indicate an address
    // e.g., street numbers, "Street", "Ave", "Road", "Blvd", etc.
    let location: string | undefined;
    const addressRegex = /\d+\s+[A-Za-z]+(\s+[A-Za-z]+)*(\s+St|\s+Street|\s+Ave|\s+Avenue|\s+Rd|\s+Road|\s+Blvd|\s+Boulevard)/i;
    
    for (const line of lines) {
      if (addressRegex.test(line)) {
        location = line.trim();
        break;
      }
    }
    
    return { name, location };
  }
  
  /**
   * Split menu text into sections
   */
  private extractMenuSections(text: string): { name: string; content: string }[] {
    // Split into lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const sections: { name: string; content: string }[] = [];
    let currentSection: { name: string; contentLines: string[] } | null = null;
    
    // Common section headings in menus
    const sectionHeadings = [
      'APPETIZER', 'APPETIZERS',
      'STARTER', 'STARTERS',
      'MAIN', 'MAINS', 'MAIN COURSE', 'ENTREE', 'ENTREES',
      'DESSERT', 'DESSERTS',
      'SIDE', 'SIDES',
      'DRINK', 'DRINKS', 'BEVERAGE', 'BEVERAGES',
      'BREAKFAST', 'LUNCH', 'DINNER',
      'SPECIAL', 'SPECIALS',
      'SOUP', 'SOUPS', 'SALAD', 'SALADS'
    ];
    
    // Check each line to see if it's a section heading
    for (const line of lines) {
      const trimmedLine = line.trim().toUpperCase();
      
      // Is this line a section heading?
      const isHeading = sectionHeadings.some(heading => 
        trimmedLine === heading || 
        trimmedLine.includes(`${heading}S`) || // plural
        trimmedLine.includes(`${heading}:`) || // with colon
        trimmedLine === `${heading} MENU`
      );
      
      if (isHeading) {
        // If we already have a section, add it to the list
        if (currentSection) {
          sections.push({
            name: currentSection.name,
            content: currentSection.contentLines.join('\n')
          });
        }
        
        // Start a new section
        currentSection = {
          name: line.trim(),
          contentLines: []
        };
      } else if (currentSection) {
        // Add line to current section
        currentSection.contentLines.push(line);
      } else {
        // If no section yet, create a default one
        currentSection = {
          name: 'Menu',
          contentLines: [line]
        };
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections.push({
        name: currentSection.name,
        content: currentSection.contentLines.join('\n')
      });
    }
    
    return sections;
  }
  
  /**
   * Extract menu items from a section
   */
  private extractItemsFromSection(sectionContent: string, sectionName: string): MenuItem[] {
    const lines = sectionContent.split('\n').filter(line => line.trim() !== '');
    const items: MenuItem[] = [];
    
    // Regular expressions for finding item patterns
    const priceRegex = /\$\s*(\d+(\.\d{2})?)/;
    
    for (const line of lines) {
      // Skip very short lines or lines that appear to be headers
      if (line.length < 3 || line.toUpperCase() === line) {
        continue;
      }
      
      // Extract price if present
      const priceMatch = line.match(priceRegex);
      const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
      
      // Extract name - if price is present, name is usually before it
      let name: string;
      if (priceMatch) {
        name = line.substring(0, priceMatch.index).trim();
        // Remove trailing dots or dashes often used as separators
        name = name.replace(/[.\\-–—]*$/, '').trim();
      } else {
        // If no price, use the whole line as the name
        name = line.trim();
      }
      
      // Check if name contains a description (often separated by a dash, comma, or period)
      let description: string | undefined;
      const descSeparators = [' - ', ' – ', ' — ', '. ', ', '];
      
      for (const separator of descSeparators) {
        const parts = name.split(separator);
        if (parts.length > 1) {
          name = parts[0].trim();
          description = parts.slice(1).join(separator).trim();
          break;
        }
      }
      
      // Add the item if it has a name
      if (name) {
        items.push({
          name,
          price,
          section: sectionName,
          description
        });
      }
    }
    
    return items;
  }
} 