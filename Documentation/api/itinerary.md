# Itinerary API

This document describes the API endpoints for managing trip itineraries in VoyageSmart.

## Overview

The Itinerary API allows you to create, read, update, and delete itinerary items for trips. Each itinerary item represents a planned activity, accommodation, or transportation during the trip.

## Authentication

All itinerary endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Get Trip Itinerary

Retrieve the complete itinerary for a specific trip.

```http
GET /api/trips/{tripId}/itinerary
```

**Parameters:**
- `tripId` (string, required): The ID of the trip

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "itinerary_123",
      "trip_id": "trip_456",
      "title": "Check-in at Grand Hotel",
      "description": "Hotel check-in and room setup",
      "type": "accommodation",
      "start_date": "2024-01-15T15:00:00Z",
      "end_date": "2024-01-15T16:00:00Z",
      "location": {
        "name": "Grand Hotel",
        "address": "123 Main St, City, Country",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "notes": "Early check-in requested",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

### Create Itinerary Item

Add a new item to the trip itinerary.

```http
POST /api/trips/{tripId}/itinerary
```

**Request Body:**
```json
{
  "title": "Visit Museum",
  "description": "Explore the local history museum",
  "type": "activity",
  "start_date": "2024-01-16T10:00:00Z",
  "end_date": "2024-01-16T12:00:00Z",
  "location": {
    "name": "City History Museum",
    "address": "456 Culture Ave, City, Country",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "notes": "Student discount available"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "itinerary_124",
    "trip_id": "trip_456",
    "title": "Visit Museum",
    "description": "Explore the local history museum",
    "type": "activity",
    "start_date": "2024-01-16T10:00:00Z",
    "end_date": "2024-01-16T12:00:00Z",
    "location": {
      "name": "City History Museum",
      "address": "456 Culture Ave, City, Country",
      "latitude": 40.7589,
      "longitude": -73.9851
    },
    "notes": "Student discount available",
    "created_at": "2024-01-10T11:00:00Z",
    "updated_at": "2024-01-10T11:00:00Z"
  }
}
```

### Update Itinerary Item

Update an existing itinerary item.

```http
PUT /api/trips/{tripId}/itinerary/{itemId}
```

**Request Body:**
```json
{
  "title": "Updated Museum Visit",
  "description": "Extended museum tour with guide",
  "start_date": "2024-01-16T09:30:00Z",
  "end_date": "2024-01-16T13:00:00Z",
  "notes": "Booked guided tour"
}
```

### Delete Itinerary Item

Remove an item from the itinerary.

```http
DELETE /api/trips/{tripId}/itinerary/{itemId}
```

**Response:**
```json
{
  "success": true,
  "message": "Itinerary item deleted successfully"
}
```

### Reorder Itinerary

Update the order of itinerary items.

```http
PUT /api/trips/{tripId}/itinerary/reorder
```

**Request Body:**
```json
{
  "items": [
    {
      "id": "itinerary_123",
      "order": 1
    },
    {
      "id": "itinerary_124",
      "order": 2
    }
  ]
}
```

## Itinerary Item Types

The following types are supported:
- `accommodation` - Hotels, check-ins, check-outs
- `transportation` - Flights, trains, car rentals
- `activity` - Tours, attractions, entertainment
- `meal` - Restaurant reservations, dining
- `meeting` - Business meetings, appointments
- `other` - Miscellaneous planned items

## Location Object

The location object contains:
- `name` (string): Name of the location
- `address` (string): Full address
- `latitude` (number): Latitude coordinate
- `longitude` (number): Longitude coordinate

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": ["Start date must be before end date"]
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
  "error": "Trip or itinerary item not found"
}
```

## Date Handling

All dates should be provided in ISO 8601 format with timezone information. The API will store and return dates in UTC format.

Example: `2024-01-15T15:00:00Z`

## Rate Limiting

API requests are limited to 100 requests per minute per user.
