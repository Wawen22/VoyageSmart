# API Documentation

This section provides detailed documentation for VoyageSmart's API endpoints. These endpoints are used by the frontend to communicate with the backend and can also be used by third-party applications.

## 📋 Contents

- [Authentication](./authentication.md) - Authentication endpoints and flow
- [Trips](./trips.md) - Trip management endpoints
- [Itinerary](./itinerary.md) - Itinerary management endpoints
- [Expenses](./expenses.md) - Expense management endpoints
- [AI Endpoints](./ai-endpoints.md) - AI-related endpoints

## 🔄 API Overview

VoyageSmart's API is built using Next.js API routes and communicates with Supabase for data storage and authentication. The API follows RESTful principles and uses JSON for data exchange.

### Base URL

The base URL for all API endpoints is:

```
https://voyage-smart.vercel.app/api
```

For local development, the base URL is:

```
http://localhost:3000/api
```

### Authentication

All API endpoints (except for public endpoints) require authentication. Authentication is handled using Supabase Auth and JWT tokens.

For more details, see the [Authentication](./authentication.md) documentation.

### Response Format

All API responses follow a standard format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "error": null
}
```

In case of an error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

### Error Codes

Common error codes include:

- `UNAUTHORIZED`: User is not authenticated
- `FORBIDDEN`: User does not have permission to access the resource
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `SERVER_ERROR`: Internal server error

### Rate Limiting

API endpoints are rate-limited to prevent abuse. The rate limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

### Versioning

The API is currently at version 1. The version is not included in the URL path, but future versions may include it.

## 📚 API Endpoints

### Authentication

- `POST /api/auth/login` - Log in with email and password
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/logout` - Log out
- `GET /api/auth/user` - Get current user information

For more details, see the [Authentication](./authentication.md) documentation.

### Trips

- `GET /api/trips` - Get all trips for the current user
- `GET /api/trips/:id` - Get a specific trip
- `POST /api/trips` - Create a new trip
- `PUT /api/trips/:id` - Update a trip
- `DELETE /api/trips/:id` - Delete a trip

For more details, see the [Trips](./trips.md) documentation.

### Itinerary

- `GET /api/itinerary/:tripId` - Get the itinerary for a trip
- `POST /api/itinerary/:tripId/days` - Add a day to the itinerary
- `PUT /api/itinerary/:tripId/days/:dayId` - Update a day in the itinerary
- `DELETE /api/itinerary/:tripId/days/:dayId` - Delete a day from the itinerary
- `POST /api/itinerary/:tripId/activities` - Add an activity to the itinerary
- `PUT /api/itinerary/:tripId/activities/:activityId` - Update an activity
- `DELETE /api/itinerary/:tripId/activities/:activityId` - Delete an activity

For more details, see the [Itinerary](./itinerary.md) documentation.

### Expenses

- `GET /api/expenses/:tripId` - Get all expenses for a trip
- `POST /api/expenses/:tripId` - Add an expense to a trip
- `PUT /api/expenses/:tripId/:expenseId` - Update an expense
- `DELETE /api/expenses/:tripId/:expenseId` - Delete an expense

For more details, see the [Expenses](./expenses.md) documentation.

### AI Endpoints

- `POST /api/ai/chat` - Send a message to the AI assistant
- `POST /api/ai/generate-activities` - Generate activities for a trip
- `POST /api/ai/optimize-route` - Optimize a route for a day

For more details, see the [AI Endpoints](./ai-endpoints.md) documentation.

## 🧪 Testing the API

You can test the API using tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/).

### Example: Get All Trips

```
GET /api/trips
Authorization: Bearer <your-jwt-token>
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Trip to Paris",
      "description": "A romantic getaway to Paris",
      "start_date": "2023-06-01",
      "end_date": "2023-06-07",
      "destination": "Paris, France",
      "is_private": false,
      "budget_total": 2000,
      "owner_id": "user-id",
      "created_at": "2023-01-15T12:00:00Z",
      "updated_at": "2023-01-15T12:00:00Z"
    },
    // More trips...
  ],
  "error": null
}
```

## 📚 Next Steps

To learn more about specific API endpoints, check out the detailed documentation for each category:

- [Authentication](./authentication.md)
- [Trips](./trips.md)
- [Itinerary](./itinerary.md)
- [Expenses](./expenses.md)
- [AI Endpoints](./ai-endpoints.md)

---

Next: [Authentication](./authentication.md)
