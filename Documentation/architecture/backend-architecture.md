# Backend Architecture

## ⚙️ Backend System Overview

VoyageSmart utilizza un'architettura backend moderna e scalabile basata su Supabase come Backend-as-a-Service (BaaS), integrata con Next.js API Routes per la logica di business personalizzata.

---

## 🏗️ Architettura Generale

### Stack Tecnologico Backend

```
┌─────────────────────────────────────────────────────────────┐
│                    VoyageSmart Backend                     │
├─────────────────────────────────────────────────────────────┤
│ Next.js API Routes (Serverless Functions)                  │
│ ├── Authentication & Authorization                         │
│ ├── Business Logic Layer                                   │
│ ├── External API Integrations                             │
│ └── Data Processing & Validation                          │
├─────────────────────────────────────────────────────────────┤
│ Supabase Backend Services                                  │
│ ├── PostgreSQL Database                                   │
│ ├── Authentication Service                                │
│ ├── Real-time Subscriptions                              │
│ ├── Storage Service                                       │
│ └── Edge Functions (Deno)                                │
├─────────────────────────────────────────────────────────────┤
│ External Services Integration                              │
│ ├── Stripe (Payments)                                    │
│ ├── Google Gemini AI                                     │
│ ├── Mapbox (Maps)                                        │
│ └── Email Services                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture

### PostgreSQL Schema Design

**Core Tables:**
- `users` - User profiles and authentication data
- `trips` - Trip information and metadata
- `activities` - Itinerary activities and events
- `expenses` - Financial tracking and cost management
- `participants` - Trip collaboration and permissions
- `user_subscriptions` - Subscription and billing data

**Relationship Structure:**
```sql
users (1) ──── (n) trips
trips (1) ──── (n) activities
trips (1) ──── (n) expenses
trips (1) ──── (n) participants
users (1) ──── (1) user_subscriptions
```

### Row Level Security (RLS)

Ogni tabella implementa RLS policies per garantire:
- **Data Isolation**: Gli utenti accedono solo ai propri dati
- **Collaboration Security**: Accesso controllato ai dati condivisi
- **Role-based Access**: Permessi basati sui ruoli nei trip

---

## 🔄 API Layer Architecture

### Next.js API Routes Structure

```
pages/api/
├── auth/
│   ├── login.ts
│   ├── register.ts
│   └── callback.ts
├── trips/
│   ├── index.ts          # GET, POST /api/trips
│   ├── [id].ts           # GET, PUT, DELETE /api/trips/:id
│   └── [id]/
│       ├── activities.ts  # Trip activities management
│       └── expenses.ts    # Trip expenses management
├── ai/
│   ├── chat.ts           # AI assistant endpoint
│   ├── generate-activities.ts
│   └── optimize-route.ts
├── payments/
│   ├── create-intent.ts
│   └── webhooks/
│       └── stripe.ts
└── admin/
    ├── users.ts
    └── analytics.ts
```

### Request/Response Flow

1. **Client Request** → Next.js API Route
2. **Authentication** → Supabase Auth verification
3. **Authorization** → RLS policy enforcement
4. **Business Logic** → Custom processing
5. **Data Access** → Supabase database operations
6. **Response** → Formatted JSON response

---

## 🔐 Authentication & Authorization

### Supabase Auth Integration

**Authentication Methods:**
- Email/Password authentication
- OAuth providers (Google, GitHub)
- Magic link authentication
- JWT token management

**Authorization Levels:**
- **Public**: Unauthenticated access (landing page)
- **Authenticated**: Basic user access
- **Subscription**: Premium feature access
- **Admin**: Administrative functions

### JWT Token Management

```typescript
// Token verification middleware
export async function verifyToken(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: user, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
```

---

## 🚀 Serverless Functions

### Next.js API Routes

**Vantaggi:**
- **Auto-scaling**: Scaling automatico basato sul carico
- **Cost-effective**: Pay-per-execution model
- **Global Distribution**: Edge deployment con Vercel
- **Zero Configuration**: Setup automatico

**Limitazioni:**
- **Execution Time**: Limite di 10 secondi per request
- **Memory**: Limite di memoria per function
- **Cold Starts**: Latenza iniziale per funzioni inattive

### Supabase Edge Functions

**Use Cases:**
- **Webhook Processing**: Gestione webhook esterni
- **Scheduled Tasks**: Operazioni programmate
- **Heavy Processing**: Elaborazioni intensive
- **Third-party Integrations**: Integrazioni complesse

---

## 🔌 External Integrations

### API Integration Patterns

**Stripe Integration:**
```typescript
// Payment processing
export async function createPaymentIntent(amount: number, currency: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency,
    automatic_payment_methods: { enabled: true }
  });
  
  return paymentIntent;
}
```

**Gemini AI Integration:**
```typescript
// AI response generation
export async function generateAIResponse(prompt: string) {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}
```

**Mapbox Integration:**
```typescript
// Geocoding and routing
export async function geocodeAddress(address: string) {
  const response = await mapboxClient.geocoding.forwardGeocode({
    query: address,
    limit: 1
  }).send();
  
  return response.body.features[0];
}
```

---

## 📊 Data Processing & Validation

### Input Validation

**Zod Schema Validation:**
```typescript
import { z } from 'zod';

