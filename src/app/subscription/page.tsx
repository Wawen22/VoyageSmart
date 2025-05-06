'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import TestWebhook from './test-webhook';
import {
  CheckIcon,
  XIcon,
  RocketIcon,
  SparklesIcon,
  StarIcon,
  CreditCardIcon,
  HistoryIcon,
  SettingsIcon,
  ArrowLeftIcon,
  TagIcon
} from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { subscription, isSubscribed, upgradeSubscription, cancelSubscription, getSubscriptionHistory, refreshSubscription } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Controlla se c'è un parametro di successo o cancellazione nella URL
  useEffect(() => {
    const handleSubscriptionResult = async () => {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');

      if (success === 'true') {
        // Forza l'aggiornamento dei dati della sottoscrizione
        if (user) {
          try {
            setLoading(true);
            await refreshSubscription();
            setLoading(false);

            toast({
              title: 'Subscription Updated',
              description: 'Your subscription has been successfully updated.',
              variant: 'default',
            });
          } catch (error) {
            console.error('Error refreshing subscription after upgrade:', error);
            toast({
              title: 'Subscription Status Update',
              description: 'Your payment was successful, but we need to refresh your subscription status. Please wait a moment.',
              variant: 'default',
            });

            // Riprova dopo un breve ritardo
            setTimeout(async () => {
              try {
                await refreshSubscription();
              } catch (innerError) {
                console.error('Error in delayed subscription refresh:', innerError);
              }
            }, 3000);
          }
        } else {
          toast({
            title: 'Subscription Updated',
            description: 'Your subscription has been successfully updated.',
            variant: 'default',
          });
        }
      } else if (canceled === 'true') {
        toast({
          title: 'Checkout Canceled',
          description: 'You have canceled the checkout process.',
          variant: 'destructive',
        });
      }
    };

    handleSubscriptionResult();
  }, [searchParams, user, refreshSubscription]);

  // Carica la cronologia delle sottoscrizioni
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const historyData = await getSubscriptionHistory();
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading subscription history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'history') {
      loadHistory();
    }
  }, [user, activeTab, getSubscriptionHistory]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please log in to view this page.</p>
      </div>
    );
  }

  const handleUpgrade = async (plan: 'free' | 'premium' | 'ai') => {
    try {
      await upgradeSubscription(plan);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: 'Error',
        description: 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!subscription?.stripeSubscriptionId) {
      console.log('Page - Cannot cancel subscription: no subscription ID');
      toast({
        title: 'Error',
        description: 'No active subscription found to cancel.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Page - Attempting to cancel subscription:', subscription.stripeSubscriptionId);
      await cancelSubscription();
      console.log('Page - Subscription canceled successfully');

      // Aggiorna la cronologia
      await loadHistory();

      toast({
        title: 'Subscription Canceled',
        description: `Your subscription has been canceled. You will continue to have Premium access until ${formatDate(subscription.currentPeriodEnd?.toISOString() || subscription.validUntil.toISOString())}.`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Page - Error canceling subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'There was an error canceling your subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const PricingFeature = ({ included, children }: { included: boolean; children: React.ReactNode }) => (
    <div className="flex items-center space-x-2">
      {included ? (
        <CheckIcon className="h-5 w-5 text-primary" />
      ) : (
        <XIcon className="h-5 w-5 text-muted-foreground" />
      )}
      <span className={included ? 'text-foreground' : 'text-muted-foreground'}>{children}</span>
    </div>
  );

  return (
    <PageLayout transitionType="fade">
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
            <Link href="/profile" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </div>

          <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center">
                <TagIcon className="h-6 w-6 mr-2" />
                Subscription Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your subscription plan and payment details
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center justify-center">
                <RocketIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center justify-center">
                <TagIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Plans</span>
                <span className="sm:hidden">Plans</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center justify-center">
                <HistoryIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Current Subscription</CardTitle>
                    {subscription && (
                      <Badge
                        variant={subscription.tier !== 'free' ? 'default' : 'outline'}
                        className={`text-sm ${subscription.tier === 'ai' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : ''}`}
                      >
                        {subscription.tier === 'premium'
                          ? 'Premium'
                          : subscription.tier === 'ai'
                            ? 'AI Assistant'
                            : 'Free'}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Your current plan and subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {subscription ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Plan</h3>
                          <p className="text-lg font-medium capitalize">{subscription.tier}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                          <p className="text-lg font-medium capitalize">
                            {subscription.status}
                            {subscription.cancelAtPeriodEnd && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                (Cancels on {formatDate(subscription.currentPeriodEnd?.toISOString() || subscription.validUntil.toISOString())})
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Valid Until</h3>
                          <p className="text-lg font-medium">{formatDate(subscription.validUntil.toISOString())}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Next Payment</h3>
                          <p className="text-lg font-medium">
                            {subscription.tier === 'free' ? 'No payment required' :
                             subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd.toISOString()) :
                             formatDate(subscription.validUntil.toISOString())}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Features Included</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <PricingFeature included={true}>Basic itinerary planning</PricingFeature>
                          <PricingFeature included={true}>Expense tracking</PricingFeature>
                          <PricingFeature included={true}>Trip collaboration</PricingFeature>
                          <PricingFeature included={subscription.tier !== 'free'}>Unlimited trips</PricingFeature>
                          <PricingFeature included={subscription.tier !== 'free' || subscription.cancelAtPeriodEnd}>Accommodations management</PricingFeature>
                          <PricingFeature included={subscription.tier !== 'free' || subscription.cancelAtPeriodEnd}>Transportation tracking</PricingFeature>

                          {subscription.tier === 'ai' && (
                            <>
                              <PricingFeature included={true}>
                                <span className="flex items-center">
                                  <SparklesIcon className="h-3 w-3 mr-1 text-purple-500" />
                                  AI Travel Assistant
                                </span>
                              </PricingFeature>
                              <PricingFeature included={true}>
                                <span className="flex items-center">
                                  <SparklesIcon className="h-3 w-3 mr-1 text-purple-500" />
                                  Itinerary Wizard
                                </span>
                              </PricingFeature>
                              <PricingFeature included={true}>
                                <span className="flex items-center">
                                  <SparklesIcon className="h-3 w-3 mr-1 text-purple-500" />
                                  Smart Trip Recommendations
                                </span>
                              </PricingFeature>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Loading subscription information...</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  {subscription?.tier === 'free' ? (
                    <Button onClick={() => handleUpgrade('premium')} className="w-full sm:w-auto">
                      Upgrade to Premium
                    </Button>
                  ) : subscription?.cancelAtPeriodEnd ? (
                    <Button variant="outline" onClick={() => handleUpgrade('premium')} className="w-full sm:w-auto">
                      Resubscribe
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                      Cancel Subscription
                    </Button>
                  )}
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/pricing">View All Plans</Link>
                  </Button>
                </CardFooter>

                {/* Componente di test per il webhook */}
                {process.env.NODE_ENV === 'development' && <TestWebhook />}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Summary</CardTitle>
                  <CardDescription>
                    Your current usage and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm font-medium">Trips</h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.tier === 'free' ? '0/3 trips' : 'Unlimited'}
                      </p>
                    </div>
                    {subscription?.tier === 'free' && (
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm font-medium mb-3">
                      {subscription?.tier === 'ai' ? 'Premium Features (Included)' : 'Premium Features'}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm">Accommodations</p>
                        <Badge variant={subscription?.tier !== 'free' ? 'default' : 'outline'} className="text-xs">
                          {subscription?.tier !== 'free' ? 'Available' : 'Premium Only'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm">Transportation</p>
                        <Badge variant={subscription?.tier !== 'free' ? 'default' : 'outline'} className="text-xs">
                          {subscription?.tier !== 'free' ? 'Available' : 'Premium Only'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {subscription?.tier === 'ai' && (
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-3 text-purple-500 flex items-center">
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        AI Assistant Features
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm">AI Travel Assistant</p>
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                            Available
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm">Itinerary Wizard</p>
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                            Available
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm">Smart Trip Recommendations</p>
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                            Available
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plans Tab */}
            <TabsContent value="plans" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
                <Card className={`border-2 ${subscription?.tier === 'free' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <StarIcon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Free</CardTitle>
                    <CardDescription>Perfect for occasional travelers</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">€0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PricingFeature included={true}>Up to 3 trips</PricingFeature>
                    <PricingFeature included={true}>Basic itinerary planning</PricingFeature>
                    <PricingFeature included={true}>Expense tracking</PricingFeature>
                    <PricingFeature included={true}>Trip collaboration</PricingFeature>
                    <PricingFeature included={false}>Accommodations management</PricingFeature>
                    <PricingFeature included={false}>Transportation tracking</PricingFeature>
                    <PricingFeature included={false}>Priority support</PricingFeature>
                  </CardContent>
                  <CardFooter className="flex justify-center pt-4">
                    {subscription?.tier === 'free' ? (
                      <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpgrade('free')}
                      >
                        Downgrade
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* Premium Plan */}
                <Card className={`border-2 ${subscription?.tier === 'premium' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow relative`}>
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                  </div>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <RocketIcon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Premium</CardTitle>
                    <CardDescription>For frequent travelers</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">€4.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PricingFeature included={true}>Unlimited trips</PricingFeature>
                    <PricingFeature included={true}>Advanced itinerary planning</PricingFeature>
                    <PricingFeature included={true}>Expense tracking</PricingFeature>
                    <PricingFeature included={true}>Trip collaboration</PricingFeature>
                    <PricingFeature included={true}>Accommodations management</PricingFeature>
                    <PricingFeature included={true}>Transportation tracking</PricingFeature>
                    <PricingFeature included={true}>Priority support</PricingFeature>
                  </CardContent>
                  <CardFooter className="flex justify-center pt-4">
                    {subscription?.tier === 'premium' ? (
                      <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade('premium')}
                      >
                        Upgrade
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* AI Plan */}
                <Card className={`border-2 ${subscription?.tier === 'ai' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow`}>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <SparklesIcon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>For smart travelers</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">€9.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PricingFeature included={true}>All Premium features</PricingFeature>
                    <PricingFeature included={true}>AI trip recommendations</PricingFeature>
                    <PricingFeature included={true}>Smart itinerary optimization</PricingFeature>
                    <PricingFeature included={true}>Budget forecasting</PricingFeature>
                    <PricingFeature included={true}>Personalized travel insights</PricingFeature>
                    <PricingFeature included={true}>24/7 AI travel assistant</PricingFeature>
                    <PricingFeature included={true}>Early access to new features</PricingFeature>
                  </CardContent>
                  <CardFooter className="flex justify-center pt-4">
                    {subscription?.tier === 'ai' ? (
                      <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                        onClick={() => handleUpgrade('ai')}
                      >
                        Upgrade
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    Your subscription payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Loading payment history...</p>
                    </div>
                  ) : subscription?.tier === 'free' ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No payment history available for Free plan</p>
                      <Button onClick={() => handleUpgrade('premium')} className="mt-4">
                        Upgrade to Premium
                      </Button>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No payment history available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history
                        .filter(item => ['payment_succeeded', 'payment_failed'].includes(item.event_type))
                        .map((item, index) => (
                          <div key={index} className="flex items-start gap-4 p-3 border border-border rounded-md">
                            <div className={`bg-${item.event_type === 'payment_succeeded' ? 'green' : 'red'}-100 p-2 rounded-full`}>
                              <CreditCardIcon className={`h-5 w-5 text-${item.event_type === 'payment_succeeded' ? 'green' : 'red'}-500`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {item.event_type === 'payment_succeeded' ? 'Payment Succeeded' : 'Payment Failed'}
                                </p>
                                <Badge variant={item.event_type === 'payment_succeeded' ? 'default' : 'destructive'}>
                                  {item.event_type === 'payment_succeeded' ? 'Paid' : 'Failed'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.event_timestamp)}
                              </p>
                              {item.details?.amount_total && (
                                <p className="text-sm font-medium mt-1">
                                  {formatCurrency(item.details.amount_total / 100, item.details.currency || 'EUR')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Changes</CardTitle>
                  <CardDescription>
                    History of changes to your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Loading subscription history...</p>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No subscription history available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history
                        .filter(item => !['payment_succeeded', 'payment_failed'].includes(item.event_type))
                        .map((item, index) => {
                          let icon = <TagIcon className="h-5 w-5 text-primary" />;
                          let title = 'Subscription Updated';
                          let bgColor = 'bg-primary/10';

                          if (item.event_type === 'subscription_created') {
                            icon = <TagIcon className="h-5 w-5 text-primary" />;
                            title = 'Subscription Created';
                            bgColor = 'bg-primary/10';
                          } else if (item.event_type === 'subscription_updated') {
                            icon = <SettingsIcon className="h-5 w-5 text-amber-500" />;
                            title = 'Subscription Updated';
                            bgColor = 'bg-amber-100';
                          } else if (item.event_type === 'subscription_canceled' || item.event_type === 'subscription_deleted') {
                            icon = <XIcon className="h-5 w-5 text-red-500" />;
                            title = item.event_type === 'subscription_canceled' ? 'Subscription Canceled' : 'Subscription Deleted';
                            bgColor = 'bg-red-100';
                          } else if (item.event_type === 'checkout_completed') {
                            icon = <CheckIcon className="h-5 w-5 text-green-500" />;
                            title = 'Checkout Completed';
                            bgColor = 'bg-green-100';
                          }

                          return (
                            <div key={index} className="flex items-start gap-4">
                              <div className={`${bgColor} p-2 rounded-full`}>
                                {icon}
                              </div>
                              <div>
                                <p className="font-medium">{title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(item.event_timestamp)}
                                </p>
                                {item.tier && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {`Plan: ${item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}`}
                                  </p>
                                )}
                                {item.status && (
                                  <p className="text-sm text-muted-foreground">
                                    {`Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageLayout>
  );
}
