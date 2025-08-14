import { logger } from '@/lib/logger';
import { aiProviderService, AIProvider, AIConfig } from './aiProviderService';
import { config } from '@/lib/config';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

export interface ApiCallOptions {
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  cacheKey?: string;
  cacheTtl?: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableStatuses: [429, 503, 502, 504, 408]
};

// Simple in-memory cache for API responses
const responseCache = new Map<string, { data: any; expiry: number }>();
// Track in-flight requests to deduplicate concurrent identical calls
const inFlight = new Map<string, Promise<string>>();

// Rate limiting per provider
const PROVIDER_RATE_LIMITS = {
  openai: {
    minDelay: 2000, // 2 secondi tra le richieste per Azure OpenAI
    maxConcurrent: 1 // Solo 1 richiesta concorrente per Azure
  },
  gemini: {
    minDelay: 500, // 0.5 secondi per Gemini
    maxConcurrent: 3 // Fino a 3 richieste concorrenti per Gemini
  },
  deepseek: {
    minDelay: 1000, // 1 secondo per DeepSeek via OpenRouter
    maxConcurrent: 2 // Fino a 2 richieste concorrenti per DeepSeek
  },
  'gemini-openrouter': {
    minDelay: 500, // 0.5 secondi per Gemini via OpenRouter
    maxConcurrent: 3 // Fino a 3 richieste concorrenti per Gemini OpenRouter
  }
};

// Track delle ultime richieste per provider
const lastRequestTime = new Map<string, number>();
const activeRequests = new Map<string, number>();

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check and enforce rate limiting for a provider
 */
async function enforceRateLimit(provider: AIProvider): Promise<void> {
  const limits = PROVIDER_RATE_LIMITS[provider];
  const now = Date.now();

  // Check concurrent requests
  const currentActive = activeRequests.get(provider) || 0;
  if (currentActive >= limits.maxConcurrent) {
    logger.warn(`Rate limit: too many concurrent requests for ${provider}`, {
      current: currentActive,
      max: limits.maxConcurrent
    });
    throw new Error(`Too many concurrent requests for ${provider}. Please wait.`);
  }

  // Check time-based rate limiting
  const lastRequest = lastRequestTime.get(provider) || 0;
  const timeSinceLastRequest = now - lastRequest;

  if (timeSinceLastRequest < limits.minDelay) {
    const waitTime = limits.minDelay - timeSinceLastRequest;
    logger.debug(`Rate limit: waiting ${waitTime}ms for ${provider}`);
    await sleep(waitTime);
  }

  // Update tracking
  lastRequestTime.set(provider, Date.now());
  activeRequests.set(provider, currentActive + 1);
}

/**
 * Mark request as completed for rate limiting
 */
