# Third-Party Integrations

<div align="center">
  <h3>🔌 Service Integrations</h3>
  <p>Learn how VoyageSmart integrates with external services to provide enhanced functionality.</p>
</div>

---

## 🛠️ Available Integrations

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="./supabase.md">
          <img src="https://img.shields.io/badge/🗄️-Supabase-green?style=for-the-badge" alt="Supabase"/>
        </a>
      </td>
      <td align="center">
        <a href="./mapbox.md">
          <img src="https://img.shields.io/badge/🗺️-Mapbox-blue?style=for-the-badge" alt="Mapbox"/>
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <a href="./stripe.md">
          <img src="https://img.shields.io/badge/💳-Stripe-purple?style=for-the-badge" alt="Stripe"/>
        </a>
      </td>
      <td align="center">
        <a href="./gemini-ai.md">
          <img src="https://img.shields.io/badge/🤖-Gemini%20AI-orange?style=for-the-badge" alt="Gemini AI"/>
        </a>
      </td>
    </tr>
  </table>
</div>

---

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
