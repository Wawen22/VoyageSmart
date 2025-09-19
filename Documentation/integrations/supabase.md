# Supabase Integration

## Overview

Supabase serves as VoyageSmart's primary backend infrastructure, providing PostgreSQL database, authentication, real-time subscriptions, and file storage. This integration is central to the application's functionality.

## Setup and Configuration

### Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Client Configuration

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### Next.js Integration

```typescript
// lib/supabase-server.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// For API routes
export function createSupabaseRouteClient() {
  return createRouteHandlerClient({ cookies });
}

// For server components
export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies });
}
```

## Authentication

### User Authentication Flow

```typescript
// lib/auth/supabaseAuth.ts
export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient) {}

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw new AuthError(error.message);
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw new AuthError(error.message);
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new AuthError(error.message);
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw new AuthError(error.message);
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw new AuthError(error.message);
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw new AuthError(error.message);
    return session;
  }

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw new AuthError(error.message);
    return user;
  }
}
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Trip access policies
CREATE POLICY "Users can view trips they own or participate in" ON trips
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Trip owners can update their trips" ON trips
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Trip owners can delete their trips" ON trips
  FOR DELETE USING (owner_id = auth.uid());

-- Expense access policies
CREATE POLICY "Users can view expenses for accessible trips" ON expenses
  FOR SELECT USING (
    trip_id IN (
      SELECT id FROM trips WHERE owner_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

CREATE POLICY "Users can create expenses for accessible trips" ON expenses
  FOR INSERT WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE owner_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() 
      AND invitation_status = 'accepted'
      AND role IN ('admin', 'editor')
    )
  );
```

## Database Operations

### CRUD Operations

```typescript
// lib/services/supabaseService.ts
export class SupabaseService<T> {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string
  ) {}

  async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return result;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(error.message);
    }

    return data;
  }

  async findMany(filters?: Record<string, any>): Promise<T[]> {
    let query = this.supabase.from(this.tableName).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;

    if (error) throw new DatabaseError(error.message);
    return data || [];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new DatabaseError(error.message);
  }
}
```

### Complex Queries

```typescript
// lib/services/tripService.ts
export class TripService extends SupabaseService<Trip> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'trips');
  }

  async getTripWithDetails(tripId: string): Promise<TripWithDetails | null> {
    const { data, error } = await this.supabase
      .from('trips')
      .select(`
        *,
        trip_participants (
          id,
          user_id,
          invited_email,
          role,
          invitation_status,
          users (
            id,
            full_name,
            avatar_url
          )
        ),
        accommodations (*),
        transportation (*),
        itinerary_days (
          *,
          activities (*)
        ),
        expenses (
          *,
          users!expenses_paid_by_fkey (
            id,
            full_name
          ),
          expense_participants (
            *,
            users (
              id,
              full_name
            )
          )
        )
      `)
      .eq('id', tripId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(error.message);
    }

    return data;
  }

  async getUserTrips(userId: string): Promise<Trip[]> {
    const { data, error } = await this.supabase
      .from('trips')
      .select(`
        *,
        trip_participants!inner (
          role,
          invitation_status
        )
      `)
      .or(`owner_id.eq.${userId},trip_participants.user_id.eq.${userId}`)
      .eq('trip_participants.invitation_status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw new DatabaseError(error.message);
    return data || [];
  }
}
```

## Real-time Subscriptions

### Real-time Updates

```typescript
// lib/realtime/supabaseRealtime.ts
export class SupabaseRealtimeService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  constructor(private supabase: SupabaseClient) {}

  subscribeToTrip(tripId: string, callbacks: {
    onTripUpdate?: (payload: any) => void;
    onExpenseChange?: (payload: any) => void;
    onActivityChange?: (payload: any) => void;
  }) {
    const channel = this.supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        callbacks.onTripUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `trip_id=eq.${tripId}`
        },
        callbacks.onExpenseChange || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`
        },
        callbacks.onActivityChange || (() => {})
      )
      .subscribe();

    this.subscriptions.set(`trip-${tripId}`, channel);
    return channel;
  }

  unsubscribeFromTrip(tripId: string) {
    const channel = this.subscriptions.get(`trip-${tripId}`);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.subscriptions.delete(`trip-${tripId}`);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}
