import { supabase } from './supabase';

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
    console.error('Sign up error:', error);
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
    console.error('Sign in error:', error);
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
        console.error('Error updating last login:', updateError);
      }
    } catch (err) {
      console.error('Error in last login update:', err);
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
    console.error('Sign out error:', error);
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
    console.error('Get session error:', error);
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
    console.error('Get user error:', error);
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
    console.error('Get user profile error:', error);
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
    console.error('Reset password error:', error);
    throw error;
  }
  
  return true;
}
