'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon, SparklesIcon, RocketIcon, StarIcon } from 'lucide-react';
import DirectCheckoutButton from '@/components/subscription/DirectCheckoutButton';
import CustomerPortalButton from '@/components/subscription/CustomerPortalButton';
import { useToast } from '@/components/ui/use-toast';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { subscription, isSubscribed } = useSubscription();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'ai'>(
    subscription?.tier || 'free'
  );

  // Check for success or canceled parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const tier = searchParams.get('tier');

    if (success) {
      toast({
        title: 'Subscription successful!',
        description: 'Your subscription has been activated.',
        variant: 'default',
      });
    } else if (canceled) {
      toast({
        title: 'Subscription canceled',
        description: 'Your subscription process was canceled.',
        variant: 'destructive',
      });
    }

    // Set the selected plan from URL parameter
    if (tier && (tier === 'free' || tier === 'premium' || tier === 'ai')) {
      setSelectedPlan(tier);
    }
  }, [searchParams, toast]);

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
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-foreground">Pricing Plans</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Choose the Perfect Plan for Your Adventures</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're planning a single trip or multiple journeys, we have a plan that fits your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Free Plan */}
            <Card className={`border-2 ${selectedPlan === 'free' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow`}>
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
                {isSubscribed('free') && !isSubscribed('premium') ? (
                  <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                ) : (
                  <Button
                    variant={selectedPlan === 'free' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('free')}
                    disabled={isSubscribed('free') && !isSubscribed('premium')}
                  >
                    {isSubscribed('premium') ? 'Downgrade' : 'Select'}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className={`border-2 ${selectedPlan === 'premium' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow relative`}>
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
                {isSubscribed('premium') ? (
                  <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                ) : (
                  <Button
                    variant={selectedPlan === 'premium' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('premium')}
                  >
                    Select
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

          {selectedPlan && selectedPlan !== subscription?.tier && (
            <div className="flex justify-center mt-8">
              {selectedPlan === 'free' && isSubscribed('premium') ? (
                <CustomerPortalButton className="px-8">
                  Downgrade to Free
                </CustomerPortalButton>
              ) : selectedPlan === 'premium' && !isSubscribed('premium') ? (
                <DirectCheckoutButton tier="premium" className="px-8">
                  Upgrade to Premium
                </DirectCheckoutButton>
              ) : null}
            </div>
          )}

          {subscription?.stripeCustomerId && (
            <div className="flex justify-center mt-4">
              <CustomerPortalButton variant="outline">
                Manage Current Subscription
              </CustomerPortalButton>
            </div>
          )}

          <div className="mt-16 bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Can I upgrade or downgrade my plan at any time?</h4>
                <p className="text-muted-foreground">Yes, you can change your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, you'll keep premium features until the end of your billing period.</p>
              </div>
              <div>
                <h4 className="font-medium">What happens to my data if I downgrade?</h4>
                <p className="text-muted-foreground">Your data is always preserved. However, if you downgrade to Free and have more than 3 trips, you won't be able to create new trips until you're below the limit. You'll also lose access to Accommodations and Transportation features.</p>
              </div>
              <div>
                <h4 className="font-medium">When will the AI Assistant plan be available?</h4>
                <p className="text-muted-foreground">We're working hard to bring AI features to VoyageSmart. Sign up for our newsletter to be the first to know when it launches.</p>
              </div>
              <div>
                <h4 className="font-medium">How do I cancel my subscription?</h4>
                <p className="text-muted-foreground">You can cancel your subscription at any time from your account settings. After cancellation, you'll continue to have access to premium features until the end of your current billing period.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}
