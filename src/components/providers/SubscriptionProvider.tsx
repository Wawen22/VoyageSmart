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
  createDefaultSubscription,
  initiateCheckout,
  cancelStripeSubscription,
  getSubscriptionHistory
} from '@/lib/subscription';
import { checkUserSubscription } from '@/lib/subscription-utils';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Funzione per recuperare la sottoscrizione dell'utente
  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Verifica se la sottoscrizione dell'utente è scaduta
      // Questo aggiorna automaticamente il tier a 'free' se necessario
      const wasExpired = await checkUserSubscription(user.id);
      if (wasExpired) {
        console.log('Subscription was expired and has been updated to free tier');
      }

      // Get user's subscription
      // La funzione getUserSubscription ora gestisce internamente la creazione
      // di una sottoscrizione predefinita se necessario
      const userSubscription = await getUserSubscription(user.id);

      if (userSubscription) {
        console.log('Subscription found for user:', userSubscription);
        setSubscription(userSubscription);
      } else {
        console.log('No subscription found for user after attempt to create one');
        // Imposta una sottoscrizione predefinita in memoria per evitare errori
        setSubscription({
          id: 'temp-' + Date.now(),
          tier: 'free',
          status: 'active',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError(error as Error);

      // Imposta una sottoscrizione predefinita in memoria per evitare errori
      setSubscription({
        id: 'temp-' + Date.now(),
        tier: 'free',
        status: 'active',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    } finally {
      setLoading(false);
    }
  };

  // Carica la sottoscrizione all'avvio e quando l'utente cambia
  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Aggiorna la sottoscrizione quando l'utente torna alla pagina
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused, refreshing subscription data');
        fetchSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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

    // Se la sottoscrizione è stata cancellata ma è ancora nel periodo pagato
    // l'utente mantiene l'accesso al tier corrente
    if (subscription.cancelAtPeriodEnd) {
      if (subscription.tier === 'premium' && (tier === 'premium' || tier === 'free')) {
        return true;
      }
      if (subscription.tier === 'ai') {
        return true;
      }
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
    // Premium users can access accommodations and transportation
    // Anche gli utenti con sottoscrizione cancellata ma ancora valida possono accedere
    if (isSubscribed('premium')) {
      return true;
    }

    // Se la sottoscrizione è stata cancellata ma è ancora nel periodo pagato
    if (subscription?.cancelAtPeriodEnd && subscription.tier === 'premium') {
      return true;
    }

    return false;
  };

  const upgradeSubscription = async (tier: SubscriptionTier): Promise<void> => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (tier === 'free') {
      router.push('/dashboard');
      return;
    }

    try {
      const checkoutUrl = await initiateCheckout(tier);

      if (checkoutUrl) {
        // Prima di reindirizzare, aggiorna lo stato locale per indicare che è in corso un upgrade
        setSubscription(prev => {
          if (!prev) return null;
          return {
            ...prev,
            pendingUpgrade: true,
            pendingTier: tier
          };
        });

        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      setError(error as Error);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    if (!user || !subscription?.stripeSubscriptionId) {
      console.log('Provider - Cannot cancel subscription: no user or subscription ID');
      return;
    }

    try {
      console.log('Provider - Attempting to cancel subscription:', subscription.stripeSubscriptionId);
      // La funzione cancelStripeSubscription ora lancia un errore in caso di fallimento
      // invece di restituire false
      await cancelStripeSubscription(subscription.stripeSubscriptionId);

      console.log('Provider - Subscription canceled successfully, updating local state');
      // Aggiorna lo stato locale
      setSubscription(prev => {
        if (!prev) return null;
        return {
          ...prev,
          // Manteniamo il tier corrente fino alla fine del periodo pagato
          // tier: 'free',
          cancelAtPeriodEnd: true,
          validUntil: prev.currentPeriodEnd || prev.validUntil, // Imposta validUntil uguale a currentPeriodEnd
        };
      });
    } catch (error) {
      console.error('Provider - Error canceling subscription:', error);
      setError(error as Error);
      // Rilanciamo l'errore per permettere al chiamante di gestirlo
      throw error;
    }
  };

  const fetchSubscriptionHistory = async (): Promise<any[]> => {
    if (!user) return [];

    try {
      const history = await getSubscriptionHistory(user.id);
      console.log('Fetched subscription history:', history);
      return history;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }
  };

  // Funzione per forzare il refresh dei dati della sottoscrizione
  const refreshSubscription = async (): Promise<void> => {
    if (user) {
      console.log('Manually refreshing subscription data');
      await fetchSubscription();
    }
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
        cancelSubscription,
        getSubscriptionHistory: fetchSubscriptionHistory,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