const TripSchema = z.object({
  name: z.string().min(1).max(100),
  destination: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budget: z.number().positive().optional()
});

export function validateTripData(data: unknown) {
  return TripSchema.parse(data);
}
```

### Error Handling

**Standardized Error Responses:**
```typescript
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown, res: NextApiResponse) {
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
```

---

## 🔄 Real-time Features

### Supabase Realtime

**Real-time Subscriptions:**
```typescript
// Subscribe to trip updates
const subscription = supabase
  .channel('trip-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'activities',
    filter: `trip_id=eq.${tripId}`
  }, (payload) => {
    // Handle real-time updates
    updateActivityList(payload);
  })
  .subscribe();
```

**Use Cases:**
- **Collaborative Editing**: Real-time itinerary updates
- **Expense Tracking**: Live expense additions
- **Chat Messages**: Instant messaging
- **Notifications**: Real-time alerts

---

## 📈 Performance Optimization

### Caching Strategies

**API Response Caching:**
```typescript
// Redis caching for expensive operations
export async function getCachedTripData(tripId: string) {
  const cached = await redis.get(`trip:${tripId}`);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const tripData = await fetchTripData(tripId);
  await redis.setex(`trip:${tripId}`, 300, JSON.stringify(tripData));
  
  return tripData;
}
```

**Database Query Optimization:**
- **Indexes**: Ottimizzazione query con indici appropriati
- **Connection Pooling**: Pool di connessioni per performance
- **Query Batching**: Raggruppamento query per efficienza
- **Pagination**: Paginazione per grandi dataset

---

## 🛡️ Security Measures

### API Security

**Rate Limiting:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s')
});

export async function rateLimitMiddleware(req: NextApiRequest) {
  const identifier = req.ip;
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new APIError(429, 'Rate limit exceeded');
  }
}
```

**Input Sanitization:**
- **SQL Injection Prevention**: Prepared statements
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token validation
- **Data Validation**: Schema validation

---

## 🔍 Monitoring & Logging

### Application Monitoring

**Error Tracking:**
```typescript
import * as Sentry from '@sentry/nextjs';

export function logError(error: Error, context?: any) {
  Sentry.captureException(error, {
    tags: { component: 'api' },
    extra: context
  });
}
```

**Performance Monitoring:**
- **Response Times**: API endpoint performance
- **Database Queries**: Query execution times
- **External API Calls**: Third-party service latency
- **Memory Usage**: Function memory consumption

---

## 🚀 Scalability Considerations

### Horizontal Scaling

**Stateless Design:**
- **No Server State**: Tutte le informazioni in database
- **Session Management**: JWT tokens per autenticazione
- **Load Distribution**: Distribuzione automatica del carico

**Database Scaling:**
- **Read Replicas**: Replica per letture intensive
- **Connection Pooling**: Gestione efficiente connessioni
- **Query Optimization**: Ottimizzazione performance query

### Vertical Scaling

**Resource Optimization:**
- **Memory Management**: Gestione efficiente memoria
- **CPU Optimization**: Algoritmi ottimizzati
- **I/O Optimization**: Operazioni I/O efficienti

---

## 🔗 Related Documentation

- **[Database Schema](./database-schema.md)** - Detailed database structure
- **[Security](./security.md)** - Security implementations
- **[API Documentation](../api/)** - Complete API reference
- **[Integrations](../integrations/)** - External service integrations

---

**[← Back to Architecture Overview](./README.md)** • **[Next: Security →](./security.md)**
