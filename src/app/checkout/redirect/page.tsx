'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function CheckoutRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    // Redirect to Stripe checkout
    const redirectToStripe = async () => {
      try {
        // Construct the Stripe checkout URL manually
        const stripeCheckoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
        window.location.href = stripeCheckoutUrl;
      } catch (error) {
        console.error('Error redirecting to Stripe:', error);
        setError('Failed to redirect to payment page');
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      redirectToStripe();
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId]);

  const handleManualRedirect = () => {
    if (sessionId) {
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    }
  };

  const handleCancel = () => {
    router.push('/subscription?canceled=true');
  };

  return (
    <PageLayout transitionType="fade">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Redirecting to Payment</CardTitle>
            <CardDescription>
              You are being redirected to our secure payment provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
            {error ? (
              <div className="text-center text-destructive">
                <p>{error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please try again or contact support if the problem persists.
                </p>
              </div>
            ) : (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  Please wait while we redirect you to the payment page...
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleManualRedirect} disabled={!sessionId}>
              Continue to Payment
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}
