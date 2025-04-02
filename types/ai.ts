/**
 * Types related to AI services and models
 */

// Supported AI models
export enum AIModel {
  // OpenAI models
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo-preview',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  
  // Anthropic models
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
}

// AI model provider
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

// Base prompt template
export type AIPromptTemplate = string;

// JSON schema for AI output
export type AIOutputSchema = {
  type: string;
  properties: Record<string, any>;
  required?: string[];
};

// AI completion request parameters
export type AICompletionRequest = {
  prompt: string;
  systemPrompt?: string;
  model: AIModel;
  temperature?: number;
  maxTokens?: number;
  outputSchema?: AIOutputSchema;
  stream?: boolean;
};

// Token usage information
export type AITokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

// AI completion response
export type AICompletionResponse = {
  text: string;
  parsedJson?: any;
  usage: AITokenUsage;
};

// AI streaming response
export type AIStreamingResponse = {
  text: string;
  isComplete: boolean;
  delta: string;
};

// AI stream handler
export type AIStreamHandler = (response: AIStreamingResponse) => void;

// AI error response
export type AIErrorResponse = {
  code: string;
  message: string;
  type: 'service_error' | 'rate_limit' | 'authentication' | 'validation' | 'server_error';
};

// AI service configuration
export type AIServiceConfig = {
  defaultModel: AIModel;
  provider: AIProvider;
  apiKey?: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
}; 