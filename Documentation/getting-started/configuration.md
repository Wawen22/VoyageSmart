# Configuration Guide

This guide covers all the configuration options available in VoyageSmart, from basic setup to advanced customization.

## 📋 Overview

VoyageSmart uses environment variables for configuration, allowing you to customize the application for different environments (development, staging, production) without changing the code.

## 🔧 Environment Variables

### Required Configuration

These variables are essential for VoyageSmart to function:

#### Supabase Configuration

```env
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Your Supabase anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get these values:**
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the URL and keys

#### Mapbox Configuration

```env
# Your Mapbox access token
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsb...
```

**How to get this value:**
1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Navigate to **Access tokens**
3. Create a new token or use the default public token

### Optional Configuration

These variables enable additional features:

#### AI Features (Gemini AI)

```env
# Google Gemini AI API key
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyCdjn1Ox8BqVZUMTWMo9ZMMUYiKpkAym2E
```

**How to get this value:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key

#### Payment Processing (Stripe)

```env
# Stripe publishable key (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...

# Stripe secret key (server-side)
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...

# Webhook endpoint secret
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Price IDs for subscription plans
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_1234567890abcdef
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_0987654321fedcba
```

**How to get these values:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy the publishable and secret keys
4. For webhook secret, see the [Installation Guide](./installation.md#step-6-set-up-stripe-webhook-optional)

#### Email Notifications (Resend)

```env
# Resend API key for sending emails
RESEND_API_KEY=re_1234567890abcdef...
```

**How to get this value:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key

#### Security & Cron Jobs

```env
# API key for securing cron job endpoints
CRON_API_KEY=your-secure-random-string

# Application URL (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🏗️ Application Configuration

### Feature Flags

VoyageSmart includes several feature flags that can be toggled:

```typescript
// In src/lib/config.ts
features: {
  aiAssistant: true,           // Enable AI Assistant
  aiWizard: true,              // Enable AI Wizard
  referralProgram: true,       // Enable referral system
  promoCodeSystem: true,       // Enable promo codes
  subscriptionPlans: true,     // Enable subscriptions
  emailNotifications: !!process.env.RESEND_API_KEY,
  mapIntegration: !!process.env.MAPBOX_ACCESS_TOKEN,
  stripePayments: !!process.env.STRIPE_SECRET_KEY,
}
```

### Database Configuration

#### Row Level Security (RLS)

VoyageSmart uses Supabase's Row Level Security to ensure data privacy:

- **Users** can only access their own profile data
- **Trips** are accessible only to trip creators and invited participants
- **Activities, Expenses, etc.** inherit permissions from their parent trip

#### Storage Configuration

File uploads are configured with the following buckets:

- `trip-documents` - For trip-related documents
- `expense-receipts` - For expense receipt images
- `trip-media` - For trip photos and media

### Styling Configuration

#### Tailwind CSS

VoyageSmart uses Tailwind CSS with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // ... more colors
      },
    },
  },
}
```

#### Theme Configuration

The application supports both light and dark themes:

```typescript
// Theme switching is handled by next-themes
import { ThemeProvider } from 'next-themes'

// Themes: 'light', 'dark', 'system'
```

## 🔒 Security Configuration

### Authentication

VoyageSmart uses Supabase Auth with the following providers:

- **Email/Password** - Default authentication method
- **Google OAuth** - Optional social login
- **GitHub OAuth** - Optional social login

### API Security

- **CORS** - Configured for your domain
- **Rate Limiting** - Implemented on API routes
- **Input Validation** - Using Zod schemas
- **SQL Injection Protection** - Via Supabase RLS

### Environment Security

**Important Security Notes:**

1. **Never commit `.env.local` to version control**
2. **Use different keys for development and production**
3. **Rotate API keys regularly**
4. **Use strong, unique passwords for all services**

## 🌍 Environment-Specific Configuration

### Development Environment

```env
# .env.local (development)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Use test/development keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Production Environment

```env
# .env.production (production)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Use live/production keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

## 🔧 Advanced Configuration

### Custom Domain Configuration

If you're using a custom domain:

1. **Update NEXT_PUBLIC_APP_URL** in your environment variables
2. **Configure CORS** in Supabase for your domain
3. **Update Stripe webhook URLs** to point to your domain
4. **Update OAuth redirect URLs** in your auth providers

### Performance Configuration

#### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  
  // Webpack optimization
  webpack: (config) => {
    // Custom webpack configuration
    return config;
  },
}
```

#### Database Performance

- **Connection Pooling** - Handled by Supabase
- **Query Optimization** - Use indexes on frequently queried columns
- **Caching** - Implement Redis for session caching (optional)

## 🧪 Testing Configuration

### Test Environment

```env
# .env.test
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

## 📊 Monitoring Configuration

### Error Tracking

Consider integrating error tracking services:

- **Sentry** - For error monitoring
- **LogRocket** - For session replay
- **Vercel Analytics** - For performance monitoring

### Logging Configuration

```typescript
// src/lib/config.ts
logging: {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
}
```

## 🔄 Configuration Validation

VoyageSmart includes configuration validation to ensure all required variables are set:

```typescript
// src/lib/config.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Validation runs at startup
validateConfig();
```

## 📝 Configuration Checklist

Before deploying to production, ensure:

- [ ] All required environment variables are set
- [ ] API keys are for production (not test/development)
- [ ] Database is properly configured with RLS
- [ ] CORS is configured for your domain
- [ ] Webhook URLs point to your production domain
- [ ] SSL certificates are properly configured
- [ ] Error tracking is set up
- [ ] Backup strategy is in place

## 🆘 Troubleshooting Configuration

### Common Issues

#### Environment Variables Not Loading

```bash
# Check if the file exists and has correct name
ls -la .env.local

# Verify file permissions
chmod 644 .env.local

# Restart the development server
npm run dev
```

#### Supabase Connection Issues

1. Verify URL format: `https://your-project-ref.supabase.co`
2. Check that anon key is correct and not expired
3. Ensure project is not paused in Supabase dashboard

#### Stripe Configuration Issues

1. Verify you're using the correct environment keys (test vs live)
2. Check webhook endpoint URL is correct
3. Ensure webhook secret matches the CLI output

---

**Next Steps:**
- [First Steps Guide](./first-steps.md) - Start using VoyageSmart
- [Architecture Overview](../architecture/README.md) - Understand the system
- [API Documentation](../api/README.md) - Explore the API
