import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Optimal auth configuration for session persistence
const AUTH_CONFIG = {
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false, // Disable to prevent URL conflicts
  flowType: 'pkce' as const,
  // Add debug logging for auth events in development
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Client-side Supabase client with enhanced session management
 * Use this in client components and browser-side code
 */
export const createClientSupabase = () => {
  // Don't use singleton to prevent session caching issues between users
  // Each call creates a fresh client that reads current session from localStorage
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: AUTH_CONFIG
  });

  // Add auth event logging in development
  if (process.env.NODE_ENV === 'development') {
    client.auth.onAuthStateChange((event, session) => {
      logger.debug('Supabase auth state change', {
        event,
        hasSession: !!session,
        userId: session?.user?.id?.slice(0, 8),
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      });
    });
  }

  return client;
};

/**
 * Server-side Supabase client for server components and API routes
 * Use this in server components and API routes
 * Note: This should only be used in server-side code
 */
export const createServerSupabase = async () => {
  // Dynamic import to avoid issues with client-side rendering
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
  const { cookies } = await import('next/headers');

  return createServerComponentClient({
    cookies,
  });
};

/**
 * Service role client for admin operations
 * Only use this on the server side for admin operations
 */
export const createServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Legacy client for backward compatibility
 * Gradually migrate to use the specific clients above
 * @deprecated Use createClientSupabase() instead
 */
let legacySupabaseInstance: ReturnType<typeof createClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!legacySupabaseInstance) {
      legacySupabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: AUTH_CONFIG
      });
    }
    return legacySupabaseInstance[prop as keyof ReturnType<typeof createClient>];
  }
});

// Export the client creation functions as default
export default {
  client: createClientSupabase,
  server: createServerSupabase,
  service: createServiceSupabase,
  legacy: supabase
};
