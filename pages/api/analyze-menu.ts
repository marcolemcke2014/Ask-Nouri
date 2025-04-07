import type { NextApiRequest, NextApiResponse } from 'next';
import { AgentOrchestrator, OrchestratorInput } from '@/lib/agents/orchestrator';
import { AIProvider } from '@/types/ai';
import { AnalysisResults } from '@/lib/agents/types';

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
  res: NextApiResponse<AnalysisResults | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
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
      return res.status(400).json({ error: 'OCR text is required' });
    }

    if (!userGoals || !Array.isArray(userGoals) || userGoals.length === 0) {
      return res.status(400).json({ error: 'At least one user goal is required' });
    }

    if (!userRestrictions || !Array.isArray(userRestrictions)) {
      return res.status(400).json({ error: 'User restrictions array is required' });
    }

    // Map the provider string to enum
    let aiProvider: AIProvider;
    if (provider === 'anthropic') {
      aiProvider = AIProvider.ANTHROPIC;
    } else {
      aiProvider = AIProvider.OPENAI;
    }

    // Create the orchestrator input
    const input: OrchestratorInput = {
      ocrResult: {
        text: ocrText,
        confidence: ocrConfidence
      },
      userProfile: {
        goals: userGoals,
        restrictions: userRestrictions,
        recentPatterns: recentPatterns || []
      },
      provider: aiProvider
    };

    // Initialize the orchestrator and run the analysis
    const orchestrator = new AgentOrchestrator();
    const analysisResults = await orchestrator.analyze(input);

    // Return the results
    return res.status(200).json(analysisResults);
  } catch (error) {
    console.error('Error in analyze-menu API:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
} 