function markRequestCompleted(provider: AIProvider): void {
  const currentActive = activeRequests.get(provider) || 0;
  activeRequests.set(provider, Math.max(0, currentActive - 1));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Quick check for cache presence (for analytics/logging)
 */
export function hasCachedResponse(cacheKey?: string): boolean {
  if (!cacheKey) return false;
  const cached = responseCache.get(cacheKey);
  return !!(cached && cached.expiry > Date.now());
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, config: RetryConfig): boolean {
  if (error.status && config.retryableStatuses.includes(error.status)) {
    return true;
  }
  
  // Check for network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  return false;
}

/**
 * Get cached response if available and not expired
 */
function getCachedResponse(cacheKey: string): any | null {
  if (!cacheKey) return null;
  
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  // Remove expired cache entry
  if (cached) {
    responseCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Cache response
 */
function setCachedResponse(cacheKey: string, data: any, ttl: number): void {
  if (!cacheKey) return;
  
  responseCache.set(cacheKey, {
    data,
    expiry: Date.now() + ttl
  });
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (value.expiry <= now) {
        responseCache.delete(key);
      }
    }
  }
}

/**
 * Make AI API call with retry logic and caching (supports multiple providers)
 */
export async function callAIAPI(
  prompt: string,
  options: ApiCallOptions & {
    provider?: AIProvider;
    userId?: string;
    systemPrompt?: string;
    history?: Array<{ role: string; content: string }>;
  } = {}
): Promise<string> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
  const timeout = options.timeout || 30000; // 30 seconds default
  const cacheKey = options.cacheKey;
  const cacheTtl = options.cacheTtl || 300000; // 5 minutes default
  const { provider, userId, systemPrompt, history = [] } = options;

  // Check cache first
  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      logger.debug('Returning cached AI response', { cacheKey });
      return cached;
    }
    // De-duplicate concurrent identical calls: if one is in-flight, wait for it
    const existing = inFlight.get(cacheKey);
    if (existing) {
      logger.debug('Joining in-flight AI call', { cacheKey });
      return existing;
    }
  }

  // Determine AI provider and configuration
  let aiConfig: AIConfig;

  if (provider) {
    // Use specified provider
    aiConfig = aiProviderService.getDefaultConfig(provider);
  } else {
    // Use default provider from config
    const defaultProvider = config.ai.defaultProvider;
    aiConfig = aiProviderService.getDefaultConfig(defaultProvider);
  }

  let lastError: any;

  // Define the actual call as a promise so we can register it for de-duplication
  const doCall = (async () => {
    for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
      try {
        logger.debug('Making AI API call', {
          provider: aiConfig.provider,
          model: aiConfig.model,
          attempt,
          maxRetries: retryConfig.maxRetries,
          cacheKey: cacheKey || 'none'
        });

        // Enforce rate limiting
        await enforceRateLimit(aiConfig.provider);

        // Use the unified AI provider service
        const response = await aiProviderService.generateResponse(
          prompt,
          aiConfig,
          {
            history,
            systemPrompt,
            timeout,
          }
        );

        if (!response.success) {
          throw new Error(response.error || 'AI API call failed');
        }

        // Cache successful response
        if (cacheKey && response.message) {
          setCachedResponse(cacheKey, response.message, cacheTtl);
        }

        logger.debug('AI API call successful', {
          provider: aiConfig.provider,
          model: aiConfig.model,
          attempt,
          responseLength: response.message.length,
          cached: !!cacheKey
        });

        // Mark request as completed for rate limiting
        markRequestCompleted(aiConfig.provider);
        return response.message;

      } catch (error: any) {
        // Mark request as completed for rate limiting even on error
        markRequestCompleted(aiConfig.provider);
        lastError = error;

        // Don't retry on non-retryable errors
        if (!isRetryableError(error, retryConfig) || attempt > retryConfig.maxRetries) {
          logger.error('AI API call failed permanently', {
            provider: aiConfig.provider,
            model: aiConfig.model,
            attempt,
            error: error.message,
            retryable: isRetryableError(error, retryConfig)
          });
          break;
        }

        // Calculate delay and retry
        const delay = calculateDelay(attempt, retryConfig);
        logger.warn('Retrying AI API call after error', {
          provider: aiConfig.provider,
          model: aiConfig.model,
          attempt,
          delay,
          error: error.message
        });
        await sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('All retry attempts failed');
  })();

  // Register in-flight promise (if cacheKey provided) and ensure cleanup
  if (cacheKey) {
    inFlight.set(cacheKey, doCall);
  }
  try {
    const result = await doCall;
    return result;
  } finally {
    if (cacheKey) {
      inFlight.delete(cacheKey);
    }
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use callAIAPI instead
 */
export async function callGeminiAPI(
  prompt: string,
  options: ApiCallOptions = {}
): Promise<string> {
  return callAIAPI(prompt, { ...options, provider: 'gemini' });
}

/**
 * Clear cache entries (useful for testing or manual cache invalidation)
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: responseCache.size,
    keys: Array.from(responseCache.keys())
  };
}
