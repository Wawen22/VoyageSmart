# Configuration Guide

This guide covers all configuration options for VoyageSmart.

## Environment Variables

### Required Variables

```env
# Supabase - Database and Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### AI Configuration

```env
# Default AI Provider
NEXT_PUBLIC_AI_DEFAULT_PROVIDER=gemini

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# OpenAI (Alternative)
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=your-azure-endpoint
```

### Payment Configuration

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Subscription Plans
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_...
```

### Optional Services

```env
# Email Service
RESEND_API_KEY=your-resend-key

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Weather
NEXT_PUBLIC_WEATHER_API_KEY=your-weather-key
```

## Supabase Setup

### 1. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Database Schema
Run the SQL files in the `supabase/` directory:
- `schema.sql` - Main database structure
- `*_policy.sql` - Row Level Security policies

### 3. Authentication
Configure authentication providers in Supabase dashboard:
- Email/Password (enabled by default)
- OAuth providers (optional)

## Stripe Setup

### 1. Create Account
1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard

### 2. Create Products
Create subscription products:
- Premium Plan
- AI Assistant Plan

### 3. Webhooks
Set up webhook endpoint: `your-domain.com/api/stripe/webhook`

## AI Provider Setup

### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create API key
3. Add to environment variables

### OpenAI (Alternative)
1. Sign up at [OpenAI](https://openai.com)
2. Get API key
3. Configure in environment

## Security Configuration

### Content Security Policy
The app includes secure CSP headers. Modify in `src/lib/config.ts` if needed.

### Rate Limiting
API rate limits are configured in `src/lib/config.ts`:
- Auth: 5 requests per 15 minutes
- API: 100 requests per minute
- AI: 20 requests per minute

## Development vs Production

### Development
- Debug logging enabled
- Hot reloading
- Source maps included

### Production
- Optimized builds
- Compressed assets
- Error tracking
- Performance monitoring

## Troubleshooting

### Common Configuration Issues

**Supabase Connection:**
- Verify URL and keys
- Check network connectivity
- Ensure RLS policies are correct

**Stripe Webhooks:**
- Use ngrok for local testing
- Verify webhook secret
- Check endpoint URL

**AI API Errors:**
- Verify API keys
- Check quota limits
- Ensure correct model names
