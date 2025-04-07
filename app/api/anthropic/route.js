import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from "@/lib/env";

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt, maxTokens, systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Initialize Anthropic with API key from our environment module
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Configure the Anthropic request parameters
    const messages = [{ role: 'user', content: prompt }];
    
    // Call the Anthropic API
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229", // Use the most capable Anthropic model available
      max_tokens: maxTokens || 1000,
      system: systemPrompt || undefined,
      messages: messages,
    });

    // Return the response to the client
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in Anthropic API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 