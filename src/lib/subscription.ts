import { createContext, useContext } from 'react';
import { supabase } from './supabase';

export type SubscriptionTier = 'free' | 'premium' | 'ai';

export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing';

export type Subscription = {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  validUntil: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod?: string;
};

export type SubscriptionState = {
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  isSubscribed: (tier: SubscriptionTier) => boolean;
  canCreateTrip: () => Promise<boolean>;
  canAccessFeature: (feature: 'accommodations' | 'transportation') => boolean;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  manageSubscription: () => void;
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
    console.log('Getting subscription for user:', userId);
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    if (!data) {
      console.log('No subscription found for user:', userId);
      return null;
    }

    console.log('Subscription found:', data);
    return {
      id: data.id,
      tier: data.tier as SubscriptionTier,
      status: data.status as SubscriptionStatus,
      validUntil: new Date(data.valid_until),
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
    };
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

export async function getUserTripCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    if (error) {
      console.error('Error fetching user trip count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserTripCount:', error);
    return 0;
  }
}

export async function createDefaultSubscription(userId: string): Promise<void> {
  try {
    console.log('Creating default subscription for user:', userId);
    // Check if user already has a subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkError);
      return;
    }

    // If user already has a subscription, don't create a new one
    if (existingSubscription) {
      console.log('User already has a subscription:', existingSubscription);
      return;
    }

    console.log('No existing subscription found, creating a new one');
    // Create a free subscription for the user
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
    console.log('Setting valid_until to:', validUntil);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert([
        {
          user_id: userId,
          tier: 'free',
          status: 'active',
          valid_until: validUntil,
        }
      ])
      .select();

    if (error) {
      console.error('Error creating default subscription:', error);
    } else {
      console.log('Default subscription created successfully:', data);
    }
  } catch (error) {
    console.error('Error in createDefaultSubscription:', error);
  }
}
