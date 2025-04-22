import { createContext, useContext } from 'react';
import { supabase } from './supabase';

export type SubscriptionTier = 'free' | 'premium' | 'ai';

export type Subscription = {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'canceled';
  validUntil: Date;
};

export type SubscriptionState = {
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  isSubscribed: (tier: SubscriptionTier) => boolean;
  canCreateTrip: () => Promise<boolean>;
  canAccessFeature: (feature: 'accommodations' | 'transportation') => boolean;
  upgradeSubscription: () => void;
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
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      tier: data.tier as SubscriptionTier,
      status: data.status,
      validUntil: new Date(data.valid_until),
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
      return;
    }

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
      console.error('Error creating default subscription:', error);
    }
  } catch (error) {
    console.error('Error in createDefaultSubscription:', error);
  }
}
