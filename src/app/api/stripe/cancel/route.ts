import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { withAuth } from '@/app/api/middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const body = await request.json();
      const { subscriptionId } = body;

      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Missing subscription ID' },
          { status: 400 }
        );
      }

      // Verifica che la sottoscrizione appartenga all'utente
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subscriptionError || !subscriptionData) {
        return NextResponse.json(
          { error: 'Subscription not found or does not belong to user' },
          { status: 404 }
        );
      }

      // Cancella la sottoscrizione in Stripe
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Aggiorna lo stato della sottoscrizione nel database
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
        })
        .eq('user_id', user.id)
        .eq('stripe_subscription_id', subscriptionId);

      // Registra l'evento nella cronologia
      await supabase.from('subscription_history').insert({
        user_id: user.id,
        event_type: 'subscription_canceled',
        tier: subscriptionData.tier,
        status: 'active', // Rimane attiva fino alla fine del periodo
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        details: { cancel_at_period_end: true },
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return NextResponse.json(
        { error: 'Error canceling subscription', details: error.message },
        { status: 500 }
      );
    }
  });
}
