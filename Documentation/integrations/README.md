# Integrations

## Overview

VoyageSmart integrates with several external services to provide a comprehensive travel planning experience. This section covers all external integrations, their setup, configuration, and usage.

## Core Integrations

### Supabase
- **Purpose**: Database, Authentication, and Storage
- **Features**: PostgreSQL database, Row Level Security, Real-time subscriptions
- **Documentation**: [Supabase Integration](./supabase.md)

### Stripe
- **Purpose**: Payment processing and subscription management
- **Features**: Secure payments, subscription billing, webhook handling
- **Documentation**: [Stripe Integration](./stripe.md)

### Google Gemini AI
- **Purpose**: AI-powered features and chat assistance
- **Features**: Natural language processing, trip recommendations, activity generation
- **Documentation**: [Gemini AI Integration](./gemini-ai.md)

### Mapbox
- **Purpose**: Maps and location services
- **Features**: Interactive maps, geocoding, route planning
- **Documentation**: [Mapbox Integration](./mapbox.md)

## Integration Architecture

### Service Layer Pattern

```typescript
// lib/services/integrationService.ts
export abstract class IntegrationService {
  protected apiKey: string;
  protected baseUrl: string;
  
  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  abstract healthCheck(): Promise<boolean>;
  abstract authenticate(): Promise<boolean>;
}

// Example implementation
export class StripeService extends IntegrationService {
  private stripe: Stripe;
  
  constructor() {
    super(process.env.STRIPE_SECRET_KEY!, 'https://api.stripe.com');
    this.stripe = new Stripe(this.apiKey, { apiVersion: '2023-10-16' });
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.balance.retrieve();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async authenticate(): Promise<boolean> {
    return this.healthCheck();
  }
}
```

### Configuration Management

```typescript
// lib/config/integrations.ts
export const integrationConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
  },
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
    model: 'gemini-pro'
  },
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN!,
    style: 'mapbox://styles/mapbox/streets-v11'
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: 'noreply@voyagesmart.app'
  }
};
```

## Error Handling

### Integration Error Types

```typescript
// lib/errors/integrationErrors.ts
export class IntegrationError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(service: string, originalError?: Error) {
    super(`Authentication failed for ${service}`, service, 401, originalError);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends IntegrationError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, service, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
  
  retryAfter?: number;
}

export class ServiceUnavailableError extends IntegrationError {
  constructor(service: string, originalError?: Error) {
    super(`${service} is currently unavailable`, service, 503, originalError);
    this.name = 'ServiceUnavailableError';
  }
}
```

### Error Recovery

```typescript
// lib/utils/errorRecovery.ts
export class ErrorRecovery {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      console.warn('Primary operation failed, using fallback:', error);
      return await fallback();
    }
  }
}
```

## Monitoring and Health Checks

### Integration Health Monitor

