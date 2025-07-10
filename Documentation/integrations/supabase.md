# Supabase Integration

VoyageSmart uses Supabase as its primary backend service, providing database, authentication, storage, and real-time functionality. This document covers the complete integration setup and usage.

## 🎯 Overview

Supabase provides:
- **PostgreSQL Database**: Primary data storage with Row Level Security
- **Authentication**: User management and session handling
- **Storage**: File and media storage with CDN
- **Real-time**: Live updates and collaboration features
- **Edge Functions**: Serverless compute (when needed)

## 🔧 Setup and Configuration

### Project Setup

#### 1. Create Supabase Project
```bash
# Visit https://app.supabase.com/
# Click "New Project"
# Choose organization and enter project details
# Wait for project initialization (2-3 minutes)
```

#### 2. Get Project Credentials
```bash
# From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Client Configuration

#### Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side Supabase client
export const createClient = () => createClientComponentClient();

// Server-side Supabase client
export const createServerClient = () => createServerComponentClient({ cookies });

// Service role client (server-side only)
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
```

## 🗄️ Database Schema

### Core Tables

#### Users Table (extends auth.users)
```sql
-- Create users profile table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

#### Trips Table
```sql
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  budget_total DECIMAL,
  is_private BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Trip access policies
CREATE POLICY "Users can view accessible trips" ON public.trips
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trip_participants
      WHERE trip_id = trips.id 
      AND user_id = auth.uid()
      AND invitation_status = 'accepted'
    )
  );
```

### Database Functions

#### Expense Splitting Function
```sql
CREATE OR REPLACE FUNCTION split_expense(
  expense_id UUID,
  participant_ids UUID[],
  split_amounts DECIMAL[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  expense_amount DECIMAL;
  participant_count INTEGER;
  amount_per_person DECIMAL;
  participant_id UUID;
  i INTEGER := 1;
BEGIN
  -- Get expense amount
  SELECT amount INTO expense_amount FROM expenses WHERE id = expense_id;
  
  -- Calculate split
  participant_count := array_length(participant_ids, 1);
  
  IF split_amounts IS NULL THEN
    -- Equal split
    amount_per_person := expense_amount / participant_count;
    
    FOREACH participant_id IN ARRAY participant_ids LOOP
      INSERT INTO expense_participants (expense_id, user_id, amount_owed)
      VALUES (expense_id, participant_id, amount_per_person);
    END LOOP;
  ELSE
    -- Custom split
    FOREACH participant_id IN ARRAY participant_ids LOOP
      INSERT INTO expense_participants (expense_id, user_id, amount_owed)
      VALUES (expense_id, participant_id, split_amounts[i]);
      i := i + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔐 Authentication

### Auth Configuration

#### Setup Auth Providers
```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin);
}
```

#### Auth Context Provider
```typescript
// components/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/auth-helpers-nextjs';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

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
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 📁 Storage Integration

### File Upload Setup

#### Storage Buckets Configuration
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('trip-documents', 'trip-documents', false),
  ('expense-receipts', 'expense-receipts', false),
  ('trip-media', 'trip-media', true),
  ('user-avatars', 'user-avatars', true);

-- Storage policies for trip documents
CREATE POLICY "Users can upload trip documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trip-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view accessible trip documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'trip-documents' AND
    EXISTS (
      SELECT 1 FROM trips t
      JOIN trip_participants tp ON t.id = tp.trip_id
      WHERE t.id::text = (storage.foldername(name))[2]
      AND (t.owner_id = auth.uid() OR tp.user_id = auth.uid())
    )
  );
```

#### File Upload Service
```typescript
// services/storageService.ts
import { createClient } from '@/lib/supabase';

export class StorageService {
  private supabase = createClient();

  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { upsert?: boolean }
  ) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options?.upsert || false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return { data, publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(bucket: string, path: string) {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export const storageService = new StorageService();
```

## ⚡ Real-time Features

### Real-time Subscriptions

#### Trip Collaboration
```typescript
// hooks/useRealtimeTrip.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Trip } from '@/types/trip';

export function useRealtimeTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to trip changes
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTrip(payload.new as Trip);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          // Handle activity changes
          console.log('Activity changed:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, supabase]);

  return { trip };
}
```

#### Presence System
```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface PresenceState {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  online_at: string;
}

export function usePresence(tripId: string) {
  const [presenceState, setPresenceState] = useState<Record<string, PresenceState>>({});
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`trip-${tripId}-presence`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPresenceState(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              full_name: user.user_metadata.full_name,
              avatar_url: user.user_metadata.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, supabase]);

  return { presenceState };
}
```

## 🔍 Advanced Queries

### Complex Data Fetching

#### Trip with Related Data
```typescript
// services/tripService.ts
export class TripService {
  private supabase = createClient();

  async getTripWithDetails(tripId: string) {
    const { data, error } = await this.supabase
      .from('trips')
      .select(`
        *,
        owner:users!trips_owner_id_fkey(id, full_name, avatar_url),
        participants:trip_participants(
          id,
          role,
          invitation_status,
          user:users(id, full_name, avatar_url)
        ),
        activities(
          id,
          name,
          type,
          start_time,
          end_time,
          location,
          cost,
          status
        ),
        accommodations(
          id,
          name,
          type,
          check_in_date,
          check_out_date,
          cost
        ),
        expenses(
          id,
          description,
          amount,
          currency,
          category,
          date,
          paid_by:users!expenses_paid_by_fkey(full_name)
        )
      `)
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  }

  async getTripExpenseSummary(tripId: string) {
    const { data, error } = await this.supabase
      .rpc('get_trip_expense_summary', { trip_id: tripId });

    if (error) throw error;
    return data;
  }
}
```

### Custom RPC Functions

#### Expense Summary Function
```sql
CREATE OR REPLACE FUNCTION get_trip_expense_summary(trip_id UUID)
RETURNS TABLE (
  total_expenses DECIMAL,
  category_breakdown JSONB,
  participant_balances JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(
      jsonb_object_agg(
        e.category, 
        SUM(e.amount)
      ) FILTER (WHERE e.category IS NOT NULL),
      '{}'::jsonb
    ) as category_breakdown,
    COALESCE(
      jsonb_object_agg(
        u.full_name,
        jsonb_build_object(
          'paid', COALESCE(SUM(CASE WHEN e.paid_by = u.id THEN e.amount ELSE 0 END), 0),
          'owed', COALESCE(SUM(ep.amount_owed), 0)
        )
      ) FILTER (WHERE u.id IS NOT NULL),
      '{}'::jsonb
    ) as participant_balances
  FROM expenses e
  LEFT JOIN expense_participants ep ON e.id = ep.expense_id
  LEFT JOIN users u ON ep.user_id = u.id
  WHERE e.trip_id = get_trip_expense_summary.trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🛠️ Performance Optimization

### Query Optimization

#### Efficient Pagination
```typescript
const getPaginatedTrips = async (page: number = 1, limit: number = 10) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('trips')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
};
```

#### Caching Strategy
```typescript
// lib/cache.ts
import { createClient } from '@/lib/supabase';

class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now, ttl });
    return data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
```

## 🔧 Troubleshooting

### Common Issues

#### RLS Policy Debugging
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM trips; -- Test if user can access trips
```

#### Connection Issues
```typescript
// Test Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Connection error:', error);
      return false;
    }

    console.log('Connection successful');
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
};
```

---

**Related Documentation:**
- [Database Schema](../architecture/database-schema.md) - Complete database structure
- [Security Implementation](../architecture/security.md) - Security best practices
- [API Documentation](../api/README.md) - API endpoints and usage
