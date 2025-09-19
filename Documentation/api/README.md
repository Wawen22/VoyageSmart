# API Documentation

## Overview

VoyageSmart provides a comprehensive REST API built with Next.js App Router. This documentation covers all available endpoints, authentication, request/response formats, and usage examples.

## Base URL

```
Production: https://voyagesmart.app/api
Development: http://localhost:3000/api
```

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting an Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
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
      "full_name": "John Doe"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890
    }
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited per user:

- **Authenticated users**: 100 requests per minute
- **Unauthenticated users**: 20 requests per minute
- **AI endpoints**: 10 requests per minute (subscription required)

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Pagination

List endpoints support pagination using query parameters:

```http
GET /api/trips?page=1&limit=10&sort=created_at&order=desc
```

**Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sort` - Sort field (default: created_at)
- `order` - Sort order: `asc` or `desc` (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
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
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token.

#### POST /api/auth/logout
Logout user and invalidate session.

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/forgot-password
Send password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/reset-password
Reset password using reset token.

**Request:**
```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

### User Endpoints

#### GET /api/user
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "preferences": {
      "currency": "USD",
      "timezone": "UTC",
      "language": "en"
    },
    "subscription": {
      "tier": "premium",
      "status": "active",
      "expires_at": "2024-12-31T23:59:59Z"
    }
  }
}
```

#### PUT /api/user
Update user profile.

**Request:**
```json
{
  "full_name": "John Smith",
  "preferences": {
    "currency": "EUR",
    "timezone": "Europe/London"
  }
}
```

#### DELETE /api/user
Delete user account.

### Trip Endpoints

#### GET /api/trips
Get user's trips with optional filtering.

**Query Parameters:**
- `status` - Filter by trip status
- `search` - Search in trip names and destinations
- `start_date` - Filter trips starting after date
- `end_date` - Filter trips ending before date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trip-id",
      "name": "Paris Adventure",
      "destination": "Paris, France",
      "start_date": "2024-06-01T00:00:00Z",
      "end_date": "2024-06-07T00:00:00Z",
      "status": "planned",
      "budget": 2000,
      "currency": "EUR",
      "participant_count": 3,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/trips
Create a new trip.

**Request:**
```json
{
  "name": "Tokyo Adventure",
  "destination": "Tokyo, Japan",
  "start_date": "2024-08-01T00:00:00Z",
  "end_date": "2024-08-10T00:00:00Z",
  "budget": 3000,
  "currency": "JPY",
  "description": "Exploring Tokyo's culture and cuisine"
}
```

#### GET /api/trips/[id]
Get trip details with participants, activities, and expenses.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "trip-id",
    "name": "Paris Adventure",
    "destination": "Paris, France",
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-06-07T00:00:00Z",
    "participants": [
      {
        "id": "participant-id",
        "user_id": "user-id",
        "role": "owner",
        "status": "accepted",
        "user": {
          "full_name": "John Doe",
          "avatar_url": "https://..."
        }
      }
    ],
    "activities": [...],
    "expenses": [...],
    "accommodations": [...],
    "transportation": [...]
  }
}
```

#### PUT /api/trips/[id]
Update trip details.

#### DELETE /api/trips/[id]
Delete a trip.

### Expense Endpoints

#### GET /api/trips/[tripId]/expenses
Get expenses for a trip.

**Query Parameters:**
- `category` - Filter by expense category
- `paid_by` - Filter by who paid
- `date_from` - Filter expenses from date
- `date_to` - Filter expenses to date

#### POST /api/trips/[tripId]/expenses
Create a new expense.

**Request:**
```json
{
  "title": "Dinner at Restaurant",
  "amount": 120.50,
  "currency": "EUR",
  "category": "food",
  "date": "2024-06-02T19:30:00Z",
  "paid_by": "user-id",
  "participants": ["user-id-1", "user-id-2"],
  "split_type": "equal",
  "notes": "Great Italian restaurant"
}
```

#### PUT /api/trips/[tripId]/expenses/[id]
Update an expense.

#### DELETE /api/trips/[tripId]/expenses/[id]
Delete an expense.

### Activity Endpoints

#### GET /api/trips/[tripId]/activities
Get activities for a trip.

#### POST /api/trips/[tripId]/activities
Create a new activity.

**Request:**
```json
{
  "title": "Visit Eiffel Tower",
  "description": "Iconic landmark visit",
  "date": "2024-06-02T10:00:00Z",
  "duration": 120,
  "location": {
    "name": "Eiffel Tower",
    "address": "Champ de Mars, Paris, France",
    "coordinates": {
      "lat": 48.8584,
      "lng": 2.2945
    }
  },
  "category": "sightseeing",
  "cost": 25.00,
  "booking_url": "https://...",
  "notes": "Book tickets in advance"
}
```

### AI Assistant Endpoints

#### POST /api/ai/chat
Send message to AI assistant.