```typescript
// lib/monitoring/integrationHealth.ts
export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export class IntegrationHealthMonitor {
  private healthStatuses: Map<string, HealthStatus> = new Map();
  
  async checkAllServices(): Promise<HealthStatus[]> {
    const services = [
      { name: 'supabase', check: () => this.checkSupabase() },
      { name: 'stripe', check: () => this.checkStripe() },
      { name: 'gemini', check: () => this.checkGemini() },
      { name: 'mapbox', check: () => this.checkMapbox() },
      { name: 'resend', check: () => this.checkResend() }
    ];
    
    const results = await Promise.allSettled(
      services.map(async service => {
        const startTime = Date.now();
        try {
          await service.check();
          const responseTime = Date.now() - startTime;
          
          const status: HealthStatus = {
            service: service.name,
            status: responseTime < 1000 ? 'healthy' : 'degraded',
            responseTime,
            lastChecked: new Date()
          };
          
          this.healthStatuses.set(service.name, status);
          return status;
        } catch (error) {
          const status: HealthStatus = {
            service: service.name,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          this.healthStatuses.set(service.name, status);
          return status;
        }
      })
    );
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<HealthStatus>).value);
  }
  
  private async checkSupabase(): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      integrationConfig.supabase.url,
      integrationConfig.supabase.anonKey
    );
    
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
  }
  
  private async checkStripe(): Promise<void> {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(integrationConfig.stripe.secretKey);
    await stripe.balance.retrieve();
  }
  
  private async checkGemini(): Promise<void> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${integrationConfig.gemini.apiKey}`
    );
    if (!response.ok) throw new Error('Gemini API check failed');
  }
  
  private async checkMapbox(): Promise<void> {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${integrationConfig.mapbox.accessToken}`
    );
    if (!response.ok) throw new Error('Mapbox API check failed');
  }
  
  private async checkResend(): Promise<void> {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${integrationConfig.resend.apiKey}`
      }
    });
    if (!response.ok) throw new Error('Resend API check failed');
  }
  
  getServiceStatus(serviceName: string): HealthStatus | null {
    return this.healthStatuses.get(serviceName) || null;
  }
  
  getAllStatuses(): HealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }
}
```

## Rate Limiting and Quotas

### Rate Limit Manager

```typescript
// lib/rateLimit/integrationRateLimit.ts
export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  service: string;
}

export class IntegrationRateLimitManager {
  private limits: Map<string, RateLimitConfig> = new Map([
    ['gemini', { requests: 60, windowMs: 60000, service: 'gemini' }],
    ['mapbox', { requests: 100, windowMs: 60000, service: 'mapbox' }],
    ['stripe', { requests: 100, windowMs: 60000, service: 'stripe' }],
    ['resend', { requests: 10, windowMs: 60000, service: 'resend' }]
  ]);
  
  private usage: Map<string, { count: number; resetTime: number }> = new Map();
  
  async checkLimit(service: string, identifier: string = 'default'): Promise<boolean> {
    const config = this.limits.get(service);
    if (!config) return true;
    
    const key = `${service}:${identifier}`;
    const now = Date.now();
    const current = this.usage.get(key);
    
    if (!current || now > current.resetTime) {
      this.usage.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    if (current.count >= config.requests) {
      return false;
    }
    
    current.count++;
    return true;
  }
  
  getRemainingRequests(service: string, identifier: string = 'default'): number {
    const config = this.limits.get(service);
    if (!config) return Infinity;
    
    const key = `${service}:${identifier}`;
    const current = this.usage.get(key);
    
    if (!current || Date.now() > current.resetTime) {
      return config.requests;
    }
    
    return Math.max(0, config.requests - current.count);
  }
}
```

## Security Considerations

### API Key Management

```typescript
// lib/security/apiKeyManager.ts
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private keys: Map<string, string> = new Map();
  
  private constructor() {
    this.loadKeys();
  }
  
  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }
  
  private loadKeys(): void {
    // Load from environment variables
    this.keys.set('stripe', process.env.STRIPE_SECRET_KEY!);
    this.keys.set('gemini', process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
    this.keys.set('mapbox', process.env.MAPBOX_ACCESS_TOKEN!);
    this.keys.set('resend', process.env.RESEND_API_KEY!);
  }
  
  getKey(service: string): string {
    const key = this.keys.get(service);
    if (!key) {
      throw new Error(`API key not found for service: ${service}`);
    }
    return key;
  }
  
  rotateKey(service: string, newKey: string): void {
    this.keys.set(service, newKey);
    // In production, this would also update the environment/secrets
  }
  
  validateKey(service: string, key: string): boolean {
    // Implement key validation logic
    return key.length > 0 && !key.includes('test');
  }
}
```

### Request Signing

```typescript
// lib/security/requestSigning.ts
import crypto from 'crypto';

