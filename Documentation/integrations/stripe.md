# Stripe Integration

<div align="center">
  <h3>💳 Payment Processing with Stripe</h3>
  <p>Complete guide to integrating Stripe for payments and subscriptions in VoyageSmart.</p>
</div>

---

## 💰 Overview

VoyageSmart uses Stripe as its primary payment processor to handle subscriptions, one-time payments, and financial transactions. This integration enables secure payment processing, subscription management, and financial reporting.

### Key Features

- **Subscription Management** - AI Assistant plan subscriptions
- **One-time Payments** - Trip-related purchases and bookings
- **Secure Processing** - PCI-compliant payment handling
- **Multiple Payment Methods** - Cards, digital wallets, bank transfers
- **Global Support** - International payments and currencies
- **Webhook Integration** - Real-time payment status updates

---

## 🔧 Setup & Configuration

### Stripe Account Setup

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Complete business verification
   - Configure business settings

2. **Get API Keys**
   ```bash
   # Test Environment
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # Production Environment
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

3. **Configure Webhooks**
   ```bash
   # Webhook endpoint
   https://your-domain.com/api/webhooks/stripe
   
   # Required events
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   - payment_intent.succeeded
   ```

### Environment Variables

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product IDs
STRIPE_AI_ASSISTANT_PRICE_ID=price_1...
STRIPE_PREMIUM_PRICE_ID=price_1...

# Webhook Configuration
STRIPE_WEBHOOK_ENDPOINT_SECRET=whsec_...
```

---

## 🛒 Product & Pricing Setup

### Subscription Products

#### AI Assistant Plan
```javascript
// Stripe Dashboard Configuration
{
  name: "AI Assistant Plan",
  description: "Enhanced AI features for intelligent travel planning",
  pricing: {
    monthly: "$9.99/month",
    yearly: "$99.99/year" // 2 months free
  },
  features: [
    "Unlimited AI chat assistance",
    "Advanced itinerary generation",
    "Smart expense analysis",
    "Priority support"
  ]
}
```

#### Premium Plan
```javascript
// Future premium features
{
  name: "Premium Plan",
  description: "Complete travel planning suite with advanced features",
  pricing: {
    monthly: "$19.99/month",
    yearly: "$199.99/year"
  },
  features: [
    "All AI Assistant features",
    "Advanced analytics",
    "Team collaboration tools",
    "Custom integrations"
  ]
}
```

### Promo Codes & Discounts

```javascript
// Stripe Coupon Configuration
{
  id: "WELCOME2024",
  percent_off: 50,
  duration: "once",
  max_redemptions: 1000,
  metadata: {
    campaign: "welcome-offer",
    valid_until: "2024-12-31"
  }
}
```

---

## 💻 Implementation

### Stripe Client Setup

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Client-side Stripe
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

### Subscription Creation

```typescript
// pages/api/subscriptions/create.ts
import { stripe } from '../../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, customerId, couponId } = req.body;

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      ...(couponId && { coupon: couponId }),
      metadata: {
        userId: req.user.id,
        plan: 'ai-assistant'
      }
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Payment Intent for One-time Payments

```typescript
// pages/api/payments/create-intent.ts
export default async function handler(req, res) {
  try {
    const { amount, currency = 'eur', metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user.id,
        tripId: metadata.tripId,
        type: metadata.type
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🎯 Frontend Integration

### Subscription Component

```typescript
// components/SubscriptionForm.tsx
import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export const SubscriptionForm = ({ priceId, couponCode }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

    // Create subscription
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        customerId: user.stripeCustomerId,
        couponId: couponCode
      })
    });

    const { clientSecret } = await response.json();

    // Confirm payment
    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: user.name,
          email: user.email
        }
      }
    });

    if (error) {
      console.error('Payment failed:', error);
    } else {
      // Subscription successful
      router.push('/dashboard?subscription=success');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' }
            }
          }
        }}
      />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Subscribe'}
      </button>
    </form>
  );
};
```

### Payment Element Integration

```typescript
// components/PaymentForm.tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export const PaymentForm = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`
      }
    });

    if (error) {
      // Handle error
      console.error('Payment failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  );
};
```

---

## 🔔 Webhook Handling

### Webhook Endpoint

```typescript
// pages/api/webhooks/stripe.ts
import { buffer } from 'micro';
import { stripe } from '../../../lib/stripe';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

async function handleSubscriptionCreated(subscription) {
  // Update user subscription status in database
  await updateUserSubscription(subscription.metadata.userId, {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    plan: subscription.metadata.plan
  });
}
```

### Database Updates

```typescript
// lib/subscription-handlers.ts
import { supabase } from './supabase';

export async function updateUserSubscription(userId: string, data: any) {
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: data.stripeSubscriptionId,
      status: data.status,
      current_period_end: data.currentPeriodEnd,
      plan: data.plan,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
}

export async function handlePaymentSucceeded(invoice) {
  // Record successful payment
  await supabase.from('payments').insert({
    user_id: invoice.customer_metadata?.userId,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    created_at: new Date().toISOString()
  });

  // Send confirmation email
  await sendPaymentConfirmationEmail(invoice);
}
```

---

## 🔒 Security Best Practices

### API Key Security

```typescript
// Secure API key handling
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 10000
});

// Never expose secret keys in client-side code
// Use environment variables for all sensitive data
```

### Webhook Security

```typescript
// Always verify webhook signatures
try {
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
} catch (err) {
  // Invalid signature - reject the request
  return res.status(400).send('Invalid signature');
}
```

### Payment Validation

```typescript
// Validate payment amounts server-side
export async function validatePayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  // Verify amount matches expected value
  // Verify customer matches authenticated user
  // Verify payment status is succeeded
  
  return paymentIntent.status === 'succeeded';
}
```

---

## 📊 Analytics & Reporting

### Revenue Tracking

```typescript
// lib/analytics.ts
export async function trackRevenue(event: string, data: any) {
  // Track subscription events
  if (event === 'subscription_created') {
    await analytics.track('Subscription Created', {
      plan: data.plan,
      amount: data.amount,
      currency: data.currency,
      userId: data.userId
    });
  }
  
  // Track payment events
  if (event === 'payment_succeeded') {
    await analytics.track('Payment Succeeded', {
      amount: data.amount,
      currency: data.currency,
      type: data.type
    });
  }
}
```

### Subscription Metrics

```sql
-- Subscription analytics queries
SELECT 
  plan,
  COUNT(*) as active_subscriptions,
  SUM(amount) as monthly_revenue
FROM user_subscriptions 
WHERE status = 'active'
GROUP BY plan;

-- Churn analysis
SELECT 
  DATE_TRUNC('month', cancelled_at) as month,
  COUNT(*) as churned_subscriptions
FROM user_subscriptions 
WHERE status = 'cancelled'
GROUP BY month
ORDER BY month;
```

---

## 🔧 Testing

### Test Environment Setup

```bash
# Use Stripe test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Test webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Payment Methods

```javascript
// Test card numbers
const testCards = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002'
};
```

---

## 🔗 Related Documentation

- **[API Documentation](../api/)** - Payment API endpoints
- **[Security Guidelines](../development/security-implementations.md)** - Security best practices
- **[Testing Framework](../development/testing-framework.md)** - Testing payment flows

---

<div align="center">
  <p>
    <a href="./mapbox.md">← Back to Mapbox</a> •
    <a href="./gemini-ai.md">Next: Gemini AI →</a>
  </p>
</div>
