import { useEffect, useMemo, useRef } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface AITourProps {
  run: boolean;
  onClose: () => void;
  onComplete: () => void;
  completed: boolean;
  tripName?: string;
  currentSection?: string;
}

const STORAGE_KEY = 'vs-ai-onboarding-tour-completed';

export function AITour({ run, onClose, onComplete, completed, tripName, currentSection }: AITourProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const driverRef = useRef<Driver | null>(null);

  const steps = useMemo(
    () => [
      {
        element: '.ai-chat-trigger',
        popover: {
          title: 'Assistente AI',
          description:
            'Questo pulsante apre l’assistente AI di VoyageSmart. Avvia il tour per scoprire cosa può fare.',
          side: 'top'
        }
      },
      {
        element: '.ai-chat-header',
        popover: {
          title: 'Chat contestuale',
          description: `L'assistente conosce il viaggio ${
            tripName || 'selezionato'
          } e la sezione corrente (${currentSection || 'overview'}).`,
          side: 'bottom'
        }
      },
      {
        element: '.ai-chat-input',
        popover: {
          title: 'Fai una domanda',
          description:
            'Chiedi “Cosa facciamo oggi?” oppure “Suggerisci attività food friendly”. Usa le tue parole!',
          side: 'top'
        }
      },
      {
        element: '.ai-interactive-components',
        popover: {
          title: 'Componenti interattivi',
          description:
            'Compariranno pulsanti dinamici per aggiungere attività, filtrare spese o aprire mappe senza lasciare la chat.',
          side: 'top'
        }
      },
      {
        element: '.ai-suggested-questions',
        popover: {
          title: 'Domande suggerite',
          description: 'Usa le scorciatoie per esplorare rapidamente Itinerario, Trasporti e Budget.',
          side: 'top'
        }
      }
    ],
    [tripName, currentSection]
  );

  useEffect(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver({
      showProgress: true,
      overlayOpacity: 0.65,
      allowClose: true,
      nextBtnText: 'Avanti',
      prevBtnText: 'Indietro',
      doneBtnText: 'Fine',
      closeBtnText: 'Chiudi',
      animate: true,
      steps,
      onDestroyStarted: () => {
        onClose();
        onComplete();
        logger.info('AI onboarding tour completed', {
          userId: user?.id,
          pathname
        });
      }
    });

    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [steps, onClose, onComplete, pathname, user?.id]);

  useEffect(() => {
    if (completed) {
      driverRef.current?.destroy();
      driverRef.current = null;
      return;
    }

    if (run) {
      // Delay start slightly to ensure DOM targets exist
      const timeout = setTimeout(() => {
        try {
          driverRef.current?.drive();
        } catch (error) {
          logger.error('Failed to start AI tour', {
            error: error instanceof Error ? error.message : String(error)
          });
          onClose();
        }
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      driverRef.current?.destroy();
    }
  }, [run, completed, onClose]);

  return null;
}

export function resetAITourProgress() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
