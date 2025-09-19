# API Endpoints Reference

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "terms_accepted": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Errors:**
- `400` - Validation errors (email format, password strength)
- `409` - Email already exists

---

### POST /api/auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "role": "user"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890,
      "token_type": "Bearer"
    }
  }
}
```

**Errors:**
- `400` - Invalid request format
- `401` - Invalid credentials
- `423` - Account locked due to too many failed attempts

---

### POST /api/auth/logout
Logout user and invalidate session.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
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
    "expires_at": 1234567890
  }
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

## User Management Endpoints

### GET /api/user
Get current user profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "role": "user",
    "preferences": {
      "currency": "USD",
      "timezone": "UTC",
      "language": "en",
      "notifications": {
        "email": true,
        "push": false
      }
    },
    "subscription": {
      "tier": "premium",
      "status": "active",
      "current_period_end": "2024-12-31T23:59:59Z"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### PUT /api/user
Update user profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "avatar_url": "https://...",
  "preferences": {
    "currency": "EUR",
    "timezone": "Europe/London",
    "language": "en",
    "notifications": {
      "email": true,
      "push": true
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Smith",
    "avatar_url": "https://...",
    "preferences": {
      "currency": "EUR",
      "timezone": "Europe/London",
      "language": "en",
      "notifications": {
        "email": true,
        "push": true
      }
    },
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Trip Management Endpoints

### GET /api/trips
Get user's trips with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `sort` (string, default: "created_at") - Sort field
- `order` (string, default: "desc") - Sort order (asc/desc)
- `status` (string) - Filter by status (planned/active/completed/cancelled)
- `search` (string) - Search in names and destinations
- `start_date` (ISO date) - Filter trips starting after date
- `end_date` (ISO date) - Filter trips ending before date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Paris Adventure",
      "destination": "Paris, France",
      "start_date": "2024-06-01T00:00:00Z",
      "end_date": "2024-06-07T00:00:00Z",
      "status": "planned",
      "budget": 2000,
      "currency": "EUR",
      "participant_count": 3,
      "owner_id": "uuid",
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

---

### POST /api/trips
Create a new trip.

**Headers:**
```
Authorization: Bearer <access-token>
```

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
    "id": "uuid",
    "name": "Tokyo Adventure",
    "destination": "Tokyo, Japan",
    "start_date": "2024-08-01T00:00:00Z",
    "end_date": "2024-08-10T00:00:00Z",
    "status": "planned",
    "budget": 3000,
    "currency": "JPY",
    "description": "Exploring Tokyo's culture and cuisine",
    "is_public": false,
    "owner_id": "uuid",
    "participant_count": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation errors
- `402` - Subscription required (trip limit exceeded)

---

### GET /api/trips/[id]
Get detailed trip information including participants, activities, and expenses.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Paris Adventure",
    "destination": "Paris, France",
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-06-07T00:00:00Z",
    "status": "planned",
    "budget": 2000,
    "currency": "EUR",
    "description": "A wonderful trip to Paris",
    "is_public": false,
    "owner_id": "uuid",
    "participants": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "role": "owner",
        "invitation_status": "accepted",
        "joined_at": "2024-01-01T00:00:00Z",
        "user": {
          "id": "uuid",
          "full_name": "John Doe",
          "avatar_url": "https://..."
        }
      }
    ],
    "accommodations": [
      {
        "id": "uuid",
        "name": "Hotel Paris",
        "address": "123 Rue de la Paix, Paris",
        "check_in": "2024-06-01T15:00:00Z",
        "check_out": "2024-06-07T11:00:00Z",
        "cost": 800,
        "booking_reference": "ABC123"
      }
    ],
    "transportation": [
      {
        "id": "uuid",
        "type": "flight",
        "from": "New York",
        "to": "Paris",
        "departure": "2024-06-01T08:00:00Z",
        "arrival": "2024-06-01T14:00:00Z",
        "cost": 600,
        "booking_reference": "FL123"
      }
    ],
    "itinerary_days": [
      {
        "id": "uuid",
        "date": "2024-06-02",
        "activities": [
          {
            "id": "uuid",
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
        "id": "uuid",
        "title": "Dinner at Restaurant",
        "amount": 120.50,
        "currency": "EUR",
        "category": "food",
        "date": "2024-06-02T19:30:00Z",
        "paid_by": "uuid",
        "participants": ["uuid1", "uuid2"],
        "split_type": "equal"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `404` - Trip not found
- `403` - Access denied (not a participant)

---

### PUT /api/trips/[id]
Update trip details.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "name": "Updated Trip Name",
  "description": "Updated description",
  "budget": 2500,
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Trip Name",
    "description": "Updated description",
    "budget": 2500,
    "status": "active",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `404` - Trip not found
- `403` - Access denied (not owner or admin)

---

### DELETE /api/trips/[id]
Delete a trip.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

**Errors:**
- `404` - Trip not found
- `403` - Access denied (not owner)

---

## Expense Management Endpoints

### GET /api/trips/[tripId]/expenses
Get expenses for a specific trip.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `category` (string) - Filter by category
- `paid_by` (string) - Filter by who paid
- `date_from` (ISO date) - Filter from date
- `date_to` (ISO date) - Filter to date
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Dinner at Restaurant",
      "amount": 120.50,
      "currency": "EUR",
      "category": "food",
      "date": "2024-06-02T19:30:00Z",
      "paid_by": "uuid",
      "participants": [
        {
          "user_id": "uuid",
          "amount_owed": 60.25,
          "user": {
            "full_name": "John Doe"
          }
        }
      ],
      "split_type": "equal",
      "notes": "Great Italian restaurant",
      "receipt_url": "https://...",
      "created_at": "2024-06-02T20:00:00Z"
    }
  ],
  "summary": {
    "total_amount": 1250.75,
    "user_total_paid": 450.25,
    "user_total_owed": 625.50,
    "user_balance": -175.25
  }
}
```

