# AI Endpoints API

<div align="center">
  <h3>🤖 AI-Powered Features API</h3>
  <p>Complete API reference for VoyageSmart's AI-powered travel assistance features.</p>
</div>

---

## 📋 Overview

The AI Endpoints API provides access to VoyageSmart's intelligent features powered by Google's Gemini AI. These endpoints enable conversational assistance, activity generation, and smart travel recommendations.

### Base URL
```
/api/ai
```

### Authentication
All endpoints require a valid JWT token and an active AI subscription:
```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting
AI endpoints are rate-limited to ensure fair usage:
- **Free users**: 10 requests per hour
- **Premium users**: 50 requests per hour
- **AI subscribers**: 200 requests per hour

---

## 🔄 Endpoints

### AI Chat Assistant

Engage in conversational AI assistance for travel planning and advice.

**Endpoint:** `POST /api/ai/chat`

**Request Body:**
```json
{
  "message": "What are the best restaurants in Rome for authentic Italian cuisine?",
  "tripId": "uuid",
  "context": {
    "includeItinerary": true,
    "includeExpenses": false,
    "includeParticipants": true
  }
}
```

**Required Fields:**
- `message` (string): User's message or question
- `tripId` (string): Trip ID for context

**Optional Fields:**
- `context` (object): What trip data to include in context
  - `includeItinerary` (boolean): Include trip activities
  - `includeExpenses` (boolean): Include expense data
  - `includeParticipants` (boolean): Include participant info

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your trip to Rome, here are some excellent authentic Italian restaurants:\n\n🍝 **Trattoria da Enzo** - Traditional Roman cuisine in Trastevere\n📍 Via dei Vascellari, 29\n💰 €25-35 per person\n\n🍕 **Pizzarium** - Best pizza al taglio in the city\n📍 Via della Meloria, 43\n💰 €8-15 per person\n\nWould you like me to add any of these to your itinerary?",
    "suggestions": [
      {
        "type": "add_activity",
        "title": "Add Trattoria da Enzo to itinerary",
        "data": {
          "name": "Dinner at Trattoria da Enzo",
          "type": "food",
          "location": "Via dei Vascellari, 29, Rome",
          "estimated_cost": 30.00
        }
      }
    ],
    "metadata": {
      "responseTime": 1250,
      "tokensUsed": 450,
      "cacheHit": false,
      "contextUsed": {
        "tripDays": 5,
        "activitiesCount": 12,
        "participantsCount": 4
      }
    }
  }
}
```

### Generate Activities

Automatically generate activities for a trip based on preferences and constraints.

**Endpoint:** `POST /api/ai/generate-activities`

**Request Body:**
```json
{
  "tripId": "uuid",
  "preferences": {
    "interests": ["culture", "food", "history"],
    "budget": "medium",
    "pace": "relaxed",
    "groupType": "family"
  },
  "constraints": {
    "startDate": "2024-07-15",
    "endDate": "2024-07-22",
    "dailyBudget": 100.00,
    "mobility": "walking",
    "dietaryRestrictions": ["vegetarian"]
  },
  "options": {
    "activitiesPerDay": 3,
    "includeRestTime": true,
    "avoidCrowds": false,
    "localExperiences": true
  }
}
```

**Required Fields:**
- `tripId` (string): Trip ID
- `preferences` (object): User preferences
  - `interests` (array): Activity interests
  - `budget` (string): "low", "medium", "high"
  - `pace` (string): "relaxed", "moderate", "intensive"

