# Expenses API

This document describes the API endpoints for managing trip expenses in VoyageSmart.

## Overview

The Expenses API allows you to create, read, update, and delete expense records associated with trips. All expense amounts are stored in the smallest currency unit (e.g., cents for USD).

## Authentication

All expense endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Get Trip Expenses

Retrieve all expenses for a specific trip.

```http
GET /api/trips/{tripId}/expenses
```

**Parameters:**
- `tripId` (string, required): The ID of the trip

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "expense_123",
      "trip_id": "trip_456",
      "user_id": "user_789",
      "title": "Hotel Booking",
      "description": "3 nights at Grand Hotel",
      "amount": 30000,
      "currency": "USD",
      "category": "accommodation",
      "date": "2024-01-15T00:00:00Z",
      "receipt_url": "https://...",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

### Create Expense

Create a new expense for a trip.

```http
POST /api/trips/{tripId}/expenses
```

**Request Body:**
```json
{
  "title": "Restaurant Dinner",
  "description": "Dinner at local restaurant",
  "amount": 5000,
  "currency": "USD",
  "category": "food",
  "date": "2024-01-15T19:00:00Z",
  "receipt_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "expense_124",
    "trip_id": "trip_456",
    "user_id": "user_789",
    "title": "Restaurant Dinner",
    "description": "Dinner at local restaurant",
    "amount": 5000,
    "currency": "USD",
    "category": "food",
    "date": "2024-01-15T19:00:00Z",
    "receipt_url": "https://...",
    "created_at": "2024-01-10T11:00:00Z",
    "updated_at": "2024-01-10T11:00:00Z"
  }
}
```

### Update Expense

Update an existing expense.

```http
PUT /api/trips/{tripId}/expenses/{expenseId}
```

**Request Body:**
```json
{
  "title": "Updated Restaurant Dinner",
  "description": "Updated description",
  "amount": 5500,
  "currency": "USD",
  "category": "food",
  "date": "2024-01-15T19:00:00Z"
}
```

### Delete Expense

Delete an expense.

```http
DELETE /api/trips/{tripId}/expenses/{expenseId}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

## Expense Categories

The following categories are supported:
- `accommodation` - Hotels, Airbnb, etc.
- `transportation` - Flights, trains, car rentals, etc.
- `food` - Restaurants, groceries, etc.
- `activities` - Tours, attractions, entertainment
- `shopping` - Souvenirs, clothing, etc.
- `other` - Miscellaneous expenses

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": ["Amount must be a positive number"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied to this trip"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Trip or expense not found"
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per user. When the limit is exceeded, you'll receive a 429 status code.

## Currency Support

VoyageSmart supports all major currencies. Amounts should be provided in the smallest currency unit:
- USD: cents (e.g., $50.00 = 5000)
- EUR: cents (e.g., €50.00 = 5000)
- GBP: pence (e.g., £50.00 = 5000)
- JPY: yen (e.g., ¥50 = 50)
