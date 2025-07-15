# Activities API

<div align="center">
  <h3>📅 Activities & Itinerary API</h3>
  <p>Complete API reference for managing trip activities and itineraries in VoyageSmart.</p>
</div>

---

## 📋 Overview

The Activities API allows you to create, manage, and organize activities within trip itineraries. All endpoints require authentication and are scoped to specific trips.

### Base URL
```
/api/activities
```

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔄 Endpoints

### Get Trip Activities

Retrieve all activities for a specific trip.

**Endpoint:** `GET /api/activities/:tripId`

**Parameters:**
- `tripId` (string, required): The trip ID

**Query Parameters:**
- `date` (string, optional): Filter by specific date (YYYY-MM-DD)
- `type` (string, optional): Filter by activity type
- `status` (string, optional): Filter by status ("planned", "completed", "cancelled")

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "trip_id": "uuid",
        "name": "Visit Colosseum",
        "description": "Explore the iconic ancient amphitheater",
        "type": "sightseeing",
        "date": "2024-07-16",
        "start_time": "09:00",
        "end_time": "11:00",
        "location": "Piazza del Colosseo, 1, Rome",
        "coordinates": {
          "lat": 41.8902,
          "lng": 12.4922
        },
        "cost": 25.00,
        "currency": "EUR",
        "status": "planned",
        "notes": "Book skip-the-line tickets",
        "created_by": "uuid",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "total_activities": 15,
      "by_type": {
        "sightseeing": 6,
        "food": 4,
        "culture": 3,
        "nature": 2
      },
      "by_status": {
        "planned": 12,
        "completed": 2,
        "cancelled": 1
      },
      "total_cost": 450.00
    }
  }
}
```

### Create Activity

Add a new activity to a trip.

**Endpoint:** `POST /api/activities/:tripId`

**Parameters:**
- `tripId` (string, required): The trip ID

**Request Body:**
```json
{
  "name": "Dinner at Trattoria",
  "description": "Authentic Italian cuisine",
  "type": "food",
  "date": "2024-07-16",
  "start_time": "19:30",
  "end_time": "21:30",
  "location": "Via del Corso, 123, Rome",
  "coordinates": {
    "lat": 41.9028,
    "lng": 12.4964
  },
  "cost": 45.00,
  "notes": "Reservation required"
}
```

**Required Fields:**
- `name` (string): Activity name
- `type` (string): Activity type
- `date` (string): Activity date (YYYY-MM-DD)

**Optional Fields:**
- `description` (string): Activity description
- `start_time` (string): Start time (HH:MM)
- `end_time` (string): End time (HH:MM)
- `location` (string): Activity location
- `coordinates` (object): GPS coordinates
- `cost` (number): Activity cost
- `currency` (string): Currency code
- `notes` (string): Additional notes

**Activity Types:**
- `sightseeing` - Tourist attractions, landmarks
- `food` - Restaurants, cafes, food experiences
- `culture` - Museums, galleries, cultural sites
- `nature` - Parks, hiking, outdoor activities
- `entertainment` - Shows, concerts, nightlife
- `shopping` - Markets, stores, shopping areas
- `transportation` - Flights, trains, transfers
- `accommodation` - Check-in/out, hotel activities
- `sport` - Sports activities, fitness
- `relax` - Spa, beach, relaxation
- `other` - Miscellaneous activities

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trip_id": "uuid",
    "name": "Dinner at Trattoria",
    "description": "Authentic Italian cuisine",
    "type": "food",
    "date": "2024-07-16",
    "start_time": "19:30",
    "end_time": "21:30",
    "location": "Via del Corso, 123, Rome",
    "coordinates": {
      "lat": 41.9028,
      "lng": 12.4964
    },
    "cost": 45.00,
    "currency": "EUR",
    "status": "planned",
    "notes": "Reservation required",
    "created_by": "uuid",
    "created_at": "2024-01-16T14:30:00Z"
  }
}
```

### Batch Create Activities

Create multiple activities at once.

**Endpoint:** `POST /api/activities/batch`

