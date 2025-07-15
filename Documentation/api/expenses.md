# Expenses API

<div align="center">
  <h3>💰 Expense Management API</h3>
  <p>Complete API reference for managing trip expenses and cost splitting in VoyageSmart.</p>
</div>

---

## 📋 Overview

The Expenses API allows you to track, manage, and split expenses for trips. All endpoints require authentication and are scoped to specific trips.

### Base URL
```
/api/expenses
```

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔄 Endpoints

### Get Trip Expenses

Retrieve all expenses for a specific trip.

**Endpoint:** `GET /api/expenses/:tripId`

**Parameters:**
- `tripId` (string, required): The trip ID

**Query Parameters:**
- `category` (string, optional): Filter by expense category
- `paid_by` (string, optional): Filter by who paid
- `date_from` (string, optional): Filter from date (YYYY-MM-DD)
- `date_to` (string, optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "uuid",
        "trip_id": "uuid",
        "description": "Hotel booking",
        "amount": 800.00,
        "currency": "EUR",
        "category": "accommodation",
        "date": "2024-07-15",
        "paid_by": "uuid",
        "paid_by_name": "John Doe",
        "receipt_url": "https://...",
        "notes": "3 nights at Hotel Roma",
        "created_at": "2024-01-15T10:30:00Z",
        "splits": [
          {
            "user_id": "uuid",
            "user_name": "John Doe",
            "amount": 400.00,
            "status": "settled"
          },
          {
            "user_id": "uuid2",
            "user_name": "Jane Doe",
            "amount": 400.00,
            "status": "pending"
          }
        ]
      }
    ],
    "summary": {
      "total_amount": 1250.50,
      "by_category": {
        "accommodation": 800.00,
        "food": 300.50,
        "transportation": 150.00
      },
      "by_participant": {
        "uuid": {
          "paid": 950.00,
          "owes": 625.25,
          "balance": 324.75
        }
      }
    }
  }
}
```

### Create Expense

Add a new expense to a trip.

**Endpoint:** `POST /api/expenses/:tripId`

**Parameters:**
- `tripId` (string, required): The trip ID

**Request Body:**
```json
{
  "description": "Dinner at Restaurant",
  "amount": 120.00,
  "currency": "EUR",
  "category": "food",
  "date": "2024-07-16",
  "notes": "Great Italian restaurant",
  "splits": [
    {
      "user_id": "uuid1",
      "amount": 60.00
    },
    {
      "user_id": "uuid2",
      "amount": 60.00
    }
  ]
}
```

**Required Fields:**
- `description` (string): Expense description
- `amount` (number): Total expense amount
- `category` (string): Expense category
- `date` (string): Expense date (YYYY-MM-DD)

**Optional Fields:**
- `currency` (string): Currency code (defaults to trip currency)
- `notes` (string): Additional notes
- `receipt_url` (string): URL to receipt image
- `splits` (array): How to split the expense (defaults to equal split among participants)

**Expense Categories:**
- `accommodation` - Hotels, Airbnb, etc.
- `food` - Restaurants, groceries, etc.
- `transportation` - Flights, trains, taxis, etc.
- `activities` - Tours, tickets, entertainment
- `shopping` - Souvenirs, personal items
- `other` - Miscellaneous expenses

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trip_id": "uuid",
    "description": "Dinner at Restaurant",
    "amount": 120.00,
    "currency": "EUR",
    "category": "food",
    "date": "2024-07-16",
    "paid_by": "uuid",
    "notes": "Great Italian restaurant",
    "created_at": "2024-01-16T19:30:00Z",
    "splits": [
      {
        "user_id": "uuid1",
        "amount": 60.00,
        "status": "pending"
      },
      {
        "user_id": "uuid2",
        "amount": 60.00,
        "status": "pending"
      }
    ]
  }
}
```

### Update Expense

Update an existing expense.

**Endpoint:** `PUT /api/expenses/:tripId/:expenseId`

**Parameters:**
- `tripId` (string, required): The trip ID
- `expenseId` (string, required): The expense ID

**Request Body:**
```json
{
  "description": "Updated description",
  "amount": 130.00,
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trip_id": "uuid",
    "description": "Updated description",
    "amount": 130.00,
    "currency": "EUR",
    "category": "food",
    "date": "2024-07-16",
    "paid_by": "uuid",
    "notes": "Updated notes",
    "updated_at": "2024-01-16T20:00:00Z"
  }
}
```

### Delete Expense

Delete an expense from a trip.

**Endpoint:** `DELETE /api/expenses/:tripId/:expenseId`

**Parameters:**
- `tripId` (string, required): The trip ID
- `expenseId` (string, required): The expense ID

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

### Settle Expense Split

Mark an expense split as settled.

**Endpoint:** `POST /api/expenses/:tripId/:expenseId/settle`

**Parameters:**
- `tripId` (string, required): The trip ID
- `expenseId` (string, required): The expense ID

**Request Body:**
```json
{
  "user_id": "uuid",
  "settlement_method": "cash",
  "settlement_date": "2024-07-17"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense split settled successfully"
}
```

### Get Expense Summary

Get a detailed expense summary for a trip.

**Endpoint:** `GET /api/expenses/:tripId/summary`

**Parameters:**
- `tripId` (string, required): The trip ID

**Response:**
```json
{
  "success": true,
  "data": {
    "total_expenses": 1250.50,
    "total_participants": 4,
    "average_per_person": 312.63,
    "categories": {
      "accommodation": {
        "amount": 800.00,
        "percentage": 64.0,
        "count": 2
      },
      "food": {
        "amount": 300.50,
        "percentage": 24.0,
        "count": 8
      },
      "transportation": {
        "amount": 150.00,
        "percentage": 12.0,
        "count": 3
      }
    },
    "participants": [
      {
        "user_id": "uuid",
        "name": "John Doe",
        "total_paid": 950.00,
        "total_owed": 625.25,
        "balance": 324.75,
        "status": "owes_others"
      }
    ],
    "settlements": {
      "pending": 450.00,
      "settled": 800.50
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
| 404 | Not Found - Trip or expense not found |
| 422 | Unprocessable Entity - Invalid expense splits |
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

### Add an Expense with Custom Split

```bash
curl -X POST https://voyage-smart.vercel.app/api/expenses/TRIP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Taxi to airport",
    "amount": 45.00,
    "category": "transportation",
    "date": "2024-07-22",
    "splits": [
      {"user_id": "user1", "amount": 15.00},
      {"user_id": "user2", "amount": 30.00}
    ]
  }'
```

### Get Expenses by Category

```bash
curl -X GET "https://voyage-smart.vercel.app/api/expenses/TRIP_ID?category=food" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔗 Related APIs

- **[Trips API](./trips.md)** - Manage trips
- **[Activities API](./activities.md)** - Manage trip activities
- **[Authentication API](./authentication.md)** - User authentication

---

<div align="center">
  <p>
    <a href="./trips.md">← Back to Trips API</a> •
    <a href="./ai-endpoints.md">Next: AI Endpoints →</a>
  </p>
</div>
