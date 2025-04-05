import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Type for the save scan request body
 */
interface SaveScanRequest {
  rawText: string;
  cleanedText?: string;
  items: Array<{
    name: string;
    score: number;
    tags: string[];
    flags: string[];
    improvements: string[];
  }>;
  restaurantName?: string;
  imageDataUrl?: string;
  userId?: string;
  userGoals?: string[];
}

/**
 * API endpoint to save OCR scan results and AI analysis
 * 
 * @param request The incoming request with scan data
 * @returns Confirmation with the saved scan ID
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: SaveScanRequest = await request.json();
    
    // Validate the request
    if (!body.rawText) {
      return NextResponse.json(
        { error: 'Raw text content is required' },
        { status: 400 }
      );
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Analyzed items are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for this scan
    const scanId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // In a real implementation, this would save to a database
    // For now, we'll just log it to demonstrate the endpoint works
    console.log(`Saving scan ${scanId} at ${timestamp}`);
    
    // Here's where you would add database saving logic
    // Example with Supabase would be:
    /*
    const { data, error } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        created_at: timestamp,
        raw_text: body.rawText,
        cleaned_text: body.cleanedText || body.rawText,
        restaurant_name: body.restaurantName,
        image_data_url: body.imageDataUrl,
        user_id: body.userId,
        user_goals: body.userGoals
      });
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Save the analyzed items
    for (const item of body.items) {
      await supabase
        .from('menu_items')
        .insert({
          scan_id: scanId,
          name: item.name,
          score: item.score,
          tags: item.tags,
          flags: item.flags,
          improvements: item.improvements
        });
    }
    */
    
    // Return success response
    return NextResponse.json({
      success: true,
      id: scanId,
      timestamp,
      message: 'Scan saved successfully'
    });
    
  } catch (error) {
    console.error('Error in save scan endpoint:', error);
    
    return NextResponse.json(
      { error: 'Failed to save scan' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
} 