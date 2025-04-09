import type { NextApiRequest, NextApiResponse } from 'next';
import {
  OPENAI_API_KEY,
  OPENROUTER_API_KEY,
  ANTHROPIC_API_KEY,
} from '@/lib/env';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface EnvTestResponse {
  success: boolean;
  status: Record<string, boolean>;
  validKeys?: Record<string, boolean>;
  message: string;
  details?: Record<string, string>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnvTestResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: {},
      message: 'Only GET requests allowed',
    });
  }

  // Check if environment variables are set
  const status = {
    OPENAI_API_KEY: !!OPENAI_API_KEY,
    OPENROUTER_API_KEY: !!OPENROUTER_API_KEY,
    ANTHROPIC_API_KEY: !!ANTHROPIC_API_KEY,
  };

  const allVarsSet = Object.values(status).every(Boolean);

  // Only test API keys validity if they're set (avoid testing placeholders)
  const validKeys: Record<string, boolean> = {};
  const details: Record<string, string> = {};

  // Test if keys are actually valid by making mini API calls
  if (req.query.validate === 'true') {
    try {
      if (status.OPENAI_API_KEY) {
        try {
          const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
          const openaiResponse = await openai.models.list();
          validKeys.OPENAI_API_KEY = openaiResponse.data.length > 0;
          details.OPENAI_API_KEY = validKeys.OPENAI_API_KEY
            ? `✅ OpenAI API key is valid. Found ${openaiResponse.data.length} models.`
            : '❌ OpenAI API key appears to be invalid.';
        } catch (error) {
          validKeys.OPENAI_API_KEY = false;
          details.OPENAI_API_KEY = `❌ OpenAI API key is invalid: ${(error as Error).message}`;
        }
      }

      if (status.ANTHROPIC_API_KEY) {
        try {
          const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
          // Simple test call to validate the API key
          const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 10,
            messages: [{ role: "user", content: "Hello" }]
          });
          validKeys.ANTHROPIC_API_KEY = !!response.id;
          details.ANTHROPIC_API_KEY = validKeys.ANTHROPIC_API_KEY
            ? `✅ Anthropic API key is valid.`
            : '❌ Anthropic API key appears to be invalid.';
        } catch (error) {
          validKeys.ANTHROPIC_API_KEY = false;
          details.ANTHROPIC_API_KEY = `❌ Anthropic API key is invalid: ${(error as Error).message}`;
        }
      }

      // OpenRouter API validation
      validKeys.OPENROUTER_API_KEY = status.OPENROUTER_API_KEY;
      details.OPENROUTER_API_KEY = status.OPENROUTER_API_KEY
        ? '✅ OpenRouter API key is set (validation skipped)'
        : '❌ OpenRouter API key is not set';

      const allKeysValid = Object.values(validKeys).every(Boolean);

      return res.status(200).json({
        success: allVarsSet && allKeysValid,
        status,
        validKeys,
        message: allVarsSet && allKeysValid
          ? '✅ All environment variables are set and valid.'
          : '⚠️ Some environment variables are missing or invalid.',
        details,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status,
        message: `Error validating API keys: ${(error as Error).message}`,
      });
    }
  }

  // Basic check without validation
  return res.status(200).json({
    success: allVarsSet,
    status,
    message: allVarsSet
      ? '✅ All environment variables are set.'
      : '⚠️ Some environment variables are missing.',
  });
} 