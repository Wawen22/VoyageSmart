'use client';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly timeout = 30000; // 30 seconds timeout

  /**
   * Deduplicate requests by key
   * If a request with the same key is already pending, return the existing promise
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if we have a pending request for this key
    const existing = this.pendingRequests.get(key);
    
    if (existing) {
      // Check if the request hasn't timed out
      if (Date.now() - existing.timestamp < this.timeout) {
        console.log(`[RequestDedup] Using existing request for key: ${key}`);
        return existing.promise;
      } else {
        // Remove timed out request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    console.log(`[RequestDedup] Creating new request for key: ${key}`);
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Cancel a pending request
   */
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clean up timed out requests
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.timeout) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Create a global instance
export const requestDeduplication = new RequestDeduplicationService();

// Utility function to create a request key
export function createRequestKey(
  endpoint: string,
  params?: Record<string, any>
): string {
  const paramString = params 
    ? Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&')
    : '';
  
  return paramString ? `${endpoint}?${paramString}` : endpoint;
}

// Utility function for common Supabase request patterns
export function createSupabaseRequestKey(
  table: string,
  filters?: Record<string, any>,
  select?: string,
  orderBy?: { column: string; ascending?: boolean }
): string {
  const parts = [table];
  
  if (select) {
    parts.push(`select=${select}`);
  }
  
  if (filters) {
    Object.keys(filters)
      .sort()
      .forEach(key => {
        parts.push(`${key}=${filters[key]}`);
      });
  }
  
  if (orderBy) {
    parts.push(`order=${orderBy.column}:${orderBy.ascending ? 'asc' : 'desc'}`);
  }
  
  return parts.join('|');
}

// React hook for optimized API calls
import { useState, useEffect, useCallback } from 'react';
import { tripCache } from './cacheService';

interface UseOptimizedApiOptions {
  cacheKey?: string;
  cacheTTL?: number;
  enableDeduplication?: boolean;
  dependencies?: any[];
}

export function useOptimizedApi<T>(
  requestFn: () => Promise<T>,
  options: UseOptimizedApiOptions = {}
) {
  const {
    cacheKey,
    cacheTTL,
    enableDeduplication = true,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first if cache key is provided
      if (cacheKey) {
        const cached = tripCache.get<T>(cacheKey);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Make request with optional deduplication
      let result: T;
      if (enableDeduplication && cacheKey) {
        result = await requestDeduplication.deduplicate(cacheKey, requestFn);
      } else {
        result = await requestFn();
      }

      // Cache the result if cache key is provided
      if (cacheKey) {
        tripCache.set(cacheKey, result, cacheTTL);
      }

      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestFn, cacheKey, cacheTTL, enableDeduplication]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = useCallback(() => {
    // Clear cache before refetching
    if (cacheKey) {
      tripCache.delete(cacheKey);
    }
    return fetchData();
  }, [fetchData, cacheKey]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

export default RequestDeduplicationService;
