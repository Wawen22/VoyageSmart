import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Import unified client instead of creating another instance
import { createClientSupabase } from './supabase-client';

// Use the unified client configuration
export const supabase = createClientSupabase();

// Debounce utility for authentication requests
let authTimeout: NodeJS.Timeout | null = null;
const AUTH_DEBOUNCE_MS = 1000; // 1 second debounce

function debounceAuth<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number = AUTH_DEBOUNCE_MS
): (...args: T) => Promise<R> {
  return (...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (authTimeout) {
        clearTimeout(authTimeout);
      }

      authTimeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

export type User = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  supabase: typeof supabase;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function signUp(email: string, password: string, fullName: string) {
  try {
    // Sign up the user with Supabase Auth
    // The trigger will automatically create a record in the users table
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      logger.error('Supabase Auth signup error', { error: error.message, email });
      throw error;
    }

    if (!data?.user) {
      throw new Error('User registration failed');
    }

    logger.info('User registered successfully', { userId: data.user.id, email: data.user.email });
    return data.user;
  } catch (error) {
    logger.error('Signup process error', { error: error instanceof Error ? error.message : String(error), email });
    throw error;
  }
}

// Internal sign in function (not debounced)
async function _signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Sign in error', { error: error.message, email });

      // Handle rate limit errors specifically
      if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
      }

      // Handle other authentication errors
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }

      throw error;
    }

    logger.info('Sign in successful', { userId: data.user?.id, email: data.user?.email });
    return data;
  } catch (error: any) {
    logger.error('Sign in process error', { error: error.message, email });
    throw error;
  }
}

// Debounced sign in function to prevent rapid authentication attempts
export const signIn = debounceAuth(_signIn);

export async function signOut() {
  try {
    logger.debug('Executing signOut function');

    // Use 'global' scope to sign out from all sessions
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    if (error) {
      logger.error('Error during signOut', { error: error.message });
      throw error;
    }

    logger.info('SignOut successful');
    return true;
  } catch (err) {
    logger.error('Unexpected error during signOut', { error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }
}

export async function updateProfile(data: Partial<User>) {
  const user = supabase.auth.getUser();

  if (!user) {
    throw new Error('No user logged in');
  }

  const { error } = await supabase.from('users').update(data).eq('id', (await user).data.user?.id);

  if (error) {
    throw error;
  }
}
