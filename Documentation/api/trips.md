# Trips API

<div align="center">
  <h3>🗺️ Trip Management API</h3>
  <p>Complete API reference for managing trips in VoyageSmart.</p>
</div>

---

## 📋 Overview

The Trips API allows you to create, read, update, and delete trips. All endpoints require authentication and follow RESTful conventions.

### Base URL
```
/api/trips
```

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔄 Endpoints

### Get All Trips

Retrieve all trips for the authenticated user.

**Endpoint:** `GET /api/trips`

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Summer Vacation 2024",
      "description": "Family trip to Italy",
      "destination": "Rome, Italy",
      "start_date": "2024-07-15",
      "end_date": "2024-07-22",
      "budget": 2500.00,
      "currency": "EUR",
      "status": "planning",
      "privacy": "private",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "user_id": "uuid",
      "participants_count": 4,
      "activities_count": 12,
      "expenses_total": 1250.50
    }
  ]
}
```

### Get Trip by ID

Retrieve a specific trip by its ID.

**Endpoint:** `GET /api/trips/:id`

**Parameters:**
- `id` (string, required): The trip ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Summer Vacation 2024",
    "description": "Family trip to Italy",
    "destination": "Rome, Italy",
    "start_date": "2024-07-15",
    "end_date": "2024-07-22",
    "budget": 2500.00,
    "currency": "EUR",
    "status": "planning",
    "privacy": "private",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "user_id": "uuid",
    "participants": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "email": "user@example.com",
        "role": "owner",
        "status": "accepted"
      }
    ],
    "activities": [
      {
        "id": "uuid",
        "name": "Visit Colosseum",
        "type": "sightseeing",
        "date": "2024-07-16",
        "start_time": "09:00",
        "end_time": "11:00",
        "location": "Colosseum, Rome",
        "cost": 25.00
      }
    ],
    "expenses": [
      {
        "id": "uuid",
        "description": "Hotel booking",
        "amount": 800.00,
        "category": "accommodation",
        "date": "2024-07-15",
        "paid_by": "uuid"
      }
    ]
  }
}
```

### Create Trip

Create a new trip.

**Endpoint:** `POST /api/trips`

**Request Body:**
```json
{
  "name": "Summer Vacation 2024",
  "description": "Family trip to Italy",
  "destination": "Rome, Italy",
  "start_date": "2024-07-15",
  "end_date": "2024-07-22",
  "budget": 2500.00,
  "currency": "EUR",
  "privacy": "private"
}
```

**Required Fields:**
- `name` (string): Trip name
- `destination` (string): Trip destination
- `start_date` (string): Start date in YYYY-MM-DD format
- `end_date` (string): End date in YYYY-MM-DD format

**Optional Fields:**
- `description` (string): Trip description
- `budget` (number): Trip budget
- `currency` (string): Currency code (default: "EUR")
- `privacy` (string): "private" or "public" (default: "private")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Summer Vacation 2024",
    "description": "Family trip to Italy",
    "destination": "Rome, Italy",
    "start_date": "2024-07-15",
    "end_date": "2024-07-22",
    "budget": 2500.00,
    "currency": "EUR",
    "status": "planning",
    "privacy": "private",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "user_id": "uuid"
  }
}
```

### Update Trip

Update an existing trip.

**Endpoint:** `PUT /api/trips/:id`

**Parameters:**
- `id` (string, required): The trip ID

**Request Body:**
```json
{
  "name": "Updated Trip Name",
  "description": "Updated description",
  "budget": 3000.00,
  "status": "active"
}
```

**Updatable Fields:**
- `name` (string): Trip name
- `description` (string): Trip description
- `destination` (string): Trip destination
- `start_date` (string): Start date
- `end_date` (string): End date
- `budget` (number): Trip budget
- `currency` (string): Currency code
- `privacy` (string): Privacy setting
- `status` (string): Trip status

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Trip Name",
    "description": "Updated description",
    "destination": "Rome, Italy",
    "start_date": "2024-07-15",
    "end_date": "2024-07-22",
    "budget": 3000.00,
    "currency": "EUR",
    "status": "active",
    "privacy": "private",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z",
    "user_id": "uuid"
  }
}
```

### Delete Trip

Delete a trip and all associated data.

**Endpoint:** `DELETE /api/trips/:id`

**Parameters:**
- `id` (string, required): The trip ID

**Response:**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

## 🚨 Error Responses

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Trip not found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## 📝 Examples

### Create a Trip with cURL

```bash
curl -X POST https://voyage-smart.vercel.app/api/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend Getaway",
    "destination": "Paris, France",
    "start_date": "2024-03-15",
    "end_date": "2024-03-17",
    "budget": 800,
    "currency": "EUR"
  }'
```

### Update Trip Status

```bash
curl -X PUT https://voyage-smart.vercel.app/api/trips/YOUR_TRIP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

---

## 🔗 Related APIs

- **[Activities API](./activities.md)** - Manage trip activities
- **[Expenses API](./expenses.md)** - Track trip expenses
- **[Participants API](./participants.md)** - Manage trip participants
- **[Authentication API](./authentication.md)** - User authentication

---

<div align="center">
  <p>
    <a href="./README.md">← Back to API Overview</a> •
    <a href="./expenses.md">Next: Expenses API →</a>
  </p>
</div>
