# Backend Architecture

## Overview

VoyageSmart's backend is built using Next.js API Routes, providing a serverless architecture that scales automatically. The backend handles authentication, data management, AI integrations, and external service communications.

## Technology Stack

### Core Technologies
- **Next.js API Routes**: Serverless API endpoints
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe server-side code
- **Supabase**: Database and authentication
- **PostgreSQL**: Primary database

### External Integrations
- **Supabase Auth**: User authentication and authorization
- **Stripe**: Payment processing
- **Resend**: Email delivery
- **Google Gemini**: AI services
- **OpenAI**: Alternative AI provider
- **Mapbox**: Maps and geocoding

## API Architecture

### Route Structure

```
src/app/api/
├── activities/
│   └── batch/              # Batch activity operations
├── admin/
│   ├── ai-metrics/         # AI analytics for admins
│   ├── promo-codes/        # Promo code management
│   └── users/              # User management
├── ai/
│   ├── chat/               # AI chat interface
│   ├── config/             # AI configuration
│   ├── generate-activities/ # AI activity generation
│   ├── providers/          # AI provider management
│   └── test-provider/      # AI provider testing
├── cron/
│   └── check-subscriptions/ # Subscription monitoring
├── email/                  # Email services
├── promo-codes/
│   ├── active/             # Active promo codes
│   ├── cancel/             # Cancel promo codes
│   └── redeem/             # Redeem promo codes
└── stripe/
    ├── cancel/             # Cancel subscriptions
    ├── checkout/           # Create checkout sessions
    ├── downgrade/          # Downgrade subscriptions
    └── webhook/            # Stripe webhooks
```

### API Route Pattern

```typescript
// Standard API route structure
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Business logic
    const result = await performOperation();
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Authentication & Authorization

### Supabase Auth Integration

```typescript
// Authentication middleware
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, session.user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 401 }
    );
  }
}
```

### Role-Based Access Control

```typescript
// Admin authorization check
export function requireAdmin(user: any): boolean {
  const preferences = user.user_metadata?.preferences || {};
  return preferences.role === 'admin';
}

// Trip access control
export async function checkTripAccess(
  tripId: string,
  userId: string,
  requiredRole: 'viewer' | 'editor' | 'admin' = 'viewer'
): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is trip owner
  const { data: trip } = await supabase
    .from('trips')
    .select('owner_id')
    .eq('id', tripId)
    .single();
    
  if (trip?.owner_id === userId) {
    return true;
  }
  
  // Check participant role
  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .eq('invitation_status', 'accepted')
    .single();
    
  if (!participant) {
    return false;
  }
  
  // Role hierarchy: admin > editor > viewer
  const roleHierarchy = { admin: 3, editor: 2, viewer: 1 };
  return roleHierarchy[participant.role] >= roleHierarchy[requiredRole];
}
```

## Data Access Layer

### Supabase Client Configuration

```typescript
// Server-side Supabase client
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Route handler client
export function createSupabaseClient() {
  return createRouteHandlerClient({ cookies });
}
```

### Database Operations

```typescript
// Trip service example
export class TripService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  async createTrip(tripData: CreateTripData, userId: string): Promise<Trip> {
    const { data, error } = await this.supabase
      .from('trips')
      .insert({
        ...tripData,
        owner_id: userId
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  async getTripsByUser(userId: string): Promise<Trip[]> {
    const { data, error } = await this.supabase
      .from('trips')
      .select(`
        *,
        trip_participants!inner(role, invitation_status)
      `)
      .or(`owner_id.eq.${userId},trip_participants.user_id.eq.${userId}`)
      .eq('trip_participants.invitation_status', 'accepted');
      
    if (error) throw error;
    return data;
  }
}
```

## AI Services Integration

### AI Provider Service

```typescript
// AI provider abstraction
export class AIProviderService {
  private providers: Map<string, AIProvider> = new Map();
  
  constructor() {
    this.registerProvider('gemini', new GeminiProvider());
    this.registerProvider('openai', new OpenAIProvider());
    this.registerProvider('deepseek', new DeepSeekProvider());
  }
  
  async generateResponse(
    provider: string,
    prompt: string,
    context?: any
  ): Promise<string> {
    const aiProvider = this.providers.get(provider);
    if (!aiProvider) {
      throw new Error(`Provider ${provider} not found`);
    }
    
    return aiProvider.generateResponse(prompt, context);
  }
  
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
```

### AI Chat Service

```typescript
// AI chat endpoint
export async function POST(request: NextRequest) {
  try {
    const { message, tripId, provider = 'gemini' } = await request.json();
    
    // Get trip context
    const tripContext = await getTripContext(tripId);
    
    // Queue AI request for rate limiting
    const response = await queueAIRequest({
      provider,
      message,
      context: tripContext,
      userId: session.user.id
    });
    
    // Track analytics
    aiAnalytics.trackRequest({
      provider,
      responseTime: response.responseTime,
      success: true,
      userId: session.user.id
    });
    
    return NextResponse.json({
      success: true,
      response: response.content,
      contextualActions: response.actions
    });
  } catch (error) {
    aiAnalytics.trackError(error);
    throw error;
  }
}
```

## External Service Integrations

### Stripe Integration

```typescript
// Stripe service
export class StripeService {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }
  
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId }
    });
  }
  
  async handleWebhook(
    body: string,
    signature: string
  ): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }
}
```

### Email Service

```typescript
// Email service using Resend
export class EmailService {
  private resend: Resend;
  
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  async sendInvitationEmail(
    to: string,
    inviterName: string,
    tripName: string,
    inviteLink: string
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'VoyageSmart <noreply@voyagesmart.app>',
      to,
      subject: `${inviterName} invited you to join "${tripName}"`,
      html: this.generateInvitationTemplate({
        inviterName,
        tripName,
        inviteLink
      })
    });
  }
  
  private generateInvitationTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif;">
        <h2>You're invited to join a trip!</h2>
        <p>${data.inviterName} has invited you to collaborate on "${data.tripName}".</p>
        <a href="${data.inviteLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
      </div>
    `;
  }
}
```

