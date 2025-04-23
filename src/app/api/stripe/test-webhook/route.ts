import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Funzione di logging avanzata
function logTestEvent(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;

  console.log(logMessage);

  // Salva anche su file per debugging (solo in ambiente di sviluppo)
  if (process.env.NODE_ENV === 'development') {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, 'stripe-test.log');
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

// Inizializza Supabase (senza cookies perché è un webhook)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    logTestEvent('Test webhook received');
    const body = await request.json();
    const { userId, tier = 'premium', customerId = 'cus_test', action = 'update' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    logTestEvent(`Test webhook - Action: ${action} for user ${userId}`, body);

    // Verifica se l'utente esiste
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) {
      logTestEvent(`Error fetching user subscription: ${userError.message}`, userError);
      return NextResponse.json(
        { error: 'Error fetching user subscription', details: userError.message },
        { status: 500 }
      );
    }

    if (!userData && action !== 'create') {
      logTestEvent('User subscription not found');

      // Verifica se l'utente esiste usando una query SQL diretta
      const { data: authUser, error: authError } = await supabase
        .rpc('check_user_exists', { user_id_param: userId });

      if (authError) {
        logTestEvent(`Error checking if user exists: ${authError.message}`, authError);
        return NextResponse.json(
          { error: 'Error checking if user exists', details: authError.message },
          { status: 500 }
        );
      }

      // Se authUser è vuoto o false, l'utente non esiste
      if (!authUser || !authUser[0] || !authUser[0].user_exists) {
        logTestEvent(`User with ID ${userId} does not exist`);
        return NextResponse.json(
          { error: 'User does not exist', details: `User with ID ${userId} does not exist` },
          { status: 404 }
        );
      }

      // Se l'utente esiste, crea una sottoscrizione predefinita
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
          stripe_customer_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        logTestEvent(`Error creating default subscription: ${createError.message}`, createError);
        return NextResponse.json(
          { error: 'Error creating default subscription', details: createError.message },
          { status: 500 }
        );
      }

      logTestEvent(`Created default subscription for user ${userId}`);
    }

    if (action === 'check') {
      // Solo verifica lo stato attuale
      const { data: currentData, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (checkError) {
        logTestEvent(`Error checking user subscription: ${checkError.message}`, checkError);
        return NextResponse.json(
          { error: 'Error checking user subscription', details: checkError.message },
          { status: 500 }
        );
      }

      // Verifica anche la cronologia
      const { data: historyData, error: historyCheckError } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', userId)
        .order('event_timestamp', { ascending: false });

      if (historyCheckError) {
        logTestEvent(`Error checking subscription history: ${historyCheckError.message}`, historyCheckError);
      }

      logTestEvent(`Current subscription state for user ${userId}`, currentData);
      logTestEvent(`Subscription history for user ${userId}`, historyData);

      return NextResponse.json({
        success: true,
        subscription: currentData,
        history: historyData || []
      });
    }

    // Aggiorna la sottoscrizione dell'utente
    const { data: updateData, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tier,
        status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: 'sub_test',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni da ora
        cancel_at_period_end: false,
      })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      logTestEvent(`Error updating user subscription: ${updateError.message}`, updateError);
      return NextResponse.json(
        { error: 'Error updating user subscription', details: updateError.message },
        { status: 500 }
      );
    }

    logTestEvent(`Updated subscription for user ${userId}`, updateData);

    // Verifica che l'aggiornamento sia stato effettivo
    const { data: checkData, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError) {
      logTestEvent(`Error checking updated subscription: ${checkError.message}`, checkError);
    } else {
      logTestEvent(`Current subscription state after update`, checkData);
    }

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_created',
      tier,
      status: 'active',
      stripe_subscription_id: 'sub_test',
      stripe_customer_id: customerId,
      details: { test: true, action },
    });

    if (historyError) {
      logTestEvent(`Error creating subscription history: ${historyError.message}`, historyError);
      return NextResponse.json(
        { error: 'Error creating subscription history', details: historyError.message },
        { status: 500 }
      );
    }

    logTestEvent(`Test webhook - Successfully updated user ${userId} to tier ${tier}`);

    return NextResponse.json({
      success: true,
      subscription: checkData || updateData,
      action
    });
  } catch (error: any) {
    logTestEvent(`Error in test webhook: ${error.message}`, error);
    return NextResponse.json(
      { error: 'Error in test webhook', details: error.message },
      { status: 500 }
    );
  }
}
