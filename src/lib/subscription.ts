import { createContext, useContext } from 'react';
import { supabase } from './supabase';
import { getStripe } from './stripe';
import { logger } from './logger';

export type SubscriptionTier = 'free' | 'premium' | 'ai';

export type Subscription = {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'canceled';
  validUntil: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
  pendingUpgrade?: boolean;
  pendingTier?: SubscriptionTier;
};

export type SubscriptionState = {
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  isSubscribed: (tier: SubscriptionTier) => boolean;
  canCreateTrip: () => Promise<boolean>;
  canAccessFeature: (feature: 'accommodations' | 'transportation' | 'journal' | 'photo_gallery' | 'ai_assistant') => boolean;
  canAddAccommodation: (tripId: string) => Promise<boolean>;
  canAddTransportation: (tripId: string) => Promise<boolean>;
  canAddJournalEntry: (tripId: string) => Promise<boolean>;
  canAddPhoto: (tripId: string) => Promise<boolean>;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  downgradeToFree: () => Promise<void>;
  getSubscriptionHistory: () => Promise<any[]>;
  refreshSubscription: () => Promise<void>;
};

export const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Verifica se l'utente esiste
    if (!userId) {
      logger.error('Invalid user ID provided to getUserSubscription');
      return null;
    }

    // Ora cerca la sottoscrizione dell'utente
    let { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Usa maybeSingle invece di single per evitare errori se non esiste

    if (error) {
      logger.error('Error fetching user subscription', { error: error.message, userId });
      return null;
    }

    if (!data) {
      logger.info('No subscription found for user, creating default subscription', { userId });
      await createDefaultSubscription(userId);

      // Riprova a ottenere la sottoscrizione dopo averla creata
      const { data: newData, error: newError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (newError || !newData) {
        logger.error('Error fetching newly created subscription', {
          error: newError?.message,
          userId
        });
        return null;
      }

      data = newData;
    }

    return {
      id: data.id,
      tier: data.tier as SubscriptionTier,
      status: data.status,
      validUntil: new Date(data.valid_until),
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
    };
  } catch (error) {
    logger.error('Error in getUserSubscription', { error, userId });
    return null;
  }
}

export async function getUserTripCount(): Promise<number> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    return 0;
  }
}

// New function to count all trips (owned + participating)
export async function getUserTotalTripCount(): Promise<{ owned: number; participating: number; total: number }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { owned: 0, participating: 0, total: 0 };
    }

    // Count trips owned by user
    const { count: ownedCount, error: ownedError } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    if (ownedError) {
      return { owned: 0, participating: 0, total: 0 };
    }

    // Count trips where user is a participant
    const { count: participatingCount, error: participatingError } = await supabase
      .from('trip_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (participatingError) {
      return { owned: ownedCount || 0, participating: 0, total: ownedCount || 0 };
    }

    const owned = ownedCount || 0;
    const participating = participatingCount || 0;
    const total = owned + participating;

    return { owned, participating, total };
  } catch (error) {
    return { owned: 0, participating: 0, total: 0 };
  }
}

// Check if user can add accommodation to trip (max 5 for free users)
export async function canAddAccommodation(userId: string, tripId: string, userTier: string): Promise<boolean> {
  try {
    // Premium and AI users have no limits
    if (userTier === 'premium' || userTier === 'ai') {
      return true;
    }

    // Free users are limited to 5 accommodations per trip
    const { count, error } = await supabase
      .from('accommodations')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (error) {
      logger.error('Error fetching accommodation count', { error: error.message, tripId });
      return false;
    }

    return (count || 0) < 5;
  } catch (error) {
    logger.error('Error in canAddAccommodation', { error, tripId });
    return false;
  }
}

// Check if user can add transportation to trip (max 5 for free users)
export async function canAddTransportation(userId: string, tripId: string, userTier: string): Promise<boolean> {
  try {
    // Premium and AI users have no limits
    if (userTier === 'premium' || userTier === 'ai') {
      return true;
    }

    // Free users are limited to 5 transportation items per trip
    const { count, error } = await supabase
      .from('transportation')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (error) {
      logger.error('Error fetching transportation count', { error: error.message, tripId });
      return false;
    }

    return (count || 0) < 5;
  } catch (error) {
    logger.error('Error in canAddTransportation', { error, tripId });
    return false;
  }
}

// Check if user can add journal entry to trip (max 2 for free users)
export async function canAddJournalEntry(userId: string, tripId: string, userTier: string): Promise<boolean> {
  try {
    // Premium and AI users have no limits
    if (userTier === 'premium' || userTier === 'ai') {
      return true;
    }

    // Free users are limited to 2 journal entries per trip
    const { count, error } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (error) {
      logger.error('Error fetching journal entries count', { error: error.message, tripId });
      return false;
    }

    return (count || 0) < 2;
  } catch (error) {
    logger.error('Error in canAddJournalEntry', { error, tripId });
    return false;
  }
}

