import { ParsedMenuItem } from '../types/menu';

/**
 * Parse OCR text into structured menu items
 * @param text The raw OCR text to parse
 * @returns An array of parsed menu items
 */
export function parseMenu(text: string): ParsedMenuItem[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Normalize line breaks and clean up text
  const cleanedText = cleanupText(text);
  
  // Split text into lines
  const lines = cleanedText.split('\n').filter(line => line.trim().length > 0);
  
  // Process lines and group into menu items
  return groupIntoMenuItems(lines);
}

/**
 * Clean up OCR text by removing extra spaces, normalizing line breaks, etc.
 * @param text The raw OCR text
 * @returns Cleaned text
 */
function cleanupText(text: string): string {
  return text
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove repeated line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Normalize spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Fix common OCR errors with currency symbols
    .replace(/([0-9]),([0-9])/g, '$1.$2')
    .replace(/([0-9]) ([,.]) ([0-9])/g, '$1$2$3')
    // Normalize price formats
    .replace(/(\d+)[.,](\d+)(?!\d)/g, '$1.$2');
}

/**
 * Identify section headers in a menu
 * @param line Text line to check
 * @returns True if line appears to be a section header
 */
function isSectionHeader(line: string): boolean {
  // Common section headers in uppercase or with specific formatting
  const headerPattern = /^[A-Z\s]{3,}$/;
  const commonHeaders = [
    'APPETIZERS', 'STARTERS', 'SALADS', 'ENTREES', 'MAIN COURSE', 'SIDES', 
    'DESSERTS', 'DRINKS', 'BEVERAGES', 'DINNER', 'LUNCH', 'BREAKFAST',
    'SMALL PLATES', 'PASTA', 'PIZZA', 'SANDWICHES', 'FROM', 'FRESH',
    'OVEN BAKED', 'HOUSE', 'SMALLS'
  ];
  
  const cleanLine = line.trim().toUpperCase();
  
  // Check if this is a common section header
  if (commonHeaders.some(header => cleanLine.includes(header))) {
    return true;
  }
  
  // Check if formatted like a header (all caps, certain length)
  if (headerPattern.test(cleanLine) && cleanLine.length < 30) {
    return true;
  }
  
  return false;
}

/**
 * Group text lines into menu items
 * @param lines Array of text lines
 * @returns Array of parsed menu items
 */
function groupIntoMenuItems(lines: string[]): ParsedMenuItem[] {
  const menuItems: ParsedMenuItem[] = [];
  let currentItem: Partial<ParsedMenuItem> = {};
  let descriptionLines: string[] = [];
  let currentSection: string = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is a section header
    if (isSectionHeader(line)) {
      currentSection = line.trim();
      continue;
    }
    
    // Check for price at the end of the line
    const priceAtEndMatch = line.match(/(.+?)[\s]+(\d+(?:[.,]\d+)?)\s*$/);
    
    // Check if line contains item name + price (common format in menus)
    if (priceAtEndMatch && !isNaN(parseFloat(priceAtEndMatch[2]))) {
      // If we have a current item being built, finalize it before starting a new one
      if (currentItem.title) {
        if (descriptionLines.length > 0) {
          currentItem.description = descriptionLines.join(' ');
        }
        menuItems.push(currentItem as ParsedMenuItem);
      }
      
      // Start building a new item
      currentItem = {
        title: priceAtEndMatch[1].trim(),
        price: priceAtEndMatch[2].trim()
      };
      descriptionLines = [];
    }
    // Check if this line is likely a menu item title with price
    else {
      const titlePriceMatch = isTitleWithPrice(line);
      
      if (titlePriceMatch) {
        // If we have a current item being built, finalize it before starting a new one
        if (currentItem.title) {
          if (descriptionLines.length > 0) {
            currentItem.description = descriptionLines.join(' ');
          }
          menuItems.push(currentItem as ParsedMenuItem);
        }
        
        // Start building a new item
        currentItem = {
          title: titlePriceMatch.title,
          price: titlePriceMatch.price
        };
        descriptionLines = [];
      }
      // If we're currently building an item and this line isn't a new title,
      // treat it as part of the description
      else if (currentItem.title) {
        // Check if this is just a price on its own line (adjacent to an item)
        if (isPriceOnly(line) && !currentItem.price) {
          currentItem.price = extractPrice(line);
        } else {
          descriptionLines.push(line);
        }
      }
      // If we're not currently building an item but this line doesn't look like a title+price,
      // it might be a title without a price on the same line
      else if (!isMostlyNumeric(line) && !isCommonHeaderText(line)) {
        currentItem = { title: line };
        descriptionLines = [];
      }
    }
  }
  
  // Don't forget to add the last item
  if (currentItem.title) {
    if (descriptionLines.length > 0) {
      currentItem.description = descriptionLines.join(' ');
    }
    menuItems.push(currentItem as ParsedMenuItem);
  }
  
  return menuItems;
}

