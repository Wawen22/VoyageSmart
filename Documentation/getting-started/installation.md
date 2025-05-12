# Installing VoyageSmart

This guide will walk you through the process of installing VoyageSmart on your local machine for development purposes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher)
- **Git**

You'll also need accounts for the following services:

- [Supabase](https://supabase.com/) - For database, authentication, and storage
- [Mapbox](https://www.mapbox.com/) - For maps and location services
- [Stripe](https://stripe.com/) - For payment processing (optional for local development)
- [Google Cloud Platform](https://cloud.google.com/) - For Gemini AI API (optional for local development)

## Step 1: Clone the Repository

```bash
git clone https://github.com/Wawen22/VoyageSmart.git
cd VoyageSmart
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all the necessary dependencies for VoyageSmart.

## Step 3: Set Up Supabase

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com/)
2. Note your Supabase URL and anon key from the project settings
3. Run the database setup script:

```bash
# Navigate to the supabase directory
cd supabase

# Run the setup script
npm run setup
```

For detailed instructions on setting up Supabase, refer to the [Supabase Integration Guide](../integrations/supabase.md).

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Gemini AI (optional for local development)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Stripe (optional for local development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Subscription Price IDs (optional for local development)
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_your_ai_price_id
```

## Step 5: Start the Development Server

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`.

## Step 6: Set Up Stripe Webhook (Optional)

If you want to test the subscription functionality locally, you'll need to set up Stripe webhook forwarding:

1. Install the Stripe CLI from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Log in to your Stripe account:

```bash
stripe login
```

3. Start the webhook forwarding:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

4. Note the webhook signing secret and add it to your `.env.local` file:

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Troubleshooting

### Common Issues

#### "Module not found" errors

If you encounter "Module not found" errors, try the following:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Supabase connection issues

If you're having trouble connecting to Supabase:

1. Verify your Supabase URL and anon key in `.env.local`
2. Check if your Supabase project is active
3. Ensure your IP is not blocked by Supabase

#### Port already in use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

## Next Steps

Now that you have VoyageSmart installed, you can:

- [Configure your application](./configuration.md)
- [Take your first steps with VoyageSmart](./first-steps.md)
- [Explore the features](../features/README.md)

---

Next: [Configuration](./configuration.md)