// Check if user can add photo to trip (max 2 for free users)
export async function canAddPhoto(userId: string, tripId: string, userTier: string): Promise<boolean> {
  try {
    // Premium and AI users have no limits
    if (userTier === 'premium' || userTier === 'ai') {
      return true;
    }

    // Free users are limited to 2 photos per trip
    const { count, error } = await supabase
      .from('trip_media')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('type', 'photo');

    if (error) {
      logger.error('Error fetching photos count', { error: error.message, tripId });
      return false;
    }

    return (count || 0) < 2;
  } catch (error) {
    logger.error('Error in canAddPhoto', { error, tripId });
    return false;
  }
}

export async function createDefaultSubscription(userId: string): Promise<void> {
  try {
    // Check if user already has a subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      logger.error('Error checking existing subscription', {
        error: checkError.message,
        userId
      });
      return;
    }

    // If user already has a subscription, don't create a new one
    if (existingSubscription) {
      logger.debug('User already has a subscription, skipping creation', { userId });
      return;
    }

    logger.info('Creating default subscription for user', { userId });

    // Create a free subscription for the user
    const { error } = await supabase
      .from('user_subscriptions')
      .insert([
        {
          user_id: userId,
          tier: 'free',
          status: 'active',
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        }
      ]);

    if (error) {
      // Se l'errore è di duplicazione, non è un problema
      if (error.code === '23505') {
        logger.debug('Subscription already exists (concurrent creation), skipping', { userId });
        return;
      }
      logger.error('Error creating default subscription', {
        error: error.message,
        userId
      });
      return;
    }

    logger.info('Default subscription created successfully', { userId });

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_created',
      tier: 'free',
      status: 'active',
      event_timestamp: new Date().toISOString(),
    });

    if (historyError) {
      logger.error('Error creating subscription history', {
        error: historyError.message,
        userId
      });
    } else {
      logger.debug('Subscription history created successfully', { userId });
    }
  } catch (error) {
    logger.error('Error in createDefaultSubscription', { error, userId });
  }
}

export async function initiateCheckout(tier: SubscriptionTier): Promise<string | null> {
  try {
    // Determina il priceId in base al tier
    let priceId;
    if (tier === 'premium') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
    } else if (tier === 'ai') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_AI_PRICE_ID;
    } else if (tier === 'free') {
      // Per il piano free, reindirizza alla dashboard
      window.location.href = '/dashboard';
      return null;
    } else {
      throw new Error('Invalid subscription tier');
    }

    // Ottieni la sessione corrente per il token di accesso
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      logger.error('No active session or access token found for checkout');
      throw new Error('No active session found');
    }

    logger.debug('Got access token, proceeding with checkout');

    // Chiama l'API di checkout con il token di autorizzazione
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/subscription?canceled=true`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error creating checkout session');
    }

    return data.url;
  } catch (error) {
    logger.error('Error initiating checkout', { error, tier });
    return null;
  }
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<boolean> {
  try {
    logger.info('Canceling subscription', { subscriptionId });
    // Ottieni la sessione corrente per il token di accesso
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      logger.error('No active session found for subscription cancellation');
      throw new Error('No active session found');
    }

    logger.debug('Got access token, proceeding with cancellation');

    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ subscriptionId }),
    });

    const data = await response.json();
    logger.debug('Cancellation response received', { data });

    if (!response.ok) {
      logger.error('Error response from cancellation API', { data, status: response.status });

      // Fornisci messaggi di errore più specifici
      let errorMessage = data.error || 'Error canceling subscription';
      if (data.details) {
        errorMessage += `: ${data.details}`;
      }

      throw new Error(errorMessage);
    }

    logger.info('Subscription canceled successfully', { subscriptionId });
    return true;
  } catch (error: any) {
    logger.error('Error canceling subscription', { error: error.message, subscriptionId });

    // Se è un errore di rete, fornisci un messaggio più chiaro
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    // Rilanciamo l'errore per permettere al chiamante di gestirlo
    throw error;
  }
}

export async function downgradeToFree(): Promise<boolean> {
  try {
    logger.info('Downgrading to free tier');
    // Ottieni la sessione corrente per il token di accesso
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      logger.error('No active session found for downgrade');
      throw new Error('No active session found');
    }

    logger.debug('Got access token, proceeding with downgrade');

    const response = await fetch('/api/stripe/downgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    logger.debug('Downgrade response received', { data });

    if (!response.ok) {
      logger.error('Error response from downgrade API', { data, status: response.status });

      // Fornisci messaggi di errore più specifici
      let errorMessage = data.error || 'Error downgrading subscription';
      if (data.details) {
        errorMessage += `: ${data.details}`;
      }

      throw new Error(errorMessage);
    }

    logger.info('Subscription downgraded successfully');
    return true;
  } catch (error: any) {
    logger.error('Error downgrading subscription', { error: error.message });

    // Se è un errore di rete, fornisci un messaggio più chiaro
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    // Rilanciamo l'errore per permettere al chiamante di gestirlo
    throw error;
  }
}

export async function getSubscriptionHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('event_timestamp', { ascending: false });

    if (error) {
      logger.error('Error fetching subscription history', { error: error.message, userId });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in getSubscriptionHistory', { error, userId });
    return [];
  }
}
