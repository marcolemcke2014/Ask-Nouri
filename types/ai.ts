/**
 * AI related type definitions
 */

/**
 * AI analysis response format
 */
export interface AIAnalysisResponse {
  items: MenuItemAnalysis[];
  error?: string;
}

/**
 * Menu item analysis from AI
 */
export interface MenuItemAnalysis {
  name: string;
  score: number;
  tags: string[];
  flags: string[];
  improvements: string[];
  reason?: string;
}

/**
 * AI provider options
 */
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  LOCAL = 'local'
}

/**
 * OpenAI API request options
 */
export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * OpenAI message format
 */
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * OpenAI API response format
 */
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * Anthropic API request options
 */
export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

/**
 * Anthropic message format
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Anthropic API response format
 */
export interface AnthropicResponse {
  id: string;
  type: string;
  model: string;
  content: {
    type: string;
    text: string;
  }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: {
    message: string;
    type: string;
  };
}

/**
 * AI menu analysis request
 */
export interface MenuAnalysisRequest {
  menuText: string;
  userGoals: string[];
  dietaryRestrictions?: string[];
  provider?: AIProvider;
}

/**
 * AI feedback request
 */
export interface FeedbackRequest {
  menuItemName: string;
  userExperience: string;
  rating: number;
  provider?: AIProvider;
} 