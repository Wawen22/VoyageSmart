# Security Implementations

## Overview

This document details the specific security implementations in VoyageSmart, providing developers with practical guidance on maintaining and extending the security features.

## Authentication Implementation

### Supabase Auth Integration

```typescript
// lib/auth.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };
}
```

### Password Security

```typescript
// lib/password-validation.ts
import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const result = zxcvbn(password);
  
  return {
    score: result.score,
    feedback: result.feedback.suggestions,
    isValid: result.score >= 3 && password.length >= 8
  };
}

export function validatePasswordRequirements(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## Authorization & Access Control

### Role-Based Access Control

```typescript
// lib/rbac.ts
export enum Permission {
  READ_TRIP = 'read:trip',
  WRITE_TRIP = 'write:trip',
  DELETE_TRIP = 'delete:trip',
  MANAGE_PARTICIPANTS = 'manage:participants',
  ADMIN_ACCESS = 'admin:access',
  VIEW_EXPENSES = 'view:expenses',
  MANAGE_EXPENSES = 'manage:expenses'
}

export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  OWNER = 'owner'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP,
    Permission.DELETE_TRIP,
    Permission.MANAGE_PARTICIPANTS,
    Permission.VIEW_EXPENSES,
    Permission.MANAGE_EXPENSES
  ],
  [Role.ADMIN]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP,
    Permission.MANAGE_PARTICIPANTS,
    Permission.VIEW_EXPENSES,
    Permission.MANAGE_EXPENSES
  ],
  [Role.EDITOR]: [
    Permission.READ_TRIP,
    Permission.WRITE_TRIP,
    Permission.VIEW_EXPENSES,
    Permission.MANAGE_EXPENSES
  ],
  [Role.VIEWER]: [
    Permission.READ_TRIP,
    Permission.VIEW_EXPENSES
  ]
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

export function canAccessTrip(
  userRole: Role, 
  action: 'read' | 'write' | 'delete'
): boolean {
  const permissionMap = {
    read: Permission.READ_TRIP,
    write: Permission.WRITE_TRIP,
    delete: Permission.DELETE_TRIP
  };
  
  return hasPermission(userRole, permissionMap[action]);
}
```

### Trip Access Control Hook

```typescript
// hooks/useRolePermissions.ts
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Role, Permission, hasPermission } from '@/lib/rbac';

export function useRolePermissions(tripId?: string) {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user || !tripId) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is trip owner
        const { data: trip } = await supabase
          .from('trips')
          .select('owner_id')
          .eq('id', tripId)
          .single();

        if (trip?.owner_id === user.id) {
          setRole(Role.OWNER);
          setLoading(false);
          return;
        }

        // Check participant role
        const { data: participant } = await supabase
          .from('trip_participants')
          .select('role')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .eq('invitation_status', 'accepted')
          .single();

        setRole(participant?.role as Role || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, tripId]);

  const checkPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  const canRead = checkPermission(Permission.READ_TRIP);
  const canWrite = checkPermission(Permission.WRITE_TRIP);
  const canDelete = checkPermission(Permission.DELETE_TRIP);
  const canManageParticipants = checkPermission(Permission.MANAGE_PARTICIPANTS);
  const canViewExpenses = checkPermission(Permission.VIEW_EXPENSES);
  const canManageExpenses = checkPermission(Permission.MANAGE_EXPENSES);

  return {
    role,
    loading,
    canRead,
    canWrite,
    canDelete,
    canManageParticipants,
    canViewExpenses,
    canManageExpenses,
    checkPermission
  };
}
```

## Input Validation & Sanitization

### Comprehensive Validation Schemas

```typescript
// lib/validation-schemas.ts
import { z } from 'zod';

// User validation
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
});

// Trip validation
export const tripSchema = z.object({
  name: z.string()
    .min(1, 'Trip name is required')
    .max(100, 'Trip name too long')
    .trim(),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  destination: z.string()
    .min(1, 'Destination is required')
    .max(100, 'Destination too long')
    .trim(),
  startDate: z.string()
    .datetime('Invalid start date'),
  endDate: z.string()
    .datetime('Invalid end date'),
  budgetTotal: z.number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget too large')
    .optional(),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Invalid currency format')
    .default('USD')
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

// Expense validation
export const expenseSchema = z.object({
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category too long'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Invalid currency format'),
  date: z.string()
    .datetime('Invalid date'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  splitType: z.enum(['equal', 'custom', 'percentage'])
});
```

### Input Sanitization

```typescript
// lib/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

export function sanitizeUserInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
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

export function validateAndSanitize<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  // First sanitize the input
  const sanitized = sanitizeUserInput(data);
  
  // Then validate with schema
  return schema.parse(sanitized);
}
```

## API Security Middleware

### Authentication Middleware

```typescript
// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No active session' },
        { status: 401 }
      );
    }

    // Check if user account is active
    const { data: user } = await supabase
      .from('users')
      .select('id, preferences')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return handler(request, session.user);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Rate Limiting Implementation