---

### POST /api/trips/[tripId]/expenses
Create a new expense.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "title": "Taxi to Airport",
  "amount": 45.00,
  "currency": "EUR",
  "category": "transportation",
  "date": "2024-06-07T08:00:00Z",
  "paid_by": "uuid",
  "participants": ["uuid1", "uuid2"],
  "split_type": "equal",
  "notes": "Shared taxi ride",
  "receipt_url": "https://..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Taxi to Airport",
    "amount": 45.00,
    "currency": "EUR",
    "category": "transportation",
    "date": "2024-06-07T08:00:00Z",
    "paid_by": "uuid",
    "participants": [
      {
        "user_id": "uuid1",
        "amount_owed": 22.50
      },
      {
        "user_id": "uuid2",
        "amount_owed": 22.50
      }
    ],
    "split_type": "equal",
    "notes": "Shared taxi ride",
    "receipt_url": "https://...",
    "created_at": "2024-06-07T08:15:00Z"
  }
}
```

---

## Activity Management Endpoints

### GET /api/trips/[tripId]/activities
Get activities for a specific trip.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `date` (ISO date) - Filter by specific date
- `category` (string) - Filter by category
- `day` (number) - Filter by trip day number

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Visit Louvre Museum",
      "description": "World's largest art museum",
      "date": "2024-06-03",
      "start_time": "09:00",
      "duration": 180,
      "location": {
        "name": "Louvre Museum",
        "address": "Rue de Rivoli, Paris",
        "coordinates": {
          "lat": 48.8606,
          "lng": 2.3376
        }
      },
      "category": "culture",
      "cost": 17.00,
      "booking_url": "https://...",
      "booking_reference": "LV123",
      "notes": "Book tickets online to skip the line",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/trips/[tripId]/activities
Create a new activity.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "title": "Seine River Cruise",
  "description": "Romantic evening cruise along the Seine",
  "date": "2024-06-04",
  "start_time": "19:00",
  "duration": 90,
  "location": {
    "name": "Pont Neuf",
    "address": "Pont Neuf, Paris",
    "coordinates": {
      "lat": 48.8566,
      "lng": 2.3412
    }
  },
  "category": "entertainment",
  "cost": 35.00,
  "booking_url": "https://...",
  "notes": "Includes dinner and wine"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Seine River Cruise",
    "description": "Romantic evening cruise along the Seine",
    "date": "2024-06-04",
    "start_time": "19:00",
    "duration": 90,
    "location": {
      "name": "Pont Neuf",
      "address": "Pont Neuf, Paris",
      "coordinates": {
        "lat": 48.8566,
        "lng": 2.3412
      }
    },
    "category": "entertainment",
    "cost": 35.00,
    "booking_url": "https://...",
    "notes": "Includes dinner and wine",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## AI Assistant Endpoints

### POST /api/ai/chat
Send message to AI assistant.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "message": "What are the best restaurants near the Eiffel Tower?",
  "trip_id": "uuid",
  "context": {
    "current_location": "Eiffel Tower",
    "preferences": ["french cuisine", "romantic"],
    "budget": "medium"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "Here are some excellent restaurants near the Eiffel Tower...",
    "suggestions": [
      {
        "type": "restaurant",
        "name": "Le Jules Verne",
        "description": "Michelin-starred restaurant in the Eiffel Tower",
        "location": {
          "name": "Eiffel Tower",
          "coordinates": {
            "lat": 48.8584,
            "lng": 2.2945
          }
        },
        "price_range": "expensive"
      }
    ],
    "usage": {
      "tokens_used": 250,
      "remaining_tokens": 750
    }
  }
}
```

