# API Authentication

## Overview

VoyageSmart API uses JWT (JSON Web Tokens) for authentication, powered by Supabase Auth. This document covers authentication flows, token management, and security best practices for API access.

## Authentication Flow

### JWT Token-Based Authentication

All protected API endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### Token Structure

VoyageSmart uses Supabase JWT tokens with the following structure:

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "full_name": "John Doe"
  },
  "role": "authenticated",
  "aal": "aal1",
  "amr": [{"method": "password", "timestamp": 1234567890}],
  "session_id": "session-uuid"
}
```

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "email_confirmed_at": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "session": null
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Implementation:**
```typescript
// app/api/auth/register/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { email, password, full_name } = await request.json();

    // Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Register user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Registration successful. Please check your email to verify your account.'
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### POST /api/auth/login

Authenticate user and receive access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": null,
      "role": "authenticated"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890,
      "token_type": "bearer"
    }
  }
}
```

**Implementation:**
```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { email, password } = await request.json();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### POST /api/auth/logout

Logout user and invalidate session.

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token",
    "expires_at": 1234567890
  }
}
```

## Token Management

### Token Validation Middleware

```typescript
// lib/middleware/auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function validateAuth(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add user info to request headers for downstream handlers
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email || '');
    
    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request);
  if (authResult.status === 401) {
    return authResult;
  }

  const userId = request.headers.get('x-user-id');
  // Continue with authenticated request...
}
```

### Client-Side Token Management

```typescript
// lib/auth/tokenManager.ts
export class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  setTokens(accessToken: string, refreshToken: string, expiresAt: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('expires_at', expiresAt.toString());
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.expiresAt = parseInt(localStorage.getItem('expires_at') || '0');
    }

    // Check if token is expired
    if (this.expiresAt && Date.now() / 1000 > this.expiresAt) {
      this.clearTokens();
      return null;
    }

    return this.accessToken;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('refresh_token');
    }

    if (!this.refreshToken) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      this.setTokens(
        data.data.access_token,
        data.data.refresh_token,
        data.data.expires_at
      );

      return data.data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
    }
  }

  isTokenExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() / 1000 > this.expiresAt;
  }
}
```

## API Client with Authentication

### Authenticated HTTP Client

```typescript
// lib/api/client.ts
import { TokenManager } from '@/lib/auth/tokenManager';

export class APIClient {
  private baseURL: string;
  private tokenManager: TokenManager;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.tokenManager = TokenManager.getInstance();
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get access token
    let accessToken = this.tokenManager.getAccessToken();
    
    // Refresh token if expired
    if (!accessToken || this.tokenManager.isTokenExpired()) {
      accessToken = await this.tokenManager.refreshAccessToken();
      
      if (!accessToken) {
        throw new Error('Authentication required');
      }
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers
    };

    // Make request
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 responses
    if (response.status === 401) {
      // Try to refresh token once
      const newToken = await this.tokenManager.refreshAccessToken();
      
      if (newToken) {
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }

        return retryResponse.json();
      } else {
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Usage
const apiClient = new APIClient();

// Get user trips
const trips = await apiClient.get('/trips');

// Create new trip
const newTrip = await apiClient.post('/trips', {
  name: 'Paris Adventure',
  destination: 'Paris, France'
});
```

## Role-Based Access Control

### User Roles and Permissions

```typescript
// types/auth.ts
export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export const USER_ROLES: UserRole[] = [
  {
    id: 'user',
    name: 'User',
    permissions: [
      { resource: 'trips', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'expenses', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'activities', actions: ['read', 'create', 'update', 'delete'] }
    ]
  },
  {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      { resource: '*', actions: ['*'] }
    ]
  }
];
```

### Permission Middleware

```typescript
// lib/middleware/permissions.ts
export function requirePermission(resource: string, action: string) {
  return async (request: NextRequest) => {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const userRole = USER_ROLES.find(role => role.id === user?.role);
    
    if (!userRole) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    // Check permissions
    const hasPermission = userRole.permissions.some(permission => 
      (permission.resource === '*' || permission.resource === resource) &&
      (permission.actions.includes('*') || permission.actions.includes(action))
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return null; // Allow request to proceed
  };
}
```

## Security Best Practices

### Token Security

1. **Secure Storage**: Store tokens securely (httpOnly cookies for web)
2. **Token Rotation**: Implement automatic token refresh
3. **Expiration**: Use short-lived access tokens (1 hour)
4. **Revocation**: Implement token revocation on logout
5. **HTTPS Only**: Always use HTTPS in production

### API Security

1. **Rate Limiting**: Implement rate limiting per user/IP
2. **Input Validation**: Validate all input data
3. **CORS**: Configure CORS appropriately
4. **Headers**: Use security headers (HSTS, CSP, etc.)
5. **Logging**: Log authentication events for monitoring

### Error Handling

```typescript
// lib/errors/authErrors.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: new AuthError('Invalid credentials', 'INVALID_CREDENTIALS', 401),
  TOKEN_EXPIRED: new AuthError('Token expired', 'TOKEN_EXPIRED', 401),
  INSUFFICIENT_PERMISSIONS: new AuthError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', 403),
  ACCOUNT_LOCKED: new AuthError('Account locked', 'ACCOUNT_LOCKED', 423),
  EMAIL_NOT_VERIFIED: new AuthError('Email not verified', 'EMAIL_NOT_VERIFIED', 403)
};
```

## Testing Authentication

### Authentication Testing

```typescript
// __tests__/auth/authentication.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/auth/login/route';

describe('Authentication API', () => {
  it('should authenticate valid credentials', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.session.access_token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});
```

## Monitoring and Analytics

### Authentication Metrics

- **Login Success Rate**: Track successful vs failed logins
- **Token Refresh Rate**: Monitor token refresh frequency
- **Session Duration**: Average session length
- **Failed Attempts**: Monitor for brute force attacks
- **Geographic Distribution**: Track login locations

### Security Monitoring

- **Suspicious Activity**: Detect unusual login patterns
- **Multiple Devices**: Track concurrent sessions
- **API Abuse**: Monitor for excessive API calls
- **Error Rates**: Track authentication error patterns
