# Subscription Implementation

## Overview

VoyageSmart implements a comprehensive subscription system using Stripe for payment processing and Supabase for subscription management. This document covers the technical implementation, billing logic, and subscription lifecycle management.

## Subscription Tiers

### Plan Structure

```typescript
// types/subscription.ts
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
    trips: number; // -1 for unlimited
    participants: number; // -1 for unlimited
    aiRequests: number;
    storage: number; // in GB
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
      'Up to 5 participants per trip',
      '1GB storage'
    ],
    limits: {
      trips: 3,
      participants: 5,
      aiRequests: 0,
      storage: 1
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
      'Priority support',
      '10GB storage'
    ],
    limits: {
      trips: -1,
      participants: -1,
      aiRequests: 0,
      storage: 10
    },
    popular: true
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
      'AI chat assistant',
      '1000 AI requests/month',
      '50GB storage'
    ],
    limits: {
      trips: -1,
      participants: -1,
      aiRequests: 1000,
      storage: 50
    }
  }
];
```

## Database Schema

### Subscription Tables

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  stripe_promotion_code_id TEXT UNIQUE,
  discount_type TEXT NOT NULL, -- 'percentage' or 'amount'
  discount_value DECIMAL(10,2) NOT NULL,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo code redemptions table
CREATE TABLE promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
```

## Subscription Service

### Core Subscription Logic

```typescript
// lib/services/subscriptionService.ts
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

export class SubscriptionService {
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Failed to fetch subscription');
    }

    if (!data) {
      // Return free plan as default
      return {
        id: 'free',
        tier: 'free',
        status: 'active',
        limits: SUBSCRIPTION_PLANS[0].limits,
        features: SUBSCRIPTION_PLANS[0].features,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      };
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === data.tier);
    return {
      id: data.id,
      tier: data.tier,
      status: data.status,
      limits: plan?.limits || SUBSCRIPTION_PLANS[0].limits,
      features: plan?.features || SUBSCRIPTION_PLANS[0].features,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
      cancelAtPeriodEnd: data.cancel_at_period_end
    };
  }

  async checkFeatureAccess(
    userId: string,
    feature: 'trips' | 'participants' | 'aiRequests' | 'storage'
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.limits[feature];

    // Get current usage
    const current = await this.getCurrentUsage(userId, feature);

    return {
      allowed: limit === -1 || current < limit,
      current,
      limit: limit === -1 ? Infinity : limit
    };
  }

  async incrementUsage(
    userId: string,
    feature: string,
    amount: number = 1
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await supabaseAdmin
      .from('subscription_usage')
      .upsert({
        user_id: userId,
        feature,
        usage_count: amount,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString()
      }, {
        onConflict: 'user_id,feature,period_start',
        ignoreDuplicates: false
      });
  }

  private async getCurrentUsage(userId: string, feature: string): Promise<number> {
    switch (feature) {
      case 'trips':
        const { count: tripCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId);
        return tripCount || 0;

      case 'aiRequests':
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const { data: usage } = await supabase
          .from('subscription_usage')
          .select('usage_count')
          .eq('user_id', userId)
          .eq('feature', 'aiRequests')
          .gte('period_start', monthStart.toISOString())
          .single();

        return usage?.usage_count || 0;

      case 'storage':
        // Calculate storage usage from uploaded files
        const { data: files } = await supabase.storage
          .from('trip-files')
          .list(userId);

        return files?.reduce((total, file) => total + (file.metadata?.size || 0), 0) || 0;

      default:
        return 0;
    }
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    promoCode?: string
  ): Promise<{ sessionId: string; url: string }> {
    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: { userId }
      });

      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const sessionData: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: { userId },
      allow_promotion_codes: true
    };

    if (promoCode) {
      // Validate promo code
      const { data: promoData } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode)
        .eq('active', true)
        .single();

      if (promoData && promoData.stripe_promotion_code_id) {
        sessionData.discounts = [{ promotion_code: promoData.stripe_promotion_code_id }];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return {
      sessionId: session.id,
      url: session.url!
    };
  }

  async cancelSubscription(userId: string, immediately: boolean = false): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.tier === 'free') {
      throw new Error('No active subscription to cancel');
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!data?.stripe_subscription_id) {
      throw new Error('Stripe subscription not found');
    }

    if (immediately) {
      await stripe.subscriptions.cancel(data.stripe_subscription_id);
    } else {
      await stripe.subscriptions.update(data.stripe_subscription_id, {
        cancel_at_period_end: true
      });
    }
  }

  async reactivateSubscription(userId: string): Promise<void> {
    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!data?.stripe_subscription_id) {
      throw new Error('Stripe subscription not found');
    }

    await stripe.subscriptions.update(data.stripe_subscription_id, {
      cancel_at_period_end: false
    });
  }
}
```

## Promo Code System

### Promo Code Management

```typescript
// lib/services/promoCodeService.ts
export class PromoCodeService {
  async createPromoCode(
    code: string,
    discountType: 'percentage' | 'amount',
    discountValue: number,
    options: {
      maxRedemptions?: number;
      validUntil?: Date;
      createdBy?: string;
    } = {}
  ): Promise<PromoCode> {
    // Create Stripe promotion code
    const coupon = await stripe.coupons.create({
      [discountType === 'percentage' ? 'percent_off' : 'amount_off']: discountValue,
      currency: discountType === 'amount' ? 'usd' : undefined,
      duration: 'once'
    });

    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: options.maxRedemptions,
      expires_at: options.validUntil ? Math.floor(options.validUntil.getTime() / 1000) : undefined
    });

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        code,
        stripe_promotion_code_id: promotionCode.id,
        discount_type: discountType,
        discount_value: discountValue,
        max_redemptions: options.maxRedemptions,
        valid_until: options.validUntil?.toISOString(),
        created_by: options.createdBy
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create promo code');
    return data;
  }

  async validatePromoCode(code: string, userId: string): Promise<{
    valid: boolean;
    reason?: string;
    promoCode?: PromoCode;
  }> {
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single();

    if (!promoCode) {
      return { valid: false, reason: 'Promo code not found' };
    }

    // Check if expired
    if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
      return { valid: false, reason: 'Promo code has expired' };
    }

    // Check if max redemptions reached
    if (promoCode.max_redemptions && promoCode.current_redemptions >= promoCode.max_redemptions) {
      return { valid: false, reason: 'Promo code has reached maximum redemptions' };
    }

    // Check if user already redeemed
    const { data: redemption } = await supabase
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId)
      .single();

    if (redemption) {
      return { valid: false, reason: 'You have already used this promo code' };
    }

    return { valid: true, promoCode };
  }

  async redeemPromoCode(promoCodeId: string, userId: string, subscriptionId?: string): Promise<void> {
    await supabaseAdmin.rpc('redeem_promo_code', {
      p_promo_code_id: promoCodeId,
      p_user_id: userId,
      p_subscription_id: subscriptionId
    });
  }

  async getActivePromoCodes(): Promise<PromoCode[]> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch promo codes');
    return data || [];
  }
}
```

## Usage Enforcement

### Middleware for Feature Access

```typescript
// lib/middleware/subscriptionMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';

