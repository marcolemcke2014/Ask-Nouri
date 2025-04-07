import type { NextApiRequest, NextApiResponse } from 'next';
import { AnalysisResults } from '@/lib/agents/types';
import fs from 'fs';
import path from 'path';

// Mock data for successful response
const mockAnalysisResults: AnalysisResults = {
  averageMenuScore: 68,
  menuCategory: "⚖️ Balanced",
  topDishes: {
    healthiest: {
      title: "Grilled Salmon",
      price: "$32",
      category: "🥗 Healthiest",
      summary: "High in omega-3 fatty acids and protein. Excellent for muscle recovery and growth while being naturally low in sodium.",
      macros: {
        calories: 450,
        protein: "High",
        carbs: "Low",
        fat: "Mid",
        sugar: "Low",
        confidence: 0.85
      },
      health_prediction: {
        short_term: "Provides clean, lean protein for immediate muscle repair with minimal water retention due to low sodium.",
        long_term: "Supports consistent muscle gain while maintaining heart health through regular omega-3 intake."
      },
      score: 88,
      confidence: 0.9
    },
    balanced: {
      title: "Herb-Roasted Chicken",
      price: "$28",
      category: "⚖️ Balanced",
      summary: "Good source of protein with moderate fat content. The wild rice provides complex carbs for sustained energy.",
      macros: {
        calories: 550,
        protein: "High",
        carbs: "Mid",
        fat: "Mid",
        sugar: "Low",
        confidence: 0.8
      },
      health_prediction: {
        short_term: "Complete meal providing balanced energy and satiety for approximately 4-5 hours.",
        long_term: "Reasonable protein support for muscle maintenance while offering diverse nutrient intake."
      },
      score: 75,
      confidence: 0.85
    },
    indulgent: {
      title: "House Burger",
      price: "$22",
      category: "🍔 Indulgent",
      summary: "High protein from beef but also high in sodium from bacon and cheese. Request sauce on the side to reduce sodium intake.",
      macros: {
        calories: 850,
        protein: "High",
        carbs: "High",
        fat: "High",
        sugar: "Mid",
        confidence: 0.8
      },
      health_prediction: {
        short_term: "Delivers ample protein for muscle-building but may cause temporary water retention due to sodium content.",
        long_term: "Can support muscle gains when balanced with lower-sodium options in other meals."
      },
      score: 55,
      confidence: 0.75
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