**Request Body:**
```json
{
  "activities": [
    {
      "trip_id": "uuid",
      "name": "Morning Coffee",
      "type": "food",
      "date": "2024-07-16",
      "start_time": "08:00",
      "location": "Cafe Roma"
    },
    {
      "trip_id": "uuid",
      "name": "Vatican Tour",
      "type": "sightseeing",
      "date": "2024-07-16",
      "start_time": "10:00",
      "location": "Vatican City"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "activities": [
      {
        "id": "uuid1",
        "name": "Morning Coffee",
        "status": "created"
      },
      {
        "id": "uuid2",
        "name": "Vatican Tour",
        "status": "created"
      }
    ]
  }
}
```

### Update Activity

Update an existing activity.

**Endpoint:** `PUT /api/activities/:tripId/:activityId`

**Parameters:**
- `tripId` (string, required): The trip ID
- `activityId` (string, required): The activity ID

**Request Body:**
```json
{
  "name": "Updated Activity Name",
  "start_time": "10:00",
  "cost": 30.00,
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trip_id": "uuid",
    "name": "Updated Activity Name",
    "type": "sightseeing",
    "date": "2024-07-16",
    "start_time": "10:00",
    "cost": 30.00,
    "status": "completed",
    "updated_at": "2024-01-16T15:00:00Z"
  }
}
```

### Delete Activity

Delete an activity from a trip.

**Endpoint:** `DELETE /api/activities/:tripId/:activityId`

**Parameters:**
- `tripId` (string, required): The trip ID
- `activityId` (string, required): The activity ID

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

### Get Daily Itinerary

Get activities organized by day for a trip.

**Endpoint:** `GET /api/activities/:tripId/itinerary`

**Parameters:**
- `tripId` (string, required): The trip ID

**Query Parameters:**
- `date_from` (string, optional): Start date (YYYY-MM-DD)
- `date_to` (string, optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "itinerary": [
      {
        "date": "2024-07-16",
        "day_name": "Tuesday",
        "activities": [
          {
            "id": "uuid",
            "name": "Morning Coffee",
            "type": "food",
            "start_time": "08:00",
            "end_time": "08:30",
            "location": "Cafe Roma",
            "cost": 5.00
          },
          {
            "id": "uuid2",
            "name": "Colosseum Tour",
            "type": "sightseeing",
            "start_time": "09:00",
            "end_time": "11:00",
            "location": "Colosseum",
            "cost": 25.00
          }
        ],
        "daily_summary": {
          "total_activities": 6,
          "total_cost": 120.00,
          "duration": "12 hours",
          "free_time": "2 hours"
        }
      }
    ],
    "trip_summary": {
      "total_days": 7,
      "total_activities": 42,
      "total_cost": 840.00,
      "most_active_day": "2024-07-18",
      "least_active_day": "2024-07-20"
    }
  }
}
```

---

## 🚨 Error Responses

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Not a trip participant |
| 404 | Not Found - Trip or activity not found |
| 409 | Conflict - Time slot already occupied |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Time conflict",
  "details": "Activity overlaps with existing activity 'Lunch at Restaurant' (12:00-14:00)"
}
```

---

## 📝 Examples

### Create a Sightseeing Activity

```bash
curl -X POST https://voyage-smart.vercel.app/api/activities/TRIP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pantheon Visit",
    "type": "sightseeing",
    "date": "2024-07-17",
    "start_time": "14:00",
    "end_time": "15:30",
    "location": "Piazza della Rotonda, Rome",
    "cost": 0,
    "notes": "Free entry, best time to visit"
  }'
```

### Get Activities for a Specific Date

```bash
curl -X GET "https://voyage-smart.vercel.app/api/activities/TRIP_ID?date=2024-07-16" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔗 Related APIs

- **[Trips API](./trips.md)** - Manage trips
- **[Expenses API](./expenses.md)** - Track activity costs
- **[AI Endpoints](./ai-endpoints.md)** - Generate activities with AI

---

<div align="center">
  <p>
    <a href="./ai-endpoints.md">← Back to AI Endpoints</a> •
    <a href="./README.md">Back to API Overview</a>
  </p>
</div>
