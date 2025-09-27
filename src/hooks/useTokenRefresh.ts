import { useEffect, useRef, useCallback } from 'react';
import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

interface TokenRefreshOptions {
  /** Refresh token when it has this many seconds left before expiration (default: 300 = 5 minutes) */
  refreshThreshold?: number;
  /** Enable automatic refresh (default: true) */
  enabled?: boolean;
  /** Callback when token is refreshed successfully */
  onRefresh?: (session: any) => void;
  /** Callback when refresh fails */
  onRefreshError?: (error: Error) => void;
}

/**
 * Hook for proactive token refresh to prevent session expiration
 * Automatically refreshes tokens before they expire to maintain authentication state
 */
export function useTokenRefresh(options: TokenRefreshOptions = {}) {
  const {
    refreshThreshold = 300, // 5 minutes before expiration
    enabled = true,
    onRefresh,
    onRefreshError
  } = options;

  const supabase = createClientSupabase();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Calculate time until token expiration
   */
  const getTimeUntilExpiration = useCallback((expiresAt: number): number => {
    const now = Math.floor(Date.now() / 1000);
    return expiresAt - now;
  }, []);

  /**
   * Schedule the next token refresh
   */
  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (!enabled) return;

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    const timeUntilExpiration = getTimeUntilExpiration(expiresAt);
    const refreshIn = Math.max(0, timeUntilExpiration - refreshThreshold);

    logger.debug('Scheduling token refresh', {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      timeUntilExpiration,
      refreshIn,
      refreshThreshold
    });

    // Schedule refresh
    refreshTimeoutRef.current = setTimeout(async () => {
      await performRefresh();
    }, refreshIn * 1000);
  }, [enabled, refreshThreshold, getTimeUntilExpiration]);

  /**
   * Perform token refresh
   */
  const performRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      logger.debug('Token refresh already in progress, skipping');
      return;
    }

    isRefreshingRef.current = true;

    try {
      logger.debug('Performing proactive token refresh');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('Proactive token refresh failed', { error: error.message });
        onRefreshError?.(error);
        return;
      }

      if (session?.expires_at) {
        logger.info('Token refreshed successfully', {
          userId: session.user?.id?.slice(0, 8),
          newExpiresAt: new Date(session.expires_at * 1000).toISOString()
        });

        onRefresh?.(session);
        
        // Schedule next refresh
        scheduleRefresh(session.expires_at);
      }
    } catch (error) {
      logger.error('Exception during token refresh', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      onRefreshError?.(error as Error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [supabase.auth, onRefresh, onRefreshError, scheduleRefresh]);

  /**
   * Manually trigger token refresh
   */
  const refreshNow = useCallback(async () => {
    await performRefresh();
  }, [performRefresh]);

  /**
   * Initialize token refresh monitoring
   */
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const initializeRefresh = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error getting session for token refresh', { error: error.message });
          return;
        }

        if (session?.expires_at && mounted) {
          const timeUntilExpiration = getTimeUntilExpiration(session.expires_at);
          
          logger.debug('Initializing token refresh', {
            userId: session.user?.id?.slice(0, 8),
            expiresAt: new Date(session.expires_at * 1000).toISOString(),
            timeUntilExpiration
          });

          // If token is already close to expiration, refresh immediately
          if (timeUntilExpiration <= refreshThreshold) {
            logger.debug('Token close to expiration, refreshing immediately');
            await performRefresh();
          } else {
            // Schedule refresh
            scheduleRefresh(session.expires_at);
          }
        }
      } catch (error) {
        logger.error('Error initializing token refresh', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        logger.debug('Auth state change in token refresh hook', { event, hasSession: !!session });

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session?.expires_at) {
              scheduleRefresh(session.expires_at);
            }
            break;
          case 'SIGNED_OUT':
            // Clear any scheduled refresh
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
              refreshTimeoutRef.current = null;
            }
            break;
        }
      }
    );

    // Initialize
    initializeRefresh();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      
      // Clear timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [enabled, supabase.auth, scheduleRefresh, performRefresh, getTimeUntilExpiration, refreshThreshold]);

  return {
    refreshNow,
    isRefreshing: isRefreshingRef.current
  };
}
