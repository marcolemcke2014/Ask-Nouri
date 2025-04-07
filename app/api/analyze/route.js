import { NextResponse } from 'next/server';
import { OPENAI_API_KEY, ANTHROPIC_API_KEY } from '@/lib/env';
import { analyzeMenu } from '@/lib/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, goals, restrictions } = body;
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: 'At least one goal is required' }, { status: 400 });
    }
    
    if (!restrictions || !Array.isArray(restrictions)) {
      return NextResponse.json({ error: 'Restrictions array is required' }, { status: 400 });
    }
    
    // Choose AI provider based on available API keys
    const provider = OPENAI_API_KEY ? 'openai' : (ANTHROPIC_API_KEY ? 'anthropic' : null);
    
    if (!provider) {
      return NextResponse.json({ 
        error: 'No AI provider available. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY in environment variables.'
      }, { status: 500 });
    }
    
    const result = await analyzeMenu(text, goals, restrictions, provider);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 