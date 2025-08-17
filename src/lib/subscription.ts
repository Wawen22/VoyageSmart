import { createContext, useContext } from 'react';
import { supabase } from './supabase';
import { getStripe } from './stripe';

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
      console.error('Invalid user ID');
      return null;
    }

    // Ora cerca la sottoscrizione dell'utente
    let { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Usa maybeSingle invece di single per evitare errori se non esiste

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    if (!data) {
      console.log('No subscription found for user, creating default subscription');
      await createDefaultSubscription(userId);

      // Riprova a ottenere la sottoscrizione dopo averla creata
      const { data: newData, error: newError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (newError || !newData) {
        console.error('Error fetching newly created subscription:', newError);
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
    console.error('Error in getUserSubscription:', error);
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
      console.error('Error fetching accommodation count:', error);
      return false;
    }

    return (count || 0) < 5;
  } catch (error) {
    console.error('Error in canAddAccommodation:', error);
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
      console.error('Error fetching transportation count:', error);
      return false;
    }

    return (count || 0) < 5;
  } catch (error) {
    console.error('Error in canAddTransportation:', error);
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
      console.error('Error fetching journal entries count:', error);
      return false;
    }

    return (count || 0) < 2;
  } catch (error) {
    console.error('Error in canAddJournalEntry:', error);
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
      console.error('Error fetching photos count:', error);
      return false;
    }

    return (count || 0) < 2;
  } catch (error) {
    console.error('Error in canAddPhoto:', error);
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
      console.error('Error checking existing subscription:', checkError);
      return;
    }

    // If user already has a subscription, don't create a new one
    if (existingSubscription) {
      console.log('User already has a subscription, skipping creation');
      return;
    }

    console.log('Creating default subscription for user:', userId);

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
        console.log('Subscription already exists (concurrent creation), skipping');
        return;
      }
      console.error('Error creating default subscription:', error);
      return;
    }

    console.log('Default subscription created successfully');

    // Registra l'evento nella cronologia
    const { error: historyError } = await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'subscription_created',
      tier: 'free',
      status: 'active',
      event_timestamp: new Date().toISOString(),
    });

    if (historyError) {
      console.error('Error creating subscription history:', historyError);
    } else {
      console.log('Subscription history created successfully');
    }
  } catch (error) {
    console.error('Error in createDefaultSubscription:', error);
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
      console.error('No active session or access token found');
      throw new Error('No active session found');
    }

    console.log('Got access token, proceeding with checkout');

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
    console.error('Error initiating checkout:', error);
    return null;
  }
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<boolean> {
  try {
    console.log('Client - Canceling subscription:', subscriptionId);
    // Ottieni la sessione corrente per il token di accesso
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.error('Client - No active session found');
      throw new Error('No active session found');
    }

    console.log('Client - Got access token, proceeding with cancellation');

    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ subscriptionId }),
    });

    const data = await response.json();
    console.log('Client - Cancellation response:', data);

    if (!response.ok) {
      console.error('Client - Error response from cancellation API:', data);

      // Fornisci messaggi di errore più specifici
      let errorMessage = data.error || 'Error canceling subscription';
      if (data.details) {
        errorMessage += `: ${data.details}`;
      }

      throw new Error(errorMessage);
    }

    console.log('Client - Subscription canceled successfully');
    return true;
  } catch (error: any) {
    console.error('Client - Error canceling subscription:', error);

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
    console.log('Client - Downgrading to free tier');
    // Ottieni la sessione corrente per il token di accesso
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.error('Client - No active session found');
      throw new Error('No active session found');
    }

    console.log('Client - Got access token, proceeding with downgrade');

    const response = await fetch('/api/stripe/downgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('Client - Downgrade response:', data);

    if (!response.ok) {
      console.error('Client - Error response from downgrade API:', data);

      // Fornisci messaggi di errore più specifici
      let errorMessage = data.error || 'Error downgrading subscription';
      if (data.details) {
        errorMessage += `: ${data.details}`;
      }

      throw new Error(errorMessage);
    }

    console.log('Client - Subscription downgraded successfully');
    return true;
  } catch (error: any) {
    console.error('Client - Error downgrading subscription:', error);

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
      console.error('Error fetching subscription history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSubscriptionHistory:', error);
    return [];
  }
}
