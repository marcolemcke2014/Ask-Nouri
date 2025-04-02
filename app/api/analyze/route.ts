/**
 * API route for analyzing menu text
 */
import { NextResponse, NextRequest } from 'next/server';
import { analyzeMenu } from '@/lib/ai/menuAnalysis';
import { saveMenuText } from '@/lib/db/menu';
import { MenuAnalysisRequest, MenuAnalysisResponse } from '@/types/menu';
import { z } from 'zod';

// Define runtime environment
export const runtime = 'edge';

// Define validation schema
const requestSchema = z.object({
  menuText: z.string().min(1, 'Menu text is required'),
  userPreferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    healthGoals: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    preferredCuisines: z.array(z.string()).optional(),
    avoidIngredients: z.array(z.string()).optional(),
    calorieLimit: z.number().optional(),
    nutritionTargets: z.record(z.number()).optional(),
  }).optional(),
  includeNutrition: z.boolean().optional(),
  restaurantInfo: z.object({
    name: z.string().optional(),
    cuisineType: z.string().optional(),
    location: z.string().optional(),
    priceRange: z.string().optional(),
  }).optional(),
});

/**
 * POST handler for menu analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: result.error.format() 
        },
        { status: 400 }
      );
    }
    
    const validatedData = result.data as MenuAnalysisRequest;
    
    // Get user ID from session (if authenticated)
    // This is placeholder code - implement proper auth
    const userId = request.headers.get('x-user-id');
    
    // Save menu text to database (optional)
    let menuId: string | undefined;
    if (process.env.SAVE_MENU_DATA === 'true') {
      const savedMenu = await saveMenuText(
        validatedData.menuText, 
        userId || undefined,
        validatedData.restaurantInfo?.name ? 'restaurant-id' : undefined
      );
      if (savedMenu) {
        menuId = savedMenu.id;
      }
    }
    
    // Process the menu text with AI
    const analysis = await analyzeMenu(validatedData);
    
    // Return the analysis
    return NextResponse.json<MenuAnalysisResponse>(analysis);
  } catch (error) {
    console.error('Error analyzing menu:', error);
    
    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze menu' },
      { status: 500 }
    );
  }
} 