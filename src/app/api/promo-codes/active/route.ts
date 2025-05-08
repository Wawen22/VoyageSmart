import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API per ottenere i codici promozionali attivi dell'utente
 * GET /api/promo-codes/active
 */
export async function GET(request: NextRequest) {
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
    console.log(`Checking active promo codes for user ${userId}`);

    // Ottieni i codici promozionali riscattati dall'utente
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('promo_code_redemptions')
      .select(`
        id,
        redeemed_at,
        promo_codes (
          id,
          code,
          description,
          tier,
          expires_at
        )
      `)
      .eq('user_id', userId)
      .order('redeemed_at', { ascending: false });

    if (redemptionsError) {
      console.error('Error fetching promo code redemptions:', redemptionsError);
      return NextResponse.json(
        { error: 'Error fetching your promo code redemptions', details: redemptionsError.message },
        { status: 500 }
      );
    }

    // Ottieni la sottoscrizione attuale dell'utente per verificare se è attiva tramite promo code
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

    // Verifica se la sottoscrizione è attiva tramite promo code
    // Questo è un controllo semplificato, in un sistema reale potrebbe essere più complesso
    const hasActivePromoSubscription = subscription && 
                                      subscription.status === 'active' && 
                                      !subscription.stripe_subscription_id;

    return NextResponse.json({
      success: true,
      redemptions: redemptions || [],
      hasActivePromoSubscription,
      subscription: subscription || null
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message },
      { status: 500 }
    );
  }
}
