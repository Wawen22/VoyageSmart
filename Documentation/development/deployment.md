# Deployment Guide

<div align="center">
  <h3>🚀 Production Deployment Guide</h3>
  <p>Comprehensive guide for deploying VoyageSmart to production environments.</p>
</div>

---

## 🌐 Deployment Overview

VoyageSmart is designed for modern cloud deployment with a focus on scalability, reliability, and performance. Our recommended deployment stack uses Vercel for the frontend and Supabase for the backend infrastructure.

### Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Vercel      │    │    Supabase     │    │   External      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Next.js App   │    │ • PostgreSQL    │    │ • Stripe        │
│ • Static Assets │    │ • Auth          │    │ • Mapbox        │
│ • Edge Functions│    │ • Storage       │    │ • Gemini AI     │
│ • CDN           │    │ • Realtime      │    │ • Email Service │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🛠️ Prerequisites

### Required Accounts & Services

- **Vercel Account** - For frontend deployment
- **Supabase Account** - For backend services
- **GitHub Account** - For code repository
- **Domain Provider** - For custom domain (optional)

### Required API Keys

- **Supabase Project URL & Keys**
- **Stripe API Keys** (for payments)
- **Mapbox Access Token** (for maps)
- **Gemini AI API Key** (for AI features)
- **Email Service Keys** (for notifications)

---

## 🔧 Environment Configuration

### Environment Variables

Create production environment variables for each service:

#### Vercel Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Maps Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token

# Email Configuration
RESEND_API_KEY=re_your-resend-key

# Security
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Security Considerations

- **Never commit secrets** to version control
- **Use environment-specific keys** (production vs. staging)
- **Rotate keys regularly**
- **Use least-privilege access** for service accounts
- **Enable audit logging** for sensitive operations

---

## 🚀 Vercel Deployment

### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Push code to GitHub
   git push origin main
   
   # Vercel will automatically deploy
   ```

2. **Configure Build Settings**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm ci",
     "framework": "nextjs"
   }
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Select your project
   - Navigate to Settings → Environment Variables
   - Add all required environment variables

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy with specific environment
vercel --prod --env production
```

### Build Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    appDir: true,
  },
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    },
  }),
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🗄️ Supabase Configuration

### Database Setup

1. **Create Production Project**
   ```sql
   -- Run migration scripts
   -- Set up Row Level Security (RLS)
   -- Configure database indexes
   -- Set up backup schedules
   ```

2. **Configure Authentication**
   ```javascript
   // Supabase Auth settings
   {
     "site_url": "https://your-domain.com",
     "redirect_urls": [
       "https://your-domain.com/auth/callback"
     ],
     "jwt_expiry": 3600,
     "refresh_token_rotation_enabled": true,
     "security_update_password_require_reauthentication": true
   }
   ```

3. **Set Up Storage Buckets**
   ```sql
   -- Create storage buckets
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('trip-documents', 'trip-documents', false),
     ('user-avatars', 'user-avatars', true);
   
   -- Set up storage policies
   CREATE POLICY "Users can upload their own documents"
   ON storage.objects FOR INSERT
   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Database Migrations

```sql
-- Example migration script
-- migrations/001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create tables
CREATE TABLE trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trips"
ON trips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Database Migrations in CI/CD

```yaml
  migrate:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run database migrations
        run: |
          npx supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

---

## 📊 Monitoring & Analytics

### Performance Monitoring

```javascript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export function AnalyticsProvider({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

### Error Tracking

```javascript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Health Checks

```javascript
// pages/api/health.ts
export default function handler(req, res) {
  // Check database connection
  // Check external services
  // Return health status
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      storage: 'connected',
      ai: 'connected'
    }
  });
}
```

---

## 🔒 Security Hardening

### Security Headers

```javascript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}
```

### Rate Limiting

```javascript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function rateLimitMiddleware(req, res, next) {
  const identifier = req.ip;
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  next();
}
```

---

## 🚨 Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups via Supabase
   - Point-in-time recovery enabled
   - Cross-region backup replication

2. **File Storage Backups**
   - Automated storage bucket backups
   - Version control for critical files
   - Regular backup testing

3. **Code Repository**
   - Multiple repository mirrors
   - Tagged releases for rollback
   - Infrastructure as code

### Rollback Procedures

```bash
# Rollback to previous deployment
vercel rollback

# Rollback database migration
supabase db reset --db-url $DATABASE_URL

# Rollback to specific version
vercel rollback --target deployment-url
```

---

## 📈 Scaling Considerations

### Performance Optimization

- **Edge Functions**: Use Vercel Edge Functions for global performance
- **CDN**: Leverage Vercel's global CDN
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Implement dynamic imports
- **Caching**: Use appropriate caching strategies

### Database Scaling

- **Connection Pooling**: Configure Supabase connection pooling
- **Read Replicas**: Set up read replicas for heavy read workloads
- **Indexing**: Optimize database indexes
- **Query Optimization**: Monitor and optimize slow queries

---

## 🔗 Related Documentation

- **[Security Implementations](./security-implementations.md)** - Security best practices
- **[Testing Framework](./testing-framework.md)** - Testing in production
- **[Code Standards](./code-standards.md)** - Code quality standards

---

<div align="center">
  <p>
    <a href="./testing.md">← Back to Testing</a> •
    <a href="./README.md">Back to Development Overview</a>
  </p>
</div>
