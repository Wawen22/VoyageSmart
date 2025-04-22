'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
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
  const { user } = useAuth();
  const { subscription, isSubscribed, upgradeSubscription } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please log in to view this page.</p>
      </div>
    );
  }

  const handleUpgrade = async (plan: 'free' | 'premium' | 'ai') => {
    // For now, just simulate upgrading by redirecting to pricing page
    router.push('/pricing');
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
                      <Badge variant={subscription.tier === 'premium' ? 'default' : 'outline'} className="text-sm">
                        {subscription.tier === 'premium' ? 'Premium' : 'Free'}
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
                          <p className="text-lg font-medium capitalize">{subscription.status}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Valid Until</h3>
                          <p className="text-lg font-medium">{formatDate(subscription.validUntil.toISOString())}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Next Payment</h3>
                          <p className="text-lg font-medium">
                            {subscription.tier === 'free' ? 'No payment required' : formatDate(subscription.validUntil.toISOString())}
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
                          <PricingFeature included={subscription.tier !== 'free'}>Accommodations management</PricingFeature>
                          <PricingFeature included={subscription.tier !== 'free'}>Transportation tracking</PricingFeature>
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
                  ) : (
                    <Button variant="outline" onClick={() => handleUpgrade('free')} className="w-full sm:w-auto">
                      Manage Subscription
                    </Button>
                  )}
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/pricing">View All Plans</Link>
                  </Button>
                </CardFooter>
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
                    <h3 className="text-sm font-medium mb-3">Premium Features</h3>
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
                <Card className="border-2 border-border hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <SparklesIcon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>Coming Soon</CardDescription>
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
                    <Badge variant="outline" className="px-4 py-2">Coming Soon</Badge>
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
                  {subscription?.tier === 'free' ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No payment history available for Free plan</p>
                      <Button onClick={() => handleUpgrade('premium')} className="mt-4">
                        Upgrade to Premium
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Payment history will be available once Stripe integration is complete</p>
                      <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
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
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <TagIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Subscription Created</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription ? formatDate(subscription.validUntil.toISOString()) : 'Loading...'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {`Initial ${subscription?.tier || ''} plan created`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageLayout>
  );
}
