import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

/**
 * Client-side session manager for AI components
 * This handles session management without React hooks to avoid hook rule violations
 */
class AISessionManager {
  private supabase = createClientSupabase();
  private sessionCache: any = null;
  private lastRefresh = 0;
  private refreshPromise: Promise<any> | null = null;

  /**
   * Get current session with automatic refresh if needed
   */
  async getSession(): Promise<{ session: any; error: any }> {
    try {
      // Check if we have a recent session in cache (less than 30 seconds old)
      const now = Date.now();
      if (this.sessionCache && (now - this.lastRefresh) < 30000) {
        return { session: this.sessionCache, error: null };
      }

      // If there's already a refresh in progress, wait for it
      if (this.refreshPromise) {
        const result = await this.refreshPromise;
        return result;
      }

      // Start a new session fetch
      this.refreshPromise = this.fetchSession();
      const result = await this.refreshPromise;
      this.refreshPromise = null;

      return result;
    } catch (error) {
      logger.error('Error in getSession:', error);
      this.refreshPromise = null;
      return { session: null, error };
    }
  }

  /**
   * Fetch session from Supabase
   */
  private async fetchSession(): Promise<{ session: any; error: any }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        logger.error('Session fetch error:', error);
        return { session: null, error };
      }

      // Update cache
      this.sessionCache = session;
      this.lastRefresh = Date.now();

      logger.debug('Session fetched successfully', { 
        hasSession: !!session,
        userId: session?.user?.id 
      });

      return { session, error: null };
    } catch (error) {
      logger.error('Exception in fetchSession:', error);
      return { session: null, error };
    }
  }

  /**
   * Refresh session when it's expired or invalid
   */
  async refreshSession(): Promise<{ session: any; error: any }> {
    try {
      logger.debug('Attempting to refresh session');
      
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Session refresh failed:', error);
        this.sessionCache = null;
        return { session: null, error };
      }

      // Update cache with new session
      this.sessionCache = session;
      this.lastRefresh = Date.now();

      logger.debug('Session refreshed successfully', { 
        hasSession: !!session,
        userId: session?.user?.id 
      });

      return { session, error: null };
    } catch (error) {
      logger.error('Exception in refreshSession:', error);
      this.sessionCache = null;
      return { session: null, error };
    }
  }

  /**
   * Make authenticated API request with automatic session handling
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // First attempt with current session
    let response = await this.makeRequest(url, options);
    
    // If we get 401, try to refresh session and retry once
    if (response.status === 401) {
      logger.debug('Got 401, attempting session refresh and retry');
      
      const refreshResult = await this.refreshSession();
      
      if (refreshResult.session) {
        // Retry the request with refreshed session
        response = await this.makeRequest(url, options);
        
        if (response.ok) {
          logger.debug('Request succeeded after session refresh');
        }
      }
    }
    
    return response;
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    return fetch(url, requestOptions);
  }

  /**
   * Clear session cache (useful for logout)
   */
  clearCache(): void {
    this.sessionCache = null;
    this.lastRefresh = 0;
    this.refreshPromise = null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { session } = await this.getSession();
    return !!session;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    const { session } = await this.getSession();
    return session?.user || null;
  }
}

// Create singleton instance
const aiSessionManager = new AISessionManager();

export default aiSessionManager;