**Optional Fields:**
- `constraints` (object): Trip constraints
- `options` (object): Generation options

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "day": "2024-07-15",
        "activities": [
          {
            "name": "Visit Colosseum",
            "type": "culture",
            "startTime": "09:00",
            "endTime": "11:00",
            "location": "Piazza del Colosseo, 1, Rome",
            "coordinates": {
              "lat": 41.8902,
              "lng": 12.4922
            },
            "estimatedCost": 25.00,
            "description": "Explore the iconic ancient amphitheater",
            "tips": "Book skip-the-line tickets in advance",
            "duration": 120
          },
          {
            "name": "Lunch at Trattoria Monti",
            "type": "food",
            "startTime": "13:00",
            "endTime": "14:30",
            "location": "Via di San Vito, 13a, Rome",
            "estimatedCost": 35.00,
            "description": "Authentic Roman cuisine",
            "tips": "Try their famous carbonara"
          }
        ]
      }
    ],
    "summary": {
      "totalActivities": 21,
      "totalEstimatedCost": 650.00,
      "averageCostPerDay": 92.86,
      "activityTypes": {
        "culture": 8,
        "food": 7,
        "nature": 3,
        "shopping": 3
      }
    },
    "metadata": {
      "generationTime": 3500,
      "preferencesMatched": 95,
      "constraintsRespected": 100
    }
  }
}
```

### Optimize Route

Optimize the order of activities for a specific day to minimize travel time.

**Endpoint:** `POST /api/ai/optimize-route`

**Request Body:**
```json
{
  "tripId": "uuid",
  "date": "2024-07-16",
  "activities": [
    {
      "id": "uuid1",
      "name": "Vatican Museums",
      "location": "Vatican City",
      "coordinates": {"lat": 41.9065, "lng": 12.4536},
      "preferredTime": "morning"
    },
    {
      "id": "uuid2",
      "name": "Trevi Fountain",
      "location": "Piazza di Trevi, Rome",
      "coordinates": {"lat": 41.9009, "lng": 12.4833},
      "preferredTime": "afternoon"
    }
  ],
  "options": {
    "transportMode": "walking",
    "startLocation": "Hotel Roma, Via Nazionale",
    "endLocation": "Hotel Roma, Via Nazionale",
    "breakDuration": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimizedRoute": [
      {
        "order": 1,
        "activity": {
          "id": "uuid1",
          "name": "Vatican Museums",
          "suggestedTime": "09:00-12:00",
          "travelFromPrevious": {
            "duration": 25,
            "distance": "1.2 km",
            "mode": "walking"
          }
        }
      },
      {
        "order": 2,
        "activity": {
          "id": "uuid2",
          "name": "Trevi Fountain",
          "suggestedTime": "14:00-15:00",
          "travelFromPrevious": {
            "duration": 35,
            "distance": "2.1 km",
            "mode": "walking"
          }
        }
      }
    ],
    "summary": {
      "totalTravelTime": 60,
      "totalDistance": "3.3 km",
      "optimizationScore": 85,
      "timeSaved": 45
    }
  }
}
```

### Get AI Suggestions

Get contextual AI suggestions based on current trip state.

**Endpoint:** `GET /api/ai/suggestions/:tripId`

**Parameters:**
- `tripId` (string, required): The trip ID

**Query Parameters:**
- `type` (string, optional): Suggestion type ("activities", "restaurants", "budget", "all")
- `limit` (number, optional): Maximum suggestions to return (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "activity",
        "title": "Add morning activity",
        "description": "You have a gap on July 16th from 9-11 AM. Consider visiting Pantheon.",
        "priority": "medium",
        "action": {
          "type": "add_activity",
          "data": {
            "name": "Visit Pantheon",
            "date": "2024-07-16",
            "startTime": "09:00"
          }
        }
      },
      {
        "type": "budget",
        "title": "Budget optimization",
        "description": "You're 15% over budget. Consider these cost-saving alternatives.",
        "priority": "high",
        "alternatives": [
          {
            "current": "Expensive restaurant",
            "alternative": "Local trattoria",
            "savings": 25.00
          }
        ]
      }
    ]
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
| 402 | Payment Required - AI subscription required |
| 429 | Too Many Requests - Rate limit exceeded |
| 503 | Service Unavailable - AI service temporarily unavailable |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": "You have exceeded your hourly AI request limit. Upgrade to premium for higher limits.",
  "retryAfter": 3600,
  "upgradeUrl": "/subscription"
}
```

---

## 📝 Examples

### Chat with AI Assistant

```bash
curl -X POST https://voyage-smart.vercel.app/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I pack for a week in Rome in July?",
    "tripId": "YOUR_TRIP_ID",
    "context": {
      "includeItinerary": true
    }
  }'
```

### Generate Activities for a Day

```bash
curl -X POST https://voyage-smart.vercel.app/api/ai/generate-activities \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "YOUR_TRIP_ID",
    "preferences": {
      "interests": ["culture", "food"],
      "budget": "medium",
      "pace": "relaxed"
    },
    "constraints": {
      "startDate": "2024-07-15",
      "endDate": "2024-07-15",
      "dailyBudget": 100
    }
  }'
```

---

## 🔗 Related APIs

- **[Trips API](./trips.md)** - Manage trips
- **[Activities API](./activities.md)** - Manage activities
- **[Authentication API](./authentication.md)** - User authentication

---

<div align="center">
  <p>
    <a href="./expenses.md">← Back to Expenses API</a> •
    <a href="./README.md">Back to API Overview</a>
  </p>
</div>
