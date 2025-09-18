'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon, RocketIcon, XIcon, SparklesIcon } from 'lucide-react';

// Context per gestire il modal globalmente
interface OnboardingModalContextType {
  showModal: () => void;
  hideModal: () => void;
}

const OnboardingModalContext = createContext<OnboardingModalContextType | undefined>(undefined);

export const useOnboardingModal = () => {
  const context = useContext(OnboardingModalContext);
  if (!context) {
    throw new Error('useOnboardingModal must be used within OnboardingModalProvider');
  }
  return context;
};

export function OnboardingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const showModal = () => setIsOpen(true);
  const hideModal = () => setIsOpen(false);

  return (
    <OnboardingModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <OnboardingModalContent isOpen={isOpen} onClose={hideModal} />
    </OnboardingModalContext.Provider>
  );
}

function OnboardingModalContent({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { subscription, upgradeSubscription } = useSubscription();
  const router = useRouter();

  // Non gestire l'apertura automatica qui, viene gestita dal componente principale

  const handleClose = () => {
    onClose();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasSeenOnboardingThisSession', 'true');
    }
  };

  const handleUpgrade = (plan: 'premium' | 'ai') => {
    handleClose();
    upgradeSubscription(plan);
  };

  const handleExplore = () => {
    handleClose();
  };

  if (!user || !subscription || subscription.tier !== 'free') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-full sm:mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="modal-header-mobile">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-2 sm:mb-4">
            <RocketIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg sm:text-xl">Welcome to VoyageSmart!</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            You're currently on the Free plan. Here's what you can do:
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 sm:py-4">
          <div className="features-grid-mobile grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Free Plan Features */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-medium text-center text-sm sm:text-base">Free:</h3>
              <div className="feature-list-mobile space-y-1.5 sm:space-y-2">
                <div className="feature-item flex items-start">
                  <CheckIcon className="feature-icon h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="feature-text text-xs sm:text-sm">Create up to 5 trips</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Basic itinerary planning</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Expense tracking</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Trip collaboration</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Accommodations management</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Transportation tracking</p>
                </div>
              </div>
            </div>

            {/* Premium Features */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-medium text-center text-sm sm:text-base">Premium:</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">All Free features</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Unlimited trips</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Journal & Photo Gallery</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Advanced expense analytics</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Priority support</p>
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div className="space-y-2 sm:space-y-3 sm:col-span-2 lg:col-span-1">
              <h3 className="font-medium text-center flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
                <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                AI Assistant:
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">All Premium features</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">24/7 AI travel assistant</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Smart itinerary optimization</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Budget forecasting</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">Personalized travel insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="modal-footer-mobile pt-2 sm:pt-4">
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleExplore}
              className="w-full order-3 sm:order-1 text-xs sm:text-sm py-2 sm:py-2"
            >
              Continue with Free Plan
            </Button>
            <Button
              onClick={() => handleUpgrade('premium')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2 text-xs sm:text-sm py-2 sm:py-2"
            >
              <RocketIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Upgrade to Premium
            </Button>
            <Button
              onClick={() => handleUpgrade('ai')}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white order-2 sm:order-3 text-xs sm:text-sm py-2 sm:py-2"
            >
              <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Upgrade to AI Assistant
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente principale che ora usa il provider
export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { subscription } = useSubscription();

  // Check if this is the first time in this session (hydration-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenOnboardingThisSession = sessionStorage.getItem('hasSeenOnboardingThisSession');

    if (user && subscription && subscription.tier === 'free' && !hasSeenOnboardingThisSession) {
      // Show the modal after a short delay to ensure the page has loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, subscription]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasSeenOnboardingThisSession', 'true');
    }
  };

  return <OnboardingModalContent isOpen={isOpen} onClose={handleClose} />;
}
