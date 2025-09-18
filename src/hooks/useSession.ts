import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for managing Supabase session state with proper persistence
 * This hook ensures sessions are properly maintained across page refreshes
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  const supabase = createClientSupabase();

  useEffect(() => {
    let mounted = true;

    // Function to update session state
    const updateSession = (session: Session | null, error: Error | null = null) => {
      if (!mounted) return;

      setState({
        session,
        user: session?.user ?? null,
        loading: false,
        error,
      });
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error getting initial session', { error: error.message });
          updateSession(null, error);
          return;
        }

        logger.debug('Initial session loaded', { hasSession: !!session });
        updateSession(session);
      } catch (error) {
        logger.error('Error in getInitialSession', { error: error instanceof Error ? error.message : String(error) });
        updateSession(null, error as Error);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state change', { event, hasSession: !!session });

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            logger.info('User signed in', { userId: session?.user?.id });
            updateSession(session);
            break;
          case 'SIGNED_OUT':
            logger.info('User signed out');
            updateSession(null);
            break;
          case 'TOKEN_REFRESHED':
            logger.debug('Token refreshed', { userId: session?.user?.id });
            updateSession(session);
            break;
          case 'USER_UPDATED':
            logger.debug('User updated', { userId: session?.user?.id });
            updateSession(session);
            break;
          default:
            updateSession(session);
        }
      }
    );

    // Get initial session
    getInitialSession();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Function to refresh session manually
  const refreshSession = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Error refreshing session', { error: error.message });
        setState(prev => ({ ...prev, loading: false, error }));
        return { session: null, error };
      }

      setState({
        session,
        user: session?.user ?? null,
        loading: false,
        error: null,
      });

      return { session, error: null };
    } catch (error) {
      logger.error('Error in refreshSession', { error: error instanceof Error ? error.message : String(error) });
      const err = error as Error;
      setState(prev => ({ ...prev, loading: false, error: err }));
      return { session: null, error: err };
    }
  };

  return {
    ...state,
    refreshSession,
    isAuthenticated: !!state.session,
  };
}

/**
 * Hook to check if user is authenticated
 * Simpler version of useSession for components that only need auth status
 */
export function useAuth() {
  const { isAuthenticated, loading, user } = useSession();
  
  return {
    isAuthenticated,
    loading,
    user,
  };
}
