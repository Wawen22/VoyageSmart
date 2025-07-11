import { logger } from '@/lib/logger';

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

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * Make API call to Gemini with retry logic and caching
 */
export async function callGeminiAPI(
  prompt: string,
  options: ApiCallOptions = {}
): Promise<string> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
  const timeout = options.timeout || 30000; // 30 seconds default
  const cacheKey = options.cacheKey;
  const cacheTtl = options.cacheTtl || 300000; // 5 minutes default
  
  // Check cache first
  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      logger.debug('Returning cached AI response', { cacheKey });
      return cached;
    }
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key non configurata');
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      logger.debug('Making Gemini API call', { 
        attempt, 
        maxRetries: config.maxRetries,
        cacheKey: cacheKey || 'none'
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        
        // Log the error
        logger.error('Gemini API error', {
          status: response.status,
          statusText: response.statusText,
          attempt,
          errorData
        });
        
        // Check if we should retry
        if (attempt <= config.maxRetries && isRetryableError(error, config)) {
          const delay = calculateDelay(attempt, config);
          logger.warn('Retrying Gemini API call', { 
            attempt, 
            delay, 
            status: response.status 
          });
          await sleep(delay);
          lastError = error;
          continue;
        }
        
        throw error;
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Cache successful response
      if (cacheKey && responseText) {
        setCachedResponse(cacheKey, responseText, cacheTtl);
      }
      
      logger.debug('Gemini API call successful', { 
        attempt,
        responseLength: responseText.length,
        cached: !!cacheKey
      });
      
      return responseText;
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on non-retryable errors
      if (!isRetryableError(error, config) || attempt > config.maxRetries) {
        logger.error('Gemini API call failed permanently', {
          attempt,
          error: error.message,
          retryable: isRetryableError(error, config)
        });
        break;
      }
      
      // Calculate delay and retry
      const delay = calculateDelay(attempt, config);
      logger.warn('Retrying Gemini API call after error', { 
        attempt, 
        delay, 
        error: error.message 
      });
      await sleep(delay);
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('All retry attempts failed');
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
