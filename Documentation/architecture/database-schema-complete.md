# Complete Database Schema

VoyageSmart uses a PostgreSQL database hosted on Supabase with a comprehensive schema designed for scalability, security, and performance.

## 📊 Complete Entity Relationship Diagram

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                VoyageSmart Database Schema              │
                    └─────────────────────────────────────────────────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   users     │       │   trips     │       │trip_participants│
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)         │
│ email       │◄──┐   │ name        │       │ trip_id (FK)    │◄─┐
│ full_name   │   └───┤ owner_id(FK)│       │ user_id (FK)    │  │
│ avatar_url  │       │ start_date  │◄──────┤ role            │  │
│ preferences │       │ end_date    │       │ share_ratio     │  │
│ created_at  │       │ destination │       │ invited_email   │  │
│ last_login  │       │ budget_total│       │ invitation_status│ │
└─────────────┘       │ is_private  │       │ created_at      │  │
                      │ preferences │       └─────────────────┘  │
                      │ created_at  │                            │
                      │ updated_at  │                            │
                      └─────────────┘                            │
                           │  ▲                                  │
                           │  │                                  │
                           ▼  │                                  │
                    ┌─────────────┐                             │
                    │itinerary_   │                             │
                    │days         │                             │
                    ├─────────────┤                             │
                    │ id (PK)     │                             │
                    │ trip_id(FK) │─────────────────────────────┘
                    │ day_date    │
                    │ notes       │
                    │ weather_    │
                    │ forecast    │
                    │ created_at  │
                    │ updated_at  │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ activities  │
                    ├─────────────┤
                    │ id (PK)     │
                    │ trip_id(FK) │
                    │ day_id (FK) │
                    │ name        │
                    │ type        │
                    │ start_time  │
                    │ end_time    │
                    │ location    │
                    │ coordinates │
                    │ cost        │
                    │ currency    │
                    │ priority    │
                    │ status      │
                    │ notes       │
                    │ created_at  │
                    │ updated_at  │
                    └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│accommodations│       │transportation│      │   expenses      │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)         │
│ trip_id(FK) │       │ trip_id(FK) │       │ trip_id (FK)    │
│ name        │       │ type        │       │ description     │
│ type        │       │ from_location│      │ amount          │
│ check_in    │       │ to_location │       │ currency        │
│ check_out   │       │ departure   │       │ category        │
│ address     │       │ arrival     │       │ date            │
│ coordinates │       │ booking_ref │       │ paid_by (FK)    │
│ booking_ref │       │ cost        │       │ receipt_url     │
│ cost        │       │ currency    │       │ notes           │
│ currency    │       │ notes       │       │ created_at      │
│ notes       │       │ created_at  │       │ updated_at      │
│ created_at  │       │ updated_at  │       └─────────────────┘
│ updated_at  │       └─────────────┘                │
└─────────────┘                                      │
                                                     ▼
                                            ┌─────────────────┐
                                            │expense_         │
                                            │participants     │
                                            ├─────────────────┤
                                            │ id (PK)         │
                                            │ expense_id (FK) │
                                            │ user_id (FK)    │
                                            │ amount_owed     │
                                            │ amount_paid     │
                                            │ created_at      │
                                            └─────────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│ documents   │       │ trip_media  │       │ chat_messages   │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)         │
│ trip_id(FK) │       │ trip_id(FK) │       │ trip_id (FK)    │
│ user_id(FK) │       │ user_id(FK) │       │ user_id (FK)    │
│ type        │       │ type        │       │ message         │
│ name        │       │ title       │       │ message_type    │
│ file_url    │       │ description │       │ created_at      │
│ extracted_  │       │ file_url    │       │ updated_at      │
│ data        │       │ thumbnail   │       └─────────────────┘
│ created_at  │       │ metadata    │
│ updated_at  │       │ created_at  │
└─────────────┘       │ updated_at  │
                      └─────────────┘
