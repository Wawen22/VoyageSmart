import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API per riscattare un codice promozionale
 * POST /api/promo-codes/redeem
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
    console.log(`Redeeming promo code for user ${userId}`);

    // Ottieni i dati dalla richiesta
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    // Verifica se il codice esiste e se è valido
    const { data: promoCode, error: promoCodeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (promoCodeError) {
      console.error('Error fetching promo code:', promoCodeError);
      return NextResponse.json(
        { error: 'Invalid promo code', details: promoCodeError.message },
        { status: 404 }
      );
    }

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      );
    }

    // Verifica se il codice è attivo
    if (promoCode.is_active === false) {
      return NextResponse.json(
        { error: 'This promo code is no longer active' },
        { status: 400 }
      );
    }

    // Verifica se il codice è scaduto
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      );
    }

    // Verifica se il codice ha raggiunto il numero massimo di utilizzi
    if (promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses) {
      return NextResponse.json(
        { error: 'This promo code has reached its maximum number of uses' },
        { status: 400 }
      );
    }

    // Verifica se l'utente ha già utilizzato questo codice
    const { data: existingRedemption, error: redemptionError } = await supabase
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId)
      .single();

    if (redemptionError && redemptionError.code !== 'PGRST116') {
      console.error('Error checking existing redemption:', redemptionError);
      return NextResponse.json(
        { error: 'Error checking if you have already used this code', details: redemptionError.message },
        { status: 500 }
      );
    }

    if (existingRedemption) {
      return NextResponse.json(
        { error: 'You have already used this promo code' },
        { status: 400 }
      );
    }

    // Ottieni la sottoscrizione attuale dell'utente
    const { data: currentSubscription, error: subscriptionError } = await supabase
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

    // Utilizza la data di scadenza del codice promozionale se presente, altrimenti imposta 3 mesi da oggi
    let validUntil: Date;
    if (promoCode.expires_at) {
      // Usa la data di scadenza del codice promozionale
      validUntil = new Date(promoCode.expires_at);
      console.log(`Using promo code expiration date: ${validUntil.toISOString()}`);
    } else {
      // Imposta una data di scadenza predefinita (3 mesi da oggi)
      validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 3);
      console.log(`No expiration date in promo code, using default (3 months): ${validUntil.toISOString()}`);
    }

    // Inizia una transazione per aggiornare tutto in modo atomico
    // Aggiorna la sottoscrizione dell'utente
    let updateResult;
    if (currentSubscription) {
      // Se l'utente ha già una sottoscrizione, aggiornala
      updateResult = await supabase
        .from('user_subscriptions')
        .update({
          tier: promoCode.tier,
          status: 'active',
          valid_until: validUntil.toISOString(),
          updated_at: new Date().toISOString(),
          // Manteniamo gli ID di Stripe se esistono
          stripe_subscription_id: currentSubscription.stripe_subscription_id,
          stripe_customer_id: currentSubscription.stripe_customer_id,
        })
        .eq('user_id', userId)
        .select();
    } else {
      // Se l'utente non ha una sottoscrizione, creane una nuova
      updateResult = await supabase
        .from('user_subscriptions')
        .insert([
          {
            user_id: userId,
            tier: promoCode.tier,
            status: 'active',
            valid_until: validUntil.toISOString(),
          }
        ])
        .select();
    }

    if (updateResult.error) {
      console.error('Error updating subscription:', updateResult.error);
      return NextResponse.json(
        { error: 'Error updating your subscription', details: updateResult.error.message },
        { status: 500 }
      );
    }

    // Registra l'utilizzo del codice
    const { error: redemptionInsertError } = await supabase
      .from('promo_code_redemptions')
      .insert([
        {
          promo_code_id: promoCode.id,
          user_id: userId,
          redeemed_at: new Date().toISOString(),
        }
      ]);

    if (redemptionInsertError) {
      console.error('Error recording redemption:', redemptionInsertError);
      // Non blocchiamo il processo se la registrazione fallisce
      // ma logghiamo l'errore
    }

    // Incrementa il contatore degli utilizzi utilizzando la funzione SQL personalizzata
    const { data: updateCountResult, error: updateCountError } = await supabase
      .rpc('increment_promo_code_usage', {
        p_code: code.trim()
      });

    if (updateCountError) {
      console.error('Error updating usage count:', updateCountError);
      // Non blocchiamo il processo se l'aggiornamento fallisce
      // ma logghiamo l'errore
    } else {
      console.log('Promo code usage count updated successfully:', updateCountResult);
    }

    // Registra l'evento nella cronologia delle sottoscrizioni
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert([
        {
          user_id: userId,
          event_type: 'promo_code_redemption',
          tier: promoCode.tier,
          status: 'active',
          details: {
            promo_code: code,
            promo_code_id: promoCode.id,
            redeemed_at: new Date().toISOString(),
            valid_until: validUntil.toISOString(),
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
      message: `Successfully redeemed promo code for ${promoCode.tier} plan`,
      subscription: updateResult.data[0],
      validUntil: validUntil.toISOString(),
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message },
      { status: 500 }
    );
  }
}
