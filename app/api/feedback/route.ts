/**
 * API route for submitting user feedback
 */
import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/db/menu'; // Assuming this is implemented in your db/menu.ts
import { MealFeedbackRequest } from '@/types/feedback';
import { z } from 'zod';

// Define runtime environment
export const runtime = 'edge';

// Define validation schema
const feedbackSchema = z.object({
  userId: z.string().optional(),
  analysisId: z.string().optional(),
  menuItemId: z.string().optional(),
  dishName: z.string().min(1, 'Dish name is required'),
  rating: z.number().min(1).max(5),
  followedRecommendation: z.boolean().optional(),
  notes: z.string().optional(),
  feelingAfter: z.enum(['great', 'good', 'okay', 'not_great', 'bad']).optional(),
  symptoms: z.array(z.string()).optional(),
  wouldEatAgain: z.boolean().optional()
});

/**
 * POST handler for submitting feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: result.error.format() 
        },
        { status: 400 }
      );
    }
    
    const validatedData = result.data as MealFeedbackRequest;
    
    // Get user ID from session (if authenticated)
    // This is placeholder code - implement proper auth
    const userId = request.headers.get('x-user-id');
    if (userId) {
      validatedData.userId = userId;
    }
    
    // Save feedback to database
    const feedback = await saveFeedback(validatedData);
    
    if (!feedback) {
      throw new Error('Failed to save feedback');
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      feedbackId: feedback.id
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for feedback analytics (admin only)
 */
export async function GET(request: NextRequest) {
  // Check if user has admin access
  const userId = request.headers.get('x-user-id');
  const isAdmin = request.headers.get('x-is-admin') === 'true';
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }
  
  try {
    // TODO: Implement feedback analytics
    // This would typically query the database for feedback statistics
    
    // Return placeholder data for now
    return NextResponse.json({
      totalFeedbackCount: 0,
      averageRating: 0,
      feelingBreakdown: {
        great: 0,
        good: 0,
        okay: 0,
        not_great: 0,
        bad: 0
      }
    });
  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch feedback analytics' },
      { status: 500 }
    );
  }
} 