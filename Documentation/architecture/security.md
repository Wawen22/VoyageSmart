# Security Architecture

## 🔒 Security Overview

VoyageSmart implementa un approccio di sicurezza multi-livello per proteggere i dati degli utenti, garantire la privacy e mantenere l'integrità del sistema. La sicurezza è integrata in ogni aspetto dell'architettura.

---

## 🛡️ Security Layers

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 7: Application Security                              │
│ ├── Input Validation & Sanitization                       │
│ ├── Business Logic Security                               │
│ └── Output Encoding                                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: API Security                                     │
│ ├── Authentication & Authorization                        │
│ ├── Rate Limiting                                         │
│ └── API Key Management                                    │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Transport Security                               │
│ ├── HTTPS/TLS Encryption                                 │
│ ├── Certificate Management                                │
│ └── Secure Headers                                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Database Security                                │
│ ├── Row Level Security (RLS)                             │
│ ├── Encryption at Rest                                   │
│ └── Access Control                                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Infrastructure Security                          │
│ ├── Network Security                                     │
│ ├── Container Security                                   │
│ └── Cloud Security                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Supabase Auth Implementation

**Multi-Factor Authentication:**
```typescript
// Enable MFA for user account
export async function enableMFA(userId: string) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'VoyageSmart MFA'
  });
  
  if (error) throw error;
  return data;
}

// Verify MFA challenge
export async function verifyMFA(factorId: string, challengeId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code
  });
  
  return { data, error };
}
```

**JWT Token Security:**
```typescript
// Secure token validation
export async function validateJWT(token: string) {
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    // Check token expiration
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    if (tokenPayload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return user;
  } catch (error) {
    throw new Error('Token validation failed');
  }
}
```

### Role-Based Access Control (RBAC)

**Permission Matrix:**
```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM = 'premium'
}

enum Permission {
  READ_TRIP = 'read:trip',
  WRITE_TRIP = 'write:trip',
  DELETE_TRIP = 'delete:trip',
  MANAGE_USERS = 'manage:users',
  ACCESS_AI = 'access:ai',
  ADMIN_PANEL = 'access:admin'
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP
  ],
  [UserRole.PREMIUM]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP,
    Permission.ACCESS_AI
  ],
  [UserRole.ADMIN]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP,
    Permission.DELETE_TRIP,
    Permission.MANAGE_USERS,
    Permission.ACCESS_AI,
    Permission.ADMIN_PANEL
  ]
};
```

---

## 🗄️ Database Security

### Row Level Security (RLS)

**Trip Access Control:**
```sql
-- Users can only access trips they own or are invited to
CREATE POLICY "trip_access_policy" ON trips
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM trip_participants 
    WHERE trip_id = trips.id AND status = 'accepted'
  )
);

-- Users can only modify trips they own
CREATE POLICY "trip_modify_policy" ON trips
FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete trips they own
CREATE POLICY "trip_delete_policy" ON trips
FOR DELETE USING (auth.uid() = user_id);
```

**Expense Privacy:**
```sql
-- Users can only see expenses for trips they have access to
CREATE POLICY "expense_access_policy" ON expenses
FOR SELECT USING (
  trip_id IN (
    SELECT id FROM trips WHERE 
    user_id = auth.uid() OR 
    id IN (
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  )
);
```

### Data Encryption

**Encryption at Rest:**
- **Database Encryption**: AES-256 encryption per tutti i dati
- **Backup Encryption**: Backup crittografati automaticamente
- **Storage Encryption**: File e documenti crittografati

**Encryption in Transit:**
- **TLS 1.3**: Tutte le comunicazioni crittografate
- **Certificate Pinning**: Prevenzione attacchi man-in-the-middle
- **HSTS**: Strict Transport Security headers

---

## 🔒 API Security

### Input Validation & Sanitization

**Schema Validation:**
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Comprehensive input validation
const TripInputSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .refine(val => !/<script/i.test(val), 'Invalid characters'),
  destination: z.string()
    .min(1, 'Destination is required')
    .max(200, 'Destination too long'),
  budget: z.number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget too high')
    .optional()
});

// Sanitize HTML content
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

**SQL Injection Prevention:**
```typescript
// Always use parameterized queries
export async function getTripsByUser(userId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId); // Parameterized query
    
  return { data, error };
}

// Never use string concatenation
// BAD: `SELECT * FROM trips WHERE user_id = '${userId}'`
// GOOD: Use Supabase client or prepared statements
```

### Rate Limiting & DDoS Protection

**API Rate Limiting:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';

// Different limits for different endpoints
const rateLimits = {
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m') // 5 attempts per 15 minutes
  }),
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 h') // 100 requests per hour
  }),
  ai: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 h') // 10 AI requests per hour
  })
};

