// pages/api/anthropic.js
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Anthropic with API key from environment variable
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { prompt, maxTokens, systemPrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Configure the Anthropic request parameters
    const messages = [{ role: 'user', content: prompt }];
    
    // Call the Anthropic API
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      max_tokens: maxTokens || 1000,
      system: systemPrompt || undefined,
      messages: messages,
    });

    // Return the response to the client
    return res.status(200).json(message);
  } catch (error) {
    console.error('Error in Anthropic API route:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}