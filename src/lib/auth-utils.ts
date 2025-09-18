import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Sign up a new user
 */
export async function signUpUser(email: string, password: string, fullName: string) {
  // Sign up the user with Supabase Auth
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
    logger.error('Sign up error', { error: error.message, email });
    throw error;
  }

  // Profile creation should ideally be handled by a DB trigger
  // or checked/created upon login. Removed manual insertion here.

  return data;
}

/**
 * Sign in a user
 */
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.error('Sign in error', { error: error.message, email });
    throw error;
  }

  // Update last login time
  if (data?.user) {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      if (updateError) {
        logger.error('Error updating last login', { error: updateError.message, userId: data.user.id });
      }
    } catch (err) {
      logger.error('Error in last login update', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    logger.error('Sign out error', { error: error.message });
    throw error;
  }
  
  return true;
}

/**
 * Get the current user session
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    logger.error('Get session error', { error: error.message });
    throw error;
  }
  
  return data.session;
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    logger.error('Get user error', { error: error.message });
    throw error;
  }
  
  return data.user;
}

/**
 * Get user profile from the users table
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    logger.error('Get user profile error', { error: error.message, userId });
    return null;
  }
  
  return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    logger.error('Reset password error', { error: error.message, email });
    throw error;
  }
  
  return true;
}