```

## 📋 Table Definitions

### Core Tables

#### users
Extends Supabase auth.users with additional profile information.

| Column      | Type      | Constraints | Description                    |
|-------------|-----------|-------------|--------------------------------|
| id          | UUID      | PK, FK      | References auth.users(id)      |
| email       | TEXT      | NOT NULL    | User's email address           |
| full_name   | TEXT      | -           | User's display name            |
| avatar_url  | TEXT      | -           | Profile picture URL            |
| preferences | JSONB     | DEFAULT {}  | User settings and preferences  |
| created_at  | TIMESTAMP | NOT NULL    | Account creation timestamp     |
| last_login  | TIMESTAMP | -           | Last login timestamp           |

#### trips
Main trip information and settings.

| Column       | Type      | Constraints | Description                    |
|--------------|-----------|-------------|--------------------------------|
| id           | UUID      | PK          | Unique trip identifier         |
| name         | TEXT      | NOT NULL    | Trip name/title                |
| description  | TEXT      | -           | Trip description               |
| start_date   | DATE      | -           | Trip start date                |
| end_date     | DATE      | -           | Trip end date                  |
| destination  | TEXT      | -           | Primary destination            |
| preferences  | JSONB     | DEFAULT {}  | Trip-specific settings         |
| is_private   | BOOLEAN   | DEFAULT true| Trip visibility                |
| budget_total | DECIMAL   | -           | Total trip budget              |
| owner_id     | UUID      | FK, NOT NULL| Trip creator (users.id)        |
| created_at   | TIMESTAMP | NOT NULL    | Creation timestamp             |
| updated_at   | TIMESTAMP | NOT NULL    | Last update timestamp          |

#### trip_participants
Manages trip participants and their roles.

| Column            | Type      | Constraints | Description                    |
|-------------------|-----------|-------------|--------------------------------|
| id                | UUID      | PK          | Unique participant record      |
| trip_id           | UUID      | FK, NOT NULL| Reference to trips.id          |
| user_id           | UUID      | FK          | Reference to users.id          |
| role              | TEXT      | NOT NULL    | admin, participant, viewer     |
| share_ratio       | DECIMAL   | DEFAULT 1.0 | Expense sharing ratio          |
| invited_email     | TEXT      | -           | Email for pending invitations  |
| invitation_status | TEXT      | DEFAULT pending | pending, accepted, declined |
| created_at        | TIMESTAMP | NOT NULL    | Invitation timestamp           |

### Itinerary Tables

#### itinerary_days
Represents individual days in a trip itinerary.

| Column          | Type      | Constraints | Description                    |
|-----------------|-----------|-------------|--------------------------------|
| id              | UUID      | PK          | Unique day identifier          |
| trip_id         | UUID      | FK, NOT NULL| Reference to trips.id          |
| day_date        | DATE      | NOT NULL    | Date for this itinerary day    |
| notes           | TEXT      | -           | Day-specific notes             |
| weather_forecast| JSONB     | -           | Weather data for the day       |
| created_at      | TIMESTAMP | NOT NULL    | Creation timestamp             |
| updated_at      | TIMESTAMP | NOT NULL    | Last update timestamp          |

#### activities
Individual activities within itinerary days.

| Column          | Type      | Constraints | Description                    |
|-----------------|-----------|-------------|--------------------------------|
| id              | UUID      | PK          | Unique activity identifier     |
| trip_id         | UUID      | FK, NOT NULL| Reference to trips.id          |
| day_id          | UUID      | FK          | Reference to itinerary_days.id |
| name            | TEXT      | NOT NULL    | Activity name                  |
| type            | TEXT      | -           | Activity category              |
| start_time      | TIMESTAMP | -           | Activity start time            |
| end_time        | TIMESTAMP | -           | Activity end time              |
| location        | TEXT      | -           | Activity location              |
| coordinates     | POINT     | -           | GPS coordinates                |
| booking_reference| TEXT     | -           | Booking confirmation           |
| priority        | INTEGER   | DEFAULT 3   | Priority level (1-5)           |
| cost            | DECIMAL   | -           | Activity cost                  |
| currency        | TEXT      | DEFAULT USD | Currency code                  |
| notes           | TEXT      | -           | Additional notes               |
| status          | TEXT      | DEFAULT planned | planned, confirmed, completed |
| created_at      | TIMESTAMP | NOT NULL    | Creation timestamp             |
| updated_at      | TIMESTAMP | NOT NULL    | Last update timestamp          |

### Accommodation & Transportation

#### accommodations
Trip accommodation information.

| Column          | Type      | Constraints | Description                    |
|-----------------|-----------|-------------|--------------------------------|
| id              | UUID      | PK          | Unique accommodation ID        |
| trip_id         | UUID      | FK, NOT NULL| Reference to trips.id          |
| name            | TEXT      | NOT NULL    | Accommodation name             |
| type            | TEXT      | -           | hotel, airbnb, hostel, etc.    |
| check_in_date   | DATE      | -           | Check-in date                  |
| check_out_date  | DATE      | -           | Check-out date                 |
| address         | TEXT      | -           | Full address                   |
| coordinates     | POINT     | -           | GPS coordinates                |
| booking_reference| TEXT     | -           | Booking confirmation           |
| contact_info    | TEXT      | -           | Contact details                |
| cost            | DECIMAL   | -           | Total cost                     |
| currency        | TEXT      | DEFAULT USD | Currency code                  |
| documents       | JSONB     | DEFAULT []  | Related documents              |
| notes           | TEXT      | -           | Additional notes               |
| created_at      | TIMESTAMP | NOT NULL    | Creation timestamp             |
| updated_at      | TIMESTAMP | NOT NULL    | Last update timestamp          |

#### transportation
Trip transportation information.

| Column          | Type      | Constraints | Description                    |
|-----------------|-----------|-------------|--------------------------------|
| id              | UUID      | PK          | Unique transportation ID       |
| trip_id         | UUID      | FK, NOT NULL| Reference to trips.id          |
| type            | TEXT      | NOT NULL    | flight, train, car, bus, etc.  |
| from_location   | TEXT      | -           | Departure location             |
| to_location     | TEXT      | -           | Arrival location               |
| departure_time  | TIMESTAMP | -           | Departure date/time            |
| arrival_time    | TIMESTAMP | -           | Arrival date/time              |
| booking_reference| TEXT     | -           | Booking confirmation           |
| cost            | DECIMAL   | -           | Transportation cost            |
| currency        | TEXT      | DEFAULT USD | Currency code                  |
| notes           | TEXT      | -           | Additional notes               |
| created_at      | TIMESTAMP | NOT NULL    | Creation timestamp             |
| updated_at      | TIMESTAMP | NOT NULL    | Last update timestamp          |

### Financial Tables

#### expenses
Trip expense tracking.

| Column      | Type      | Constraints | Description                    |
|-------------|-----------|-------------|--------------------------------|
| id          | UUID      | PK          | Unique expense identifier      |
| trip_id     | UUID      | FK, NOT NULL| Reference to trips.id          |
| description | TEXT      | NOT NULL    | Expense description            |
| amount      | DECIMAL   | NOT NULL    | Expense amount                 |
| currency    | TEXT      | DEFAULT USD | Currency code                  |
| category    | TEXT      | -           | Expense category               |
| date        | DATE      | NOT NULL    | Expense date                   |
| paid_by     | UUID      | FK          | Reference to users.id          |
| receipt_url | TEXT      | -           | Receipt image URL              |
| notes       | TEXT      | -           | Additional notes               |
| created_at  | TIMESTAMP | NOT NULL    | Creation timestamp             |
| updated_at  | TIMESTAMP | NOT NULL    | Last update timestamp          |

#### expense_participants
Tracks how expenses are split among participants.

| Column      | Type      | Constraints | Description                    |
|-------------|-----------|-------------|--------------------------------|
| id          | UUID      | PK          | Unique record identifier       |
| expense_id  | UUID      | FK, NOT NULL| Reference to expenses.id       |
| user_id     | UUID      | FK, NOT NULL| Reference to users.id          |
| amount_owed | DECIMAL   | NOT NULL    | Amount this user owes          |
| amount_paid | DECIMAL   | DEFAULT 0   | Amount this user has paid      |
| created_at  | TIMESTAMP | NOT NULL    | Creation timestamp             |

### Media & Documents

#### documents
Trip-related documents and files.

| Column        | Type      | Constraints | Description                    |
|---------------|-----------|-------------|--------------------------------|
| id            | UUID      | PK          | Unique document identifier     |
| trip_id       | UUID      | FK, NOT NULL| Reference to trips.id          |
| user_id       | UUID      | FK          | Reference to users.id          |
| type          | TEXT      | -           | Document type/category         |
| name          | TEXT      | NOT NULL    | Document name                  |
| file_url      | TEXT      | NOT NULL    | File storage URL               |
| extracted_data| JSONB     | -           | OCR/extracted text data        |
| created_at    | TIMESTAMP | NOT NULL    | Upload timestamp               |
| updated_at    | TIMESTAMP | NOT NULL    | Last update timestamp          |

#### trip_media
Photos, videos, and other media files.

| Column      | Type      | Constraints | Description                    |
|-------------|-----------|-------------|--------------------------------|
| id          | UUID      | PK          | Unique media identifier        |
| trip_id     | UUID      | FK, NOT NULL| Reference to trips.id          |
| user_id     | UUID      | FK, NOT NULL| Reference to users.id          |
| type        | TEXT      | NOT NULL    | image, video, audio            |
| title       | TEXT      | -           | Media title                    |
| description | TEXT      | -           | Media description              |
| file_url    | TEXT      | NOT NULL    | File storage URL               |
| thumbnail_url| TEXT     | -           | Thumbnail image URL            |
| metadata    | JSONB     | -           | EXIF data, location, etc.      |
| created_at  | TIMESTAMP | NOT NULL    | Upload timestamp               |
| updated_at  | TIMESTAMP | NOT NULL    | Last update timestamp          |

#### chat_messages
Trip-specific chat/communication.

| Column       | Type      | Constraints | Description                    |
|--------------|-----------|-------------|--------------------------------|
| id           | UUID      | PK          | Unique message identifier      |
| trip_id      | UUID      | FK, NOT NULL| Reference to trips.id          |
| user_id      | UUID      | FK, NOT NULL| Reference to users.id          |
| message      | TEXT      | NOT NULL    | Message content                |
| message_type | TEXT      | DEFAULT text| text, image, file, system      |
| created_at   | TIMESTAMP | NOT NULL    | Message timestamp              |
| updated_at   | TIMESTAMP | NOT NULL    | Last edit timestamp            |

## 🔒 Row Level Security (RLS) Policies

VoyageSmart implements comprehensive Row Level Security to ensure data privacy and access control.

### User Access Policies

```sql
-- Users can only view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Trip Access Policies

