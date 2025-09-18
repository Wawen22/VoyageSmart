import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

// Funzione di logging avanzata
function logWebhookEvent(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;

  // Use proper logger service instead of console.log
  logger.info(`[STRIPE_WEBHOOK] ${message}`, data);

  // Salva anche su file per debugging (solo in ambiente di sviluppo)
  if (process.env.NODE_ENV === 'development') {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, 'stripe-webhook.log');
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      logger.error('Error writing to log file', { error: error.message });
    }
  }
}

// Inizializza Stripe
// @ts-ignore - Ignora l'errore di tipo per la versione dell'API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// Inizializza Supabase (senza cookies perché è un webhook)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  logWebhookEvent('Stripe webhook received');
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  logWebhookEvent('Webhook headers', Object.fromEntries(request.headers.entries()));
  logWebhookEvent('Webhook signature', signature ? 'Present' : 'Not present');

  let event: Stripe.Event;

  try {
    // Verifica la firma del webhook
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      logWebhookEvent('Using webhook secret for verification');
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // In ambiente di sviluppo, possiamo saltare la verifica della firma
      logWebhookEvent('Webhook secret not found, parsing body directly');
      event = JSON.parse(body) as Stripe.Event;
      logWebhookEvent('Webhook signature verification bypassed in development');
    }

    logWebhookEvent(`Webhook event type: ${event.type}`);
  } catch (error: any) {
    logWebhookEvent(`Webhook signature verification failed: ${error.message}`, error);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    );
  }

  // Gestisci gli eventi di Stripe
  try {
    logWebhookEvent(`Processing event type: ${event.type}`);
    logWebhookEvent(`Event data:`, event.data.object);

    switch (event.type) {
      case 'checkout.session.completed': {
        logWebhookEvent('Handling checkout.session.completed event');
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'customer.subscription.created': {
        logWebhookEvent('Handling customer.subscription.created event');
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }
      case 'customer.subscription.updated': {
        logWebhookEvent('Handling customer.subscription.updated event');
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        logWebhookEvent('Handling customer.subscription.deleted event');
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        logWebhookEvent('Handling invoice.payment_succeeded event');
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        logWebhookEvent('Handling invoice.payment_failed event');
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        logWebhookEvent(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, success: true });
  } catch (error: any) {
    logWebhookEvent(`Error handling webhook: ${error.message}`, error);
    return NextResponse.json(
      { error: `Error handling webhook: ${error.message}` },
      { status: 500 }
    );
  }
}

// Funzioni per gestire gli eventi di Stripe

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logWebhookEvent('Processing checkout.session.completed', session);

  // Ottieni l'ID utente dai metadati della sessione
  const userId = session.metadata?.userId;

  if (!userId) {
    logWebhookEvent('No userId found in session metadata');
    return;
  }

  logWebhookEvent(`Found userId in session metadata: ${userId}`);

  try {
    // Verifica se l'utente esiste
    const { data: userExists, error: userExistsError } = await supabase
      .rpc('check_user_exists', { user_id_param: userId });

    if (userExistsError) {
      logWebhookEvent(`Error checking if user exists: ${userExistsError.message}`, userExistsError);
      return;
    }

    if (!userExists || !userExists[0] || !userExists[0].user_exists) {
      logWebhookEvent(`User with ID ${userId} does not exist in auth.users`);
      return;
    }

    // Verifica se l'utente esiste nella tabella user_subscriptions
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) {
      logWebhookEvent(`Error checking user subscription: ${userError.message}`, userError);
      return;
    }

    if (!userData) {
      logWebhookEvent(`User subscription not found for user ${userId}, creating default subscription`);

      // Crea una sottoscrizione predefinita per l'utente
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
          stripe_customer_id: session.customer as string,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        logWebhookEvent(`Error creating default subscription: ${createError.message}`, createError);
        return;
      }

      logWebhookEvent(`Default subscription created for user ${userId}`);
    } else {
      logWebhookEvent(`Found existing subscription for user ${userId}`, userData);
    }

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'checkout_completed',
      stripe_customer_id: session.customer as string,
      details: session,
    });

    if (historyError) {
      logWebhookEvent(`Error inserting checkout history: ${historyError.message}`, historyError);
      return;
    }

    logWebhookEvent(`Checkout session history recorded for user ${userId}`);

    // Se la sessione ha una sottoscrizione, aggiorna immediatamente l'utente
    if (session.subscription) {
      logWebhookEvent(`Session has subscription ID: ${session.subscription}`);

      // Ottieni i dettagli della sottoscrizione da Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      logWebhookEvent(`Retrieved subscription details from Stripe`, subscription);

      // Determina il tier in base al prezzo
      const priceId = subscription.items.data[0].price.id;
      let tier = 'free';

      if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
        tier = 'premium';
      } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_AI_PRICE_ID) {
        tier = 'ai';
      }

      logWebhookEvent(`Determined tier from price ID ${priceId}: ${tier}`);

      // Aggiorna la sottoscrizione dell'utente
      const { data: updateData, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          tier,
          status: subscription.status,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          // @ts-ignore - Ignora l'errore di tipo per current_period_end
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        logWebhookEvent(`Error updating user subscription: ${updateError.message}`, updateError);
        return;
      }

      logWebhookEvent(`User subscription updated for user ${userId} to tier ${tier}`, updateData);

      // Verifica che l'aggiornamento sia stato effettivo
      const { data: checkData, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (checkError) {
        logWebhookEvent(`Error checking updated subscription: ${checkError.message}`, checkError);
      } else {
        logWebhookEvent(`Current subscription state after update`, checkData);
      }
    } else {
      logWebhookEvent('Session does not have a subscription ID, waiting for subscription event');
    }
  } catch (error: any) {
    logWebhookEvent(`Error in handleCheckoutSessionCompleted: ${error.message}`, error);
  }

  logWebhookEvent(`Checkout session completed for user ${userId}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logWebhookEvent('Processing customer.subscription.created', subscription);

  try {
    // Ottieni il customer ID dalla sottoscrizione
    const customerId = subscription.customer as string;
    logWebhookEvent(`Customer ID: ${customerId}`);

    // Trova l'utente associato a questo customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      logWebhookEvent(`Error finding user for customer ${customerId}: ${userError.message}`, userError);

      // Prova a cercare nei metadati del customer
      const customer = await stripe.customers.retrieve(customerId);
      logWebhookEvent(`Retrieved customer from Stripe`, customer);

      // @ts-ignore - Ignora l'errore di tipo per customer.metadata
      if (customer && !('deleted' in customer) && customer.metadata && customer.metadata.supabaseUserId) {
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        logWebhookEvent(`Found user ID in customer metadata: ${customer.metadata.supabaseUserId}`);
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        const userId = customer.metadata.supabaseUserId;

        // Verifica se l'utente esiste nella tabella user_subscriptions
        const { data: existingUser, error: existingError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingError) {
          logWebhookEvent(`Error checking if user exists: ${existingError.message}`, existingError);
          return;
        }

        if (!existingUser) {
          logWebhookEvent(`User subscription not found for user ${userId}, creating default subscription`);

          // Crea una sottoscrizione predefinita per l'utente
          const { error: createError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              tier: 'free',
              status: 'active',
              valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
              stripe_customer_id: customerId,
            });

          if (createError) {
            logWebhookEvent(`Error creating default subscription: ${createError.message}`, createError);
            return;
          }

          logWebhookEvent(`Default subscription created for user ${userId}`);
        } else {
          // Aggiorna il customer ID nella tabella user_subscriptions
          const { data: updateData, error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', userId)
            .select();

          if (updateError) {
            logWebhookEvent(`Error updating customer ID for user ${userId}: ${updateError.message}`, updateError);
            return;
          }

          logWebhookEvent(`Updated customer ID for user ${userId}`, updateData);
        }

        // Continua con l'aggiornamento della sottoscrizione
        await updateSubscription(userId, customerId, subscription);
        return;
      }

      logWebhookEvent(`No user found for customer ${customerId}`);
      return;
    }

    if (!userData) {
      logWebhookEvent(`No user data found for customer ${customerId}`);
      return;
    }

    const userId = userData.user_id;
    logWebhookEvent(`Found user ID: ${userId}`);

    await updateSubscription(userId, customerId, subscription);
  } catch (error: any) {
    logWebhookEvent(`Error in handleSubscriptionCreated: ${error.message}`, error);
  }
}

async function updateSubscription(userId: string, customerId: string, subscription: Stripe.Subscription) {
  try {
    logWebhookEvent(`Updating subscription for user ${userId}`, { userId, customerId, subscriptionId: subscription.id });

    // Verifica se l'utente esiste
    const { data: userExists, error: userExistsError } = await supabase
      .rpc('check_user_exists', { user_id_param: userId });

    if (userExistsError) {
      logWebhookEvent(`Error checking if user exists: ${userExistsError.message}`, userExistsError);
      return;
    }

    if (!userExists || !userExists[0] || !userExists[0].user_exists) {
      logWebhookEvent(`User with ID ${userId} does not exist in auth.users`);
      return;
    }

    // Verifica se l'utente esiste nella tabella user_subscriptions
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) {
      logWebhookEvent(`Error checking user subscription: ${userError.message}`, userError);
      return;
    }

    if (!userData) {
      logWebhookEvent(`User subscription not found for user ${userId}, creating default subscription`);

      // Crea una sottoscrizione predefinita per l'utente
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
          stripe_customer_id: customerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        logWebhookEvent(`Error creating default subscription: ${createError.message}`, createError);
        return;
      }

      logWebhookEvent(`Default subscription created for user ${userId}`);
    } else {
      logWebhookEvent(`Found existing subscription for user ${userId}`, userData);
    }

    // Determina il tier in base al prezzo
    const priceId = subscription.items.data[0].price.id;
    let tier = 'free';

    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
      tier = 'premium';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_AI_PRICE_ID) {
      tier = 'ai';
    }

    logWebhookEvent(`Determined tier from price ID ${priceId}: ${tier}`);

    // Aggiorna la sottoscrizione dell'utente
    const { data: updateData, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tier,
        status: subscription.status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        // @ts-ignore - Ignora l'errore di tipo per current_period_end
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      logWebhookEvent(`Error updating subscription for user ${userId}: ${updateError.message}`, updateError);
      return;
    }

    logWebhookEvent(`Subscription updated for user ${userId}`, updateData);

    // Verifica che l'aggiornamento sia stato effettivo
    const { data: checkData, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError) {
      logWebhookEvent(`Error checking updated subscription: ${checkError.message}`, checkError);
    } else {
      logWebhookEvent(`Current subscription state after update`, checkData);
    }

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_created',
      tier,
      status: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      details: subscription,
    });

    if (historyError) {
      logWebhookEvent(`Error creating subscription history for user ${userId}: ${historyError.message}`, historyError);
      return;
    }

    logWebhookEvent(`Subscription history created for user ${userId}`);
    logWebhookEvent(`Subscription created for user ${userId}, tier: ${tier}`);
  } catch (error: any) {
    logWebhookEvent(`Error in updateSubscription: ${error.message}`, error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logWebhookEvent('Processing customer.subscription.updated', subscription);

  try {
    // Ottieni il customer ID dalla sottoscrizione
    const customerId = subscription.customer as string;
    logWebhookEvent(`Customer ID: ${customerId}`);

    // Trova l'utente associato a questo customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      logWebhookEvent(`Error finding user for customer ${customerId}: ${userError.message}`, userError);

      // Prova a cercare nei metadati del customer
      const customer = await stripe.customers.retrieve(customerId);
      logWebhookEvent(`Retrieved customer from Stripe`, customer);

      // @ts-ignore - Ignora l'errore di tipo per customer.metadata
      if (customer && !('deleted' in customer) && customer.metadata && customer.metadata.supabaseUserId) {
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        logWebhookEvent(`Found user ID in customer metadata: ${customer.metadata.supabaseUserId}`);
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        const userId = customer.metadata.supabaseUserId;

        // Aggiorna il customer ID nella tabella user_subscriptions
        const { data: updateData, error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId)
          .select();

        if (updateError) {
          logWebhookEvent(`Error updating customer ID for user ${userId}: ${updateError.message}`, updateError);
          return;
        }

        logWebhookEvent(`Updated customer ID for user ${userId}`, updateData);

        // Continua con l'aggiornamento della sottoscrizione
        await updateSubscription(userId, customerId, subscription);
        return;
      }

      return;
    }

    if (!userData) {
      logWebhookEvent(`No user data found for customer ${customerId}`);
      return;
    }

    const userId = userData.user_id;
    logWebhookEvent(`Found user ID: ${userId}`);

    await updateSubscription(userId, customerId, subscription);
  } catch (error: any) {
    logWebhookEvent(`Error in handleSubscriptionUpdated: ${error.message}`, error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logWebhookEvent('Processing customer.subscription.deleted', subscription);

  try {
    // Ottieni il customer ID dalla sottoscrizione
    const customerId = subscription.customer as string;
    logWebhookEvent(`Customer ID: ${customerId}`);

    // Trova l'utente associato a questo customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      logWebhookEvent(`Error finding user for customer ${customerId}: ${userError.message}`, userError);
      return;
    }

    if (!userData) {
      logWebhookEvent(`No user data found for customer ${customerId}`);
      return;
    }

    const userId = userData.user_id;
    logWebhookEvent(`Found user ID: ${userId}`);

    // Aggiorna la sottoscrizione dell'utente a free
    const { data: updateData, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'free',
        status: 'inactive',
        stripe_subscription_id: null,
        cancel_at_period_end: false,
      })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      logWebhookEvent(`Error updating subscription for user ${userId}: ${updateError.message}`, updateError);
      return;
    }

    logWebhookEvent(`Subscription reset to free for user ${userId}`, updateData);

    // Verifica che l'aggiornamento sia stato effettivo
    const { data: checkData, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError) {
      logWebhookEvent(`Error checking updated subscription: ${checkError.message}`, checkError);
    } else {
      logWebhookEvent(`Current subscription state after update`, checkData);
    }

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_deleted',
      tier: 'free',
      status: 'inactive',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      details: subscription,
    });

    if (historyError) {
      logWebhookEvent(`Error creating subscription history for user ${userId}: ${historyError.message}`, historyError);
      return;
    }

    logWebhookEvent(`Subscription deletion history created for user ${userId}`);
    logWebhookEvent(`Subscription deleted for user ${userId}`);
  } catch (error: any) {
    logWebhookEvent(`Error in handleSubscriptionDeleted: ${error.message}`, error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logWebhookEvent('Processing invoice.payment_succeeded', invoice);

  try {
    // @ts-ignore - Ignora l'errore di tipo per invoice.subscription
    if (!(invoice as any).subscription) {
      logWebhookEvent('Invoice does not have a subscription, skipping');
      return;
    }

    // Ottieni il customer ID dalla fattura
    const customerId = invoice.customer as string;
    logWebhookEvent(`Customer ID: ${customerId}`);

    // Trova l'utente associato a questo customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      logWebhookEvent(`Error finding user for customer ${customerId}: ${userError.message}`, userError);

      // Prova a cercare nei metadati del customer
      const customer = await stripe.customers.retrieve(customerId);
      logWebhookEvent(`Retrieved customer from Stripe`, customer);

      // @ts-ignore - Ignora l'errore di tipo per customer.metadata
      if (customer && !('deleted' in customer) && customer.metadata && customer.metadata.supabaseUserId) {
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        logWebhookEvent(`Found user ID in customer metadata: ${customer.metadata.supabaseUserId}`);
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        const userId = customer.metadata.supabaseUserId;

        // Aggiorna il customer ID nella tabella user_subscriptions
        const { data: updateData, error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId)
          .select();

        if (updateError) {
          logWebhookEvent(`Error updating customer ID for user ${userId}: ${updateError.message}`, updateError);
          return;
        }

        logWebhookEvent(`Updated customer ID for user ${userId}`, updateData);

        // Continua con la registrazione del pagamento
        await processPaymentSucceeded(userId, customerId, invoice);
        return;
      }

      return;
    }

    if (!userData) {
      logWebhookEvent(`No user data found for customer ${customerId}`);
      return;
    }

    const userId = userData.user_id;
    logWebhookEvent(`Found user ID: ${userId}`);

    await processPaymentSucceeded(userId, customerId, invoice);
  } catch (error: any) {
    logWebhookEvent(`Error in handleInvoicePaymentSucceeded: ${error.message}`, error);
  }
}

async function processPaymentSucceeded(userId: string, customerId: string, invoice: Stripe.Invoice) {
  try {
    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'payment_succeeded',
      // @ts-ignore - Ignora l'errore di tipo per invoice.subscription
      stripe_subscription_id: (invoice as any).subscription as string,
      stripe_customer_id: customerId,
      details: invoice,
    });

    if (historyError) {
      logWebhookEvent(`Error creating payment history for user ${userId}: ${historyError.message}`, historyError);
      return;
    }

    logWebhookEvent(`Payment history created for user ${userId}`);
    logWebhookEvent(`Payment succeeded for user ${userId}, invoice: ${invoice.id}`);

    // Aggiorna anche lo stato della sottoscrizione per sicurezza
    // @ts-ignore - Ignora l'errore di tipo per invoice.subscription
    const subscriptionId = (invoice as any).subscription as string;
    if (subscriptionId) {
      logWebhookEvent(`Updating subscription status for subscription ${subscriptionId}`);

      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        logWebhookEvent(`Retrieved subscription details from Stripe`, subscription);
        await updateSubscription(userId, customerId, subscription);
      } catch (error: any) {
        logWebhookEvent(`Error updating subscription after payment: ${error.message}`, error);
      }
    }
  } catch (error: any) {
    logWebhookEvent(`Error in processPaymentSucceeded: ${error.message}`, error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logWebhookEvent('Processing invoice.payment_failed', invoice);

  try {
    // @ts-ignore - Ignora l'errore di tipo per invoice.subscription
    if (!(invoice as any).subscription) {
      logWebhookEvent('Invoice does not have a subscription, skipping');
      return;
    }

    // Ottieni il customer ID dalla fattura
    const customerId = invoice.customer as string;
    logWebhookEvent(`Customer ID: ${customerId}`);

    // Trova l'utente associato a questo customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      logWebhookEvent(`Error finding user for customer ${customerId}: ${userError.message}`, userError);

      // Prova a cercare nei metadati del customer
      const customer = await stripe.customers.retrieve(customerId);
      logWebhookEvent(`Retrieved customer from Stripe`, customer);

      // @ts-ignore - Ignora l'errore di tipo per customer.metadata
      if (customer && !('deleted' in customer) && customer.metadata && customer.metadata.supabaseUserId) {
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        logWebhookEvent(`Found user ID in customer metadata: ${customer.metadata.supabaseUserId}`);
        // @ts-ignore - Ignora l'errore di tipo per customer.metadata
        const userId = customer.metadata.supabaseUserId;

        // Aggiorna il customer ID nella tabella user_subscriptions
        const { data: updateData, error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId)
          .select();

        if (updateError) {
          logWebhookEvent(`Error updating customer ID for user ${userId}: ${updateError.message}`, updateError);
          return;
        }

        logWebhookEvent(`Updated customer ID for user ${userId}`, updateData);

        // Registra l'evento nella cronologia
        await processPaymentFailed(userId, customerId, invoice);
        return;
      }

      return;
    }

    if (!userData) {
      logWebhookEvent(`No user data found for customer ${customerId}`);
      return;
    }

    const userId = userData.user_id;
    logWebhookEvent(`Found user ID: ${userId}`);

    await processPaymentFailed(userId, customerId, invoice);
  } catch (error: any) {
    logWebhookEvent(`Error in handleInvoicePaymentFailed: ${error.message}`, error);
  }
}

async function processPaymentFailed(userId: string, customerId: string, invoice: Stripe.Invoice) {
  try {
    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'payment_failed',
      // @ts-ignore - Ignora l'errore di tipo per invoice.subscription
      stripe_subscription_id: (invoice as any).subscription as string,
      stripe_customer_id: customerId,
      details: invoice,
    });

    if (historyError) {
      logWebhookEvent(`Error creating payment history for user ${userId}: ${historyError.message}`, historyError);
      return;
    }

    logWebhookEvent(`Payment failure history created for user ${userId}`);
    logWebhookEvent(`Payment failed for user ${userId}, invoice: ${invoice.id}`);
  } catch (error: any) {
    logWebhookEvent(`Error in processPaymentFailed: ${error.message}`, error);
  }
}