**Request:**
```json
{
  "message": "Help me plan activities for day 2 in Paris",
  "trip_id": "trip-id",
  "context": {
    "current_day": 2,
    "preferences": ["museums", "food"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Here are some great activities for day 2 in Paris...",
    "suggestions": [
      {
        "type": "activity",
        "title": "Louvre Museum",
        "description": "World's largest art museum"
      }
    ],
    "usage": {
      "tokens_used": 150,
      "remaining_tokens": 850
    }
  }
}
```

#### POST /api/ai/generate-itinerary
Generate AI-powered itinerary.

**Request:**
```json
{
  "trip_id": "trip-id",
  "preferences": {
    "interests": ["culture", "food", "history"],
    "budget_level": "medium",
    "pace": "relaxed",
    "group_size": 2
  },
  "constraints": {
    "mobility": "none",
    "dietary": ["vegetarian"]
  }
}
```

### Admin Endpoints

#### GET /api/admin/users
Get all users (admin only).

#### GET /api/admin/analytics
Get platform analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "active": 890,
      "new_this_month": 45
    },
    "trips": {
      "total": 3200,
      "active": 450,
      "completed": 2750
    },
    "revenue": {
      "monthly": 12500,
      "annual": 150000
    }
  }
}
```

## Webhooks

### Stripe Webhooks

#### POST /api/stripe/webhook
Handle Stripe webhook events.

**Events Handled:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## SDK Examples

### JavaScript/TypeScript

```typescript
// VoyageSmart API Client
class VoyageSmartAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(data.data.session.access_token);
    return data;
  }

  // Trip methods
  async getTrips(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/trips?${query}`);
  }

  async createTrip(tripData: any) {
    return this.request('/api/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  async getTrip(id: string) {
    return this.request(`/api/trips/${id}`);
  }

  // Expense methods
  async getExpenses(tripId: string) {
    return this.request(`/api/trips/${tripId}/expenses`);
  }

  async createExpense(tripId: string, expenseData: any) {
    return this.request(`/api/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }
}

// Usage
const api = new VoyageSmartAPI('https://voyagesmart.app');

// Login
await api.login('user@example.com', 'password');

// Get trips
const trips = await api.getTrips({ page: 1, limit: 10 });

// Create trip
const newTrip = await api.createTrip({
  name: 'Tokyo Adventure',
  destination: 'Tokyo, Japan',
  start_date: '2024-08-01T00:00:00Z',
  end_date: '2024-08-10T00:00:00Z',
});
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class VoyageSmartAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.session = requests.Session()

    def set_token(self, token: str):
        self.token = token
        self.session.headers.update({'Authorization': f'Bearer {token}'})

    def _request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[Any, Any]:
        url = f"{self.base_url}{endpoint}"
        
        response = self.session.request(
            method=method,
            url=url,
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        return response.json()

    def login(self, email: str, password: str) -> Dict[Any, Any]:
        data = self._request('/api/auth/login', 'POST', {
            'email': email,
            'password': password
        })
        
        self.set_token(data['data']['session']['access_token'])
        return data

    def get_trips(self, page: int = 1, limit: int = 10) -> Dict[Any, Any]:
        return self._request(f'/api/trips?page={page}&limit={limit}')

    def create_trip(self, trip_data: Dict[Any, Any]) -> Dict[Any, Any]:
        return self._request('/api/trips', 'POST', trip_data)

# Usage
api = VoyageSmartAPI('https://voyagesmart.app')

# Login
api.login('user@example.com', 'password')

# Get trips
trips = api.get_trips(page=1, limit=10)

# Create trip
new_trip = api.create_trip({
    'name': 'Tokyo Adventure',
    'destination': 'Tokyo, Japan',
    'start_date': '2024-08-01T00:00:00Z',
    'end_date': '2024-08-10T00:00:00Z',
})
```

## Testing

### API Testing with Jest

```typescript
// __tests__/api/trips.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/trips/route';

describe('/api/trips', () => {
  it('should return user trips', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should create a new trip', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
        'content-type': 'application/json'
      },
      body: {
        name: 'Test Trip',
        destination: 'Test City',
        start_date: '2024-06-01T00:00:00Z',
        end_date: '2024-06-07T00:00:00Z'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Trip');
  });
});
```

## Best Practices

### API Design Principles

1. **RESTful Design** - Follow REST conventions
2. **Consistent Responses** - Use standard response format
3. **Proper HTTP Status Codes** - Use appropriate status codes
4. **Comprehensive Error Handling** - Provide clear error messages
5. **Input Validation** - Validate all input data
6. **Rate Limiting** - Implement rate limiting
7. **Authentication** - Secure all protected endpoints
8. **Documentation** - Keep documentation up to date

### Security Best Practices

1. **Use HTTPS** for all API communications
2. **Validate JWT tokens** on protected endpoints
3. **Implement rate limiting** to prevent abuse
4. **Sanitize input data** to prevent injection attacks
5. **Use CORS** appropriately
6. **Log security events** for monitoring
7. **Keep dependencies updated**

### Performance Optimization

1. **Implement caching** for frequently accessed data
2. **Use pagination** for large datasets
3. **Optimize database queries**
4. **Compress responses** when appropriate
5. **Monitor API performance**
6. **Use CDN** for static assets
