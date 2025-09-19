'use client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
  storage: 'memory' | 'session' | 'local';
}

class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      storage: 'session',
      ...config
    };
  }

  /**
   * Set an item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.config.defaultTTL);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry
    };

    try {
      switch (this.config.storage) {
        case 'memory':
          this.setMemoryCache(key, item);
          break;
        case 'session':
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(key, JSON.stringify(item));
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(item));
          }
          break;
      }
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  /**
   * Get an item from cache
   */
  get<T>(key: string): T | null {
    try {
      let item: CacheItem<T> | null = null;

      switch (this.config.storage) {
        case 'memory':
          item = this.memoryCache.get(key) || null;
          break;
        case 'session':
          if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(key);
            item = cached ? JSON.parse(cached) : null;
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(key);
            item = cached ? JSON.parse(cached) : null;
          }
          break;
      }

      if (!item) return null;

      // Check if expired
      if (Date.now() > item.expiry) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): void {
    try {
      switch (this.config.storage) {
        case 'memory':
          this.memoryCache.delete(key);
          break;
        case 'session':
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(key);
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
          break;
      }
    } catch (error) {
      console.warn('Cache delete failed:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    try {
      switch (this.config.storage) {
        case 'memory':
          this.memoryCache.clear();
          break;
        case 'session':
          if (typeof window !== 'undefined') {
            sessionStorage.clear();
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            localStorage.clear();
          }
          break;
      }
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  /**
   * Get or set pattern - fetch data if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): void {
    try {
      switch (this.config.storage) {
        case 'memory':
          for (const key of this.memoryCache.keys()) {
            if (key.includes(pattern)) {
              this.memoryCache.delete(key);
            }
          }
          break;
        case 'session':
          if (typeof window !== 'undefined') {
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
              const key = sessionStorage.key(i);
              if (key && key.includes(pattern)) {
                sessionStorage.removeItem(key);
              }
            }
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && key.includes(pattern)) {
                localStorage.removeItem(key);
              }
            }
          }
          break;
      }
    } catch (error) {
      console.warn('Cache invalidate pattern failed:', error);
    }
  }

  private setMemoryCache<T>(key: string, item: CacheItem<T>): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.config.maxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(key, item);
  }
}

// Create cache instances for different use cases
export const tripCache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storage: 'session'
});

export const userCache = new CacheService({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  storage: 'session'
});

export const staticCache = new CacheService({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  storage: 'local'
});

export default CacheService;
