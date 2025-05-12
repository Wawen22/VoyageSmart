# Authentication API

This document provides detailed information about VoyageSmart's authentication API endpoints and flow.

## Overview

VoyageSmart uses Supabase Auth for authentication. The authentication flow is as follows:

1. User signs up or logs in using email/password or a third-party provider
2. Supabase Auth generates a JWT token
3. The JWT token is stored in the browser's local storage
4. The JWT token is included in the `Authorization` header for all API requests
5. The server validates the JWT token for each request

## API Endpoints

### Sign Up

Register a new user with email and password.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": null,
      "created_at": "2023-01-15T12:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1673884800
    }
  },
  "error": null
}
```

**Error Responses:**

- `400 Bad Request`: Invalid email or password
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

### Log In

Log in with email and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2023-01-15T12:00:00Z",
      "last_login": "2023-01-15T12:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1673884800
    }
  },
  "error": null
}
```

**Error Responses:**

- `400 Bad Request`: Invalid email or password
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

### Log Out

Log out the current user.

**Endpoint:** `POST /api/auth/logout`

**Headers:**

```
Authorization: Bearer jwt-token
```

**Response:**

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Server error

### Get Current User

Get information about the currently authenticated user.

**Endpoint:** `GET /api/auth/user`

**Headers:**

```
Authorization: Bearer jwt-token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "dark",
      "currency": "USD",
      "language": "en"
    },
    "created_at": "2023-01-15T12:00:00Z",
    "last_login": "2023-01-15T12:00:00Z"
  },
  "error": null
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

### Update User Profile

Update the current user's profile information.

**Endpoint:** `PUT /api/auth/user`

**Headers:**

```
Authorization: Bearer jwt-token
```

**Request Body:**

```json
{
  "full_name": "John Smith",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "preferences": {
    "theme": "light",
    "currency": "EUR",
    "language": "fr"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "John Smith",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "preferences": {
      "theme": "light",
      "currency": "EUR",
      "language": "fr"
    },
    "created_at": "2023-01-15T12:00:00Z",
    "last_login": "2023-01-15T12:00:00Z",
    "updated_at": "2023-01-16T12:00:00Z"
  },
  "error": null
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Invalid or expired token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

### Reset Password

Send a password reset email to the user.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  },
  "error": null
}
```

**Error Responses:**

- `400 Bad Request`: Invalid email
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

## Implementation

### Client-Side Authentication

VoyageSmart uses a custom hook called `useAuth` to manage authentication on the client side:

```tsx
// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const session = supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Server-Side Authentication

On the server side, VoyageSmart uses a middleware to validate JWT tokens:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected route
  if (!session && req.nextUrl.pathname.startsWith('/api/')) {
    // Exclude public API routes
    if (
      !req.nextUrl.pathname.startsWith('/api/auth/login') &&
      !req.nextUrl.pathname.startsWith('/api/auth/signup') &&
      !req.nextUrl.pathname.startsWith('/api/auth/reset-password')
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

## Security Considerations

- **HTTPS**: All API requests should be made over HTTPS to ensure secure communication
- **JWT Expiration**: JWT tokens expire after 1 hour by default
- **Refresh Tokens**: Refresh tokens are used to obtain new JWT tokens without requiring the user to log in again
- **Password Requirements**: Passwords must be at least 8 characters long and include a mix of letters, numbers, and special characters
- **Rate Limiting**: Authentication endpoints are rate-limited to prevent brute force attacks

---

Next: [Trips](./trips.md)
