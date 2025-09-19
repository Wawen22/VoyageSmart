# Security Architecture

## Overview

VoyageSmart implements a comprehensive security architecture that protects user data, ensures privacy, and maintains system integrity. The security model is built on multiple layers of protection, from authentication to data encryption.

## Authentication & Authorization

### Supabase Auth Integration

VoyageSmart uses Supabase Auth for secure user authentication with multiple layers of protection:

```typescript
// Authentication flow
export class AuthService {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw new AuthError(error.message);
    
    // Track successful login
    await this.trackLoginEvent(data.user.id);
    
    return data;
  }
  
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });
    
    if (error) throw new AuthError(error.message);
    return data;
  }
}
```

### JWT Token Management

```typescript
// Token validation middleware
export async function validateToken(request: NextRequest): Promise<User | null> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) return null;
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return null;
    
    // Verify token hasn't been revoked
    const { data: session } = await supabase.auth.getSession();
    if (!session) return null;
    
    return user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// Permission system
export enum Permission {
  READ_TRIP = 'read:trip',
  WRITE_TRIP = 'write:trip',
  DELETE_TRIP = 'delete:trip',
  MANAGE_PARTICIPANTS = 'manage:participants',
  ADMIN_ACCESS = 'admin:access'
}

export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP,
    Permission.DELETE_TRIP,
    Permission.MANAGE_PARTICIPANTS
  ],
  [Role.EDITOR]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP
  ],
  [Role.VIEWER]: [
    Permission.READ_TRIP
  ]
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}
```

## Row Level Security (RLS)

### Database-Level Security Policies

```sql
-- Trip access policy
CREATE POLICY "Users can access trips they own or participate in" ON trips
  FOR ALL USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() 
      AND invitation_status = 'accepted'
    )
  );

-- Expense privacy policy
CREATE POLICY "Users can view expenses for accessible trips" ON expenses
  FOR SELECT USING (
    trip_id IN (
      SELECT id FROM trips WHERE owner_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- Activity access policy
CREATE POLICY "Users can manage activities for their trips" ON activities
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE owner_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() 
      AND invitation_status = 'accepted'
      AND role IN ('admin', 'editor')
    )
  );

-- Admin-only access policy
CREATE POLICY "Admin users can access all data" ON users
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );
```

### Dynamic RLS Policies

```typescript
// Dynamic policy enforcement
export async function enforceRLS(
  tableName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  userId: string,
  resourceId?: string
): Promise<boolean> {
  const policies = await getPoliciesForTable(tableName);
  
  for (const policy of policies) {
    if (policy.operation === operation) {
      const isAllowed = await evaluatePolicy(policy, userId, resourceId);
      if (!isAllowed) return false;
    }
  }
  
  return true;
}
```

## Data Encryption

### Encryption at Rest

```typescript
// Sensitive data encryption
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('VoyageSmart', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('VoyageSmart', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Encryption in Transit

```typescript
// HTTPS enforcement
export function enforceHTTPS(request: NextRequest): NextResponse | null {
  const proto = request.headers.get('x-forwarded-proto');
  
  if (process.env.NODE_ENV === 'production' && proto !== 'https') {
    const httpsUrl = `https://${request.headers.get('host')}${request.nextUrl.pathname}`;
    return NextResponse.redirect(httpsUrl, 301);
  }
  
  return null;
}

// TLS configuration
export const tlsConfig = {
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true
};
```

## Input Validation & Sanitization

### Schema Validation

```typescript
// Comprehensive validation schemas
import { z } from 'zod';

export const userInputSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  fullName: z.string().min(1).max(100).regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )
});

export const tripInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  destination: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budgetTotal: z.number().positive().max(1000000).optional(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/)
});
```

### SQL Injection Prevention

```typescript
// Parameterized queries
export class SecureQueryBuilder {
  static buildTripQuery(userId: string, filters: any): string {
    const baseQuery = `
      SELECT t.*, tp.role 
      FROM trips t
      LEFT JOIN trip_participants tp ON t.id = tp.trip_id
      WHERE (t.owner_id = $1 OR (tp.user_id = $1 AND tp.invitation_status = 'accepted'))
    `;
    
    const params = [userId];
    let whereClause = '';
    
    if (filters.destination) {
      whereClause += ` AND t.destination ILIKE $${params.length + 1}`;
      params.push(`%${filters.destination}%`);
    }
    
    if (filters.startDate) {
      whereClause += ` AND t.start_date >= $${params.length + 1}`;
      params.push(filters.startDate);
    }
    
    return {
      query: baseQuery + whereClause + ' ORDER BY t.created_at DESC',
      params
    };
  }
}
```

### XSS Prevention

```typescript
// Content sanitization
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeUserInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value);
    }
    return sanitized;
  }
  
  return input;
}
```

## Rate Limiting & DDoS Protection

### API Rate Limiting

```typescript
// Advanced rate limiting
export class RateLimiter {
  private windows: Map<string, RateWindow> = new Map();
  
