# Trips API

## Overview

The Trips API provides comprehensive endpoints for managing travel trips, including creation, modification, participant management, and trip data retrieval. This API supports both individual and collaborative trip planning.

## Base Endpoint

```
/api/trips
```

## Authentication

All trip endpoints require authentication via JWT token:

```http
Authorization: Bearer <jwt-token>
```

## Trip Object Structure

```typescript
interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string; // ISO 8601 format
  end_date: string;   // ISO 8601 format
  budget?: number;
  currency: string;
  description?: string;
  status: 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  is_public: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  
  // Extended fields (when requested)
  participants?: Participant[];
  accommodations?: Accommodation[];
  transportation?: Transportation[];
  itinerary_days?: ItineraryDay[];
  expenses?: Expense[];
}

interface Participant {
  id: string;
  user_id: string;
  invited_email?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invitation_status: 'pending' | 'accepted' | 'declined';
  joined_at?: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}
```

## Endpoints

### GET /api/trips

Retrieve user's trips with optional filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `sort` (string, default: "created_at") - Sort field
- `order` (string, default: "desc") - Sort order (asc/desc)
- `status` (string) - Filter by status
- `search` (string) - Search in names and destinations
- `start_date` (ISO date) - Filter trips starting after date
- `end_date` (ISO date) - Filter trips ending before date

