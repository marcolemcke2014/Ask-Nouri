import { NextResponse } from 'next/server';
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
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      ocrText,
      ocrConfidence,
      userGoals,
      userRestrictions,
      recentPatterns,
      provider = 'openai'
    } = body;

    // Validate required inputs
    if (!ocrText) {
      return NextResponse.json({ error: 'OCR text is required' }, { status: 400 });
    }

    if (!userGoals || !Array.isArray(userGoals) || userGoals.length === 0) {
      return NextResponse.json({ error: 'At least one user goal is required' }, { status: 400 });
    }

    if (!userRestrictions || !Array.isArray(userRestrictions)) {
      return NextResponse.json({ error: 'User restrictions array is required' }, { status: 400 });
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
    return NextResponse.json(analysisResults);
  } catch (error) {
    console.error('Error in analyze-menu API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
} 