```typescript
// lib/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimit {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimit> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  async checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const limit = this.limits.get(identifier);

    if (!limit || now > limit.resetTime) {
      // Create new window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    if (limit.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: limit.resetTime
      };
    }

    limit.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - limit.count,
      resetTime: limit.resetTime
    };
  }
}

const rateLimiter = new RateLimiter();

export async function applyRateLimit(
  request: NextRequest,
  config: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: NextRequest) => string;
  }
): Promise<NextResponse | null> {
  const identifier = config.keyGenerator 
    ? config.keyGenerator(request)
    : request.ip || 'unknown';

  const result = await rateLimiter.checkLimit(
    identifier,
    config.maxRequests,
    config.windowMs
  );

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    );
  }

  return null;
}

// Usage in API routes
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => req.ip || 'unknown'
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Continue with normal processing
  return withAuth(request, async (req, user) => {
    // API logic here
  });
}
```

## Data Encryption

### Encryption Service

```typescript
// lib/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly keyDerivationSalt: Buffer;

  constructor() {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    this.keyDerivationSalt = Buffer.from(process.env.ENCRYPTION_SALT || 'default-salt', 'hex');
    this.key = crypto.pbkdf2Sync(masterKey, this.keyDerivationSalt, 100000, 32, 'sha256');
  }

  encrypt(text: string, additionalData?: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: string, additionalData?: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipher(this.algorithm, this.key);
      
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }
      
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha256');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const newHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha256');
      return hash === newHash.toString('hex');
    } catch (error) {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
```

## Security Headers

### Security Headers Middleware

```typescript
// lib/middleware/security-headers.ts
import { NextResponse } from 'next/server';

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  
  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}
```

## Security Monitoring

### Security Event Logging

```typescript
// lib/security-logger.ts
import { supabase } from '@/lib/supabase';

export interface SecurityEvent {
  type: 'auth_attempt' | 'auth_failure' | 'suspicious_activity' | 'data_access' | 'permission_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  action?: string;
}

export class SecurityLogger {
  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      const logEntry = {
        type: event.type,
        severity: event.severity,
        user_id: event.userId,
        ip_address: event.ip,
        user_agent: event.userAgent,
        details: event.details,
        action: event.action,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('security_logs')
        .insert(logEntry);

      // Alert on high severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.sendAlert(logEntry);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async sendAlert(logEntry: any): Promise<void> {
    // Implementation for sending alerts (email, Slack, etc.)
    console.warn('Security Alert:', logEntry);
  }

  async getRecentEvents(limit: number = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }

    return data || [];
  }
}

export const securityLogger = new SecurityLogger();
```

## Security Testing

### Security Test Utilities

```typescript
// __tests__/security/security-utils.test.ts
import { validatePasswordStrength, sanitizeUserInput } from '@/lib/security';

describe('Security Utilities', () => {
  describe('Password Validation', () => {
    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('123456');
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(3);
    });

    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('MyStr0ng!Password');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Input Sanitization', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeUserInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove javascript: protocols', () => {
      const malicious = 'javascript:alert("xss")';
      const sanitized = sanitizeUserInput(malicious);
      expect(sanitized).not.toContain('javascript:');
    });
  });
});
```

## Security Checklist

### Implementation Checklist

- [ ] Authentication implemented with Supabase Auth
- [ ] Password strength validation enforced
- [ ] Role-based access control implemented
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention with parameterized queries
- [ ] XSS prevention with input sanitization
- [ ] CSRF protection with SameSite cookies
- [ ] Rate limiting on API endpoints
- [ ] Security headers configured
- [ ] HTTPS enforced in production
- [ ] Sensitive data encryption at rest
- [ ] Security event logging implemented
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerability scanning
- [ ] Error handling doesn't leak sensitive information
