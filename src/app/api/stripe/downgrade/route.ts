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
      console.log('Downgrade API - Processing request for user:', user.id);
      const supabase = createRouteHandlerClient({ cookies });

      // Trova la sottoscrizione corrente dell'utente
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subscriptionError) {
        console.error('Downgrade API - Error fetching subscription:', subscriptionError);
        return NextResponse.json(
          { error: 'Error fetching subscription', details: subscriptionError.message },
          { status: 500 }
        );
      }

      if (!subscriptionData) {
        console.error('Downgrade API - No subscription found for user:', user.id);
        return NextResponse.json(
          { error: 'No subscription found' },
          { status: 404 }
        );
      }

      console.log('Downgrade API - Found subscription:', subscriptionData);

      // Se l'utente è già sul piano free, non fare nulla
      if (subscriptionData.tier === 'free') {
        console.log('Downgrade API - User is already on free tier');
        return NextResponse.json({ 
          success: true, 
          message: 'User is already on free tier',
          subscription: subscriptionData 
        });
      }

      // Se c'è una sottoscrizione Stripe attiva, cancellarla
      let stripeUpdateSuccessful = false;
      if (subscriptionData.stripe_subscription_id) {
        try {
          console.log('Downgrade API - Canceling Stripe subscription:', subscriptionData.stripe_subscription_id);

          // Cancella immediatamente la sottoscrizione in Stripe
          await stripe.subscriptions.cancel(subscriptionData.stripe_subscription_id);
          console.log('Downgrade API - Stripe subscription canceled');
          stripeUpdateSuccessful = true;
        } catch (stripeError: any) {
          console.error('Downgrade API - Error canceling Stripe subscription:', stripeError);

          // Se la subscription non esiste in Stripe (es. subscription di test), continua comunque
          if (stripeError.code === 'resource_missing' || stripeError.type === 'StripeInvalidRequestError') {
            console.log('Downgrade API - Subscription not found in Stripe (possibly test data), continuing with database update');
          } else {
            console.log('Downgrade API - Continuing with database update despite Stripe error');
          }
        }
      }

      // Aggiorna la sottoscrizione nel database al piano free
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'free',
          status: 'active',
          stripe_subscription_id: null,
          stripe_customer_id: subscriptionData.stripe_customer_id, // Manteniamo il customer ID
          cancel_at_period_end: false,
          current_period_end: null,
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
          updated_at: now,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Downgrade API - Error updating subscription in database:', updateError);
        return NextResponse.json(
          { error: 'Error updating subscription', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('Downgrade API - Subscription updated to free tier');

      // Registra l'evento nella cronologia
      const { error: historyError } = await supabase.from('subscription_history').insert({
        user_id: user.id,
        event_type: 'subscription_downgraded',
        tier: 'free',
        status: 'active',
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        event_timestamp: now,
        details: {
          previous_tier: subscriptionData.tier,
          downgraded_at: now,
          reason: 'user_requested_downgrade',
          stripe_updated: stripeUpdateSuccessful
        },
      });

      if (historyError) {
        console.error('Downgrade API - Error recording event in subscription history:', historyError);
        // Non blocchiamo il processo se fallisce la registrazione nella cronologia
      } else {
        console.log('Downgrade API - Event recorded in subscription history');
      }

      // Recupera la sottoscrizione aggiornata per restituirla
      const { data: updatedSubscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Downgrade API - Error fetching updated subscription:', fetchError);
        // Restituiamo comunque successo anche se non riusciamo a recuperare i dati aggiornati
      }

      const message = stripeUpdateSuccessful
        ? 'Subscription downgraded to free tier successfully'
        : 'Subscription downgraded to free tier in our system. Note: This appears to be test data, so no changes were made in Stripe.';

      return NextResponse.json({
        success: true,
        message,
        stripeUpdated: stripeUpdateSuccessful,
        subscription: updatedSubscription || { tier: 'free', status: 'active' }
      });

    } catch (error: any) {
      console.error('Downgrade API - Unexpected error:', error);
      return NextResponse.json(
        {
          error: 'Error downgrading subscription',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  });
}