  async checkLimit(
    identifier: string,
    limits: RateLimit[]
  ): Promise<RateLimitResult> {
    const now = Date.now();
    
    for (const limit of limits) {
      const key = `${identifier}:${limit.window}`;
      const window = this.windows.get(key) || {
        count: 0,
        resetTime: now + limit.window
      };
      
      if (now > window.resetTime) {
        window.count = 0;
        window.resetTime = now + limit.window;
      }
      
      if (window.count >= limit.max) {
        return {
          allowed: false,
          limit: limit.max,
          remaining: 0,
          resetTime: window.resetTime
        };
      }
      
      window.count++;
      this.windows.set(key, window);
    }
    
    return { allowed: true };
  }
}

// Rate limit configurations
export const rateLimits = {
  auth: [
    { window: 15 * 60 * 1000, max: 5 },    // 5 attempts per 15 minutes
    { window: 60 * 60 * 1000, max: 10 }    // 10 attempts per hour
  ],
  api: [
    { window: 60 * 1000, max: 100 },       // 100 requests per minute
    { window: 60 * 60 * 1000, max: 1000 }  // 1000 requests per hour
  ],
  ai: [
    { window: 60 * 1000, max: 20 },        // 20 AI requests per minute
    { window: 60 * 60 * 1000, max: 100 }   // 100 AI requests per hour
  ]
};
```

### DDoS Protection

```typescript
// DDoS detection and mitigation
export class DDoSProtection {
  private suspiciousIPs: Map<string, SuspiciousActivity> = new Map();
  
  async analyzeRequest(request: NextRequest): Promise<SecurityAction> {
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /bot|crawler|spider/i,
      /curl|wget|python/i,
      /automated|script/i
    ];
    
    const isSuspiciousUA = suspiciousPatterns.some(pattern => 
      pattern.test(userAgent)
    );
    
    if (isSuspiciousUA) {
      await this.flagSuspiciousActivity(clientIP, 'suspicious_user_agent');
    }
    
    // Check request frequency
    const activity = this.suspiciousIPs.get(clientIP);
    if (activity && activity.score > 100) {
      return { action: 'block', reason: 'high_risk_score' };
    }
    
    return { action: 'allow' };
  }
  
  private async flagSuspiciousActivity(
    ip: string, 
    reason: string
  ): Promise<void> {
    const activity = this.suspiciousIPs.get(ip) || {
      score: 0,
      incidents: [],
      firstSeen: Date.now()
    };
    
    activity.score += this.getScoreForReason(reason);
    activity.incidents.push({
      reason,
      timestamp: Date.now()
    });
    
    this.suspiciousIPs.set(ip, activity);
    
    // Log for monitoring
    console.warn(`Suspicious activity detected: ${ip} - ${reason}`);
  }
}
```

## CORS & CSP Configuration

### Cross-Origin Resource Sharing

```typescript
// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'https://voyagesmart.app',
      'https://www.voyagesmart.app',
      'https://app.voyagesmart.app'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Content Security Policy

```typescript
// CSP headers
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://js.stripe.com',
    'https://maps.googleapis.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:'
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://*.supabase.co',
    'https://api.openai.com',
    'https://generativelanguage.googleapis.com'
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com'
  ]
};

export function generateCSPHeader(): string {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}
```

## Security Monitoring & Logging

### Security Event Logging

```typescript
// Security event tracking
export class SecurityLogger {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      action: event.action
    };
    
    // Log to database
    await supabase
      .from('security_logs')
      .insert(logEntry);
    
    // Alert on high severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.sendSecurityAlert(logEntry);
    }
  }
  
  async detectAnomalies(): Promise<SecurityAnomaly[]> {
    const recentLogs = await this.getRecentSecurityLogs();
    const anomalies: SecurityAnomaly[] = [];
    
    // Detect unusual login patterns
    const loginAttempts = recentLogs.filter(log => 
      log.type === 'auth_attempt'
    );
    
    const failedLogins = loginAttempts.filter(log => 
      log.details.success === false
    );
    
    if (failedLogins.length > 10) {
      anomalies.push({
        type: 'excessive_failed_logins',
        severity: 'medium',
        count: failedLogins.length,
        timeframe: '1 hour'
      });
    }
    
    return anomalies;
  }
}
```

