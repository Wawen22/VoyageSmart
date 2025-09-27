import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';



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

    // Simplified middleware - let the UnifiedSessionManager handle all session logic
    // Just check for basic authentication state from localStorage if available
    let isAuthenticated = false;

    // Only check authentication on server-side for redirect logic
    // The actual session management is handled by UnifiedSessionManager on client-side
    const authCookie = req.cookies.get('sb-ijtfwzxwthunsujobvsk-auth-token');
    isAuthenticated = !!authCookie;

    console.log('[Middleware] Path:', pathname, 'Has auth cookie:', isAuthenticated);

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
