/**
 * Environment variables configuration for NutriFlow
 * 
 * This file loads and validates essential environment variables
 * for the application to function properly.
 */

// OpenAI API key for menu analysis
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY in environment variables");

// Google Vision API key for OCR
export const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_KEY!;
if (!GOOGLE_VISION_KEY) throw new Error("Missing GOOGLE_VISION_KEY in environment variables");

// Anthropic API key for alternative AI provider
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY in environment variables");

/**
 * Validates that all required environment variables are set
 * @returns True if all environment variables are valid
 */
export function validateEnvVars(): boolean {
  return !!OPENAI_API_KEY && !!GOOGLE_VISION_KEY && !!ANTHROPIC_API_KEY;
}

/**
 * Returns a summary of environment variable status
 * @returns Object with status of each environment variable
 */
export function getEnvStatus(): Record<string, boolean> {
  return {
    OPENAI_API_KEY: !!OPENAI_API_KEY,
    GOOGLE_VISION_KEY: !!GOOGLE_VISION_KEY,
    ANTHROPIC_API_KEY: !!ANTHROPIC_API_KEY,
  };
} 