```sql
-- Users can view trips they own or participate in
CREATE POLICY "Users can view accessible trips" ON trips
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trip_participants
      WHERE trip_id = trips.id 
      AND user_id = auth.uid()
      AND invitation_status = 'accepted'
    )
  );

-- Only trip owners can update trip details
CREATE POLICY "Trip owners can update trips" ON trips
  FOR UPDATE USING (owner_id = auth.uid());

-- Only trip owners can delete trips
CREATE POLICY "Trip owners can delete trips" ON trips
  FOR DELETE USING (owner_id = auth.uid());
```

### Participant Management Policies

```sql
-- Users can view participants of trips they have access to
CREATE POLICY "Users can view trip participants" ON trip_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE id = trip_participants.trip_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_participants tp
          WHERE tp.trip_id = trips.id
          AND tp.user_id = auth.uid()
          AND tp.invitation_status = 'accepted'
        )
      )
    )
  );
```

### Activity and Expense Policies

```sql
-- Users can view activities for trips they have access to
CREATE POLICY "Users can view trip activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE id = activities.trip_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_participants
          WHERE trip_id = trips.id
          AND user_id = auth.uid()
          AND invitation_status = 'accepted'
        )
      )
    )
  );

-- Similar policies apply to expenses, accommodations, transportation, etc.
```

