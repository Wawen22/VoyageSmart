# Integrations

This section provides detailed documentation on the external services and APIs that VoyageSmart integrates with.

## 📋 Contents

- [Supabase](./supabase.md) - Database, authentication, and storage
- [Stripe](./stripe.md) - Payment processing and subscription management
- [Mapbox](./mapbox.md) - Maps and location services
- [Gemini AI](./gemini-ai.md) - AI-powered features

## 🔌 Integration Overview

VoyageSmart integrates with several external services to provide a comprehensive travel planning experience:

### Supabase

Supabase provides the backbone of VoyageSmart's infrastructure:

- **Database**: PostgreSQL database for storing all application data
- **Authentication**: User authentication and authorization
- **Storage**: File storage for documents, receipts, and media
- **Realtime**: Real-time updates for collaborative features

For more details, see the [Supabase Integration Guide](./supabase.md).

### Stripe

Stripe handles all payment processing and subscription management:

- **Payments**: Secure payment processing
- **Subscriptions**: Recurring subscription management
- **Webhooks**: Event-driven updates for subscription status changes
- **Customer Portal**: Self-service portal for managing subscriptions

For more details, see the [Stripe Integration Guide](./stripe.md).

### Mapbox

Mapbox provides maps and location services:

- **Maps**: Interactive maps for visualizing trips
- **Geocoding**: Converting addresses to coordinates
- **Directions**: Route planning and optimization
- **Places**: Location search and suggestions

For more details, see the [Mapbox Integration Guide](./mapbox.md).

### Gemini AI

Google's Gemini AI powers VoyageSmart's AI features:

- **Natural Language Processing**: Understanding and generating human-like text
- **Context-Aware Responses**: Generating responses based on trip context
- **Activity Generation**: Creating personalized activity suggestions
- **Smart Recommendations**: Providing intelligent recommendations

For more details, see the [Gemini AI Integration Guide](./gemini-ai.md).

## 🔑 API Keys and Environment Variables

VoyageSmart uses environment variables to manage API keys and configuration for external services. These variables should be set in a `.env.local` file in the root directory of the project.

Here's a list of the required environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_your_ai_price_id
```

For more details on setting up environment variables, see the [Configuration Guide](../getting-started/configuration.md).

## 📚 Next Steps

To learn more about specific integrations, check out the detailed documentation for each service:

- [Supabase](./supabase.md)
- [Stripe](./stripe.md)
- [Mapbox](./mapbox.md)
- [Gemini AI](./gemini-ai.md)

---

Next: [Supabase](./supabase.md)
