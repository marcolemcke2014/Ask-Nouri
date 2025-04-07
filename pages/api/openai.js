// pages/api/openai.js
import OpenAI from "openai";
import { OPENAI_API_KEY } from "@/lib/env";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize OpenAI with API key from our environment module
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const { prompt, maxTokens, responseFormat } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Configure the OpenAI request parameters
    const requestParams = {
      model: "gpt-4o", // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
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
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}