## 📊 Database Functions

### Expense Splitting Function

```sql
CREATE OR REPLACE FUNCTION split_expense(
  expense_id UUID,
  participant_ids UUID[],
  split_type TEXT DEFAULT 'equal'
)
RETURNS VOID AS $$
DECLARE
  expense_amount DECIMAL;
  participant_count INTEGER;
  amount_per_person DECIMAL;
  participant_id UUID;
BEGIN
  -- Get expense amount
  SELECT amount INTO expense_amount
  FROM expenses WHERE id = expense_id;
  
  -- Calculate split amount
  participant_count := array_length(participant_ids, 1);
  amount_per_person := expense_amount / participant_count;
  
  -- Insert expense participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    INSERT INTO expense_participants (expense_id, user_id, amount_owed)
    VALUES (expense_id, participant_id, amount_per_person);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## 🔍 Indexes and Performance

### Key Indexes

```sql
-- Trip access optimization
CREATE INDEX idx_trips_owner_id ON trips(owner_id);
CREATE INDEX idx_trip_participants_trip_user ON trip_participants(trip_id, user_id);

-- Activity queries
CREATE INDEX idx_activities_trip_day ON activities(trip_id, day_id);
CREATE INDEX idx_activities_start_time ON activities(start_time);

-- Expense queries
CREATE INDEX idx_expenses_trip_date ON expenses(trip_id, date);
CREATE INDEX idx_expense_participants_expense ON expense_participants(expense_id);

-- Full-text search
CREATE INDEX idx_activities_search ON activities USING gin(to_tsvector('english', name || ' ' || COALESCE(notes, '')));
```

## 🔄 Database Migrations

The database schema is managed through Supabase migrations:

1. **Initial Schema** (`001_initial_schema.sql`) - Core tables and relationships
2. **RLS Policies** (`002_rls_policies.sql`) - Security policies
3. **Functions** (`003_functions.sql`) - Database functions
4. **Indexes** (`004_indexes.sql`) - Performance indexes
5. **Storage** (`005_storage.sql`) - File storage buckets and policies

## 📈 Scalability Considerations

- **Partitioning**: Large tables can be partitioned by date or trip_id
- **Read Replicas**: Supabase supports read replicas for scaling reads
- **Connection Pooling**: Built-in connection pooling via Supabase
- **Caching**: Application-level caching with RTK Query
- **Archive Strategy**: Old trips can be archived to separate tables

---

**Related Documentation:**
- [Frontend Architecture](./frontend-architecture.md)
- [Backend Architecture](./backend-architecture.md)
- [Security Implementation](./security.md)
