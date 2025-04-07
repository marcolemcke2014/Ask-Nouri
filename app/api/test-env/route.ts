import { NextResponse } from 'next/server';
import {
  OPENAI_API_KEY,
  GOOGLE_VISION_KEY,
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

export async function GET(request: Request) {
  // Check if environment variables are set
  const status = {
    OPENAI_API_KEY: !!OPENAI_API_KEY,
    GOOGLE_VISION_KEY: !!GOOGLE_VISION_KEY,
    ANTHROPIC_API_KEY: !!ANTHROPIC_API_KEY,
  };

  const allVarsSet = Object.values(status).every(Boolean);

  // Get URL to check for validate parameter
  const { searchParams } = new URL(request.url);
  const validate = searchParams.get('validate');

  // Only test API keys validity if they're set (avoid testing placeholders)
  const validKeys: Record<string, boolean> = {};
  const details: Record<string, string> = {};

  // Test if keys are actually valid by making mini API calls
  if (validate === 'true') {
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

      // Google Vision API requires more complex setup (skip for basic validation)
      validKeys.GOOGLE_VISION_KEY = status.GOOGLE_VISION_KEY;
      details.GOOGLE_VISION_KEY = status.GOOGLE_VISION_KEY
        ? '✅ Google Vision key is set (validation skipped)'
        : '❌ Google Vision key is not set';

      const allKeysValid = Object.values(validKeys).every(Boolean);

      const response: EnvTestResponse = {
        success: allVarsSet && allKeysValid,
        status,
        validKeys,
        message: allVarsSet && allKeysValid
          ? '✅ All environment variables are set and valid.'
          : '⚠️ Some environment variables are missing or invalid.',
        details,
      };
      
      return NextResponse.json(response);
    } catch (error) {
      const response: EnvTestResponse = {
        success: false,
        status,
        message: `Error validating API keys: ${(error as Error).message}`,
      };
      
      return NextResponse.json(response, { status: 500 });
    }
  }

  // Basic check without validation
  const response: EnvTestResponse = {
    success: allVarsSet,
    status,
    message: allVarsSet
      ? '✅ All environment variables are set.'
      : '⚠️ Some environment variables are missing.',
  };
  
  return NextResponse.json(response);
} 