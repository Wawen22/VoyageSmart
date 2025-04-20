import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      console.error('Supabase Auth signup error:', error);
      throw error;
    }

    if (!data?.user) {
      throw new Error('User registration failed');
    }

    console.log('User registered successfully:', data.user);
    return data.user;
  } catch (error) {
    console.error('Signup process error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }

  console.log('Sign in successful:', data);
  return data;
}

export async function signOut() {
  try {
    console.log('auth.ts - Executing signOut function');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('auth.ts - Error during signOut:', error);
      throw error;
    }

    console.log('auth.ts - SignOut successful');
    return true;
  } catch (err) {
    console.error('auth.ts - Unexpected error during signOut:', err);
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
