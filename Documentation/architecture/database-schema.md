# Database Schema

## Overview

VoyageSmart uses PostgreSQL as its primary database, hosted on Supabase. The schema is designed with strong relationships, data integrity, and Row Level Security (RLS) policies to ensure data privacy and security.

## Core Tables

### Users Table
Extends Supabase's `auth.users` table with additional profile information.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key Features:**
- Links to Supabase auth system
- Stores user preferences as JSONB
- Tracks login activity
- Supports admin roles via preferences

### Trips Table
Central entity for organizing travel plans.

```sql
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  budget_total DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

**Key Features:**
- Owner-based access control
- Budget tracking with currency support
- Privacy controls
- Automatic timestamps

### Trip Participants Table
Manages multi-user collaboration on trips.

```sql
CREATE TABLE public.trip_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE
);
```

**Key Features:**
- Role-based permissions (admin, editor, viewer)
- Email-based invitations
- Invitation status tracking
- Flexible user association

## Itinerary System

### Itinerary Days Table
Organizes activities by date.

```sql
CREATE TABLE public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(trip_id, day_date)
);
```

### Activities Table
Individual activities within itinerary days.

```sql
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  start_time TIME,
  end_time TIME,
  location TEXT,
  coordinates POINT,
  description TEXT,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  booking_reference TEXT,
  contact_info TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

**Key Features:**
- Time-based scheduling
- Location with coordinates
- Cost tracking
- Booking information

## Accommodation & Transportation

### Accommodations Table
Hotel and lodging management.

```sql
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  check_in_date DATE,
  check_out_date DATE,
  address TEXT,
  coordinates POINT,
  booking_reference TEXT,
  contact_info TEXT,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### Transportation Table
Flight, train, and car rental tracking.

```sql
CREATE TABLE public.transportation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT,
  departure_time TIMESTAMP WITH TIME ZONE,
  departure_location TEXT,
  arrival_time TIMESTAMP WITH TIME ZONE,
  arrival_location TEXT,
  booking_reference TEXT,
  seat_info TEXT,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

## Expense Management

### Expenses Table
Multi-currency expense tracking.

```sql
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL,
  description TEXT,
  paid_by UUID NOT NULL REFERENCES public.users(id),
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'percentage')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### Expense Participants Table
Tracks who owes what for each expense.

```sql
CREATE TABLE public.expense_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(expense_id, user_id)
);
```

## Subscription System

### Subscriptions Table
User subscription management.

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'ai')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### Promo Codes Table
Promotional code system.

```sql
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'ai')),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

## Row Level Security (RLS)

### Trip Access Control
```sql
-- Users can only access trips they own or are participants in
CREATE POLICY "Users can view trips they have access to" ON trips
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );
```

### Expense Privacy
```sql
-- Users can only see expenses for trips they have access to
CREATE POLICY "Users can view expenses for accessible trips" ON expenses
  FOR SELECT USING (
    trip_id IN (
      SELECT id FROM trips WHERE owner_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_participants 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );
```

## Indexes and Performance

### Key Indexes
```sql
-- Trip performance
CREATE INDEX idx_trips_owner_id ON trips(owner_id);
CREATE INDEX idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX idx_trip_participants_trip_id ON trip_participants(trip_id);

-- Itinerary performance
CREATE INDEX idx_activities_trip_id ON activities(trip_id);
CREATE INDEX idx_activities_day_id ON activities(day_id);
CREATE INDEX idx_itinerary_days_trip_id ON itinerary_days(trip_id);

-- Expense performance
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expense_participants_expense_id ON expense_participants(expense_id);
```

## Data Relationships

### Entity Relationship Diagram
```
Users ──┐
        │
        ├── Trips (owner_id)
        │   ├── Trip_Participants
        │   ├── Itinerary_Days
        │   │   └── Activities
        │   ├── Accommodations
        │   ├── Transportation
        │   ├── Expenses
        │   │   └── Expense_Participants
        │   └── Documents
        │
        ├── Subscriptions
        └── Promo_Code_Redemptions
```

## Migration Strategy

### Version Control
- All schema changes tracked in migration files
- Rollback procedures for each migration
- Environment-specific configurations

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate data values
- Unique constraints prevent duplicates
- NOT NULL constraints ensure required data
