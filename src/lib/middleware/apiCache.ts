import { NextRequest, NextResponse } from 'next/server';

interface CacheConfig {
  maxAge?: number; // in seconds
  sMaxAge?: number; // in seconds
  staleWhileRevalidate?: number; // in seconds
  mustRevalidate?: boolean;
  noCache?: boolean;
  private?: boolean;
}

/**
 * Add cache headers to API responses
 */
export function withCacheHeaders(
  response: NextResponse,
  config: CacheConfig = {}
): NextResponse {
  const {
    maxAge = 300, // 5 minutes default
    sMaxAge,
    staleWhileRevalidate,
    mustRevalidate = false,
    noCache = false,
    private: isPrivate = false
  } = config;

  if (noCache) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  const cacheDirectives: string[] = [];

  if (isPrivate) {
    cacheDirectives.push('private');
  } else {
    cacheDirectives.push('public');
  }

  cacheDirectives.push(`max-age=${maxAge}`);

  if (sMaxAge) {
    cacheDirectives.push(`s-maxage=${sMaxAge}`);
  }

  if (staleWhileRevalidate) {
    cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (mustRevalidate) {
    cacheDirectives.push('must-revalidate');
  }

  response.headers.set('Cache-Control', cacheDirectives.join(', '));
  
  // Add ETag for better caching
  const etag = generateETag(response);
  if (etag) {
    response.headers.set('ETag', etag);
  }

  return response;
}

/**
 * Create a cached API response
 */
export function createCachedResponse(
  data: any,
  config: CacheConfig = {}
): NextResponse {
  const response = NextResponse.json(data);
  return withCacheHeaders(response, config);
}

/**
 * Check if request has valid cache headers
 */
export function checkCacheHeaders(request: NextRequest): {
  ifNoneMatch?: string;
  ifModifiedSince?: string;
} {
  return {
    ifNoneMatch: request.headers.get('if-none-match') || undefined,
    ifModifiedSince: request.headers.get('if-modified-since') || undefined
  };
}

/**
 * Create 304 Not Modified response
 */
export function createNotModifiedResponse(): NextResponse {
  return new NextResponse(null, { status: 304 });
}

/**
 * Generate ETag from response data
 */
function generateETag(response: NextResponse): string | null {
  try {
    // Simple hash function for ETag generation
    const content = JSON.stringify(response);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(16)}"`;
  } catch {
    return null;
  }
}

/**
 * Cache configurations for different API endpoints
 */
export const cacheConfigs = {
  // Static data that rarely changes
  static: {
    maxAge: 3600, // 1 hour
    sMaxAge: 86400, // 24 hours
    staleWhileRevalidate: 604800 // 1 week
  },
  
  // User-specific data
  user: {
    maxAge: 300, // 5 minutes
    private: true,
    mustRevalidate: true
  },
  
  // Trip data that changes moderately
  trip: {
    maxAge: 300, // 5 minutes
    sMaxAge: 600, // 10 minutes
    staleWhileRevalidate: 3600 // 1 hour
  },
  
  // Real-time data
  realtime: {
    maxAge: 60, // 1 minute
    mustRevalidate: true
  },
  
  // AI responses (can be cached longer)
  ai: {
    maxAge: 1800, // 30 minutes
    sMaxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400 // 24 hours
  },
  
  // No cache for sensitive operations
  noCache: {
    noCache: true
  }
};

/**
 * Middleware wrapper for API routes with caching
 */
export function withApiCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: CacheConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check cache headers
      const { ifNoneMatch } = checkCacheHeaders(request);
      
      // Execute the handler
      const response = await handler(request);
      
      // Add cache headers to successful responses
      if (response.status === 200) {
        const cachedResponse = withCacheHeaders(response, config);
        
        // Check if client has valid cache
        if (ifNoneMatch && cachedResponse.headers.get('ETag') === ifNoneMatch) {
          return createNotModifiedResponse();
        }
        
        return cachedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('API Cache middleware error:', error);
      // Return the original response on error
      return handler(request);
    }
  };
}

/**
 * Helper to create API route with specific cache config
 */
export function createCachedApiRoute(
  handler: (request: NextRequest) => Promise<any>,
  cacheType: keyof typeof cacheConfigs = 'trip'
) {
  return withApiCache(async (request: NextRequest) => {
    const data = await handler(request);
    return NextResponse.json(data);
  }, cacheConfigs[cacheType]);
}
