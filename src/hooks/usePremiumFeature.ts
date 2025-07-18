'use client';

import { useSubscription } from '@/lib/subscription';
import { useOnboardingModal } from '@/components/subscription/OnboardingModal';

/**
 * Hook per gestire l'accesso alle funzionalità premium
 * Mostra automaticamente il modal di upgrade quando necessario
 */
export function usePremiumFeature() {
  const { subscription, isSubscribed } = useSubscription();
  
  // Prova a usare il modal context, ma fallback se non disponibile
  let showModal: (() => void) | null = null;
  try {
    const modalContext = useOnboardingModal();
    showModal = modalContext.showModal;
  } catch (error) {
    // Context non disponibile
  }

  /**
   * Controlla se l'utente ha accesso a una funzionalità specifica
   */
  const hasAccess = (feature: 'premium' | 'ai' | 'unlimited_trips' | 'accommodations' | 'transportation' | 'journal' | 'photo_gallery') => {
    if (!subscription) return false;

    switch (feature) {
      case 'premium':
        return isSubscribed('premium') || isSubscribed('ai');
      case 'ai':
        return isSubscribed('ai');
      case 'unlimited_trips':
        return subscription.tier !== 'free';
      case 'accommodations':
      case 'transportation':
        return true; // Now free for everyone
      case 'journal':
      case 'photo_gallery':
        return subscription.tier === 'premium' || subscription.tier === 'ai';
      default:
        return false;
    }
  };

  /**
   * Esegue un'azione se l'utente ha accesso, altrimenti mostra il modal di upgrade
   */
  const executeWithAccess = (
    feature: 'premium' | 'ai' | 'unlimited_trips' | 'accommodations' | 'transportation',
    action: () => void
  ) => {
    if (hasAccess(feature)) {
      action();
    } else {
      if (showModal) {
        showModal();
      } else {
        // Fallback: redirect alla pagina pricing
        window.location.href = '/pricing';
      }
    }
  };

  /**
   * Wrapper per elementi cliccabili che richiedono premium
   */
  const withPremiumAccess = (
    feature: 'premium' | 'ai' | 'unlimited_trips' | 'accommodations' | 'transportation',
    onClick: () => void
  ) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      executeWithAccess(feature, onClick);
    };
  };

  return {
    hasAccess,
    executeWithAccess,
    withPremiumAccess,
    showUpgradeModal: showModal,
    subscription,
    isSubscribed
  };
}
