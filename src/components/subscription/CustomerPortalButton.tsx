'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface CustomerPortalButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
  children?: React.ReactNode;
}

export default function CustomerPortalButton({
  variant = 'outline',
  className = '',
  children,
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePortalAccess = async () => {
    try {
      setLoading(true);

      // Create a customer portal session
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
          // Include test customer ID if needed
          testCustomerId: window.localStorage.getItem('testCustomerId'),
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to the customer portal
      window.location.href = url;
    } catch (error: any) {
      console.error('Error accessing customer portal:', error);

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
          description: error.message || 'An error occurred while accessing the customer portal. Please try again.',
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
      onClick={handlePortalAccess}
      disabled={loading}
    >
      {loading ? 'Processing...' : children || 'Manage Subscription'}
    </Button>
  );
}
