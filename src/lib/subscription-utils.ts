import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Verifica e aggiorna le sottoscrizioni scadute
 * Questa funzione controlla se ci sono sottoscrizioni che sono state cancellate
 * e il cui periodo è scaduto, e le aggiorna a 'free'
 */
export async function checkExpiredSubscriptions() {
  try {
    const now = new Date().toISOString();

    // Trova tutte le sottoscrizioni che sono state cancellate e il cui periodo è scaduto
    const { data: expiredSubscriptions, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('cancel_at_period_end', true)
      .lt('current_period_end', now)
      .neq('tier', 'free');

    if (findError) {
      throw new Error(`Error finding expired subscriptions: ${findError.message}`);
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return;
    }
    
    // Aggiorna ogni sottoscrizione scaduta
    for (const subscription of expiredSubscriptions) {
      // Aggiorna la sottoscrizione a 'free'
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'free',
          status: 'inactive',
          cancel_at_period_end: false,
          updated_at: now,
        })
        .eq('id', subscription.id);

      if (updateError) {
        throw new Error(`Error updating subscription for user ${subscription.user_id}: ${updateError.message}`);
      }
      
      logger.info('Updated subscription to free', { userId: subscription.user_id });
      
      // Registra l'evento nella cronologia
      const { error: historyError } = await supabase.from('subscription_history').insert({
        user_id: subscription.user_id,
        event_type: 'subscription_expired',
        tier: 'free',
        status: 'inactive',
        stripe_subscription_id: subscription.stripe_subscription_id,
        stripe_customer_id: subscription.stripe_customer_id,
        event_timestamp: now,
        details: {
          previous_tier: subscription.tier,
          expired_at: now,
          reason: 'automatic_expiration_check'
        },
      });
      
      if (historyError) {
        logger.error('Error creating subscription history', { userId: subscription.user_id, error: historyError.message });
      } else {
        logger.debug('Created subscription history entry', { userId: subscription.user_id });
      }
    }
    
    logger.info('Finished checking expired subscriptions', { expiredCount: expiredSubscriptions.length });
    return expiredSubscriptions.length;
  } catch (error) {
    logger.error('Error in checkExpiredSubscriptions', { error: error instanceof Error ? error.message : String(error) });
    return 0;
  }
}

/**
 * Verifica e aggiorna una singola sottoscrizione
 * Questa funzione controlla se la sottoscrizione dell'utente è scaduta
 * e la aggiorna a 'free' se necessario
 */
export async function checkUserSubscription(userId: string) {
  try {
    logger.debug('Checking user subscription', { userId });
    
    const now = new Date().toISOString();
    
    // Trova la sottoscrizione dell'utente
    const { data: subscription, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (findError) {
      logger.error('Error finding user subscription', { userId, error: findError.message });
      return false;
    }

    if (!subscription) {
      logger.debug('No subscription found for user', { userId });
      return false;
    }
    
    // Verifica se la sottoscrizione è scaduta
    const isExpired = subscription.cancel_at_period_end && 
                      subscription.current_period_end && 
                      new Date(subscription.current_period_end) < new Date() &&
                      subscription.tier !== 'free';
    
    if (!isExpired) {
      return false;
    }
    
    // Aggiorna la sottoscrizione a 'free'
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'free',
        status: 'inactive',
        cancel_at_period_end: false,
        updated_at: now,
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      throw new Error(`Error updating subscription for user ${userId}: ${updateError.message}`);
    }
    
    logger.info('Updated user subscription to free', { userId });

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_expired',
      tier: 'free',
      status: 'inactive',
      stripe_subscription_id: subscription.stripe_subscription_id,
      stripe_customer_id: subscription.stripe_customer_id,
      event_timestamp: now,
      details: {
        previous_tier: subscription.tier,
        expired_at: now,
        reason: 'user_login_check'
      },
    });

    if (historyError) {
      logger.error('Error creating user subscription history', { userId, error: historyError.message });
    } else {
      logger.debug('Created user subscription history entry', { userId });
    }

    return true;
  } catch (error) {
    logger.error('Error in checkUserSubscription', { userId, error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}
