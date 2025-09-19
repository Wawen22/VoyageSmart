# Stripe Integration

## Overview

Stripe handles all payment processing and subscription management for VoyageSmart. This integration provides secure payment processing, subscription billing, and webhook handling for real-time payment events.

## Setup and Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Client Setup

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Client-side Stripe
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    return import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    );
  }
  return null;
};
```

## Subscription Management

### Subscription Service

```typescript
// lib/services/stripeService.ts
export class StripeService {
  constructor(private stripe: Stripe) {}

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'voyagesmart'
      }
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
    });
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer']
    });
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, updates);
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    if (immediately) {
      return this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }
  }

  async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
  }

  async createPromoCode(
    couponId: string,
    code: string,
    maxRedemptions?: number
  ): Promise<Stripe.PromotionCode> {
    return this.stripe.promotionCodes.create({
      coupon: couponId,
      code,
      max_redemptions: maxRedemptions,
      restrictions: {
        first_time_transaction: true
      }
    });
  }
}
```

### Subscription Plans Configuration

```typescript
// lib/config/subscriptionPlans.ts
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  limits: {
    trips: number;
    participants: number;
    aiRequests: number;
  };
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '',
    features: [
      'Up to 3 trips',
      'Basic trip planning',
      'Expense tracking',
      'Up to 5 participants per trip'
    ],
    limits: {
      trips: 3,
      participants: 5,
      aiRequests: 0
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For serious travelers',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: 'price_premium_monthly',
    features: [
      'Unlimited trips',
      'Advanced trip planning',
      'Expense tracking & splitting',
      'Unlimited participants',
      'Priority support'
    ],
    limits: {
      trips: -1, // unlimited
      participants: -1, // unlimited
      aiRequests: 0
    }
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    description: 'Premium + AI-powered features',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: 'price_ai_monthly',
    features: [
      'Everything in Premium',
      'AI trip planning',
      'Smart recommendations',
      'Automated itinerary generation',
      'AI chat assistant'
    ],
    limits: {
      trips: -1, // unlimited
      participants: -1, // unlimited
      aiRequests: 1000
    }
  }
];

export function getPlanByStripePriceId(priceId: string): SubscriptionPlan | null {
  return subscriptionPlans.find(plan => plan.stripePriceId === priceId) || null;
}

export function getPlanById(planId: string): SubscriptionPlan | null {
  return subscriptionPlans.find(plan => plan.id === planId) || null;
}
```

## API Routes

### Checkout Session Creation

```typescript
// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { priceId, successUrl, cancelUrl } = await request.json();

    // Get or create Stripe customer
    let customerId: string;
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (user?.stripe_customer_id) {
      customerId = user.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          userId: session.user.id
        }
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id);
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: session.user.id
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      tier: getPlanByStripePriceId(subscription.items.data[0].price.id)?.id || 'free',
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    });
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(invoice.period_start * 1000),
      current_period_end: new Date(invoice.period_end * 1000),
    })
    .eq('stripe_subscription_id', subscriptionId);
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);
}

async function handleSubscriptionUpdated(subscription: any) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      tier: getPlanByStripePriceId(subscription.items.data[0].price.id)?.id || 'free',
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: any) {
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id);
}
```

### Customer Portal

```typescript
// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { returnUrl } = await request.json();

    // Get user's Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url
    });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

## Client-Side Integration

### Checkout Component

```typescript
// components/stripe/CheckoutButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getStripe } from '@/lib/stripe';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
  disabled?: boolean;
}

export function CheckoutButton({ priceId, planName, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        }),
      });

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? 'Processing...' : `Subscribe to ${planName}`}
    </Button>
  );
}
```

### Subscription Status Hook

```typescript
// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export interface Subscription {
  id: string;
  tier: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setSubscription({
            id: data.id,
            tier: data.tier,
            status: data.status,
            currentPeriodEnd: new Date(data.current_period_end),
            cancelAtPeriodEnd: data.cancel_at_period_end || false
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  const hasActiveSubscription = subscription?.status === 'active';
  const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'ai';
  const hasAI = subscription?.tier === 'ai';

  return {
    subscription,
    loading,
    hasActiveSubscription,
    isPremium,
    hasAI,
  };
}
```

