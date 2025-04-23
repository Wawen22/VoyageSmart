import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createCustomerPortalSession } from '@/lib/stripe';
import { supabase as supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // For development, allow both authenticated and unauthenticated requests
    let userId;

    if (sessionError || !session) {
      console.log('No authenticated session, using test user');
      // Use test user for development
      userId = "test-user-id";
    } else {
      console.log('Using authenticated user:', session.user.email);
      userId = session.user.id;
    }

    // Get the request body
    const body = await request.json();
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing returnUrl' },
        { status: 400 }
      );
    }

    // Get the user's Stripe customer ID
    let customerId;

    if (userId === "test-user-id") {
      // For test user, check if we have a customer ID in the request
      const { testCustomerId } = body;
      if (testCustomerId) {
        customerId = testCustomerId;
      } else {
        return NextResponse.json(
          { error: 'For test user, please provide a testCustomerId in the request body' },
          { status: 400 }
        );
      }
    } else {
      // For real users, get the customer ID from the database
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (subscriptionError || !subscriptionData?.stripe_customer_id) {
        return NextResponse.json(
          { error: 'Stripe customer ID not found' },
          { status: 404 }
        );
      }

      customerId = subscriptionData.stripe_customer_id;
    }

    // Create a customer portal session
    const { url } = await createCustomerPortalSession({
      customerId,
      returnUrl,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
