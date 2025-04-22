import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { Session } from '@supabase/supabase-js';

// Function to determine if we should refresh the session
// Only refresh if the session is close to expiration (within 30 minutes)
function shouldRefreshSession(session: Session): boolean {
  if (!session) return false;

  // Get expiry time from session
  const expiresAt = session.expires_at;
  if (!expiresAt) return true; // If no expiry, refresh to be safe

  // Calculate time until expiry in seconds
  const expiryTime = expiresAt * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeUntilExpiry = expiryTime - currentTime;

  // Refresh if less than 30 minutes until expiry
  const thirtyMinutesInMs = 30 * 60 * 1000;
  return timeUntilExpiry < thirtyMinutesInMs;
}

export async function middleware(req: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next();

  try {
    // Create a Supabase client
    const supabase = createMiddlewareClient({ req, res });

    // Get the user's session without refreshing it every time
    // Only refresh if the session is close to expiration or for specific routes
    let sessionResult = await supabase.auth.getSession();
    let session = sessionResult.data.session;

    // Check if we need to refresh the session
    // Only refresh for auth-related routes or if session exists but might be stale
    const pathname = req.nextUrl.pathname;
    const isAuthRoute = pathname.startsWith('/login') ||
                       pathname.startsWith('/register') ||
                       pathname.startsWith('/forgot-password');

    if (isAuthRoute || (session && shouldRefreshSession(session))) {
      await supabase.auth.refreshSession();
      // Get the refreshed session
      const refreshResult = await supabase.auth.getSession();
      session = refreshResult.data.session;
    }

    // Check if the user is authenticated
    const isAuthenticated = !!session;
    console.log('[Middleware] Path:', pathname, 'Authenticated:', isAuthenticated);

    // --- Temporarily disabling protected route logic ---
    /*
    const isProtectedRoute = pathname.startsWith('/dashboard') ||
                            pathname.startsWith('/trips') ||
                            pathname.startsWith('/profile');

    // Redirect unauthenticated users from protected routes to login
    if (isProtectedRoute && !isAuthenticated) {
      console.log('[Middleware] Unauthenticated on protected route. Redirecting to /login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    */
    // --- End of disabled logic ---

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && isAuthenticated) {
      console.log('[Middleware] Authenticated user on auth route. Redirecting to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    console.log('[Middleware] Allowing request to proceed.');

  } catch (error) {
    console.error('[Middleware] Error:', error);
    // In case of error, allow the request to continue
    // This prevents authentication errors from blocking the application
    return res;
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trips/:path*',
    '/profile/:path*',
    '/pricing',
    '/login',
    '/register',
    '/forgot-password',
  ],
};
