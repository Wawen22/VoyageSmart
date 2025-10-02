import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * POST /api/gdpr/delete-account
 * Delete user account and all associated data (GDPR Right to Erasure)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('GDPR Delete: Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to delete your account.' },
        { status: 401 }
      );
    }

    // Get confirmation from request body
    const body = await request.json();
    const { confirmation, password } = body;

    // Verify confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "DELETE MY ACCOUNT" to confirm.' },
        { status: 400 }
      );
    }

    // Verify password for additional security
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete your account.' },
        { status: 400 }
      );
    }

    // Verify password is correct
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      logger.warn('GDPR Delete: Invalid password attempt', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    logger.info('GDPR Delete: Starting account deletion', { userId: user.id, email: user.email });

    // Note: We need to use the service role key for admin operations
    // The deletion will cascade to all related tables due to foreign key constraints
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      logger.error('GDPR Delete: Failed to delete account', { userId: user.id, error: deleteError });
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 }
      );
    }

    logger.info('GDPR Delete: Account successfully deleted', { userId: user.id });

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });

  } catch (error) {
    logger.error('GDPR Delete: Unexpected error', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