```

### React Hook for Real-time

```typescript
// hooks/useSupabaseRealtime.ts
export function useSupabaseRealtime(tripId: string) {
  const [realtimeService] = useState(() => new SupabaseRealtimeService(supabase));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const channel = realtimeService.subscribeToTrip(tripId, {
      onTripUpdate: (payload) => {
        console.log('Trip updated:', payload);
        // Handle trip updates
      },
      onExpenseChange: (payload) => {
        console.log('Expense changed:', payload);
        // Handle expense changes
      },
      onActivityChange: (payload) => {
        console.log('Activity changed:', payload);
        // Handle activity changes
      }
    });

    channel.on('system', {}, (status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      realtimeService.unsubscribeFromTrip(tripId);
    };
  }, [tripId, realtimeService]);

  return { isConnected };
}
```

## File Storage

### File Upload Service

```typescript
// lib/storage/supabaseStorage.ts
export class SupabaseStorageService {
  constructor(private supabase: SupabaseClient) {}

  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: {
      cacheControl?: string;
      contentType?: string;
      upsert?: boolean;
    }
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        contentType: options?.contentType || file.type,
        upsert: options?.upsert || false
      });

    if (error) throw new StorageError(error.message);

    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async downloadFile(bucket: string, path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw new StorageError(error.message);
    return data;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw new StorageError(error.message);
  }

  async listFiles(bucket: string, folder?: string): Promise<FileObject[]> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(folder);

    if (error) throw new StorageError(error.message);
    return data || [];
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
```

## Error Handling

### Supabase Error Types

```typescript
// lib/errors/supabaseErrors.ts
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export class DatabaseError extends SupabaseError {
  constructor(message: string, code?: string, details?: any) {
    super(message, code, details);
    this.name = 'DatabaseError';
  }
}

export class AuthError extends SupabaseError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'AuthError';
  }
}

export class StorageError extends SupabaseError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'StorageError';
  }
}

export function handleSupabaseError(error: any): SupabaseError {
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return new DatabaseError('Record not found', error.code);
      case '23505':
        return new DatabaseError('Duplicate record', error.code);
      case '23503':
        return new DatabaseError('Foreign key constraint violation', error.code);
      default:
        return new DatabaseError(error.message, error.code);
    }
  }

  return new SupabaseError(error.message || 'Unknown Supabase error');
}
```

## Performance Optimization

### Query Optimization

```typescript
// lib/optimization/supabaseOptimization.ts
export class SupabaseQueryOptimizer {
  static addPagination(
    query: any,
    page: number = 1,
    limit: number = 10
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return query.range(from, to);
  }

  static addSorting(
    query: any,
    sortBy: string,
    ascending: boolean = true
  ) {
    return query.order(sortBy, { ascending });
  }

  static addFilters(
    query: any,
    filters: Record<string, any>
  ) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.like(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    return query;
  }

  static selectOptimized(
    query: any,
    fields: string[] | string
  ) {
    const selectFields = Array.isArray(fields) ? fields.join(',') : fields;
    return query.select(selectFields);
  }
}
```

### Caching Strategy

```typescript
// lib/cache/supabaseCache.ts
export class SupabaseCacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl
    });

    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## Testing

### Supabase Testing Setup

```typescript
// __tests__/setup/supabaseTestSetup.ts
import { createClient } from '@supabase/supabase-js';

export const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

export async function cleanupTestData() {
  // Clean up test data after each test
  await testSupabase.from('expenses').delete().neq('id', '');
  await testSupabase.from('activities').delete().neq('id', '');
  await testSupabase.from('trip_participants').delete().neq('id', '');
  await testSupabase.from('trips').delete().neq('id', '');
  await testSupabase.from('users').delete().neq('id', '');
}

export async function createTestUser(userData: any) {
  const { data, error } = await testSupabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

## Monitoring and Debugging

### Supabase Monitoring

```typescript
// lib/monitoring/supabaseMonitoring.ts
export class SupabaseMonitoring {
  static logQuery(table: string, operation: string, duration: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Supabase] ${operation} on ${table} took ${duration}ms`);
    }
  }

  static logError(error: any, context?: string) {
    console.error(`[Supabase Error] ${context || 'Unknown'}:`, error);
  }

  static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}
```

## Best Practices

### Security Best Practices

1. **Use RLS policies** for all tables
2. **Never expose service role key** in client-side code
3. **Validate user permissions** before operations
4. **Use prepared statements** to prevent SQL injection
5. **Implement proper error handling** without exposing sensitive data

### Performance Best Practices

1. **Use selective queries** with specific field selection
2. **Implement pagination** for large datasets
3. **Add database indexes** for frequently queried fields
4. **Use real-time subscriptions** judiciously
5. **Cache frequently accessed data**

### Development Best Practices

1. **Use TypeScript** for type safety
2. **Implement proper error handling**
3. **Write comprehensive tests**
4. **Monitor query performance**
5. **Keep schema migrations** version controlled
