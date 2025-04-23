import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { withAuth } from '@/app/api/middleware';

// @ts-ignore - Ignora l'errore di tipo per la versione dell'API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15' as any,
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log('Cancel API - Processing request for user:', user.id);
      const supabase = createRouteHandlerClient({ cookies });
      const body = await request.json();
      const { subscriptionId } = body;

      console.log('Cancel API - Request body:', { subscriptionId });

      if (!subscriptionId) {
        console.error('Cancel API - Missing subscription ID');
        return NextResponse.json(
          { error: 'Missing subscription ID' },
          { status: 400 }
        );
      }

      // Verifica che la sottoscrizione appartenga all'utente
      console.log('Cancel API - Verifying subscription for user:', user.id);
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Cancel API - Error fetching subscription:', subscriptionError);
        return NextResponse.json(
          { error: 'Error fetching subscription', details: subscriptionError.message },
          { status: 500 }
        );
      }

      if (!subscriptionData) {
        console.error('Cancel API - Subscription not found for user:', user.id);
        return NextResponse.json(
          { error: 'Subscription not found or does not belong to user' },
          { status: 404 }
        );
      }

      console.log('Cancel API - Found subscription:', subscriptionData);

      // Cancella la sottoscrizione in Stripe
      try {
        console.log('Cancel API - Updating subscription in Stripe:', subscriptionId);
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        console.log('Cancel API - Subscription updated in Stripe');
      } catch (stripeError: any) {
        console.error('Cancel API - Error updating subscription in Stripe:', stripeError);
        return NextResponse.json(
          { error: 'Error updating subscription in Stripe', details: stripeError.message },
          { status: 500 }
        );
      }

      // Aggiorna lo stato della sottoscrizione nel database
      // Opzione 1: Mantieni l'accesso premium fino alla fine del periodo pagato
      // await supabase
      //   .from('user_subscriptions')
      //   .update({
      //     cancel_at_period_end: true,
      //   })
      //   .eq('user_id', user.id)
      //   .eq('stripe_subscription_id', subscriptionId);

      // Opzione 2: Termina immediatamente l'accesso premium
      // Prima otteniamo il valore di current_period_end
      let currentPeriodEnd;
      try {
        console.log('Cancel API - Retrieving subscription details from Stripe:', subscriptionId);
        const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
        currentPeriodEnd = new Date(subscriptionDetails.current_period_end * 1000).toISOString();
        console.log('Cancel API - Current period end:', currentPeriodEnd);
      } catch (stripeError: any) {
        console.error('Cancel API - Error retrieving subscription details from Stripe:', stripeError);
        // Se non riusciamo a ottenere current_period_end da Stripe, usiamo il valore dal database
        if (subscriptionData.current_period_end) {
          currentPeriodEnd = new Date(subscriptionData.current_period_end).toISOString();
          console.log('Cancel API - Using current_period_end from database:', currentPeriodEnd);
        } else {
          // Se non abbiamo nemmeno quello, usiamo la data corrente + 30 giorni
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          console.log('Cancel API - Using fallback current_period_end (now + 30 days):', currentPeriodEnd);
        }
      }

      console.log('Cancel API - Updating subscription in database');
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          // Manteniamo il tier corrente fino alla fine del periodo pagato
          // tier: 'free',
          cancel_at_period_end: true,
          valid_until: currentPeriodEnd, // Aggiorna valid_until per corrispondere alla fine del periodo corrente
        })
        .eq('user_id', user.id)
        .eq('stripe_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Cancel API - Error updating subscription in database:', updateError);
        return NextResponse.json(
          { error: 'Error updating subscription in database', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('Cancel API - Subscription updated in database');

      // Registra l'evento nella cronologia
      console.log('Cancel API - Recording event in subscription history');
      const { error: historyError } = await supabase.from('subscription_history').insert({
        user_id: user.id,
        event_type: 'subscription_canceled',
        tier: subscriptionData.tier, // Manteniamo il tier corrente
        status: 'active', // Rimane attiva fino alla fine del periodo
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        details: {
          cancel_at_period_end: true,
          current_period_end: currentPeriodEnd,
          will_downgrade_to: 'free'
        },
      });

      if (historyError) {
        console.error('Cancel API - Error recording event in subscription history:', historyError);
        // Non blocchiamo il flusso se fallisce la registrazione nella cronologia
        // Ma logghiamo l'errore
      } else {
        console.log('Cancel API - Event recorded in subscription history');
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Cancel API - Unexpected error:', error);
      return NextResponse.json(
        {
          error: 'Error canceling subscription',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  });
}
