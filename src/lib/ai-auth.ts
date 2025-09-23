import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export interface AuthResult {
  success: boolean;
  session?: any;
  user?: any;
  error?: string;
  response?: NextResponse;
}

/**
 * Enhanced authentication helper for AI endpoints
 * Handles session validation, token refresh, and subscription checks
 */
export async function authenticateAIRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get cookies with proper await
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // First, try to get the current session
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error('Session error in AI auth:', sessionError);
      
      // Try to refresh the session if there's an error
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          logger.error('Session refresh failed:', refreshError);
          return {
            success: false,
            error: 'Authentication failed',
            response: NextResponse.json(
              { error: 'Authentication failed', details: 'Session expired. Please log in again.' },
              { status: 401 }
            )
          };
        }
        
        session = refreshData.session;
        logger.debug('Session refreshed successfully in AI auth');
      } catch (refreshException) {
        logger.error('Session refresh exception:', refreshException);
        return {
          success: false,
          error: 'Authentication service unavailable',
          response: NextResponse.json(
            { error: 'Authentication service unavailable' },
            { status: 503 }
          )
        };
      }
    }

    if (!session) {
      logger.warn('No active session found for AI request');
      return {
        success: false,
        error: 'No active session',
        response: NextResponse.json(
          { error: 'No active session. Please log in.' },
          { status: 401 }
        )
      };
    }

    // Validate session expiry
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      logger.warn('Session expired, attempting refresh');
      
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          logger.error('Session refresh failed for expired session:', refreshError);
          return {
            success: false,
            error: 'Session expired',
            response: NextResponse.json(
              { error: 'Session expired. Please log in again.' },
              { status: 401 }
            )
          };
        }
        
        session = refreshData.session;
        logger.debug('Expired session refreshed successfully');
      } catch (refreshException) {
        logger.error('Session refresh exception for expired session:', refreshException);
        return {
          success: false,
          error: 'Authentication service unavailable',
          response: NextResponse.json(
            { error: 'Authentication service unavailable' },
            { status: 503 }
          )
        };
      }
    }

    logger.debug('AI authentication successful', { 
      userId: session.user.id,
      expiresAt: session.expires_at 
    });

    return {
      success: true,
      session,
      user: session.user
    };

  } catch (error) {
    logger.error('Unexpected error in AI authentication:', error);
    return {
      success: false,
      error: 'Internal authentication error',
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if user has AI Assistant subscription
 */
export async function checkAISubscription(userId: string, supabase: any): Promise<{
  hasSubscription: boolean;
  error?: string;
  response?: NextResponse;
}> {
  try {
    // Check user subscription for AI features
    const { data: profile, error: profileError } = await supabase
      .from('user_subscriptions')
      .select('subscription_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking AI subscription:', profileError);
      return {
        hasSubscription: false,
        error: 'Unable to verify subscription status',
        response: NextResponse.json(
          { error: 'Unable to verify subscription status' },
          { status: 500 }
        )
      };
    }

    if (!profile || profile.subscription_type !== 'ai_assistant') {
      return {
        hasSubscription: false,
        error: 'AI Assistant subscription required',
        response: NextResponse.json(
          {
            error: 'AI Assistant subscription required',
            details: 'Please upgrade to the AI Assistant plan to use this feature'
          },
          { status: 403 }
        )
      };
    }

    return { hasSubscription: true };

  } catch (error) {
    logger.error('Subscription check exception:', error);
    return {
      hasSubscription: false,
      error: 'Subscription service unavailable',
      response: NextResponse.json(
        { error: 'Subscription service unavailable' },
        { status: 503 }
      )
    };
  }
}

/**
 * Complete authentication and subscription check for AI endpoints
 */
export async function authenticateAndAuthorizeAI(request: NextRequest): Promise<{
  success: boolean;
  session?: any;
  user?: any;
  supabase?: any;
  error?: string;
  response?: NextResponse;
}> {
  // First authenticate
  const authResult = await authenticateAIRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Create supabase client for subscription check
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Check subscription
  const subscriptionResult = await checkAISubscription(authResult.user!.id, supabase);
  
  if (!subscriptionResult.hasSubscription) {
    return {
      success: false,
      error: subscriptionResult.error,
      response: subscriptionResult.response
    };
  }

  return {
    success: true,
    session: authResult.session,
    user: authResult.user,
    supabase
  };
}
