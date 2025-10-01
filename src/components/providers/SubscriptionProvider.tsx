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
  getUserTotalTripCount,
  canAddAccommodation,
  canAddTransportation,
  canAddJournalEntry,
  canAddPhoto,
  createDefaultSubscription,
  initiateCheckout,
  cancelStripeSubscription,
  downgradeToFree,
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
          tier: 'free' as SubscriptionTier,
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
        tier: 'free' as SubscriptionTier,
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
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Aggiorna la sottoscrizione quando l'utente torna alla pagina
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        console.log('Window focused, refreshing subscription data');
        fetchSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]); // Only depend on user ID

  const isSubscribed = (tier: SubscriptionTier): boolean => {
    if (!subscription) return false;

    const currentTier: SubscriptionTier = subscription.tier;

    // If user has premium, they have access to all tiers below it
    if (currentTier === 'premium' && (tier === 'premium' || tier === 'free')) {
      return true;
    }

    // If user has AI tier, they have access to all tiers
    if (currentTier === 'ai') {
      return true;
    }

    // Se la sottoscrizione è stata cancellata ma è ancora nel periodo pagato
    // l'utente mantiene l'accesso al tier corrente
    if (subscription.cancelAtPeriodEnd) {
      if (currentTier === 'premium' && (tier === 'premium' || tier === 'free')) {
        return true;
      }
      if (currentTier === 'ai') {
        return true;
      }
    }

    // Otherwise, check if the user's tier matches the requested tier
    return currentTier === tier;
  };

  const canCreateTrip = async (): Promise<boolean> => {
    if (!user) return false;

    // Premium users can create unlimited trips
    if (isSubscribed('premium')) {
      return true;
    }

    // Free users are limited to 5 trips (including trips they participate in)
    const { total } = await getUserTotalTripCount();
    return total < 5;
  };

  const canAccessFeature = (feature: 'accommodations' | 'transportation' | 'journal' | 'photo_gallery' | 'ai_assistant'): boolean => {
    // Se non c'è sottoscrizione, solo accesso alle funzionalità free
    if (!subscription) return false;

    const currentTier: SubscriptionTier = subscription.tier;

    // Per le funzionalità AI, solo gli utenti con piano AI hanno accesso
    if (feature === 'ai_assistant') {
      // Se l'utente ha il piano AI, ha accesso
      if (currentTier === 'ai') {
        return true;
      }

      // Se la sottoscrizione AI è stata cancellata ma è ancora nel periodo pagato
      if (subscription.cancelAtPeriodEnd && currentTier === 'ai') {
        return true;
      }

      // Altrimenti, nessun accesso alle funzionalità AI
      return false;
    }

    // Accommodations e Transportation sono ora FREE per tutti
    if (feature === 'accommodations' || feature === 'transportation') {
      return true; // Sempre accessibili
    }

    // Journal e Photo Gallery sono ora PREMIUM
    if (feature === 'journal' || feature === 'photo_gallery') {
      return currentTier === 'premium' || currentTier === 'ai';
    }

    return false;
  };

  const canAddAccommodationToTrip = async (tripId: string): Promise<boolean> => {
    if (!user || !subscription) return false;
    return await canAddAccommodation(user.id, tripId, subscription.tier);
  };

  const canAddTransportationToTrip = async (tripId: string): Promise<boolean> => {
    if (!user || !subscription) return false;
    return await canAddTransportation(user.id, tripId, subscription.tier);
  };

  const canAddJournalEntryToTrip = async (tripId: string): Promise<boolean> => {
    if (!user || !subscription) return false;
    return await canAddJournalEntry(user.id, tripId, subscription.tier);
  };

  const canAddPhotoToTrip = async (tripId: string): Promise<boolean> => {
    if (!user || !subscription) return false;
    return await canAddPhoto(user.id, tripId, subscription.tier);
  };

  const upgradeSubscription = async (tier: SubscriptionTier): Promise<void> => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (tier === 'free') {
      // Gestisci il downgrade al piano free
      try {
        console.log('Provider - Downgrading to free tier');
        await downgradeToFree();

        console.log('Provider - Downgrade successful, refreshing subscription data');
        // Aggiorna i dati della sottoscrizione
        await fetchSubscription();

        console.log('Provider - Downgrade completed successfully');
      } catch (error) {
        console.error('Provider - Error downgrading to free:', error);
        setError(error as Error);
        throw error;
      }
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
        canAddAccommodation: canAddAccommodationToTrip,
        canAddTransportation: canAddTransportationToTrip,
        canAddJournalEntry: canAddJournalEntryToTrip,
        canAddPhoto: canAddPhotoToTrip,
        upgradeSubscription,
        cancelSubscription,
        downgradeToFree: async () => {
          if (!user) {
            throw new Error('No user found');
          }
          try {
            await downgradeToFree();
            await fetchSubscription();
          } catch (error) {
            setError(error as Error);
            throw error;
          }
        },
        getSubscriptionHistory: fetchSubscriptionHistory,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
