import { useEffect, useRef } from 'react';
import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

interface AuthMonitorOptions {
  /** Enable detailed logging (default: true in development) */
  enableLogging?: boolean;
  /** Track session duration (default: true) */
  trackSessionDuration?: boolean;
  /** Callback when authentication issues are detected */
  onAuthIssue?: (issue: AuthIssue) => void;
}

interface AuthIssue {
  type: 'token_expired' | 'session_lost' | 'refresh_failed' | 'storage_cleared';
  message: string;
  timestamp: Date;
  userId?: string;
}

interface SessionMetrics {
  sessionStart: Date | null;
  lastActivity: Date | null;
  tokenRefreshCount: number;
  authIssues: AuthIssue[];
}

/**
 * Hook for monitoring authentication persistence and detecting issues
 * Provides detailed logging and metrics for authentication state changes
 */
export function useAuthMonitor(options: AuthMonitorOptions = {}) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    trackSessionDuration = true,
    onAuthIssue
  } = options;

  const supabase = createClientSupabase();
  const metricsRef = useRef<SessionMetrics>({
    sessionStart: null,
    lastActivity: null,
    tokenRefreshCount: 0,
    authIssues: []
  });

  const reportIssue = (issue: AuthIssue) => {
    metricsRef.current.authIssues.push(issue);
    
    if (enableLogging) {
      logger.warn('Authentication issue detected', issue);
    }
    
    onAuthIssue?.(issue);
  };

  const updateActivity = () => {
    if (trackSessionDuration) {
      metricsRef.current.lastActivity = new Date();
    }
  };

  useEffect(() => {
    if (!enableLogging && !trackSessionDuration) return;

    let mounted = true;

    // Monitor localStorage changes for auth data
    const handleStorageChange = (event: StorageEvent) => {
      if (!mounted) return;

      if (event.key?.includes('supabase') || event.key?.includes('auth')) {
        if (enableLogging) {
          logger.debug('Auth storage change detected', {
            key: event.key,
            oldValue: event.oldValue ? 'present' : 'null',
            newValue: event.newValue ? 'present' : 'null'
          });
        }

        // Detect if auth data was cleared
        if (event.oldValue && !event.newValue) {
          reportIssue({
            type: 'storage_cleared',
            message: `Auth storage key cleared: ${event.key}`,
            timestamp: new Date()
          });
        }
      }
    };

    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      if (!mounted) return;

      if (document.visibilityState === 'visible') {
        updateActivity();
        
        if (enableLogging) {
          logger.debug('Page became visible, checking auth state');
        }

        // Check if session is still valid when page becomes visible
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            reportIssue({
              type: 'session_lost',
              message: `Session check failed after page visibility: ${error.message}`,
              timestamp: new Date()
            });
          } else if (!session && metricsRef.current.sessionStart) {
            reportIssue({
              type: 'session_lost',
              message: 'Session lost while page was hidden',
              timestamp: new Date()
            });
          }
        });
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const now = new Date();
        updateActivity();

        if (enableLogging) {
          logger.info('Auth state change monitored', {
            event,
            hasSession: !!session,
            userId: session?.user?.id?.slice(0, 8),
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            sessionDuration: metricsRef.current.sessionStart 
              ? Math.round((now.getTime() - metricsRef.current.sessionStart.getTime()) / 1000)
              : null
          });
        }

        switch (event) {
          case 'SIGNED_IN':
            metricsRef.current.sessionStart = now;
            metricsRef.current.tokenRefreshCount = 0;
            metricsRef.current.authIssues = [];
            break;

          case 'SIGNED_OUT':
            if (enableLogging && metricsRef.current.sessionStart) {
              const sessionDuration = Math.round((now.getTime() - metricsRef.current.sessionStart.getTime()) / 1000);
              logger.info('Session ended', {
                duration: sessionDuration,
                refreshCount: metricsRef.current.tokenRefreshCount,
                issueCount: metricsRef.current.authIssues.length
              });
            }
            metricsRef.current.sessionStart = null;
            break;

          case 'TOKEN_REFRESHED':
            metricsRef.current.tokenRefreshCount++;
            
            if (enableLogging) {
              logger.debug('Token refresh monitored', {
                refreshCount: metricsRef.current.tokenRefreshCount,
                userId: session?.user?.id?.slice(0, 8),
                newExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
              });
            }
            break;

          case 'USER_UPDATED':
            if (enableLogging) {
              logger.debug('User data updated', {
                userId: session?.user?.id?.slice(0, 8)
              });
            }
            break;
        }

        // Check for potential token expiration issues
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const timeUntilExpiration = expiresAt - Date.now();
          const fiveMinutes = 5 * 60 * 1000;

          if (timeUntilExpiration < fiveMinutes && timeUntilExpiration > 0) {
            if (enableLogging) {
              logger.warn('Token expiring soon', {
                timeUntilExpiration: Math.round(timeUntilExpiration / 1000),
                expiresAt: new Date(expiresAt).toISOString()
              });
            }
          } else if (timeUntilExpiration <= 0) {
            reportIssue({
              type: 'token_expired',
              message: 'Token has expired',
              timestamp: now,
              userId: session.user?.id
            });
          }
        }
      }
    );

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        reportIssue({
          type: 'session_lost',
          message: `Initial session check failed: ${error.message}`,
          timestamp: new Date()
        });
      } else if (session) {
        metricsRef.current.sessionStart = new Date();
        updateActivity();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase.auth, enableLogging, trackSessionDuration, onAuthIssue]);

  // Return current metrics
  const getMetrics = () => ({
    ...metricsRef.current,
    sessionDuration: metricsRef.current.sessionStart 
      ? Math.round((Date.now() - metricsRef.current.sessionStart.getTime()) / 1000)
      : null
  });

  return {
    getMetrics,
    reportIssue: (issue: Omit<AuthIssue, 'timestamp'>) => 
      reportIssue({ ...issue, timestamp: new Date() })
  };
}
