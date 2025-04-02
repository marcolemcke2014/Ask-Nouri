/**
 * AI service for calling language models (OpenAI GPT or Anthropic Claude)
 */
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { 
  AIModel, 
  AIProvider, 
  AICompletionRequest, 
  AICompletionResponse, 
  AIErrorResponse,
  AIStreamHandler
} from '@/types/ai';

// Initialize clients (only when API keys are available)
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION_ID
  });
}

if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
}

/**
 * Determine the provider for a given model
 */
function getProviderForModel(model: AIModel): AIProvider {
  if (model.startsWith('gpt')) {
    return AIProvider.OPENAI;
  } else if (model.startsWith('claude')) {
    return AIProvider.ANTHROPIC;
  }
  
  throw new Error(`Unsupported model: ${model}`);
}

/**
 * Call an AI model with the given prompt
 */
export async function callAI(request: AICompletionRequest): Promise<AICompletionResponse> {
  const { 
    prompt, 
    systemPrompt, 
    model, 
    temperature = 0.2, 
    maxTokens,
    outputSchema,
    stream
  } = request;
  
  const provider = getProviderForModel(model);
  
  if (provider === AIProvider.OPENAI) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Make sure OPENAI_API_KEY is set.');
    }
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: outputSchema ? { type: 'json_object' } : undefined,
      stream: false // We handle streaming separately
    });
    
    const text = response.choices[0]?.message?.content || '';
    
    let parsedJson = undefined;
    if (outputSchema && text) {
      try {
        parsedJson = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
      }
    }
    
    return {
      text,
      parsedJson,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  } else if (provider === AIProvider.ANTHROPIC) {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized. Make sure ANTHROPIC_API_KEY is set.');
    }
    
    // Call Anthropic Claude
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens || 4096,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    const text = response.content.reduce((acc, item) => {
      if (item.type === 'text') {
        return acc + item.text;
      }
      return acc;
    }, '');
    
    let parsedJson = undefined;
    if (outputSchema && text) {
      try {
        // Extract JSON from the response if it's wrapped in markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        parsedJson = JSON.parse(jsonText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
      }
    }
    
    return {
      text,
      parsedJson,
      usage: {
        promptTokens: 0, // Claude doesn't provide token usage details in the same way
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Call an AI model with streaming response
 */
export async function streamAI(
  request: AICompletionRequest,
  handler: AIStreamHandler
): Promise<void> {
  const { 
    prompt, 
    systemPrompt, 
    model, 
    temperature = 0.2, 
    maxTokens 
  } = request;
  
  const provider = getProviderForModel(model);
  
  if (provider === AIProvider.OPENAI) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Make sure OPENAI_API_KEY is set.');
    }
    
    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true
    });
    
    let fullText = '';
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullText += delta;
      
      handler({
        text: fullText,
        delta,
        isComplete: false
      });
    }
    
    handler({
      text: fullText,
      delta: '',
      isComplete: true
    });
  } else if (provider === AIProvider.ANTHROPIC) {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized. Make sure ANTHROPIC_API_KEY is set.');
    }
    
    // Call Anthropic Claude with streaming
    const stream = await anthropic.messages.create({
      model,
      max_tokens: maxTokens || 4096,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: true
    });
    
    let fullText = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text') {
        const delta = chunk.delta.text;
        fullText += delta;
        
        handler({
          text: fullText,
          delta,
          isComplete: false
        });
      }
    }
    
    handler({
      text: fullText,
      delta: '',
      isComplete: true
    });
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Default AI model based on environment configuration
 */
export function getDefaultModel(): AIModel {
  return (process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL as AIModel) || 
    (openai ? AIModel.GPT_4_TURBO : AIModel.CLAUDE_3_SONNET);
}

/**
 * Check if a model is available based on API keys
 */
export function isModelAvailable(model: AIModel): boolean {
  const provider = getProviderForModel(model);
  
  if (provider === AIProvider.OPENAI) {
    return !!openai;
  } else if (provider === AIProvider.ANTHROPIC) {
    return !!anthropic;
  }
  
  return false;
}

/**
 * Get all available AI models
 */
export function getAvailableModels(): AIModel[] {
  const models: AIModel[] = [];
  
  if (openai) {
    models.push(AIModel.GPT_4_TURBO, AIModel.GPT_4, AIModel.GPT_3_5_TURBO);
  }
  
  if (anthropic) {
    models.push(AIModel.CLAUDE_3_OPUS, AIModel.CLAUDE_3_SONNET, AIModel.CLAUDE_3_HAIKU);
  }
  
  return models;
}

export default {
  callAI,
  streamAI,
  getDefaultModel,
  isModelAvailable,
  getAvailableModels
}; 