export class RequestSigner {
  static signRequest(
    method: string,
    url: string,
    body: string,
    secret: string,
    timestamp: number = Date.now()
  ): string {
    const payload = `${method}|${url}|${body}|${timestamp}`;
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
  
  static verifySignature(
    signature: string,
    method: string,
    url: string,
    body: string,
    secret: string,
    timestamp: number,
    toleranceMs: number = 300000 // 5 minutes
  ): boolean {
    const now = Date.now();
    if (Math.abs(now - timestamp) > toleranceMs) {
      return false;
    }
    
    const expectedSignature = this.signRequest(method, url, body, secret, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}
```

## Testing Integrations

### Mock Services

```typescript
// __tests__/mocks/integrationMocks.ts
export class MockStripeService {
  async createCustomer(email: string) {
    return {
      id: 'cus_mock_123',
      email,
      created: Date.now()
    };
  }
  
  async createSubscription(customerId: string, priceId: string) {
    return {
      id: 'sub_mock_123',
      customer: customerId,
      status: 'active'
    };
  }
}

export class MockGeminiService {
  async generateContent(prompt: string) {
    return {
      response: {
        text: () => `Mock response for: ${prompt}`
      }
    };
  }
}
```

### Integration Tests

```typescript
// __tests__/integration/services.test.ts
import { IntegrationHealthMonitor } from '@/lib/monitoring/integrationHealth';

describe('Integration Health Monitor', () => {
  let monitor: IntegrationHealthMonitor;
  
  beforeEach(() => {
    monitor = new IntegrationHealthMonitor();
  });
  
  it('should check all services', async () => {
    const statuses = await monitor.checkAllServices();
    
    expect(statuses).toHaveLength(5);
    expect(statuses.every(status => 
      ['healthy', 'degraded', 'unhealthy'].includes(status.status)
    )).toBe(true);
  });
  
  it('should handle service failures gracefully', async () => {
    // Mock a service failure
    jest.spyOn(monitor as any, 'checkStripe').mockRejectedValue(new Error('Service down'));
    
    const statuses = await monitor.checkAllServices();
    const stripeStatus = statuses.find(s => s.service === 'stripe');
    
    expect(stripeStatus?.status).toBe('unhealthy');
    expect(stripeStatus?.error).toBe('Service down');
  });
});
```

## Best Practices

### Integration Guidelines

1. **Error Handling**
   - Always implement proper error handling
   - Use specific error types for different failure modes
   - Implement retry logic with exponential backoff

2. **Rate Limiting**
   - Respect service rate limits
   - Implement client-side rate limiting
   - Monitor usage and adjust limits as needed

3. **Security**
   - Never expose API keys in client-side code
   - Use environment variables for sensitive data
   - Implement request signing for webhooks

4. **Monitoring**
   - Monitor service health continuously
   - Track response times and error rates
   - Set up alerts for service degradation

5. **Testing**
   - Mock external services in tests
   - Test error scenarios and edge cases
   - Implement integration tests for critical paths

### Configuration Management

```typescript
// lib/config/integrationValidator.ts
export function validateIntegrationConfig(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_GEMINI_API_KEY',
    'MAPBOX_ACCESS_TOKEN',
    'RESEND_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify API keys are correct
   - Check key permissions and scopes
   - Ensure keys haven't expired

2. **Rate Limiting**
   - Monitor request frequency
   - Implement proper backoff strategies
   - Consider upgrading service plans

3. **Network Issues**
   - Check service status pages
   - Verify network connectivity
   - Implement timeout handling

4. **Configuration Errors**
   - Validate environment variables
   - Check service endpoints
   - Verify webhook URLs

### Debug Tools

```typescript
// lib/debug/integrationDebugger.ts
export class IntegrationDebugger {
  static logRequest(service: string, method: string, url: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${service}] ${method} ${url}`, data);
    }
  }
  
  static logResponse(service: string, status: number, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${service}] Response ${status}`, data);
    }
  }
  
  static logError(service: string, error: Error): void {
    console.error(`[${service}] Error:`, error);
  }
}
```
