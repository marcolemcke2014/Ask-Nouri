import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to save a scanned menu
 * Saves data to a JSON file in the data directory
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rawText, items, timestamp } = req.body;

    // Validate required fields
    if (!rawText || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a unique ID for this scan
    const scanId = uuidv4();
    
    // Create data object
    const scanData = {
      id: scanId,
      timestamp: timestamp || new Date().toISOString(),
      rawText,
      items,
    };

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save to file
    const filePath = path.join(dataDir, `scan-${scanId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(scanData, null, 2));

    // Return success
    return res.status(200).json({ 
      success: true, 
      id: scanId,
      message: 'Menu scan saved successfully' 
    });
  } catch (error) {
    console.error('Error saving scan:', error);
    return res.status(500).json({ 
      error: 'Failed to save scan',
      details: error.message 
    });
  }
} 