'use client';

import { ReactNode, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext, User, signIn, signOut, signUp, resetPassword, updateProfile } from '@/lib/auth';
import { clearAllCache, clearUserSpecificCache, hardNavigate } from '@/lib/cache-utils';
import { tripCache, userCache } from '@/lib/services/cacheService';
import { clearUserCache as clearTransportationCache } from '@/lib/features/transportationSlice';
import { clearUserCache as clearAccommodationCache } from '@/lib/features/accommodationSlice';
import { clearUserCache as clearItineraryCache } from '@/lib/features/itinerarySlice';
import { createClientSupabase } from '@/lib/supabase-client';

import { UnifiedSessionManager } from '@/lib/unified-session-manager';
import { logger } from '@/lib/logger';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter(); // Initialize useRouter
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use the proper Next.js Supabase client - memoize to prevent recreation
  const supabase = useMemo(() => createClientSupabase(), []);

  // Keep track of current user ID to prevent unnecessary updates
  const currentUserIdRef = useRef<string | null>(null);

  // Stable user update function to prevent unnecessary re-renders
  const updateUser = useCallback((newUser: User | null) => {
    // Only update if the user ID actually changed
    const newUserId = newUser?.id || null;
    if (currentUserIdRef.current !== newUserId) {
      currentUserIdRef.current = newUserId;
      setUser(newUser);
      logger.debug('AuthProvider user state updated', {
        userId: newUserId?.slice(0, 8) || 'null',
        hasProfile: !!newUser
      });
    }
  }, []);



  // Initialize unified session manager
  const sessionManager = useMemo(() => UnifiedSessionManager.getInstance(), []);

  useEffect(() => {
    // Initialize unified session manager and set up session listener
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize the unified session manager
        await sessionManager.initialize();

        // Set up session listener
        const unsubscribe = sessionManager.addSessionListener(async (session) => {
          logger.debug('AuthProvider: Session change received', {
            hasSession: !!session,
            userId: session?.user?.id?.slice(0, 8)
          });

          if (session) {
            // Get user profile from the users table
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const finalUser = profile || {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email
            };

            updateUser(finalUser);
            logger.debug('AuthProvider: User state updated', {
              userId: finalUser.id,
              hasProfile: !!profile
            });
          } else {
            updateUser(null);
            logger.debug('AuthProvider: User state cleared');
          }

          setLoading(false);
        });

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } catch (error) {
        logger.error('AuthProvider: Initialization failed', {
          error: error instanceof Error ? error.message : String(error)
        });
        setError(error as Error);
        updateUser(null);
        setLoading(false);
        return () => {};
      }
    };

    // Start initialization and store cleanup function
    let cleanup: (() => void) | null = null;

    initializeAuth().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [sessionManager]);

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      await signUp(email, password, fullName);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await signIn(email, password);
      logger.info('AuthProvider - Sign in successful', { userId: data?.user?.id });

      // Update the user state immediately
      if (data?.user) {
        logger.debug('Sign in - Fetching user profile', { userId: data.user.id });

        try {
          // First try to get the user profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
             .single();

          // Check if the profile fetch failed
          if (profileError) {
            // Only attempt to create profile if it wasn't found (PGRST116)
            if (profileError.code === 'PGRST116') {
              logger.info('User profile not found, attempting to create', { userId: data.user.id });
              const { error: insertError } = await supabase
                .from('users')
                .insert([
                  {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.user_metadata?.full_name || '',
                    // Ensure created_at is set if your table requires it
                    // created_at: new Date().toISOString(),
                  }
                ]);

              if (insertError) {
                logger.error('Error creating user profile', {
                  error: insertError.message,
                  userId: data.user.id
                });
                // Set user state with basic info even if profile creation fails
                updateUser({
                  id: data.user.id,
                  email: data.user.email || '',
                });
              } else {
                logger.info('User profile created successfully', { userId: data.user.id });
                // Set user state with the info used for creation
                updateUser({
                  id: data.user.id,
                  email: data.user.email || '',
                  full_name: data.user.user_metadata?.full_name || '',
                });
              }
            } else {
              // Log other types of profile fetch errors
              logger.error('Error fetching user profile after sign in (not PGRST116)', {
                error: profileError.message,
                userId: data.user.id
              });
              // Set user state with basic info
              updateUser({
                id: data.user.id,
                email: data.user.email || '',
              });
            }
          } else {
            // Profile fetched successfully
            updateUser(profile);
          }
          /* Original problematic insertion logic removed:
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
          */
        } catch (err) {
          logger.error('Unexpected error during profile handling in signIn', {
            error: err.message,
            userId: data.user.id
          });

          // Fallback to basic user info
          updateUser({
            id: data.user.id,
            email: data.user.email || '',
          });
        }

        // Let the middleware handle the redirect based on the URL parameters
        logger.info('Login successful, letting middleware handle redirect');
      }

      // No return needed here, the function updates state internally
    } catch (error) {
      logger.error('AuthProvider - Sign in error', { error: error.message });
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      logger.info('AuthProvider - Signing out');

      // First set user to null to update UI immediately
      updateUser(null);

      // Clear all cached data BEFORE calling signOut (but preserve auth during transition)
      logger.debug('AuthProvider - Clearing all cached data');
      await clearAllCache(true); // Preserve auth tokens during cache clear

      // Then call the unified session manager signOut
      await sessionManager.signOut();

      logger.info('AuthProvider - Sign out successful, redirecting to login page');

      // Force a hard navigation to clear any remaining state
      hardNavigate('/login');

    } catch (error) {
      logger.error('AuthProvider - Sign out error', { error: error.message });
      setError(error as Error);

      // Even if there's an error, we should still try to redirect with hard refresh
      hardNavigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setLoading(true);
      await resetPassword(email);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      await updateProfile(data);
      if (user) {
        updateUser({ ...user, ...data });
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Prefetch common routes when user is authenticated
  useEffect(() => {
    if (user?.id && !loading) {
      try {
        // Manually prefetch important routes
        router.prefetch('/dashboard');
        router.prefetch('/trips/new');
      } catch (error) {
        logger.error('Error prefetching routes', { error: error.message });
      }
    }
  }, [user?.id, loading, router]); // Only depend on user ID

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('AuthProvider RENDERING - Providing context value', {
      hasUser: !!user,
      loading
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        supabase,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
