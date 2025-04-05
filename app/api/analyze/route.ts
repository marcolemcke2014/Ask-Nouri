import { NextResponse } from 'next/server';
import { analyzeMenu } from '@/lib/ai';
import { MenuAnalysisRequest, AIProvider } from '@/types/ai';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint to analyze menu text using AI
 * 
 * @param request The incoming request with menu text and user goals
 * @returns AI analysis of the menu items
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: MenuAnalysisRequest = await request.json();
    
    // Validate the request
    if (!body.menuText) {
      return NextResponse.json(
        { error: 'Menu text is required' },
        { status: 400 }
      );
    }
    
    if (!body.userGoals || !Array.isArray(body.userGoals) || body.userGoals.length === 0) {
      return NextResponse.json(
        { error: 'At least one user goal is required' },
        { status: 400 }
      );
    }
    
    // Call the AI service to analyze the menu
    const analysis = await analyzeMenu(
      body.menuText,
      body.userGoals,
      (body.provider as AIProvider) || AIProvider.OPENAI
    );
    
    // If there was an error in the analysis
    if (analysis.error) {
      return NextResponse.json(
        { error: analysis.error },
        { status: 500 }
      );
    }
    
    // Return the analysis with a unique ID and timestamp
    return NextResponse.json({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      items: analysis.items,
      rawText: body.menuText,
      userGoals: body.userGoals,
      dietaryRestrictions: body.dietaryRestrictions || []
    });
    
  } catch (error) {
    console.error('Error in menu analysis endpoint:', error);
    
    return NextResponse.json(
      { error: 'Failed to analyze menu' },
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