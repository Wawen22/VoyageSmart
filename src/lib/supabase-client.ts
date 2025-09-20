import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client-side Supabase client with proper session management
 * Use this in client components and browser-side code
 */
export const createClientSupabase = () => {
  // Create a singleton instance to prevent multiple clients
  if (typeof window !== 'undefined' && (window as any).__supabaseClient) {
    return (window as any).__supabaseClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disable to prevent URL conflicts
      flowType: 'pkce'
    }
  });

  // Store as singleton
  if (typeof window !== 'undefined') {
    (window as any).__supabaseClient = client;
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
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Export the client creation functions as default
export default {
  client: createClientSupabase,
  server: createServerSupabase,
  service: createServiceSupabase,
  legacy: supabase
};
