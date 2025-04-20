'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext, User, signIn, signOut, signUp, resetPassword, updateProfile, supabase } from '@/lib/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter(); // Initialize useRouter
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if there's an active session
    const checkSession = async () => {
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Get user profile from the users table
          console.log('Fetching user profile for ID:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile in checkSession:', profileError);
          }

          const finalUser = profile || { id: session.user.id, email: session.user.email };
          setUser(finalUser);
          console.log('AuthProvider checkSession - User state SET:', finalUser); // Added log
        } else {
          setUser(null);
          console.log('AuthProvider checkSession - User state SET to null'); // Added log
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Get user profile from the users table
        console.log('Auth state change - Fetching user profile for ID:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile on auth change:', profileError);
        }

        const finalUser = profile || { id: session.user.id, email: session.user.email };
        setUser(finalUser);
        console.log('AuthProvider onAuthStateChange - User state SET:', finalUser); // Added log
      } else {
        setUser(null);
        console.log('AuthProvider onAuthStateChange - User state SET to null'); // Added log
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      console.log('AuthProvider - Sign in successful:', data);

      // Update the user state immediately
      if (data?.user) {
        console.log('Sign in - Fetching user profile for ID:', data.user.id);

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
              console.log('User profile not found, attempting to create...');
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
                console.error('Error creating user profile:', insertError);
                // Set user state with basic info even if profile creation fails
                setUser({
                  id: data.user.id,
                  email: data.user.email || '',
                });
              } else {
                console.log('User profile created successfully');
                // Set user state with the info used for creation
                setUser({
                  id: data.user.id,
                  email: data.user.email || '',
                  full_name: data.user.user_metadata?.full_name || '',
                });
              }
            } else {
              // Log other types of profile fetch errors
              console.error('Error fetching user profile after sign in (not PGRST116):', profileError);
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
          console.error('Unexpected error during profile handling in signIn:', err);

          // Fallback to basic user info
          setUser({
            id: data.user.id,
            email: data.user.email || '',
          });
        }

        // Explicitly redirect to dashboard after successful login
        console.log('Redirecting to dashboard after successful login');
        router.push('/dashboard');
      }

      // No return needed here, the function updates state internally
    } catch (error) {
      console.error('AuthProvider - Sign in error:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      console.log('AuthProvider - Signing out...');

      // First set user to null to update UI immediately
      setUser(null);

      // Then call the actual signOut function
      await signOut();

      console.log('AuthProvider - Sign out successful, redirecting to login page');

      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();

      // Redirect to login page after sign out
      router.push('/login');
    } catch (error) {
      console.error('AuthProvider - Sign out error:', error);
      setError(error as Error);

      // Even if there's an error, we should still try to redirect
      router.push('/login');
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
        console.error('Error prefetching routes:', error);
      }
    }
  }, [user, loading, router]);

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('AuthProvider RENDERING - Providing context value:', { user, loading });
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