export async function enforceSubscriptionLimits(
  request: NextRequest,
  feature: 'trips' | 'participants' | 'aiRequests' | 'storage'
): Promise<NextResponse | null> {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscriptionService = new SubscriptionService();
  const access = await subscriptionService.checkFeatureAccess(userId, feature);

  if (!access.allowed) {
    return NextResponse.json({
      error: 'Subscription limit exceeded',
      details: {
        feature,
        current: access.current,
        limit: access.limit,
        upgradeRequired: true
      }
    }, { status: 402 });
  }

  return null; // Allow request to proceed
}
```

### React Hook for Subscription

```typescript
// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { SubscriptionService } from '@/lib/services/subscriptionService';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const sub = await subscriptionService.getUserSubscription(user.id);
        setSubscription(sub);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  const checkFeatureAccess = async (feature: string) => {
    if (!user) return { allowed: false, current: 0, limit: 0 };
    return subscriptionService.checkFeatureAccess(user.id, feature as any);
  };

  const hasFeature = (feature: string): boolean => {
    return subscription?.features.includes(feature) || false;
  };

  const isOnPlan = (planId: string): boolean => {
    return subscription?.tier === planId;
  };

  return {
    subscription,
    loading,
    checkFeatureAccess,
    hasFeature,
    isOnPlan,
    isPremium: isOnPlan('premium') || isOnPlan('ai'),
    hasAI: isOnPlan('ai')
  };
}
```

## Webhook Handling

### Stripe Webhook Processing

```typescript
// app/api/stripe/webhook/route.ts
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
  }

  return new Response('OK');
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const plan = getPlanByStripePriceId(subscription.items.data[0].price.id);

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      tier: plan?.id || 'free',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    });
}
```

## Testing

### Subscription Testing

```typescript
// __tests__/subscription/subscriptionService.test.ts
import { SubscriptionService } from '@/lib/services/subscriptionService';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  it('should return free plan for users without subscription', async () => {
    const subscription = await service.getUserSubscription('test-user-id');
    
    expect(subscription.tier).toBe('free');
    expect(subscription.limits.trips).toBe(3);
  });

  it('should enforce trip limits for free users', async () => {
    const access = await service.checkFeatureAccess('test-user-id', 'trips');
    
    expect(access.limit).toBe(3);
    expect(typeof access.allowed).toBe('boolean');
  });
});
```

## Best Practices

### Subscription Implementation Guidelines

1. **Graceful Degradation**: Always provide fallback to free tier
2. **Usage Tracking**: Monitor feature usage for billing accuracy
3. **Webhook Reliability**: Implement idempotent webhook handlers
4. **Security**: Validate all subscription checks server-side
5. **User Experience**: Provide clear upgrade prompts and limits
