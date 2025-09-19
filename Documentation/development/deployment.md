# Deployment Guide

## Overview

This guide covers the deployment process for VoyageSmart, including environment setup, build configuration, and deployment to various platforms.

## Deployment Platforms

### Vercel (Recommended)

VoyageSmart is optimized for deployment on Vercel, which provides seamless integration with Next.js applications.

#### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Environment variables configured

#### Automatic Deployment

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret",
    "RESEND_API_KEY": "@resend-api-key",
    "NEXT_PUBLIC_GEMINI_API_KEY": "@gemini-api-key",
    "MAPBOX_ACCESS_TOKEN": "@mapbox-token",
    "ENCRYPTION_KEY": "@encryption-key",
    "CRON_API_KEY": "@cron-api-key"
  }
}
```

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
    restart: unless-stopped
```

## Environment Configuration

### Environment Variables

```bash
# .env.production
# Application
NEXT_PUBLIC_APP_URL=https://voyagesmart.app
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
NEXT_PUBLIC_AI_DEFAULT_PROVIDER=gemini
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=your-azure-endpoint
NEXT_PUBLIC_AZURE_OPENAI_API_VERSION=2024-02-01
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...

# Maps
MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# Security
ENCRYPTION_KEY=your-32-byte-hex-key
CRON_API_KEY=your-cron-api-key
JWT_SECRET=your-jwt-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

### Environment Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

## Build Process

### Build Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['images.unsplash.com', 'supabase.co'],
    formats: ['image/webp', 'image/avif']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/documentation',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
```

### Build Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true npm run build",
    "build:production": "NODE_ENV=production npm run build",
    "export": "next export"
  }
}
```

### Bundle Analysis

```javascript
// next.config.js (with bundle analyzer)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

## CI/CD Pipeline

### GitHub Actions

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
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
        env:
          CI: true
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Pre-deployment Checks

```yaml
# .github/workflows/pre-deploy.yml
name: Pre-deployment Checks

on:
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  performance-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
```

## Database Migrations

### Supabase Migrations

```sql
-- migrations/20240101000000_initial_schema.sql
-- Create initial tables and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables (see database-schema.md for full schema)

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (owner_id = auth.uid());
```

### Migration Scripts

```bash
#!/bin/bash
# scripts/migrate.sh

echo "Running database migrations..."

# Apply migrations
supabase db push

# Seed data if needed
if [ "$NODE_ENV" = "development" ]; then
  echo "Seeding development data..."
  supabase db seed
fi

echo "Migrations completed successfully!"
```

## Monitoring and Logging

### Error Tracking with Sentry

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  }
});
```

### Health Checks

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check database connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error('Database connection failed');
    }

    // Check external services
    const checks = await Promise.allSettled([
      fetch('https://api.stripe.com/v1/charges', {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      }),
      // Add other service checks
    ]);

    const failedChecks = checks
      .filter(check => check.status === 'rejected')
      .length;

    return NextResponse.json({
      status: failedChecks === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        external: failedChecks === 0 ? 'healthy' : 'degraded'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 503 }
    );
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedTrips = unstable_cache(
  async (userId: string) => {
    return await tripService.getUserTrips(userId);
  },
  ['user-trips'],
  {
    revalidate: 300, // 5 minutes
    tags: ['trips']
  }
);
```

### Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['images.unsplash.com', 'supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
};
```

## Security Considerations

### Environment Security

```bash
# Use secrets management
# Never commit sensitive data to git
# Rotate keys regularly
# Use different keys for different environments
```

### HTTPS Configuration

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};
```

## Rollback Strategy

### Automated Rollback

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    
    steps:
      - name: Rollback to previous version
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --force'
          alias-domains: |
            voyagesmart.app
```

### Manual Rollback

```bash
# Rollback using Vercel CLI
vercel rollback [deployment-url] --prod

# Rollback database migrations
supabase db reset --db-url [connection-string]
```

## Post-Deployment

### Verification Checklist

- [ ] Application loads successfully
- [ ] Authentication works
- [ ] Database connections are healthy
- [ ] External services are accessible
- [ ] Performance metrics are within acceptable ranges
- [ ] Error rates are low
- [ ] Security headers are present

### Monitoring Setup

```typescript
// lib/monitoring.ts
export function trackDeployment() {
  // Track deployment metrics
  analytics.track('deployment', {
    version: process.env.VERCEL_GIT_COMMIT_SHA,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify dependencies
   - Review build logs

2. **Runtime Errors**
   - Check application logs
   - Verify database connections
   - Test external service connectivity

3. **Performance Issues**
   - Monitor response times
   - Check database query performance
   - Review bundle size

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Test production build locally
npm run build && npm start
```
