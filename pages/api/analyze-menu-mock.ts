import type { NextApiRequest, NextApiResponse } from 'next';
import { MenuAnalysisResult } from '@/lib/agents/types';
import fs from 'fs';
import path from 'path';

// Mock data for successful response
const mockAnalysisResults: MenuAnalysisResult = {
  timestamp: new Date().toISOString(),
  averageHealthScore: 68,
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

// Mock errors for testing
const mockErrors = {
  menuStructuringFailed: {
    error: "No menu items identified in the OCR text",
    code: "MENU_STRUCTURING_FAILED",
    details: "Error occurred at MenuStructurer.process"
  },
  dishNotFound: {
    error: "Healthiest dish \"Grilled Salmon\" not found in menu items",
    code: "DISH_NOT_FOUND",
    details: "Error occurred in orchestrator.analyze"
  }
};

/**
 * Mock API endpoint for menu analysis
 * This endpoint doesn't use real AI - it returns mock data for testing
 * 
 * Query params:
 * - error: Simulate an error response ("structure" or "notfound")
 * - delay: Simulate processing time in ms (default: 2000)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  // Get query parameters
  const shouldError = req.query.error as string;
  const delay = parseInt(req.query.delay as string) || 2000;

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate errors if requested
  if (shouldError === 'structure') {
    return res.status(500).json(mockErrors.menuStructuringFailed);
  } else if (shouldError === 'notfound') {
    return res.status(500).json(mockErrors.dishNotFound);
  }

  // Otherwise return successful mock data
  return res.status(200).json(mockAnalysisResults);
} 