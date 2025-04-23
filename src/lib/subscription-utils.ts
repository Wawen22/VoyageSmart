import { supabase } from './supabase';

/**
 * Verifica e aggiorna le sottoscrizioni scadute
 * Questa funzione controlla se ci sono sottoscrizioni che sono state cancellate
 * e il cui periodo è scaduto, e le aggiorna a 'free'
 */
export async function checkExpiredSubscriptions() {
  try {
    console.log('Checking for expired subscriptions...');
    
    const now = new Date().toISOString();
    
    // Trova tutte le sottoscrizioni che sono state cancellate e il cui periodo è scaduto
    const { data: expiredSubscriptions, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('cancel_at_period_end', true)
      .lt('current_period_end', now)
      .neq('tier', 'free');
    
    if (findError) {
      console.error('Error finding expired subscriptions:', findError);
      return;
    }
    
    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('No expired subscriptions found');
      return;
    }
    
    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);
    
    // Aggiorna ogni sottoscrizione scaduta
    for (const subscription of expiredSubscriptions) {
      console.log(`Updating expired subscription for user ${subscription.user_id}`);
      
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
        console.error(`Error updating subscription for user ${subscription.user_id}:`, updateError);
        continue;
      }
      
      console.log(`Updated subscription for user ${subscription.user_id} to free`);
      
      // Registra l'evento nella cronologia
      const { error: historyError } = await supabase.from('subscription_history').insert({
        user_id: subscription.user_id,
        event_type: 'subscription_expired',
        tier: 'free',
        status: 'inactive',
        stripe_subscription_id: subscription.stripe_subscription_id,
        stripe_customer_id: subscription.stripe_customer_id,
        details: {
          previous_tier: subscription.tier,
          expired_at: now,
          reason: 'automatic_expiration_check'
        },
      });
      
      if (historyError) {
        console.error(`Error creating history for user ${subscription.user_id}:`, historyError);
      } else {
        console.log(`Created history entry for user ${subscription.user_id}`);
      }
    }
    
    console.log('Finished checking expired subscriptions');
    return expiredSubscriptions.length;
  } catch (error) {
    console.error('Error in checkExpiredSubscriptions:', error);
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
    console.log(`Checking subscription for user ${userId}...`);
    
    const now = new Date().toISOString();
    
    // Trova la sottoscrizione dell'utente
    const { data: subscription, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (findError) {
      console.error(`Error finding subscription for user ${userId}:`, findError);
      return false;
    }
    
    if (!subscription) {
      console.log(`No subscription found for user ${userId}`);
      return false;
    }
    
    // Verifica se la sottoscrizione è scaduta
    const isExpired = subscription.cancel_at_period_end && 
                      subscription.current_period_end && 
                      new Date(subscription.current_period_end) < new Date() &&
                      subscription.tier !== 'free';
    
    if (!isExpired) {
      console.log(`Subscription for user ${userId} is not expired`);
      return false;
    }
    
    console.log(`Subscription for user ${userId} is expired, updating to free`);
    
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
      console.error(`Error updating subscription for user ${userId}:`, updateError);
      return false;
    }
    
    console.log(`Updated subscription for user ${userId} to free`);
    
    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_expired',
      tier: 'free',
      status: 'inactive',
      stripe_subscription_id: subscription.stripe_subscription_id,
      stripe_customer_id: subscription.stripe_customer_id,
      details: {
        previous_tier: subscription.tier,
        expired_at: now,
        reason: 'user_login_check'
      },
    });
    
    if (historyError) {
      console.error(`Error creating history for user ${userId}:`, historyError);
    } else {
      console.log(`Created history entry for user ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error in checkUserSubscription for user ${userId}:`, error);
    return false;
  }
}
