'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon, SparklesIcon, RocketIcon, StarIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, isSubscribed, upgradeSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'ai'>(
    subscription?.tier || 'free'
  );

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
                {subscription?.tier === 'free' ? (
                  <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                ) : (
                  <Button
                    variant={selectedPlan === 'free' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('free')}
                    disabled={subscription?.tier === 'free'}
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
                {subscription?.tier === 'premium' ? (
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
            <Card className={`border-2 ${selectedPlan === 'ai' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow`}>
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
                    variant={selectedPlan === 'ai' ? 'default' : 'outline'}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                    onClick={() => setSelectedPlan('ai')}
                  >
                    Select
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {selectedPlan && selectedPlan !== subscription?.tier && (
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={() => handleUpgrade(selectedPlan)}
                className="animate-pulse-once"
              >
                {subscription?.tier === 'free' && selectedPlan === 'premium'
                  ? 'Upgrade to Premium'
                  : subscription?.tier === 'premium' && selectedPlan === 'free'
                  ? 'Downgrade to Free'
                  : `Switch to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`}
              </Button>
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
                <h4 className="font-medium">What AI features are included in the AI Assistant plan?</h4>
                <p className="text-muted-foreground">The AI Assistant plan includes a 24/7 AI travel assistant, smart itinerary generation, personalized recommendations, and more advanced AI features to enhance your travel planning experience.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}