/**
 * Check if a line is a menu item title with a price
 * @param line The text line
 * @returns Object with title and price if matched, or null
 */
function isTitleWithPrice(line: string): { title: string; price: string } | null {
  // Match various formats of items with prices
  // e.g., "Chicken Tikka - $12.99", "Burger €10.50", "Pizza 8,90€", etc.
  
  // Pattern 1: Title followed by price with separator (dash, space)
  // Example: "Chicken Curry - $12.99" or "Margherita Pizza €8.90"
  const pattern1 = /^(.+?)[\s\-–—]+([€$£¥]?\s?\d+[.,]?\d*\s?(?:[€$£¥]|EUR|USD|GBP)?)$/i;
  
  // Pattern 2: Title with price at the end
  // Example: "Beef Burger 14,50" or "Garden Salad 8.90€"
  const pattern2 = /^(.+?)\s+([€$£¥]?\s?\d+[.,]?\d*\s?(?:[€$£¥]|EUR|USD|GBP)?)$/i;
  
  let match = line.match(pattern1) || line.match(pattern2);
  
  if (match) {
    const title = match[1].trim();
    let price = match[2].trim();
    
    // Only accept if the title makes sense (not too short, not numeric)
    if (title.length > 1 && !isMostlyNumeric(title)) {
      return { title, price };
    }
  }
  
  return null;
}

/**
 * Check if a line is only a price
 * @param line The text line
 * @returns True if the line is just a price
 */
function isPriceOnly(line: string): boolean {
  const pricePattern = /^[€$£¥]?\s?\d+[.,]?\d*\s?(?:[€$£¥]|EUR|USD|GBP)?$/i;
  return pricePattern.test(line.trim());
}

/**
 * Extract price from a string
 * @param text The text containing a price
 * @returns The extracted price string
 */
function extractPrice(text: string): string {
  const priceMatch = text.match(/([€$£¥]?\s?\d+[.,]?\d*\s?(?:[€$£¥]|EUR|USD|GBP)?)/i);
  return priceMatch ? priceMatch[1].trim() : '';
}

/**
 * Check if a string is mostly numeric
 * @param text The text to check
 * @returns True if the string is mostly digits
 */
function isMostlyNumeric(text: string): boolean {
  const digits = text.replace(/[^0-9]/g, '').length;
  return digits > text.length / 3;
}

/**
 * Check if the text is common header text that's not a menu item
 * @param text The text to check
 * @returns True if the text looks like a header
 */
function isCommonHeaderText(text: string): boolean {
  const lowercased = text.toLowerCase();
  const headers = [
    'menu', 'appetizers', 'starters', 'mains', 'main course', 'desserts',
    'drinks', 'beverages', 'sides', 'entrees', 'specials', 'special', 'pizza',
    'pasta', 'salads', 'breakfast', 'lunch', 'dinner', 'brunch', 'smalls',
    'from pool', 'house miami', 'fresh pasta', 'oven baked', 'pizzas'
  ];
  
  return headers.some(header => 
    lowercased === header || 
    lowercased.startsWith(header + ':') ||
    lowercased.startsWith(header + 's:')
  );
} 