# Database Schema

VoyageSmart uses a PostgreSQL database hosted on Supabase. This document provides a detailed overview of the database schema, including tables, relationships, and key fields.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   users     │       │   trips     │       │trip_participants│
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id          │       │ id          │       │ id              │
│ email       │◄──┐   │ name        │       │ trip_id         │◄─┐
│ full_name   │   └───┤ owner_id    │       │ user_id         │  │
│ avatar_url  │       │ start_date  │◄──────┤ role            │  │
│ preferences │       │ end_date    │       │ share_ratio     │  │
│ created_at  │       │ destination │       │ invited_email   │  │
│ last_login  │       │ budget_total│       │ invitation_status│ │
└─────────────┘       └─────────────┘       └─────────────────┘ │
                           │  ▲                                 │
                           │  │                                 │
                           ▼  │                                 │
┌─────────────┐       ┌─────────────┐                          │
│itinerary_days│       │ activities  │                          │
├─────────────┤       ├─────────────┤                          │
│ id          │       │ id          │                          │
│ trip_id     │◄──────┤ trip_id     │                          │
│ day_date    │◄──────┤ day_id      │                          │
│ notes       │       │ name        │                          │
│ weather     │       │ start_time  │                          │
│ created_at  │       │ end_time    │                          │
│ updated_at  │       │ location    │                          │
└─────────────┘       └─────────────┘                          │
                                                               │
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│accommodations│       │transportation│       │    expenses     │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id          │       │ id          │       │ id              │
│ trip_id     │◄──┐   │ trip_id     │◄──┐   │ trip_id         │◄─┘
│ name        │   │   │ day_id      │   │   │ category        │
│ check_in    │   │   │ type        │   │   │ amount          │
│ check_out   │   │   │ departure   │   │   │ currency        │
│ address     │   │   │ arrival     │   │   │ date            │
│ cost        │   │   │ cost        │   │   │ paid_by         │
└─────────────┘   │   └─────────────┘   │   └─────────────────┘
                  │                     │             ▲
                  │                     │             │
                  └─────────────────────┴─────────────┘
```

## Tables

### users

Stores user information and preferences.

| Column      | Type      | Description                                |
|-------------|-----------|--------------------------------------------|
| id          | uuid      | Primary key, generated by Supabase Auth    |
| email       | text      | User's email address                       |
| full_name   | text      | User's full name                           |
| avatar_url  | text      | URL to user's profile image                |
| preferences | jsonb     | User preferences as JSON                   |
| created_at  | timestamp | When the user was created                  |
| last_login  | timestamp | When the user last logged in               |

### trips

Stores information about trips.

| Column       | Type      | Description                                |
|--------------|-----------|--------------------------------------------|
| id           | uuid      | Primary key                                |
| name         | text      | Trip name                                  |
| description  | text      | Trip description                           |
| start_date   | date      | Trip start date                            |
| end_date     | date      | Trip end date                              |
| destination  | text      | Trip destination                           |
| preferences  | jsonb     | Trip preferences as JSON                   |
| is_private   | boolean   | Whether the trip is private                |
| budget_total | numeric   | Total budget for the trip                  |
| owner_id     | uuid      | Foreign key to users.id                    |
| created_at   | timestamp | When the trip was created                  |
| updated_at   | timestamp | When the trip was last updated             |

### trip_participants

Stores information about trip participants.

| Column            | Type      | Description                                |
|-------------------|-----------|--------------------------------------------|
| id                | uuid      | Primary key                                |
| trip_id           | uuid      | Foreign key to trips.id                    |
| user_id           | uuid      | Foreign key to users.id                    |
| role              | text      | Participant role (admin, editor, viewer)   |
| share_ratio       | numeric   | Share ratio for expenses                   |
| invited_email     | text      | Email for invited users                    |
| invitation_status | text      | Status of invitation                       |
| created_at        | timestamp | When the participant was added             |

### itinerary_days

Stores information about days in the itinerary.

| Column          | Type      | Description                                |
|-----------------|-----------|--------------------------------------------|
| id              | uuid      | Primary key                                |
| trip_id         | uuid      | Foreign key to trips.id                    |
| day_date        | date      | Date of the day                            |
| notes           | text      | Notes for the day                          |
| weather_forecast| jsonb     | Weather forecast as JSON                   |
| created_at      | timestamp | When the day was created                   |
| updated_at      | timestamp | When the day was last updated              |

### activities

Stores information about activities in the itinerary.

| Column           | Type      | Description                                |
|------------------|-----------|--------------------------------------------|
| id               | uuid      | Primary key                                |
| trip_id          | uuid      | Foreign key to trips.id                    |
| day_id           | uuid      | Foreign key to itinerary_days.id           |
| name             | text      | Activity name                              |
| type             | text      | Activity type                              |
| start_time       | time      | Activity start time                        |
| end_time         | time      | Activity end time                          |
| location         | text      | Activity location                          |
| coordinates      | point     | Geographical coordinates                   |
| booking_reference| text      | Booking reference                          |
| priority         | integer   | Priority level                             |
| cost             | numeric   | Activity cost                              |
| currency         | text      | Currency for the cost                      |
| notes            | text      | Notes for the activity                     |
| status           | text      | Activity status                            |
| created_at       | timestamp | When the activity was created              |
| updated_at       | timestamp | When the activity was last updated         |

For the complete database schema, including all tables and relationships, please refer to the [SQL schema file](../../supabase/schema.sql).

## Row-Level Security (RLS) Policies

VoyageSmart uses Row-Level Security (RLS) policies to ensure that users can only access data they are authorized to see. Here are some key policies:

### trips Table Policies

```sql
-- Users can view trips they own or are participants in
CREATE POLICY "Users can view their trips" ON trips
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trip_participants
      WHERE trip_id = trips.id AND user_id = auth.uid()
    )
  );

-- Only trip owners can update their trips
CREATE POLICY "Trip owners can update their trips" ON trips
  FOR UPDATE USING (owner_id = auth.uid());

-- Only trip owners can delete their trips
CREATE POLICY "Trip owners can delete their trips" ON trips
  FOR DELETE USING (owner_id = auth.uid());
```

For more details on security and RLS policies, see the [Security](./security.md) documentation.

---

Next: [Frontend Architecture](./frontend-architecture.md)