export async function checkRateLimit(
  type: keyof typeof rateLimits,
  identifier: string
) {
  const { success, limit, reset, remaining } = await rateLimits[type].limit(identifier);
  
  if (!success) {
    throw new APIError(429, 'Rate limit exceeded', {
      limit,
      reset,
      remaining
    });
  }
}
```

---

## 🔐 Secure Headers & CORS

### Security Headers

**Next.js Security Headers:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
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
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' *.supabase.co *.stripe.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

**CORS Configuration:**
```typescript
// Secure CORS setup
export function corsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const allowedOrigins = [
    'https://voyage-smart.vercel.app',
    'https://www.voyagesmart.com'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

---

## 🔑 API Key & Secret Management

### Environment Variable Security

**Secure Configuration:**
```typescript
// Environment validation
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  GEMINI_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32)
});

// Validate environment on startup
export const env = envSchema.parse(process.env);
```

**Key Rotation Strategy:**
```typescript
// API key rotation tracking
interface APIKeyRotation {
  service: string;
  currentKey: string;
  previousKey?: string;
  rotationDate: Date;
  expiryDate: Date;
}

export async function rotateAPIKey(service: string) {
  // Implementation for key rotation
  const newKey = await generateNewAPIKey(service);
  await updateServiceConfiguration(service, newKey);
  await scheduleOldKeyRevocation(service);
}
```

---

## 🛡️ Data Privacy & GDPR Compliance

### Personal Data Protection

**Data Classification:**
```typescript
enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

interface PersonalDataField {
  field: string;
  classification: DataClassification;
  retention: number; // days
  encryption: boolean;
}

const personalDataMap: PersonalDataField[] = [
  { field: 'email', classification: DataClassification.CONFIDENTIAL, retention: 2555, encryption: true },
  { field: 'name', classification: DataClassification.INTERNAL, retention: 2555, encryption: false },
  { field: 'trip_data', classification: DataClassification.CONFIDENTIAL, retention: 1095, encryption: true }
];
```

**GDPR Rights Implementation:**
```typescript
// Right to access
export async function exportUserData(userId: string) {
  const userData = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  const tripData = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId);
    
  return {
    personal_data: userData.data,
    trip_data: tripData.data,
    export_date: new Date().toISOString()
  };
}

// Right to be forgotten
export async function deleteUserData(userId: string) {
  // Anonymize instead of delete for data integrity
  await supabase
    .from('users')
    .update({
      email: `deleted_${userId}@example.com`,
      name: 'Deleted User',
      deleted_at: new Date().toISOString()
    })
    .eq('id', userId);
}
```

---

## 🔍 Security Monitoring & Incident Response

### Security Event Logging

**Audit Trail:**
```typescript
interface SecurityEvent {
  eventType: 'login' | 'logout' | 'data_access' | 'permission_change' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export async function logSecurityEvent(event: SecurityEvent) {
  // Log to secure audit system
  await supabase.from('security_audit_log').insert(event);
  
  // Alert on high-risk events
  if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
    await sendSecurityAlert(event);
  }
}
```

**Anomaly Detection:**
```typescript
export async function detectAnomalies(userId: string) {
  // Check for unusual login patterns
  const recentLogins = await getRecentLogins(userId);
  
  // Geographic anomalies
  if (hasUnusualLocation(recentLogins)) {
    await logSecurityEvent({
      eventType: 'suspicious_activity',
      userId,
      riskLevel: 'medium',
      details: { type: 'unusual_location' }
    });
  }
  
  // Time-based anomalies
  if (hasUnusualTiming(recentLogins)) {
    await logSecurityEvent({
      eventType: 'suspicious_activity',
      userId,
      riskLevel: 'low',
      details: { type: 'unusual_timing' }
    });
  }
}
```

---

## 🚨 Incident Response Plan

### Security Incident Classification

**Severity Levels:**
- **P0 - Critical**: Data breach, system compromise
- **P1 - High**: Authentication bypass, privilege escalation
- **P2 - Medium**: Suspicious activity, failed attacks
- **P3 - Low**: Policy violations, minor vulnerabilities

**Response Procedures:**
```typescript
export async function handleSecurityIncident(incident: SecurityIncident) {
  // Immediate containment
  if (incident.severity === 'P0' || incident.severity === 'P1') {
    await containThreat(incident);
    await notifySecurityTeam(incident);
  }
  
  // Investigation
  await startInvestigation(incident);
  
  // Communication
  if (incident.requiresUserNotification) {
    await notifyAffectedUsers(incident);
  }
  
  // Recovery
  await implementRecoveryPlan(incident);
  
  // Post-incident review
  await schedulePostIncidentReview(incident);
}
```

---

## 🔒 Security Testing & Validation

### Automated Security Testing

**SAST (Static Application Security Testing):**
```yaml
# GitHub Actions security scan
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
```

**DAST (Dynamic Application Security Testing):**
```typescript
// Automated penetration testing
export async function runSecurityTests() {
  const tests = [
    testSQLInjection,
    testXSSVulnerabilities,
    testAuthenticationBypass,
    testAuthorizationFlaws,
    testRateLimiting
  ];
  
  const results = await Promise.all(
    tests.map(test => test())
  );
  
  return generateSecurityReport(results);
}
```

---

## 📋 Security Checklist

### Pre-Deployment Security Review

- [ ] **Authentication**: MFA enabled, secure password policies
- [ ] **Authorization**: RBAC implemented, RLS policies active
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Output Encoding**: XSS prevention implemented
- [ ] **HTTPS**: TLS 1.3 enforced, HSTS enabled
- [ ] **Headers**: Security headers configured
- [ ] **Rate Limiting**: API rate limits implemented
- [ ] **Logging**: Security events logged and monitored
- [ ] **Secrets**: No secrets in code, secure key management
- [ ] **Dependencies**: Security vulnerabilities scanned

---

## 🔗 Related Documentation

- **[Backend Architecture](./backend-architecture.md)** - System architecture overview
- **[Database Schema](./database-schema.md)** - Database security implementation
- **[API Documentation](../api/)** - API security specifications
- **[Development Security](../development/security-implementations.md)** - Development security practices

---

**[← Back to Backend Architecture](./backend-architecture.md)** • **[Back to Architecture Overview](./README.md)**
