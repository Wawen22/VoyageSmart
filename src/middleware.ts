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

  // Refresh if less than 5 minutes until expiry (reduced from 30 minutes)
  // This reduces unnecessary refresh calls that might trigger rate limits
  const fiveMinutesInMs = 5 * 60 * 1000;
  return timeUntilExpiry < fiveMinutesInMs;
}

export async function middleware(req: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next();

  try {
    const pathname = req.nextUrl.pathname;

    // Skip middleware for static assets and certain API routes to reduce auth calls
    if (pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/webhooks/') ||
        pathname.includes('.')) {
      return res;
    }

    // Create a Supabase client with proper configuration
    const supabase = createMiddlewareClient({
      req,
      res,
    });

    // Always refresh session to ensure we have the latest state
    // This is crucial for proper session persistence
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError);
    }

    // Check if the user is authenticated
    const isAuthenticated = !!session;
    console.log('[Middleware] Path:', pathname, 'Authenticated:', isAuthenticated, 'Session ID:', session?.user?.id?.slice(0, 8) || 'none');

    // Define auth routes
    const isAuthRoute = pathname.startsWith('/login') ||
                       pathname.startsWith('/register') ||
                       pathname.startsWith('/forgot-password');

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

    // Redirect authenticated users from auth routes to dashboard or redirect URL
    // Only redirect if not already in a redirect loop
    if (isAuthRoute && isAuthenticated && !req.nextUrl.searchParams.has('_redirected')) {
      console.log('[Middleware] Authenticated user on auth route. Checking for redirect...');

      // Check if there's a redirect parameter
      const redirectParam = req.nextUrl.searchParams.get('redirect');
      const redirectTo = redirectParam || '/dashboard';

      console.log('[Middleware] Redirecting authenticated user to:', redirectTo);

      // Add a flag to prevent redirect loops
      const redirectUrl = new URL(redirectTo, req.url);
      redirectUrl.searchParams.set('_redirected', 'true');

      return NextResponse.redirect(redirectUrl);
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
