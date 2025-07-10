# Subscription Implementation

This document provides detailed information about the subscription system implementation in VoyageSmart, including Stripe integration, subscription plans, and promotional features.

## 📋 Table of Contents
- [Overview](#overview)
- [Subscription Plans](#subscription-plans)
- [Stripe Integration](#stripe-integration)
- [Promotional System](#promotional-system)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Implementation](#frontend-implementation)
- [Security Considerations](#security-considerations)

## 🎯 Overview

VoyageSmart implements a subscription-based model with multiple tiers to provide different levels of functionality. The system is built on Stripe for payment processing and includes promotional features for user acquisition and retention.

### Key Features
- **Multiple subscription tiers** (Free, Premium, AI Assistant)
- **Stripe payment processing** with webhooks
- **Promotional code system** for discounts and free trials
- **Referral program** for user acquisition
- **Subscription management** with upgrade/downgrade capabilities
- **Usage tracking** and limits enforcement

## 💳 Subscription Plans

### Free Plan
- **Price**: $0/month
- **Features**:
  - Basic trip management
  - Up to 3 trips
  - Basic itinerary planning
  - Limited file uploads
  - Community support

### Premium Plan
- **Price**: $9.99/month
- **Features**:
  - Unlimited trips
  - Advanced itinerary planning
  - Unlimited file uploads
  - Collaboration features
  - Priority support
  - Export capabilities

### AI Assistant Plan
- **Price**: $19.99/month
- **Features**:
  - All Premium features
  - AI Travel Assistant chatbot
  - AI Itinerary Generation Wizard
  - Smart recommendations
  - Advanced analytics
  - Premium support

## 🔌 Stripe Integration

### Setup
- **Stripe Account**: Configured for production and test environments
- **Webhooks**: Configured to handle subscription events
- **Products**: Created in Stripe dashboard for each plan
- **Prices**: Configured for monthly billing cycles

### Webhook Events
The system handles the following Stripe webhook events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Implementation Details
```typescript
// Webhook endpoint: /api/webhooks/stripe
- Verifies webhook signature
- Processes subscription events
- Updates user subscription status
- Handles payment failures and retries
```

### Customer Management
- **Customer Creation**: Automatic when user subscribes
- **Subscription Management**: Via Stripe Customer Portal
- **Payment Methods**: Credit/debit cards via Stripe Elements
- **Billing History**: Accessible through customer portal

## 🎁 Promotional System

### Promotional Codes
- **Code Generation**: Admin-generated promotional codes
- **Usage Tracking**: Prevents multiple redemptions per user
- **Expiration Dates**: Configurable expiration for codes
- **Plan Assignment**: Codes can grant specific subscription plans

### Referral Program
- **Referral Rewards**:
  - 3 referrals = 1 month free Premium
  - 5 referrals = 1 month free AI Assistant
- **Tracking**: Referral links and conversion tracking
- **Rewards**: Automatic subscription upgrades

### Free Trials
- **7-day AI Assistant trial** for new users
- **Automatic conversion** to paid plan after trial
- **Trial limitations** to prevent abuse

## 🗄️ Database Schema

### Users Table Extensions
```sql
-- Additional columns in users table
preferences JSONB DEFAULT '{
  "subscription_plan": "free",
  "subscription_status": "active",
  "stripe_customer_id": null,
  "subscription_end_date": null,
  "trial_end_date": null,
  "referral_code": null,
  "referred_by": null
}'::jsonb
```

### Promotional Codes Table
```sql
CREATE TABLE promotional_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  duration_months INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### User Promo Redemptions Table
```sql
CREATE TABLE user_promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  promo_code_id UUID REFERENCES promotional_codes(id) NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, promo_code_id)
);
```

## 🔄 API Endpoints

### Subscription Management
- `POST /api/subscription/create` - Create new subscription
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/status` - Get current subscription status
- `POST /api/subscription/portal` - Access customer portal

### Promotional Features
- `POST /api/promo/redeem` - Redeem promotional code
- `GET /api/promo/status` - Check promo code status
- `DELETE /api/promo/remove` - Remove active promo code
- `POST /api/admin/promo/create` - Create promotional code (admin only)

### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

## 🖥️ Frontend Implementation

### Subscription Components
- **SubscriptionCard**: Display current plan and features
- **PricingPlans**: Show available plans and pricing
- **PromoCodeForm**: Redeem promotional codes
- **SubscriptionModal**: Upgrade/downgrade interface

### State Management
```typescript
// Subscription state in Redux store
interface SubscriptionState {
  plan: 'free' | 'premium' | 'ai_assistant';
  status: 'active' | 'canceled' | 'past_due';
  endDate: string | null;
  trialEndDate: string | null;
  promoCode: string | null;
  promoExpiry: string | null;
}
```

### Feature Gating
```typescript
// Example feature gating
const hasAIAccess = subscription.plan === 'ai_assistant' && 
                   subscription.status === 'active';

if (!hasAIAccess) {
  // Show upgrade prompt
  return <UpgradePrompt feature="AI Assistant" />;
}
```

## 🔒 Security Considerations

### Webhook Security
- **Signature Verification**: All webhooks verified with Stripe signature
- **Idempotency**: Duplicate webhook handling prevention
- **Error Handling**: Graceful handling of webhook failures

### Subscription Validation
- **Server-side Checks**: All subscription checks performed server-side
- **Real-time Validation**: Subscription status checked on each request
- **Fallback Handling**: Graceful degradation when Stripe is unavailable

### Data Protection
- **PCI Compliance**: No card data stored locally
- **Stripe Elements**: Secure payment form handling
- **Encryption**: Sensitive data encrypted at rest

## 📊 Usage Tracking

### Metrics Tracked
- **Subscription Conversions**: Free to paid conversion rates
- **Churn Rate**: Monthly subscription cancellations
- **Feature Usage**: AI feature usage by plan type
- **Promotional Effectiveness**: Promo code redemption rates

### Analytics Integration
- **Stripe Analytics**: Built-in subscription analytics
- **Custom Metrics**: Application-specific usage tracking
- **User Behavior**: Feature adoption and usage patterns

## 🚀 Future Enhancements

### Planned Features
- **Annual Billing**: Discounted annual subscription options
- **Team Plans**: Multi-user subscription plans
- **Usage-based Billing**: Pay-per-use for certain features
- **Gift Subscriptions**: Allow users to gift subscriptions

### Technical Improvements
- **Subscription Forecasting**: Predict subscription trends
- **Advanced Promo System**: More flexible promotional rules
- **Integration APIs**: Allow third-party subscription management
- **Mobile Payments**: Apple Pay and Google Pay integration

## 🔧 Maintenance

### Regular Tasks
- **Webhook Monitoring**: Ensure webhooks are processing correctly
- **Subscription Sync**: Verify local data matches Stripe
- **Promo Code Cleanup**: Remove expired promotional codes
- **Usage Monitoring**: Track subscription plan usage

### Troubleshooting
- **Failed Payments**: Handle dunning management
- **Webhook Failures**: Retry failed webhook processing
- **Subscription Mismatches**: Reconcile local vs Stripe data
- **Customer Support**: Handle subscription-related issues

---

The subscription system is designed to be scalable and maintainable, with clear separation between payment processing (Stripe) and application logic. Regular monitoring and maintenance ensure reliable operation and positive user experience.
