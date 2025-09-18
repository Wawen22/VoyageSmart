/**
 * Unified AI Provider Service
 * Manages multiple AI providers (Gemini, OpenAI) with a common interface
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI, { AzureOpenAI } from 'openai';
import { logger } from '@/lib/logger';

// AI Provider types
export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'gemini-openrouter';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
  provider: AIProvider;
  model: string;
}

// Default configurations for each provider
const DEFAULT_CONFIGS: Record<AIProvider, Omit<AIConfig, 'provider'>> = {
  gemini: {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: 4096,
  },
  openai: {
    model: 'gpt-5-nano',
    temperature: 1.0, // GPT-5-nano supports temperature = 1
    maxTokens: 4096,
  },
  deepseek: {
    model: 'deepseek/deepseek-r1:free',
    temperature: 1,
    maxTokens: 4096,
  },
  'gemini-openrouter': {
    model: 'google/gemini-2.0-flash-exp:free',
    temperature: 0.7,
    maxTokens: 4096,
  },
};

class AIProviderService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | AzureOpenAI | null = null;
  private deepseekClient: OpenAI | null = null;
  private geminiOpenrouterClient: OpenAI | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize Gemini client
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
      logger.debug('Gemini client initialized');
    } else {
      logger.warn('Gemini API key not found');
    }

    // Initialize OpenAI client (Azure OpenAI)
    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const azureEndpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
    const azureApiVersion = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2025-04-01-preview';
    const azureDeploymentName = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano';

    if (openaiApiKey && azureEndpoint) {
      // Use AzureOpenAI client with proper configuration
      this.openaiClient = new AzureOpenAI({
        endpoint: azureEndpoint,
        apiKey: openaiApiKey,
        deployment: azureDeploymentName,
        apiVersion: azureApiVersion,
        dangerouslyAllowBrowser: true, // Only for client-side usage
        timeout: 20000, // 20 seconds timeout for faster responses
      });
      logger.debug('Azure OpenAI client initialized', {
        endpoint: azureEndpoint,
        deploymentName: azureDeploymentName,
        apiVersion: azureApiVersion
      });
    } else if (openaiApiKey) {
      // Fallback to regular OpenAI if no Azure endpoint
      this.openaiClient = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
      logger.debug('OpenAI client initialized');
    } else {
      logger.warn('OpenAI API key not found');
    }

    // Initialize DeepSeek client (via OpenRouter)
    const openrouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (openrouterApiKey) {
      this.deepseekClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openrouterApiKey,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'VoyageSmart',
        },
      });
      logger.debug('DeepSeek (OpenRouter) client initialized');
    } else {
      logger.warn('OpenRouter API key not found');
    }

    // Initialize Gemini OpenRouter client
    const geminiOpenrouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_GEMINI_API_KEY;
    if (geminiOpenrouterApiKey) {
      this.geminiOpenrouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: geminiOpenrouterApiKey,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'VoyageSmart',
        },
      });
      logger.debug('Gemini OpenRouter client initialized');
    } else {
      logger.warn('Gemini OpenRouter API key not found');
    }
  }

  /**
   * Get available providers based on configured API keys
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.geminiClient) providers.push('gemini');
    if (this.openaiClient) providers.push('openai');
    if (this.deepseekClient) providers.push('deepseek');
    if (this.geminiOpenrouterClient) providers.push('gemini-openrouter');
    return providers;
  }

  /**
   * Get default configuration for a provider
   */
  getDefaultConfig(provider: AIProvider): AIConfig {
    return {
      provider,
      ...DEFAULT_CONFIGS[provider],
    };
  }

  /**
   * Generate AI response using the specified provider
   */
  async generateResponse(
    prompt: string,
    config: AIConfig,
    options?: {
      history?: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      timeout?: number;
    }
  ): Promise<AIResponse> {
    const { provider, model, temperature, maxTokens } = config;
    const { history = [], systemPrompt, timeout = 30000 } = options || {};

    try {
      logger.debug('Generating AI response', {
        provider,
        model,
        promptLength: prompt.length,
        hasHistory: history.length > 0,
        hasSystemPrompt: !!systemPrompt,
      });

      let response: string;

      switch (provider) {
        case 'gemini':
          response = await this.generateGeminiResponse(prompt, {
            model,
            temperature,
            maxTokens,
            history,
            systemPrompt,
            timeout,
          });
          break;

        case 'openai':
          response = await this.generateOpenAIResponse(prompt, {
            model,
            temperature,
            maxTokens,
            history,
            systemPrompt,
            timeout,
          });
          break;

        case 'deepseek':
          response = await this.generateDeepSeekResponse(prompt, {
            model,
            temperature,
            maxTokens,
            history,
            systemPrompt,
            timeout,
          });
          break;

        case 'gemini-openrouter':
          response = await this.generateGeminiOpenrouterResponse(prompt, {
            model,
            temperature,
            maxTokens,
            history,
            systemPrompt,
            timeout,
          });
          break;

        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      logger.debug('AI response generated successfully', {
        provider,
        model,
        responseLength: response.length,
      });

      return {
        success: true,
        message: response,
        provider,
        model,
      };
    } catch (error: any) {
      logger.error('AI response generation failed', {
        provider,
        model,
        error: error.message,
      });

      return {
        success: false,
        message: 'Mi dispiace, ho avuto un problema nel rispondere. Riprova più tardi.',
        error: error.message,
        provider,
        model,
      };
    }
  }

  /**
   * Generate response using Gemini
   */
  private async generateGeminiResponse(
    prompt: string,
    options: {
      model: string;
      temperature: number;
      maxTokens: number;
      history: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      timeout: number;
    }
  ): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const { model, temperature, maxTokens, history, systemPrompt } = options;

    const geminiModel = this.geminiClient.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topK: 40,
        topP: 0.95,
      },
    });

    // Convert history to Gemini format
    const geminiHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add system prompt to the beginning if provided
    let finalPrompt = prompt;
    if (systemPrompt) {
      finalPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const chat = geminiModel.startChat({
      history: geminiHistory,
    });

    const result = await chat.sendMessage(finalPrompt);
    const response = result.response;

    return response.text();
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    prompt: string,
    options: {
      model: string;
      temperature: number;
      maxTokens: number;
      history: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      timeout: number;
    }
  ): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    // Debug logging
    logger.debug('OpenAI client configuration', {
      clientExists: !!this.openaiClient,
      hasAzureEndpoint: !!process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT
    });

    const { model, temperature, maxTokens, history, systemPrompt } = options;

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add history
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    // For Azure OpenAI, we need to include the model name and use max_completion_tokens
    const isAzure = !!process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;

    const requestBody: any = {
      messages,
    };

    if (isAzure) {
      // Azure OpenAI specific configuration
      requestBody.model = model; // Include model name for Azure
      requestBody.max_completion_tokens = maxTokens; // Use max_completion_tokens for Azure

      // GPT-5-nano supports temperature = 1 (default)
      if (model === 'gpt-5-nano') {
        // Don't set temperature for gpt-5-nano, use default (1)
      } else {
        requestBody.temperature = temperature;
      }
    } else {
      // Standard OpenAI configuration
      requestBody.model = model;
      requestBody.max_tokens = maxTokens;
      requestBody.temperature = temperature;
    }

    // Debug logging
    logger.debug('Azure OpenAI request', {
      messagesCount: requestBody.messages?.length || 0,
      promptLength: JSON.stringify(requestBody).length,
      model: requestBody.model
    });

    let completion;
    try {
      completion = await this.openaiClient.chat.completions.create(requestBody);
    } catch (error: any) {
      logger.error('Azure OpenAI API error', {
        errorType: error.constructor.name,
        message: error.message,
        status: error.status,
        code: error.code
      });
      throw new Error(`Azure OpenAI API error: ${error.message}`);
    }

    logger.debug('Azure OpenAI response received', {
      choicesCount: completion.choices?.length || 0,
      hasFirstChoice: !!completion.choices?.[0]
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      logger.error('No response content from Azure OpenAI', {
        choicesCount: completion.choices?.length || 0
      });
      throw new Error('No response from OpenAI');
    }

    logger.debug('Azure OpenAI response processed', { responseLength: response.length });

    return response;
  }

  /**
   * Generate response using DeepSeek R1 via OpenRouter
   */
  private async generateDeepSeekResponse(
    prompt: string,
    options: {
      model: string;
      temperature: number;
      maxTokens: number;
      history: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      timeout: number;
    }
  ): Promise<string> {
    if (!this.deepseekClient) {
      throw new Error('DeepSeek client not initialized');
    }

    const { model, temperature, maxTokens, history, systemPrompt } = options;

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add history
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // Debug logging
    logger.debug('DeepSeek OpenRouter request', {
      model,
      messagesCount: messages.length,
      temperature,
      maxTokens
    });

    let completion;
    try {
      completion = await this.deepseekClient.chat.completions.create(requestBody);
    } catch (error: any) {
      logger.error('DeepSeek OpenRouter API error', {
        errorType: error.constructor.name,
        message: error.message,
        status: error.status,
        code: error.code
      });
      throw new Error(`DeepSeek API error: ${error.message}`);
    }

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      logger.error('No response content from DeepSeek', {
        choicesCount: completion.choices?.length || 0
      });
      throw new Error('No response from DeepSeek');
    }

    logger.debug('DeepSeek response processed', { responseLength: response.length });

    return response;
  }

  /**
   * Generate response using Gemini 2.0 Flash Exp via OpenRouter
   */
  private async generateGeminiOpenrouterResponse(
    prompt: string,
    options: {
      model: string;
      temperature: number;
      maxTokens: number;
      history: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      timeout: number;
    }
  ): Promise<string> {
    if (!this.geminiOpenrouterClient) {
      throw new Error('Gemini OpenRouter client not initialized');
    }

    const { model, temperature, maxTokens, history, systemPrompt } = options;

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add history
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // Debug logging
    logger.debug('Gemini OpenRouter request', {
      model,
      messagesCount: messages.length,
      temperature,
      maxTokens
    });

    let completion;
    try {
      completion = await this.geminiOpenrouterClient.chat.completions.create(requestBody);
    } catch (error: any) {
      logger.error('Gemini OpenRouter API error', {
        errorType: error.constructor.name,
        message: error.message,
        status: error.status,
        code: error.code
      });
      throw new Error(`Gemini OpenRouter API error: ${error.message}`);
    }

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      logger.error('No response content from Gemini OpenRouter', {
        choicesCount: completion.choices?.length || 0
      });
      throw new Error('No response from Gemini OpenRouter');
    }

    logger.debug('Gemini OpenRouter response processed', { responseLength: response.length });

    return response;
  }

  /**
   * Test if a provider is available and working
   */
  async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      const config = this.getDefaultConfig(provider);
      const response = await this.generateResponse(
        'Test message. Please respond with "OK".',
        config,
        { timeout: 10000 }
      );
      return response.success;
    } catch (error) {
      logger.error(`Provider test failed for ${provider}`, { error });
      return false;
    }
  }
}

// Export singleton instance
export const aiProviderService = new AIProviderService();

// Export types and utilities
export { AIProviderService };