### Intrusion Detection

```typescript
// Intrusion detection system
export class IntrusionDetection {
  private patterns: SecurityPattern[] = [
    {
      name: 'sql_injection',
      regex: /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(from|where|order|group)\b)/i,
      severity: 'high'
    },
    {
      name: 'xss_attempt',
      regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      severity: 'high'
    },
    {
      name: 'path_traversal',
      regex: /(\.\.[\/\\]){2,}/,
      severity: 'medium'
    }
  ];
  
  async analyzeRequest(request: NextRequest): Promise<ThreatAssessment> {
    const threats: DetectedThreat[] = [];
    const requestData = await this.extractRequestData(request);
    
    for (const pattern of this.patterns) {
      if (pattern.regex.test(requestData)) {
        threats.push({
          type: pattern.name,
          severity: pattern.severity,
          pattern: pattern.regex.source,
          matchedContent: requestData.match(pattern.regex)?.[0]
        });
      }
    }
    
    return {
      riskScore: this.calculateRiskScore(threats),
      threats,
      recommendation: this.getRecommendation(threats)
    };
  }
}
```

## Compliance & Privacy

### GDPR Compliance

```typescript
// GDPR data handling
export class GDPRService {
  async handleDataRequest(
    userId: string,
    requestType: 'access' | 'portability' | 'deletion'
  ): Promise<GDPRResponse> {
    switch (requestType) {
      case 'access':
        return this.generateDataReport(userId);
      case 'portability':
        return this.exportUserData(userId);
      case 'deletion':
        return this.deleteUserData(userId);
    }
  }
  
  async generateDataReport(userId: string): Promise<DataReport> {
    const userData = await this.collectUserData(userId);
    
    return {
      personalData: userData.profile,
      trips: userData.trips,
      expenses: userData.expenses,
      activities: userData.activities,
      processingPurposes: [
        'Trip planning and management',
        'Expense tracking and splitting',
        'AI-powered recommendations',
        'Service improvement'
      ],
      dataRetentionPeriod: '2 years after account deletion',
      thirdPartySharing: [
        'Stripe (payment processing)',
        'Google (AI services)',
        'Mapbox (mapping services)'
      ]
    };
  }
  
  async anonymizeUserData(userId: string): Promise<void> {
    // Replace personal identifiers with anonymous IDs
    await supabase
      .from('users')
      .update({
        email: `anonymous_${Date.now()}@deleted.local`,
        full_name: 'Deleted User',
        avatar_url: null,
        preferences: {}
      })
      .eq('id', userId);
  }
}
```

### Data Retention Policies

```typescript
// Automated data cleanup
export class DataRetentionService {
  async enforceRetentionPolicies(): Promise<void> {
    const policies = [
      {
        table: 'security_logs',
        retentionDays: 90,
        dateColumn: 'created_at'
      },
      {
        table: 'ai_analytics',
        retentionDays: 365,
        dateColumn: 'timestamp'
      },
      {
        table: 'deleted_users',
        retentionDays: 30,
        dateColumn: 'deleted_at'
      }
    ];
    
    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
      
      await supabase
        .from(policy.table)
        .delete()
        .lt(policy.dateColumn, cutoffDate.toISOString());
    }
  }
}
```

## Security Best Practices

### Secure Development Guidelines

1. **Input Validation**: Always validate and sanitize user input
2. **Least Privilege**: Grant minimum necessary permissions
3. **Defense in Depth**: Implement multiple security layers
4. **Regular Updates**: Keep dependencies and systems updated
5. **Security Testing**: Regular penetration testing and audits
6. **Incident Response**: Prepared response procedures
7. **Data Minimization**: Collect only necessary data
8. **Encryption**: Encrypt sensitive data at rest and in transit
9. **Monitoring**: Continuous security monitoring and alerting
10. **Training**: Regular security awareness training

### Security Checklist

- [ ] Authentication implemented with strong password requirements
- [ ] Authorization enforced at database and application levels
- [ ] Input validation and sanitization on all user inputs
- [ ] Rate limiting implemented on all public endpoints
- [ ] HTTPS enforced in production
- [ ] CSP headers configured properly
- [ ] Security headers implemented (HSTS, X-Frame-Options, etc.)
- [ ] Regular security audits and penetration testing
- [ ] Incident response plan documented and tested
- [ ] Data backup and recovery procedures in place
- [ ] GDPR compliance measures implemented
- [ ] Security monitoring and alerting configured
