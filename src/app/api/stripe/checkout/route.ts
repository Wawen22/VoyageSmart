import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/app/api/middleware';

// Force dynamic rendering - do not pre-render this route during build
export const dynamic = 'force-dynamic';

// @ts-ignore - Ignora l'errore di tipo per la versione dell'API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15' as any,
});

export async function POST(request: NextRequest) {
  try {
    // Estrai il token dall'header di autorizzazione
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Checkout API - No authorization header found');
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header found' },
        { status: 401 }
      );
    }

    // Estrai il token
    const token = authHeader.split(' ')[1];

    // Verifica il token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Checkout API - Invalid token:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('Checkout API - Processing request for user:', user.id);
    const body = await request.json();
    const { priceId, successUrl, cancelUrl } = body;

    console.log('Checkout API - Request body:', { priceId, successUrl, cancelUrl });

    if (!priceId || !successUrl || !cancelUrl) {
      console.error('Checkout API - Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

      // Crea un nuovo customer per ogni sessione di checkout
      try {
        console.log('Checkout API - Creating new Stripe customer for user:', user.id);
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabaseUserId: user.id,
          },
        });

        const customerId = customer.id;
        console.log('Checkout API - Created new customer ID:', customerId);

        // Crea la sessione di checkout
        try {
          console.log('Checkout API - Creating checkout session with customer ID:', customerId);
          const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
              userId: user.id,
            },
          });

          console.log('Checkout API - Checkout session created successfully:', checkoutSession.id);
          return NextResponse.json({ url: checkoutSession.url });
        } catch (stripeError: any) {
          console.error('Checkout API - Error creating checkout session:', stripeError);
          return NextResponse.json(
            { error: 'Error creating checkout session', details: stripeError.message },
            { status: 500 }
          );
        }
      } catch (customerError: any) {
        console.error('Checkout API - Error creating Stripe customer:', customerError);
        return NextResponse.json(
          { error: 'Error creating Stripe customer', details: customerError.message },
          { status: 500 }
        );
      }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session', details: error.message },
      { status: 500 }
    );
  }
}
