import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configurations
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  '/api/auth/register': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour
  '/api/auth/reset-password': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour

  // AI endpoints - optimized limits to prevent 429 errors
  '/api/ai/chat': { windowMs: 60 * 1000, maxRequests: 15 }, // 15 requests per minute (reduced from 20)
  '/api/ai/generate-activities': { windowMs: 60 * 1000, maxRequests: 8 }, // 8 requests per minute (reduced from 10)

  // General API endpoints
  'default': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
};

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get user ID from session if available
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Get rate limit configuration for a specific path
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for exact match first
  if (DEFAULT_CONFIGS[pathname]) {
    return DEFAULT_CONFIGS[pathname];
  }
  
  // Check for pattern matches
  for (const [pattern, config] of Object.entries(DEFAULT_CONFIGS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  
  // Return default configuration
  return DEFAULT_CONFIGS.default;
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const pathname = request.nextUrl.pathname;
  const clientId = getClientId(request);
  const config = getRateLimitConfig(pathname);
  
  const key = `${clientId}:${pathname}`;
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }
  
  let entry = rateLimitStore.get(key);
  
  // If no entry exists or it's expired, create a new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment the count
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(rateLimitResult: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
  };
}

/**
 * Middleware function to apply rate limiting
 */
export function applyRateLimit(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = createRateLimitHeaders(rateLimitResult);
  
  return {
    rateLimitResult,
    headers,
  };
}
