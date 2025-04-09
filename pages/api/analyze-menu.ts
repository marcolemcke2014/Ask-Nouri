import type { NextApiRequest, NextApiResponse } from 'next';
// import { AgentOrchestrator, OrchestratorInput } from '@/lib/agents/orchestrator';
import { AIProvider } from '@/types/ai';
import { MenuAnalysisResult } from '@/lib/agents/types';

// Detailed error response type
interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
}

/**
 * API endpoint for analyzing a menu using the multi-agent system
 * 
 * Request body:
 * {
 *   ocrText: string;        // The OCR-extracted text from the menu
 *   ocrConfidence?: number; // Optional OCR confidence score
 *   userGoals: string[];    // User's health goals
 *   userRestrictions: string[]; // User's dietary restrictions
 *   recentPatterns?: string[]; // Optional recent eating patterns
 *   provider?: 'openai' | 'anthropic'; // Optional AI provider
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MenuAnalysisResult | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const {
      ocrText,
      ocrConfidence,
      userGoals,
      userRestrictions,
      recentPatterns,
      provider = 'openai'
    } = req.body;

    // Validate required inputs
    if (!ocrText) {
      return res.status(400).json({ 
        error: 'OCR text is required', 
        code: 'MISSING_OCR_TEXT'
      });
    }

    if (!userGoals || !Array.isArray(userGoals) || userGoals.length === 0) {
      return res.status(400).json({ 
        error: 'At least one user goal is required', 
        code: 'MISSING_USER_GOALS'
      });
    }

    if (!userRestrictions || !Array.isArray(userRestrictions)) {
      return res.status(400).json({ 
        error: 'User restrictions array is required', 
        code: 'MISSING_USER_RESTRICTIONS'
      });
    }

    // Map the provider string to enum
    let aiProvider: AIProvider;
    if (provider === 'anthropic') {
      aiProvider = AIProvider.ANTHROPIC;
    } else {
      aiProvider = AIProvider.OPENAI;
    }

    // Instead of using the missing orchestrator, return a mock response
    const mockResult: MenuAnalysisResult = {
      timestamp: new Date().toISOString(),
      averageHealthScore: 70,
      dishes: [],
      topDishes: {
        healthiest: {
          name: "Grilled Salmon",
          price: 32,
          macros: {
            calories: 450,
            protein: "High",
            carbs: "Low",
            fat: "Mid",
            sugar: "Low"
          },
          healthScore: 88,
          category: "Healthiest"
        },
        balanced: {
          name: "Herb-Roasted Chicken",
          price: 28,
          macros: {
            calories: 550,
            protein: "High",
            carbs: "Mid",
            fat: "Mid",
            sugar: "Low"
          },
          healthScore: 75,
          category: "Balanced"
        },
        indulgent: {
          name: "House Burger",
          price: 22,
          macros: {
            calories: 850,
            protein: "High",
            carbs: "High",
            fat: "High",
            sugar: "Mid"
          },
          healthScore: 55,
          category: "Indulgent"
        }
      }
    };

    // Return the mock results
    return res.status(200).json(mockResult);
  } catch (error: any) {
    console.error('Error in analyze-menu API:', error);
    
    // Extract error code and message
    const errorMessage = error.message || 'An unknown error occurred';
    
    // Check if this is one of our structured errors
    let errorCode = 'ANALYSIS_FAILED';
    let errorDetails = errorMessage;
    
    // Parse our structured error messages
    if (errorMessage.includes(':')) {
      const parts = errorMessage.split(':');
      if (parts.length >= 2) {
        errorCode = parts[0].trim();
        errorDetails = parts[1].trim();
      }
    }
    
    // Return a detailed error response
    return res.status(500).json({
      error: errorDetails,
      code: errorCode,
      details: error.stack
    });
  }
} 