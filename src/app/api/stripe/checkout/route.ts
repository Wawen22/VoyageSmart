import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createCheckoutSession, createCustomer, PRICE_IDS, stripe } from '@/lib/stripe';
import { supabase as supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('Checkout API called');
    // Get the authenticated user
    console.log('Getting authenticated user');
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    // For development, allow both authenticated and unauthenticated requests
    let userId, userEmail;

    if (!session) {
      console.log('No authenticated session, using test user');
      // Use test user for development
      userId = "test-user-id";
      userEmail = "test@example.com";
    } else {
      console.log('Using authenticated user:', session.user.email);
      console.log('User ID:', session.user.id);
      userId = session.user.id;
      userEmail = session.user.email;
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { tier, successUrl, cancelUrl } = body;

    if (!tier || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine the price ID based on the tier
    let priceId;
    switch (tier) {
      case 'premium':
        priceId = PRICE_IDS.PREMIUM;
        break;
      case 'ai':
        priceId = PRICE_IDS.AI;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        );
    }

    // Check if the user already has a Stripe customer ID
    let customerId;

    if (userId !== "test-user-id") {
      console.log('Checking if user has a Stripe customer ID');
      // For real users, check the database
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (subscriptionError) {
        console.error('Error checking for existing customer ID:', subscriptionError);
      }

      if (subscriptionData?.stripe_customer_id) {
        customerId = subscriptionData.stripe_customer_id;
        console.log('Found existing customer ID:', customerId);
      } else {
        console.log('No existing customer ID found');
      }
    }

    // If no customer ID found, create a new one
    if (!customerId) {
      console.log('Creating new Stripe customer for:', userEmail);
      try {
        const { customerId: newCustomerId } = await createCustomer({
          email: userEmail,
          metadata: { userId },
        });

        customerId = newCustomerId;
        console.log('Created new customer ID:', customerId);

        // For real users, update the database
        if (userId !== "test-user-id") {
          console.log('Updating user_subscriptions with new customer ID');
          const { error: upsertError } = await supabaseAdmin
            .from('user_subscriptions')
            .upsert([
              {
                user_id: userId,
                stripe_customer_id: customerId,
                tier: 'free',
                status: 'active',
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
              }
            ]);

          if (upsertError) {
            console.error('Error upserting user subscription:', upsertError);
          } else {
            console.log('User subscription upserted successfully');
          }
        }
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
      }
    }

    // Create a checkout session
    console.log('Creating checkout session with:');
    console.log('- Customer ID:', customerId);
    console.log('- Price ID:', priceId);
    console.log('- Success URL:', successUrl);
    console.log('- Cancel URL:', cancelUrl);

    try {
      const { sessionId } = await createCheckoutSession({
        customerId,
        priceId,
        successUrl,
        cancelUrl,
      });

      console.log('Checkout session created with ID:', sessionId);

      // Get the checkout URL directly from Stripe
      console.log('Retrieving checkout session from Stripe');
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      const checkoutUrl = checkoutSession.url;

      console.log('Checkout URL:', checkoutUrl);

      return NextResponse.json({ sessionId, checkoutUrl });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
