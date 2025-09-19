import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail, sendTripUpdatedEmail, sendNewActivityEmail } from '@/lib/email';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        { error: 'Authentication error', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No active session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    let result;

    switch (type) {
      case 'invitation':
        result = await sendInvitationEmail(
          data.to,
          data.inviterName,
          data.tripName,
          data.inviteLink
        );
        break;
      case 'trip_updated':
        result = await sendTripUpdatedEmail(
          data.to,
          data.tripName,
          data.updaterName,
          data.changes,
          data.tripLink
        );
        break;
      case 'new_activity':
        result = await sendNewActivityEmail(
          data.to,
          data.tripName,
          data.activityName,
          data.activityDate,
          data.addedByName,
          data.tripLink
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (!result.success) {
      logger.error('Email sending failed', {
        error: result.error,
        emailType: type,
        recipient: data.to
      });

      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        // In development, return a 200 response with a warning
        return NextResponse.json({
          success: true,
          warning: 'Email sending simulated in development mode',
          mockData: result.data || { id: 'mock-email-id', status: 'simulated' },
          originalError: result.error
        });
      } else {
        // In production, return a proper error
        return NextResponse.json(
          { error: 'Failed to send email', details: result.error },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error in email API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