**Example Request:**
```http
GET /api/trips?page=1&limit=10&status=planning&search=paris
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid",
      "name": "Paris Adventure",
      "destination": "Paris, France",
      "start_date": "2024-06-01T00:00:00Z",
      "end_date": "2024-06-07T00:00:00Z",
      "budget": 2000,
      "currency": "EUR",
      "status": "planning",
      "is_public": false,
      "owner_id": "user-uuid",
      "participant_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### POST /api/trips

Create a new trip.

**Request Body:**
```json
{
  "name": "Tokyo Adventure",
  "destination": "Tokyo, Japan",
  "start_date": "2024-08-01T00:00:00Z",
  "end_date": "2024-08-10T00:00:00Z",
  "budget": 3000,
  "currency": "JPY",
  "description": "Exploring Tokyo's culture and cuisine",
  "is_public": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-trip-uuid",
    "name": "Tokyo Adventure",
    "destination": "Tokyo, Japan",
    "start_date": "2024-08-01T00:00:00Z",
    "end_date": "2024-08-10T00:00:00Z",
    "budget": 3000,
    "currency": "JPY",
    "description": "Exploring Tokyo's culture and cuisine",
    "status": "planning",
    "is_public": false,
    "owner_id": "user-uuid",
    "participant_count": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `destination`: Required, 1-200 characters
- `start_date`: Required, valid ISO 8601 date
- `end_date`: Required, must be after start_date
- `budget`: Optional, positive number
- `currency`: Required, valid 3-letter currency code

### GET /api/trips/[id]

Retrieve detailed trip information including participants, activities, and expenses.

**Path Parameters:**
- `id` (string) - Trip UUID

**Query Parameters:**
- `include` (string) - Comma-separated list of related data to include
  - `participants` - Include participant information
  - `accommodations` - Include accommodation details
  - `transportation` - Include transportation details
  - `itinerary` - Include itinerary and activities
  - `expenses` - Include expense information
  - `all` - Include all related data

**Example Request:**
```http
GET /api/trips/trip-uuid?include=participants,itinerary,expenses
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "name": "Paris Adventure",
    "destination": "Paris, France",
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-06-07T00:00:00Z",
    "budget": 2000,
    "currency": "EUR",
    "description": "A wonderful trip to Paris",
    "status": "planning",
    "is_public": false,
    "owner_id": "user-uuid",
    "participants": [
      {
        "id": "participant-uuid",
        "user_id": "user-uuid",
        "role": "owner",
        "invitation_status": "accepted",
        "joined_at": "2024-01-01T00:00:00Z",
        "user": {
          "id": "user-uuid",
          "full_name": "John Doe",
          "avatar_url": "https://..."
        }
      }
    ],
    "itinerary_days": [
      {
        "id": "day-uuid",
        "date": "2024-06-02",
        "activities": [
          {
            "id": "activity-uuid",
            "title": "Visit Eiffel Tower",
            "description": "Iconic landmark visit",
            "start_time": "10:00",
            "duration": 120,
            "location": {
              "name": "Eiffel Tower",
              "address": "Champ de Mars, Paris",
              "coordinates": {
                "lat": 48.8584,
                "lng": 2.2945
              }
            },
            "category": "sightseeing",
            "cost": 25.00
          }
        ]
      }
    ],
    "expenses": [
      {
        "id": "expense-uuid",
        "title": "Dinner at Restaurant",
        "amount": 120.50,
        "currency": "EUR",
        "category": "food",
        "date": "2024-06-02T19:30:00Z",
        "paid_by": "user-uuid",
        "participants": [
          {
            "user_id": "user-uuid",
            "amount_owed": 60.25
          }
        ],
        "split_type": "equal"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/trips/[id]

Update trip details.

**Path Parameters:**
- `id` (string) - Trip UUID

**Request Body:**
```json
{
  "name": "Updated Trip Name",
  "description": "Updated description",
  "budget": 2500,
  "status": "confirmed"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "name": "Updated Trip Name",
    "description": "Updated description",
    "budget": 2500,
    "status": "confirmed",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Permissions:**
- Trip owner: Can update all fields
- Trip admin: Can update most fields except ownership
- Trip editor: Can update limited fields
- Trip viewer: Cannot update

### DELETE /api/trips/[id]

Delete a trip permanently.

**Path Parameters:**
- `id` (string) - Trip UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

**Permissions:**
- Only trip owner can delete trips
- Deletion is permanent and cannot be undone

## Participant Management

### POST /api/trips/[id]/participants

Invite participants to a trip.

**Path Parameters:**
- `id` (string) - Trip UUID

**Request Body:**
```json
{
  "invitations": [
    {
      "email": "friend@example.com",
      "role": "editor",
      "message": "Join me on this amazing trip!"
    },
    {
      "user_id": "existing-user-uuid",
      "role": "viewer"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "invited": 2,
    "participants": [
      {
        "id": "participant-uuid-1",
        "invited_email": "friend@example.com",
        "role": "editor",
        "invitation_status": "pending"
      },
      {
        "id": "participant-uuid-2",
        "user_id": "existing-user-uuid",
        "role": "viewer",
        "invitation_status": "accepted"
      }
    ]
  }
}
```

### PUT /api/trips/[id]/participants/[participantId]

Update participant role or status.

**Path Parameters:**
- `id` (string) - Trip UUID
- `participantId` (string) - Participant UUID

**Request Body:**
```json
{
  "role": "admin",
  "invitation_status": "accepted"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "participant-uuid",
    "role": "admin",
    "invitation_status": "accepted",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### DELETE /api/trips/[id]/participants/[participantId]

Remove a participant from a trip.

**Path Parameters:**
- `id` (string) - Trip UUID
- `participantId` (string) - Participant UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Participant removed successfully"
}
```

## Trip Operations

### POST /api/trips/[id]/duplicate

Create a copy of an existing trip.

**Path Parameters:**
- `id` (string) - Trip UUID to duplicate

**Request Body:**
```json
{
  "name": "Copy of Paris Adventure",
  "start_date": "2024-09-01T00:00:00Z",
  "end_date": "2024-09-07T00:00:00Z",
  "include_participants": false,
  "include_expenses": false,
  "include_accommodations": true,
  "include_activities": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-trip-uuid",
    "name": "Copy of Paris Adventure",
    "start_date": "2024-09-01T00:00:00Z",
    "end_date": "2024-09-07T00:00:00Z",
    "status": "planning",
    "duplicated_from": "original-trip-uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/trips/[id]/share

Generate a shareable link for a trip.

**Path Parameters:**
- `id` (string) - Trip UUID

**Request Body:**
```json
{
  "permissions": "view",
  "expires_at": "2024-12-31T23:59:59Z",
  "password_protected": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "share_id": "share-uuid",
    "share_url": "https://voyagesmart.app/shared/share-uuid",
    "permissions": "view",
    "expires_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/trips/[id]/status

Update trip status with workflow validation.

**Path Parameters:**
- `id` (string) - Trip UUID

**Request Body:**
```json
{
  "status": "confirmed",
  "reason": "All accommodations and transportation booked"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "status": "confirmed",
    "status_updated_at": "2024-01-15T10:30:00Z",
    "status_updated_by": "user-uuid"
  }
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Trip name is required",
    "end_date": "End date must be after start date"
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You don't have permission to perform this action"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Trip not found",
  "message": "The requested trip does not exist or you don't have access to it"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Trip dates conflict with existing trip"
}
```

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "field": "start_date",
    "message": "Start date cannot be in the past"
  }
}
```

## Rate Limiting

Trip API endpoints are rate limited:
- **Authenticated users**: 100 requests per minute
- **Trip creation**: 10 trips per hour
- **Participant invitations**: 50 invitations per hour

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Trip Events

VoyageSmart can send webhooks for trip events:

- `trip.created` - New trip created
- `trip.updated` - Trip details updated
- `trip.deleted` - Trip deleted
- `trip.status_changed` - Trip status updated
- `participant.invited` - New participant invited
- `participant.joined` - Participant accepted invitation
- `participant.left` - Participant left trip

**Webhook Payload Example:**
```json
{
  "event": "trip.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "trip": {
      "id": "trip-uuid",
      "name": "Paris Adventure",
      "owner_id": "user-uuid"
    },
    "user": {
      "id": "user-uuid",
      "email": "user@example.com"
    }
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { VoyageSmartAPI } from '@voyagesmart/sdk';

const api = new VoyageSmartAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.voyagesmart.app'
});

