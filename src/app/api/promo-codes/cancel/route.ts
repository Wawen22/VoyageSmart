import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - do not pre-render this route during build
export const dynamic = 'force-dynamic';

/**
 * API per cancellare un codice promozionale attivo
 * POST /api/promo-codes/cancel
 */
export async function POST(request: NextRequest) {
  try {
    // Inizializza Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Ottieni l'utente dalla sessione
    // Estrai il token di autenticazione dall'header della richiesta
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid authentication token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verifica il token e ottieni l'utente
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated', details: authError?.message },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log(`Canceling promo code for user ${userId}`);

    // Ottieni i dati dalla richiesta
    const body = await request.json();
    const { promoCodeId } = body;

    if (!promoCodeId) {
      return NextResponse.json(
        { error: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    // Verifica se l'utente ha una sottoscrizione attiva
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching current subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Error fetching your current subscription', details: subscriptionError.message },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Verifica se la sottoscrizione Ã¨ attiva tramite promo code
    const isPromoSubscription = subscription.status === 'active' && !subscription.stripe_subscription_id;

    if (!isPromoSubscription) {
      return NextResponse.json(
        { error: 'Your subscription is not activated through a promo code' },
        { status: 400 }
      );
    }

    // Verifica se il codice promozionale esiste e appartiene all'utente
    const { data: redemption, error: redemptionError } = await supabase
      .from('promo_code_redemptions')
      .select('*')
      .eq('promo_code_id', promoCodeId)
      .eq('user_id', userId)
      .single();

    if (redemptionError) {
      console.error('Error fetching promo code redemption:', redemptionError);
      return NextResponse.json(
        { error: 'Error fetching your promo code redemption', details: redemptionError.message },
        { status: 500 }
      );
    }

    if (!redemption) {
      return NextResponse.json(
        { error: 'Promo code not found or not associated with your account' },
        { status: 404 }
      );
    }

    // Aggiorna la sottoscrizione dell'utente a 'free'
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'free',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Error updating your subscription', details: updateError.message },
        { status: 500 }
      );
    }

    // Registra l'evento nella cronologia delle sottoscrizioni
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert([
        {
          user_id: userId,
          event_type: 'promo_code_canceled',
          tier: 'free',
          status: 'active',
          details: {
            promo_code_id: promoCodeId,
            canceled_at: new Date().toISOString(),
          },
        }
      ]);

    if (historyError) {
      console.error('Error recording subscription history:', historyError);
      // Non blocchiamo il processo se la registrazione fallisce
      // ma logghiamo l'errore
    }

    return NextResponse.json({
      success: true,
      message: 'Promo code subscription canceled successfully',
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message },
      { status: 500 }
    );
  }
}