**Errors:**
- `402` - AI subscription required
- `429` - AI usage limit exceeded

---

### POST /api/ai/generate-itinerary
Generate AI-powered itinerary for a trip.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "trip_id": "uuid",
  "preferences": {
    "interests": ["culture", "food", "history"],
    "budget_level": "medium",
    "pace": "relaxed",
    "group_size": 2,
    "duration_per_activity": 120
  },
  "constraints": {
    "mobility": "none",
    "dietary": ["vegetarian"],
    "avoid": ["crowded places"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "itinerary": [
      {
        "date": "2024-06-02",
        "activities": [
          {
            "title": "Visit Louvre Museum",
            "description": "Start your cultural journey at the world's largest art museum",
            "start_time": "09:00",
            "duration": 180,
            "location": {
              "name": "Louvre Museum",
              "coordinates": {
                "lat": 48.8606,
                "lng": 2.3376
              }
            },
            "category": "culture",
            "estimated_cost": 17.00
          }
        ]
      }
    ],
    "summary": {
      "total_activities": 12,
      "estimated_total_cost": 450.00,
      "average_activities_per_day": 2
    },
    "usage": {
      "tokens_used": 500,
      "remaining_tokens": 500
    }
  }
}
```

---

## Admin Endpoints

### GET /api/admin/users
Get all users with filtering (admin only).

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `search` (string) - Search in names and emails
- `role` (string) - Filter by role
- `subscription` (string) - Filter by subscription tier

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "subscription": {
        "tier": "premium",
        "status": "active"
      },
      "trip_count": 5,
      "last_login": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "total_pages": 25
  }
}
```

**Errors:**
- `403` - Access denied (not admin)

---

### GET /api/admin/analytics
Get platform analytics (admin only).

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Query Parameters:**
- `period` (string) - Time period (day/week/month/year)
- `start_date` (ISO date) - Start date for custom period
- `end_date` (ISO date) - End date for custom period

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "active": 890,
      "new_this_period": 45,
      "growth_rate": 3.6
    },
    "trips": {
      "total": 3200,
      "active": 450,
      "completed": 2750,
      "average_per_user": 2.56
    },
    "revenue": {
      "total": 150000,
      "this_period": 12500,
      "growth_rate": 8.2,
      "by_tier": {
        "premium": 7500,
        "ai": 5000
      }
    },
    "ai_usage": {
      "total_requests": 25000,
      "this_period": 2100,
      "average_per_user": 20
    }
  }
}
```