// Get user trips
const trips = await api.trips.list({
  page: 1,
  limit: 10,
  status: 'planning'
});

// Create new trip
const newTrip = await api.trips.create({
  name: 'Tokyo Adventure',
  destination: 'Tokyo, Japan',
  start_date: '2024-08-01T00:00:00Z',
  end_date: '2024-08-10T00:00:00Z',
  budget: 3000,
  currency: 'JPY'
});

// Get trip details
const tripDetails = await api.trips.get('trip-uuid', {
  include: ['participants', 'itinerary', 'expenses']
});

// Update trip
const updatedTrip = await api.trips.update('trip-uuid', {
  name: 'Updated Trip Name',
  budget: 3500
});

// Invite participants
await api.trips.inviteParticipants('trip-uuid', [
  {
    email: 'friend@example.com',
    role: 'editor'
  }
]);
```

### Python

```python
from voyagesmart import VoyageSmartAPI

api = VoyageSmartAPI(
    api_key='your-api-key',
    base_url='https://api.voyagesmart.app'
)

# Get user trips
trips = api.trips.list(page=1, limit=10, status='planning')

# Create new trip
new_trip = api.trips.create({
    'name': 'Tokyo Adventure',
    'destination': 'Tokyo, Japan',
    'start_date': '2024-08-01T00:00:00Z',
    'end_date': '2024-08-10T00:00:00Z',
    'budget': 3000,
    'currency': 'JPY'
})

# Get trip details
trip_details = api.trips.get(
    'trip-uuid',
    include=['participants', 'itinerary', 'expenses']
)
```

## Best Practices

### API Usage Guidelines

1. **Pagination**: Always use pagination for list endpoints
2. **Filtering**: Use appropriate filters to reduce data transfer
3. **Caching**: Cache trip data when possible
4. **Error Handling**: Implement proper error handling
5. **Rate Limiting**: Respect rate limits and implement backoff

### Performance Optimization

1. **Selective Loading**: Use `include` parameter to load only needed data
2. **Batch Operations**: Group related operations when possible
3. **Compression**: Enable gzip compression for large responses
4. **Connection Pooling**: Reuse HTTP connections
5. **Monitoring**: Monitor API performance and usage
