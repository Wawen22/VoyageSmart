import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail, sendTripUpdatedEmail, sendNewActivityEmail } from '@/lib/email';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Set to true to disable authentication for testing
const DISABLE_AUTH_FOR_TESTING = true;

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication (unless disabled for testing)
    if (!DISABLE_AUTH_FOR_TESTING) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return NextResponse.json(
          { error: 'Authentication error', details: sessionError.message },
          { status: 401 }
        );
      }

      if (!session) {
        console.error('No session found');
        return NextResponse.json(
          { error: 'Unauthorized - No active session found' },
          { status: 401 }
        );
      }

      console.log('Authenticated user:', session.user.email);
    } else {
      console.log('Authentication disabled for testing');
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
      console.error('Email sending failed:', result.error);

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
