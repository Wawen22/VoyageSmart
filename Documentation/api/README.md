# API Documentation

<div align="center">
  <h3>🔄 VoyageSmart API Reference</h3>
  <p>Complete documentation for VoyageSmart's RESTful API endpoints.</p>
</div>

---

## 📚 API Endpoints

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="./authentication.md">
          <img src="https://img.shields.io/badge/🔐-Authentication-blue?style=for-the-badge" alt="Authentication"/>
        </a>
      </td>
      <td align="center">
        <a href="./trips.md">
          <img src="https://img.shields.io/badge/🗺️-Trips-green?style=for-the-badge" alt="Trips"/>
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <a href="./activities.md">
          <img src="https://img.shields.io/badge/📅-Activities-cyan?style=for-the-badge" alt="Activities"/>
        </a>
      </td>
      <td align="center">
        <a href="./expenses.md">
          <img src="https://img.shields.io/badge/💰-Expenses-orange?style=for-the-badge" alt="Expenses"/>
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <a href="./ai-endpoints.md">
          <img src="https://img.shields.io/badge/🤖-AI%20Endpoints-purple?style=for-the-badge" alt="AI Endpoints"/>
        </a>
      </td>
      <td align="center">
        <a href="#coming-soon">
          <img src="https://img.shields.io/badge/👥-Participants-pink?style=for-the-badge" alt="Participants"/>
        </a>
      </td>
    </tr>
  </table>
</div>

---

## 🔄 API Overview

VoyageSmart's API is built with:
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Architecture**: RESTful principles
- **Data Format**: JSON

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

### Activities & Itinerary

- `GET /api/activities/:tripId` - Get all activities for a trip
- `GET /api/activities/:tripId/itinerary` - Get daily itinerary
- `POST /api/activities/:tripId` - Add an activity to a trip
- `POST /api/activities/batch` - Create multiple activities
- `PUT /api/activities/:tripId/:activityId` - Update an activity
- `DELETE /api/activities/:tripId/:activityId` - Delete an activity

For more details, see the [Activities](./activities.md) documentation.

### Expenses

- `GET /api/expenses/:tripId` - Get all expenses for a trip
- `GET /api/expenses/:tripId/summary` - Get expense summary
- `POST /api/expenses/:tripId` - Add an expense to a trip
- `PUT /api/expenses/:tripId/:expenseId` - Update an expense
- `DELETE /api/expenses/:tripId/:expenseId` - Delete an expense
- `POST /api/expenses/:tripId/:expenseId/settle` - Settle expense split

For more details, see the [Expenses](./expenses.md) documentation.

### AI Endpoints

- `POST /api/ai/chat` - Send a message to the AI assistant
- `POST /api/ai/generate-activities` - Generate activities for a trip
- `POST /api/ai/optimize-route` - Optimize a route for a day
- `GET /api/ai/suggestions/:tripId` - Get AI suggestions

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
- [Activities](./activities.md)
- [Expenses](./expenses.md)
- [AI Endpoints](./ai-endpoints.md)

---

Next: [Authentication](./authentication.md)
