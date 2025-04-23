'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Load Stripe outside of component render to avoid recreating Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutButtonProps {
  tier: 'premium' | 'ai';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
  children?: React.ReactNode;
}

export default function CheckoutButton({
  tier,
  variant = 'default',
  className = '',
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Create a checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);

      // Check for network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        toast({
          title: 'Network Error',
          description: 'Unable to connect to payment service. Please check your internet connection or disable ad blockers.',
          variant: 'destructive',
        });
      } else if (error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        toast({
          title: 'Connection Blocked',
          description: 'Your browser is blocking connections to our payment provider. Please disable ad blockers or privacy extensions.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'An error occurred during checkout. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? 'Processing...' : children || `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
    </Button>
  );
}
