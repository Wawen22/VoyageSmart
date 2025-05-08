'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/subscription';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  TrashIcon,
  AlertCircleIcon,
  SparklesIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type PromoCodeRedemption = {
  id: string;
  redeemed_at: string;
  promo_codes: {
    id: string;
    code: string;
    description: string;
    tier: string;
    expires_at: string | null;
  };
};

export default function PromoCodeRedemption() {
  const { refreshSubscription, subscription } = useSubscription();
  const { supabase } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeRedemptions, setActiveRedemptions] = useState<PromoCodeRedemption[]>([]);
  const [hasActivePromoSubscription, setHasActivePromoSubscription] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [cancelingPromo, setCancelingPromo] = useState(false);
  const [selectedPromoCodeId, setSelectedPromoCodeId] = useState<string | null>(null);

  // Carica i codici promozionali attivi dell'utente
  useEffect(() => {
    const fetchActivePromoCodes = async () => {
      try {
        setCheckingStatus(true);

        // Ottieni il token di autenticazione
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.error('No active session');
          return;
        }

        const token = session.access_token;

        const response = await fetch('/api/promo-codes/active', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Error fetching active promo codes:', data.error);
          return;
        }

        setActiveRedemptions(data.redemptions || []);
        setHasActivePromoSubscription(data.hasActivePromoSubscription || false);
      } catch (err) {
        console.error('Error checking promo code status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    fetchActivePromoCodes();
  }, [supabase, success]);

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Ottieni il token di autenticazione
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to redeem a promo code');
      }

      const token = session.access_token;

      const response = await fetch('/api/promo-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: promoCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem promo code');
      }

      // Mostra il messaggio di successo
      setSuccess(data.message);
      toast({
        title: 'Promo Code Redeemed!',
        description: data.message,
        variant: 'default',
      });

      // Resetta il form
      setPromoCode('');

      // Aggiorna la sottoscrizione nel context
      refreshSubscription();
    } catch (err: any) {
      console.error('Error redeeming promo code:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPromoCode = async () => {
    if (!selectedPromoCodeId) return;

    try {
      setCancelingPromo(true);
      setError(null);

      // Ottieni il token di autenticazione
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to cancel a promo code');
      }

      const token = session.access_token;

      const response = await fetch('/api/promo-codes/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          promoCodeId: selectedPromoCodeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel promo code');
      }

      // Mostra il messaggio di successo
      toast({
        title: 'Promo Code Canceled',
        description: 'Your subscription has been downgraded to the free plan',
        variant: 'default',
      });

      // Aggiorna la sottoscrizione nel context
      refreshSubscription();

      // Resetta lo stato
      setSelectedPromoCodeId(null);
      setSuccess(null);
    } catch (err: any) {
      console.error('Error canceling promo code:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setCancelingPromo(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          Redeem Promo Code
        </CardTitle>
        <CardDescription>
          Enter a promotional code to activate special subscription benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkingStatus ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">Checking promo code status...</p>
            </div>
          ) : hasActivePromoSubscription ? (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <SparklesIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Active Promo Code Subscription</h4>
                    <Badge
                      variant="outline"
                      className={`${
                        subscription?.tier === 'premium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        subscription?.tier === 'ai' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {subscription?.tier.charAt(0).toUpperCase() + subscription?.tier.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your subscription is currently active through a promotional code.
                    {subscription && (
                      <span> Valid until {' '}
                        <strong>{format(new Date(subscription.validUntil), 'PPP')}</strong>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {activeRedemptions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">Active promo code:</h5>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setSelectedPromoCodeId(activeRedemptions[0]?.promo_codes.id)}
                          disabled={cancelingPromo}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Cancel Promo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel your promotional subscription and downgrade your account to the free plan.
                            You will lose access to all premium features immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelPromoCode}
                            disabled={cancelingPromo}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {cancelingPromo ? 'Canceling...' : 'Yes, Cancel Promo'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="space-y-2">
                    {activeRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between text-sm border border-border rounded-md p-3">
                        <div>
                          <span className="font-mono bg-muted-foreground/10 px-2 py-1 rounded">
                            {redemption.promo_codes.code}
                          </span>
                          <Badge
                            variant="outline"
                            className={`ml-2 ${
                              redemption.promo_codes.tier === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              redemption.promo_codes.tier === 'ai' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {redemption.promo_codes.tier}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Redeemed on {format(new Date(redemption.redeemed_at), 'PP')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="promoCode">Promo Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="promoCode"
                    placeholder="Enter your promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button onClick={handleRedeemCode} disabled={loading || !promoCode.trim()}>
                    {loading ? 'Redeeming...' : 'Redeem'}
                  </Button>
                </div>
              </div>

              {activeRedemptions.length > 0 && (
                <div className="mt-3 space-y-2 bg-muted p-3 rounded-lg">
                  <h5 className="text-sm font-medium flex items-center gap-1">
                    <InfoIcon className="h-4 w-4" />
                    Previously redeemed codes:
                  </h5>
                  <div className="space-y-2">
                    {activeRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <span className="font-mono bg-muted-foreground/10 px-2 py-1 rounded">
                            {redemption.promo_codes.code}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {redemption.promo_codes.tier}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(redemption.redeemed_at), 'PP')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
              <XCircleIcon className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-500 mt-2">
              <CheckCircleIcon className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Promotional codes can be used to activate premium features or extend your subscription.
          Each code can only be redeemed once per account.
        </p>
      </CardFooter>
    </Card>
  );
}
