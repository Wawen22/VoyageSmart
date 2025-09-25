'use client';

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext, User, signIn, signOut, signUp, resetPassword, updateProfile } from '@/lib/auth';
import { clearAllCache, clearUserSpecificCache, hardNavigate } from '@/lib/cache-utils';
import { tripCache, userCache } from '@/lib/services/cacheService';
import { clearUserCache as clearTransportationCache } from '@/lib/features/transportationSlice';
import { clearUserCache as clearAccommodationCache } from '@/lib/features/accommodationSlice';
import { clearUserCache as clearItineraryCache } from '@/lib/features/itinerarySlice';
import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter(); // Initialize useRouter
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use the proper Next.js Supabase client - memoize to prevent recreation
  const supabase = useMemo(() => createClientSupabase(), []);

  useEffect(() => {
    // Check if there's an active session
    const checkSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current session with proper error handling
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Session error in checkSession', { error: sessionError.message });
          setUser(null);
          setError(sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Get user profile from the users table with retry logic
          logger.debug('Fetching user profile', { userId: session.user.id });

          let profile = null;
          let profileError = null;

          // Retry profile fetch up to 2 times (reduced from 3 to minimize rate limiting)
          for (let attempt = 1; attempt <= 2; attempt++) {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!error) {
              profile = data;
              break;
            }

            profileError = error;
            logger.warn('Profile fetch attempt failed', {
              attempt,
              error: error.message,
              userId: session.user.id
            });

            if (attempt < 2) {
              // Wait before retry (increased delay to reduce rate limiting)
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }

          if (profileError) {
            logger.error('Error fetching user profile after retries', {
              error: profileError.message,
              userId: session.user.id
            });
          }

          const finalUser = profile || {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email
          };

          setUser(finalUser);
          logger.debug('AuthProvider checkSession - User state SET', {
            userId: finalUser.id,
            hasProfile: !!profile
          });
        } else {
          setUser(null);
          logger.debug('AuthProvider checkSession - User state SET to null');
        }
      } catch (error) {
        logger.error('Error checking session', { error: error.message });
        setError(error as Error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state change event', { event, hasSession: !!session });

      try {
        if (session?.user) {
          // Clear user-specific cache when switching to a different user
          const currentUserId = user?.id;
          const newUserId = session.user.id;

          if (currentUserId && currentUserId !== newUserId) {
            logger.debug('User changed, clearing user-specific cache', {
              oldUserId: currentUserId,
              newUserId
            });
            clearUserSpecificCache(currentUserId);
            tripCache.clearUserCache(currentUserId);
            userCache.clearUserCache(currentUserId);
            // Clear Redux caches
            clearTransportationCache(currentUserId);
            clearAccommodationCache(currentUserId);
            clearItineraryCache(currentUserId);
          }
          // Get user profile from the users table with retry logic
          logger.debug('Auth state change - Fetching user profile', { userId: session.user.id });

          let profile = null;
          let profileError = null;

          // Retry profile fetch up to 2 times for auth state changes
          for (let attempt = 1; attempt <= 2; attempt++) {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!error) {
              profile = data;
              break;
            }

            profileError = error;
            logger.warn('Auth change profile fetch attempt failed', {
              attempt,
              error: error.message,
              userId: session.user.id
            });

            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          if (profileError) {
            logger.error('Error fetching user profile on auth change', {
              error: profileError.message,
              userId: session.user.id
            });
          }

          const finalUser = profile || {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email
          };

          setUser(finalUser);
          logger.debug('AuthProvider onAuthStateChange - User state SET', {
            userId: finalUser.id,
            hasProfile: !!profile
          });
        } else {
          // Clear user-specific cache when signing out
          if (user?.id) {
            logger.debug('User signing out, clearing user-specific cache', { userId: user.id });
            clearUserSpecificCache(user.id);
            tripCache.clearUserCache(user.id);
            userCache.clearUserCache(user.id);
            // Clear Redux caches
            clearTransportationCache(user.id);
            clearAccommodationCache(user.id);
            clearItineraryCache(user.id);
          }
          setUser(null);
          logger.debug('AuthProvider onAuthStateChange - User state SET to null');
        }
      } catch (error) {
        logger.error('Error in auth state change handler', { error: error.message });
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
                setUser({
                  id: data.user.id,
                  email: data.user.email || '',
                });
              } else {
                logger.info('User profile created successfully', { userId: data.user.id });
                // Set user state with the info used for creation
                setUser({
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
              setUser({
                id: data.user.id,
                email: data.user.email || '',
              });
            }
          } else {
            // Profile fetched successfully
            setUser(profile);
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
          setUser({
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
      setUser(null);

      // Clear all cached data BEFORE calling signOut
      logger.debug('AuthProvider - Clearing all cached data');
      await clearAllCache();

      // Then call the actual signOut function
      await signOut();

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
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Prefetch common routes when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      try {
        // Manually prefetch important routes
        router.prefetch('/dashboard');
        router.prefetch('/trips/new');
      } catch (error) {
        logger.error('Error prefetching routes', { error: error.message });
      }
    }
  }, [user, loading, router]);

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