## Error Handling

### Stripe Error Types

```typescript
// lib/errors/stripeErrors.ts
export class StripeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

export function handleStripeError(error: any): StripeError {
  if (error.type) {
    switch (error.type) {
      case 'card_error':
        return new StripeError(
          error.message,
          error.code,
          error.type,
          402
        );
      case 'rate_limit_error':
        return new StripeError(
          'Too many requests made to the API too quickly',
          error.code,
          error.type,
          429
        );
      case 'invalid_request_error':
        return new StripeError(
          error.message,
          error.code,
          error.type,
          400
        );
      case 'authentication_error':
        return new StripeError(
          'Authentication with Stripe failed',
          error.code,
          error.type,
          401
        );
      case 'api_connection_error':
        return new StripeError(
          'Network communication with Stripe failed',
          error.code,
          error.type,
          502
        );
      case 'api_error':
        return new StripeError(
          'An error occurred internally with Stripe',
          error.code,
          error.type,
          500
        );
      default:
        return new StripeError(error.message, error.code, error.type);
    }
  }

  return new StripeError(error.message || 'Unknown Stripe error');
}
```

## Testing

### Stripe Testing Setup

```typescript
// __tests__/stripe/stripeTestSetup.ts
import Stripe from 'stripe';

export const testStripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const testCards = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
};

export async function createTestCustomer(email: string = 'test@example.com') {
  return testStripe.customers.create({
    email,
    metadata: { test: 'true' }
  });
}

export async function cleanupTestData() {
  // Clean up test customers, subscriptions, etc.
  const customers = await testStripe.customers.list({
    limit: 100,
  });

  for (const customer of customers.data) {
    if (customer.metadata?.test === 'true') {
      await testStripe.customers.del(customer.id);
    }
  }
}
```

## Security Considerations

### Webhook Security

```typescript
// lib/security/webhookSecurity.ts
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
```

### PCI Compliance

1. **Never store card data** - Use Stripe's secure vaults
2. **Use HTTPS** for all communications
3. **Validate webhooks** with signature verification
4. **Implement proper error handling** without exposing sensitive data
5. **Use test keys** in development environments

## Monitoring and Analytics

### Stripe Analytics

```typescript
// lib/analytics/stripeAnalytics.ts
export class StripeAnalytics {
  static async getSubscriptionMetrics(period: 'month' | 'year' = 'month') {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    const metrics = {
      totalSubscriptions: subscriptions.data.length,
      monthlyRecurringRevenue: 0,
      churnRate: 0,
      averageRevenuePerUser: 0,
    };

    // Calculate MRR
    subscriptions.data.forEach(sub => {
      const amount = sub.items.data[0]?.price.unit_amount || 0;
      metrics.monthlyRecurringRevenue += amount / 100;
    });

    return metrics;
  }

  static async getPaymentMetrics() {
    const charges = await stripe.charges.list({
      limit: 100,
    });

    return {
      totalCharges: charges.data.length,
      successfulCharges: charges.data.filter(c => c.status === 'succeeded').length,
      failedCharges: charges.data.filter(c => c.status === 'failed').length,
      totalAmount: charges.data.reduce((sum, c) => sum + c.amount, 0) / 100,
    };
  }
}
```

## Best Practices

### Stripe Best Practices

1. **Use webhooks** for reliable event handling
2. **Implement idempotency** for webhook handlers
3. **Handle all subscription states** (active, past_due, cancelled, etc.)
4. **Use metadata** to link Stripe objects to your data
5. **Test with Stripe's test cards** and scenarios
6. **Monitor webhook delivery** and retry failed events
7. **Keep Stripe data in sync** with your database
8. **Use Stripe's customer portal** for self-service
9. **Implement proper error handling** for all scenarios
10. **Follow PCI compliance** guidelines
