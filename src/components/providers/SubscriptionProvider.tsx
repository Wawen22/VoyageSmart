'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  SubscriptionContext,
  Subscription,
  SubscriptionTier,
  getUserSubscription,
  getUserTripCount,
  createDefaultSubscription
} from '@/lib/subscription';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user's subscription
        const userSubscription = await getUserSubscription(user.id);
        
        if (userSubscription) {
          setSubscription(userSubscription);
        } else {
          // Create a default free subscription if none exists
          await createDefaultSubscription(user.id);
          
          // Fetch the newly created subscription
          const newSubscription = await getUserSubscription(user.id);
          setSubscription(newSubscription);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const isSubscribed = (tier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    
    // If user has premium, they have access to all tiers below it
    if (subscription.tier === 'premium' && (tier === 'premium' || tier === 'free')) {
      return true;
    }
    
    // If user has AI tier, they have access to all tiers
    if (subscription.tier === 'ai') {
      return true;
    }
    
    // Otherwise, check if the user's tier matches the requested tier
    return subscription.tier === tier;
  };

  const canCreateTrip = async (): Promise<boolean> => {
    if (!user) return false;
    
    // Premium users can create unlimited trips
    if (isSubscribed('premium')) {
      return true;
    }
    
    // Free users are limited to 3 trips
    const tripCount = await getUserTripCount(user.id);
    return tripCount < 3;
  };

  const canAccessFeature = (feature: 'accommodations' | 'transportation'): boolean => {
    // Only premium users can access accommodations and transportation
    return isSubscribed('premium');
  };

  const upgradeSubscription = () => {
    // Navigate to pricing page
    router.push('/pricing');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        isSubscribed,
        canCreateTrip,
        canAccessFeature,
        upgradeSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