## Performance & Monitoring

### Rate Limiting

```typescript
// Rate limiting service
export class RateLimitService {
  private limits: Map<string, RateLimit> = new Map();
  
  async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const rateLimit = this.limits.get(key);
    
    if (!rateLimit || now - rateLimit.resetTime > windowMs) {
      this.limits.set(key, {
        count: 1,
        resetTime: now
      });
      return true;
    }
    
    if (rateLimit.count >= limit) {
      return false;
    }
    
    rateLimit.count++;
    return true;
  }
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const clientIP = request.ip || 'unknown';
  const isAllowed = await rateLimitService.checkLimit(
    `ai-chat:${clientIP}`,
    20, // 20 requests
    60 * 1000 // per minute
  );
  
  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // Continue with request processing
}
```

### Analytics & Logging

```typescript
// Analytics service
export class AnalyticsService {
  private metrics: Map<string, any> = new Map();
  
  trackAPICall(endpoint: string, duration: number, success: boolean): void {
    const key = `api:${endpoint}`;
    const current = this.metrics.get(key) || {
      totalCalls: 0,
      successfulCalls: 0,
      totalDuration: 0,
      errors: []
    };
    
    current.totalCalls++;
    current.totalDuration += duration;
    
    if (success) {
      current.successfulCalls++;
    }
    
    this.metrics.set(key, current);
  }
  
  getMetrics(): any {
    const result = {};
    for (const [key, value] of this.metrics) {
      result[key] = {
        ...value,
        averageDuration: value.totalDuration / value.totalCalls,
        successRate: (value.successfulCalls / value.totalCalls) * 100
      };
    }
    return result;
  }
}
```

## Error Handling

### Centralized Error Handler

```typescript
// Error handling utility
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

## Security Measures

### Input Validation

```typescript
// Validation schemas using Zod
export const createTripSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  destination: z.string().min(1).max(100),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  budget_total: z.number().positive().optional(),
  currency: z.string().length(3).optional()
});

// Usage in API routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTripSchema.parse(body);
    
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### CORS Configuration

```typescript
// CORS middleware
export function corsMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://voyagesmart.app',
    'https://www.voyagesmart.app'
  ];
  
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

## Deployment & Scaling

### Environment Configuration

```typescript
// Configuration management
export const config = {
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },
  ai: {
    geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
    openaiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    defaultProvider: process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER || 'gemini'
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
  },
  email: {
    resendKey: process.env.RESEND_API_KEY!
  }
};
```

### Health Checks

```typescript
// Health check endpoint
export async function GET(): Promise<NextResponse> {
  try {
    // Check database connection
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (dbError) throw new Error('Database connection failed');
    
    // Check external services
    const checks = await Promise.allSettled([
      checkStripeConnection(),
      checkEmailService(),
      checkAIProviders()
    ]);
    
    const failedChecks = checks
      .filter(check => check.status === 'rejected')
      .map((check, index) => ({
        service: ['stripe', 'email', 'ai'][index],
        error: check.reason
      }));
    
    return NextResponse.json({
      status: failedChecks.length === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        external: failedChecks.length === 0 ? 'healthy' : 'degraded'
      },
      failures: failedChecks
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
