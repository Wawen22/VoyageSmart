'use client';

import { useState, useEffect } from 'react';
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
import { CheckIcon, RocketIcon, XIcon } from 'lucide-react';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { subscription, upgradeSubscription } = useSubscription();
  const router = useRouter();

  // Check if this is the first login for the user
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

    if (user && subscription && subscription.tier === 'free' && !hasSeenOnboarding) {
      // Show the modal after a short delay to ensure the page has loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, subscription]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleUpgrade = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
    upgradeSubscription('premium');
  };

  const handleExplore = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/dashboard');
  };

  if (!user || !subscription || subscription.tier !== 'free') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <RocketIcon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center">Welcome to VoyageSmart!</DialogTitle>
          <DialogDescription className="text-center">
            You're currently on the Free plan. Here's what you can do:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Free Plan Features:</h3>

            <div className="space-y-2">
              <div className="flex items-start">
                <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p className="text-sm">Create up to 3 trips</p>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p className="text-sm">Basic itinerary planning</p>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p className="text-sm">Expense tracking</p>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p className="text-sm">Trip collaboration</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Premium Features (Upgrade to access):</h3>

            <div className="space-y-2">
              <div className="flex items-start">
                <XIcon className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                <p className="text-sm text-muted-foreground">Unlimited trips</p>
              </div>
              <div className="flex items-start">
                <XIcon className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                <p className="text-sm text-muted-foreground">Accommodations management</p>
              </div>
              <div className="flex items-start">
                <XIcon className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                <p className="text-sm text-muted-foreground">Transportation tracking</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExplore} className="sm:flex-1">
            Explore Free Plan
          </Button>
          <Button onClick={handleUpgrade} className="sm:flex-1">
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
