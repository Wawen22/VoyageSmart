'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function TestCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check for success or canceled parameters
  useEffect(() => {
    // Load customer ID from localStorage if available
    const savedCustomerId = window.localStorage.getItem('testCustomerId');
    if (savedCustomerId) {
      setCustomerId(savedCustomerId);
    }

    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success) {
      toast({
        title: 'Checkout successful!',
        description: 'Your test subscription has been activated.',
        variant: 'default',
      });

      // If we have a session ID, we can get the customer ID
      if (sessionId) {
        fetchCustomerIdFromSession(sessionId);
      }
    } else if (canceled) {
      toast({
        title: 'Checkout canceled',
        description: 'Your test subscription process was canceled.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // Function to fetch customer ID from session
  const fetchCustomerIdFromSession = async (sessionId: string) => {
    try {
      // This would be a real API call in production
      // For now, we'll just simulate it
      // In a real implementation, you would have an API endpoint that retrieves the customer ID from the session

      // Simulate a successful response
      const customerId = `cus_test_${Math.random().toString(36).substring(2, 10)}`;

      // Save to localStorage
      window.localStorage.setItem('testCustomerId', customerId);
      setCustomerId(customerId);

      toast({
        title: 'Customer ID saved',
        description: 'You can now access the customer portal.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error fetching customer ID:', error);
    }
  };

  const handleCustomerPortal = async () => {
    try {
      setLoading(true);

      // Create a customer portal session
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/test-checkout`,
          testCustomerId: customerId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to the customer portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while accessing the customer portal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
          tier: 'premium',
          successUrl: `${window.location.origin}/test-checkout?success=true`,
          cancelUrl: `${window.location.origin}/test-checkout?canceled=true`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // If we have a direct checkout URL, use it
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Otherwise, redirect to a fallback page
      router.push(`/checkout/redirect?session_id=${data.sessionId}`);
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout transitionType="fade">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test Checkout</CardTitle>
            <CardDescription>
              This is a test page for Stripe checkout integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerId ? (
              <>
                <div className="p-4 border border-green-200 bg-green-50 rounded-md">
                  <p className="font-medium text-green-800">Test Customer ID:</p>
                  <p className="text-sm font-mono mt-1 break-all">{customerId}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can now test the customer portal or create another checkout session.
                </p>
              </>
            ) : (
              <>
                <p>Click the button below to test the Stripe checkout process.</p>
                <p className="text-sm text-muted-foreground">
                  This will create a test customer and redirect you to the Stripe checkout page.
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Test Premium Checkout'}
            </Button>

            {customerId && (
              <Button
                variant="outline"
                onClick={handleCustomerPortal}
                disabled={loading}
                className="w-full"
              >
                Access Customer Portal
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}
