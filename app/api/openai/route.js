import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { OPENAI_API_KEY } from "@/lib/env";

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt, maxTokens, responseFormat } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Initialize OpenAI with API key from our environment module
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Configure the OpenAI request parameters
    const requestParams = {
      model: "gpt-4o", // The newest OpenAI model
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens || 1000,
    };

    // Add response_format if needed
    if (responseFormat === 'json_object') {
      requestParams.response_format = { type: "json_object" };
    }

    // Call the OpenAI API
    const response = await openai.chat.completions.create(requestParams);

    // Return the response to the client
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 