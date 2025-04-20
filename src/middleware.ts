import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next();

  try {
    // Create a Supabase client
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session to ensure the latest auth state is used
    await supabase.auth.refreshSession();

    // Get the user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if the user is authenticated
    const isAuthenticated = !!session;
    const pathname = req.nextUrl.pathname;
    console.log('[Middleware] Path:', pathname, 'Authenticated:', isAuthenticated);

    // Define auth routes (login, register, etc.)
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
    '/login',
    '/register',
    '/forgot-password',
  ],
};
