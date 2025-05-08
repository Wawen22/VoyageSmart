import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Debug API - Request received');

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Auth Debug API - Error getting session:', sessionError);
      return NextResponse.json({
        status: 'error',
        message: 'Error getting session',
        error: sessionError.message,
      }, { status: 500 });
    }

    if (!session) {
      console.log('Auth Debug API - No session found');
      return NextResponse.json({
        status: 'unauthenticated',
        message: 'No active session found',
      }, { status: 200 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Auth Debug API - Error getting user data:', userError);
      return NextResponse.json({
        status: 'error',
        message: 'Error getting user data',
        error: userError.message,
        session: {
          userId: session.user.id,
          email: session.user.email,
        }
      }, { status: 200 });
    }

    // Always set isAdmin to true for authenticated users
    const isAdmin = true;

    return NextResponse.json({
      status: 'authenticated',
      message: 'Session found',
      session: {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at,
      },
      user: {
        preferences: userData?.preferences || {},
        isAdmin,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Auth Debug API - Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error.message,
    }, { status: 500 });
  }
}
