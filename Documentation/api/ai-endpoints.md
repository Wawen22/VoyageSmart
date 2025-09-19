# AI Endpoints

## Overview

The AI Endpoints provide access to VoyageSmart's artificial intelligence capabilities, including conversational AI, trip planning assistance, smart recommendations, and automated content generation. These endpoints leverage Google Gemini, OpenAI, and custom machine learning models.

## Base Endpoint

```
/api/ai
```

## Authentication

All AI endpoints require authentication and may have subscription-based access controls:

```http
Authorization: Bearer <jwt-token>
X-Subscription-Tier: ai-assistant
```

## Rate Limiting

AI endpoints have specific rate limits based on subscription tier:

- **Free Tier**: 0 requests per month
- **Premium Tier**: 0 requests per month  
- **AI Assistant Tier**: 1000 requests per month

## AI Assistant Endpoints

### POST /api/ai/chat

Send a message to the AI assistant and receive a conversational response.

**Request Body:**
```json
{
  "message": "What are the best restaurants in Paris for dinner?",
  "context": {
    "trip_id": "trip-uuid",
    "conversation_id": "conv-uuid",
    "user_preferences": {
      "cuisine": ["french", "italian"],
      "budget": "medium",
      "dietary_restrictions": ["vegetarian"]
    }
  },
  "options": {
    "include_suggestions": true,
    "max_tokens": 500,
    "temperature": 0.7
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "Based on your preferences for vegetarian-friendly restaurants in Paris, I'd recommend these excellent options for dinner:\n\n**L'As du Fallafel** - Famous for their incredible falafel in the Marais district...",
    "conversation_id": "conv-uuid",
    "message_id": "msg-uuid",
    "suggestions": [
      {
        "type": "restaurant",
        "title": "L'As du Fallafel",
        "description": "Famous falafel restaurant in Le Marais",
        "location": {
          "name": "L'As du Fallafel",
          "address": "34 Rue des Rosiers, 75004 Paris",
          "coordinates": { "lat": 48.8571, "lng": 2.3594 }
        },
        "metadata": {
          "cuisine": "middle_eastern",
          "price_range": "€",
          "rating": 4.5,
          "vegetarian_friendly": true
        }
      }
    ],
    "context_used": {
      "trip_data": true,
      "user_preferences": true,
      "location": "Paris, France",
      "conversation_history": 3
    },
    "usage": {
      "tokens_used": 245,
      "model": "gemini-2.5-flash",
      "processing_time": 1.2
    }
  }
}
```

**Error Responses:**
```json
// Rate limit exceeded
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": {
    "limit": 1000,
    "used": 1000,
    "reset_date": "2024-02-01T00:00:00Z"
  }
}

// Subscription required
{
  "success": false,
  "error": "AI Assistant subscription required",
  "details": {
    "current_tier": "premium",
    "required_tier": "ai-assistant",
    "upgrade_url": "/pricing"
  }
}
```

### GET /api/ai/conversations

Retrieve conversation history for the current user.

**Query Parameters:**
- `trip_id` (string, optional) - Filter by specific trip
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `start_date` (ISO date, optional) - Filter conversations after date
- `end_date` (ISO date, optional) - Filter conversations before date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid",
      "trip_id": "trip-uuid",
      "title": "Restaurant recommendations in Paris",
      "message_count": 5,
      "last_message_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:00:00Z",
      "preview": "What are the best restaurants in Paris..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### GET /api/ai/conversations/[id]

Retrieve detailed conversation history.

**Path Parameters:**
- `id` (string) - Conversation UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "conv-uuid",
    "trip_id": "trip-uuid",
    "title": "Restaurant recommendations in Paris",
    "messages": [
      {
        "id": "msg-uuid-1",
        "role": "user",
        "content": "What are the best restaurants in Paris for dinner?",
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "id": "msg-uuid-2",
        "role": "assistant",
        "content": "Based on your preferences...",
        "timestamp": "2024-01-15T10:00:15Z",
        "suggestions": [...],
        "metadata": {
          "model": "gemini-2.5-flash",
          "tokens": 245
        }
      }
    ],
    "context": {
      "trip_data": {...},
      "user_preferences": {...}
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### DELETE /api/ai/conversations/[id]

Delete a conversation and all its messages.

**Path Parameters:**
- `id` (string) - Conversation UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

## Trip Planning Endpoints

### POST /api/ai/generate-itinerary

Generate an AI-powered itinerary for a trip.

**Request Body:**
```json
{
  "trip_id": "trip-uuid",
  "preferences": {
    "interests": ["culture", "food", "history"],
    "activity_level": "medium",
    "budget_per_day": 150,
    "group_size": 2,
    "accommodation_type": "hotel",
    "transportation_mode": "public_transport"
  },
  "constraints": {
    "mobility_requirements": [],
    "dietary_restrictions": ["vegetarian"],
    "time_constraints": [
      {
        "date": "2024-06-16",
        "unavailable_times": ["09:00-11:00"]
      }
    ]
  },
  "options": {
    "include_alternatives": true,
    "optimize_for": "time", // or "cost" or "experience"
    "detail_level": "high"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "itinerary_id": "itinerary-uuid",
    "trip_id": "trip-uuid",
    "generated_at": "2024-01-15T10:30:00Z",
    "days": [
      {
        "date": "2024-06-15",
        "theme": "Arrival and Orientation",
        "activities": [
          {
            "id": "activity-uuid-1",
            "title": "Arrive at Charles de Gaulle Airport",
            "description": "Land at CDG and take RER B to central Paris",
            "start_time": "14:00",
            "duration": 90,
            "category": "transportation",
            "location": {
              "name": "Charles de Gaulle Airport",
              "address": "95700 Roissy-en-France",
              "coordinates": { "lat": 49.0097, "lng": 2.5479 }
            },
            "cost_estimate": {
              "amount": 12.50,
              "currency": "EUR",
              "per_person": true
            },
            "ai_reasoning": "Efficient and cost-effective way to reach central Paris",
            "alternatives": [
              {
                "title": "Taxi to hotel",
                "cost": 55.00,
                "duration": 45,
                "pros": ["Faster", "Direct"],
                "cons": ["More expensive", "Traffic dependent"]
              }
            ]
          }
        ],
        "daily_cost": 85.50,
        "travel_time": 120,
        "walking_distance": 2.5
      }
    ],
    "summary": {
      "total_activities": 25,
      "total_cost": 1275.00,
      "total_duration": 10,
      "optimization_score": 0.87,
      "confidence": 0.92
    },
    "alternatives": [
      {
        "title": "Budget-focused itinerary",
        "description": "Emphasizes free activities and budget dining",
        "cost_difference": -450.00,
        "activity_changes": 8
      }
    ],
    "ai_notes": [
      "Itinerary optimized for cultural experiences",
      "Weather considerations included for outdoor activities",
      "Restaurant reservations recommended for dinner spots"
    ]
  }
}
```

### POST /api/ai/optimize-itinerary

Optimize an existing itinerary using AI.

**Request Body:**
```json
{
  "trip_id": "trip-uuid",
  "optimization_goals": ["minimize_travel_time", "reduce_costs", "maximize_experiences"],
  "constraints": {
    "fixed_activities": ["activity-uuid-1", "activity-uuid-5"],
    "time_windows": [
      {
        "activity_id": "activity-uuid-3",
        "preferred_time": "morning"
      }
    ]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "optimization_id": "opt-uuid",
    "original_score": 0.72,
    "optimized_score": 0.89,
    "improvements": [
      {
        "type": "reorder_activities",
        "description": "Reordered Day 2 activities to reduce travel time",
        "impact": "Saved 45 minutes of travel time"
      },
      {
        "type": "activity_substitution",
        "description": "Suggested alternative restaurant with better reviews",
        "impact": "Improved experience rating by 0.8 points"
      }
    ],
    "changes": [
      {
        "activity_id": "activity-uuid-2",
        "change_type": "time_update",
        "old_time": "14:00",
        "new_time": "11:00",
        "reason": "Better alignment with nearby activities"
      }
    ],
    "cost_impact": {
      "original_cost": 1275.00,
      "optimized_cost": 1195.00,
      "savings": 80.00
    }
  }
}
```

## Recommendation Endpoints

### GET /api/ai/recommendations

Get AI-powered recommendations based on user preferences and trip context.

**Query Parameters:**
- `trip_id` (string, optional) - Trip context for recommendations
- `type` (string) - Type of recommendations: `activities`, `restaurants`, `accommodations`, `destinations`
- `location` (string, optional) - Location for recommendations
- `budget` (string, optional) - Budget level: `low`, `medium`, `high`
- `limit` (number, default: 10, max: 50) - Number of recommendations

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec-uuid-1",
        "type": "restaurant",
        "title": "Le Comptoir du Relais",
        "description": "Authentic French bistro in Saint-Germain",
        "confidence": 0.94,
        "reasoning": "Matches your preference for authentic local cuisine and medium budget",
        "location": {
          "name": "Le Comptoir du Relais",
          "address": "9 Carrefour de l'Odéon, 75006 Paris",
          "coordinates": { "lat": 48.8506, "lng": 2.3387 }
        },
        "metadata": {
          "cuisine": "french",
          "price_range": "€€",
          "rating": 4.3,
          "review_count": 1247,
          "features": ["outdoor_seating", "wine_selection", "traditional_menu"]
        },
        "ai_insights": {
          "best_time_to_visit": "lunch or early dinner",
          "reservation_required": true,
          "popular_dishes": ["duck confit", "coq au vin"],
          "estimated_cost_per_person": 35
        }
      }
    ],
    "context": {
      "user_preferences": {
        "cuisine_preferences": ["french", "italian"],
        "budget_level": "medium",
        "dietary_restrictions": []
      },
      "trip_context": {
        "destination": "Paris, France",
        "travel_dates": ["2024-06-15", "2024-06-25"],
        "group_size": 2
      },
      "recommendation_factors": [
        "user_preference_match",
        "location_proximity",
        "review_quality",
        "price_appropriateness"
      ]
    },
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/ai/recommendation-feedback

Provide feedback on AI recommendations to improve future suggestions.

**Request Body:**
```json
{
  "recommendation_id": "rec-uuid-1",
  "feedback": {
    "rating": 4,
    "helpful": true,
    "used": true,
    "comments": "Great recommendation! The restaurant was exactly what we were looking for.",
    "aspects": {
      "accuracy": 5,
      "relevance": 4,
      "usefulness": 5
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "data": {
    "feedback_id": "feedback-uuid",
    "recommendation_id": "rec-uuid-1",
    "processed_at": "2024-01-15T10:30:00Z"
  }
}
```

## Content Generation Endpoints

### POST /api/ai/generate-description

Generate AI-powered descriptions for trips, activities, or other content.

**Request Body:**
```json
{
  "type": "activity_description",
  "input": {
    "title": "Visit Eiffel Tower",
    "location": "Paris, France",
    "category": "sightseeing",
    "duration": 120,
    "context": {
      "trip_theme": "romantic getaway",
      "time_of_day": "sunset"
    }
  },
  "options": {
    "tone": "enthusiastic",
    "length": "medium",
    "include_tips": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "generated_content": {
      "description": "Experience the magic of Paris with a sunset visit to the iconic Eiffel Tower. As the golden hour approaches, watch the City of Light transform before your eyes from the tower's observation decks. This 2-hour romantic adventure offers breathtaking panoramic views and unforgettable photo opportunities.",
      "tips": [
        "Book tickets in advance to avoid long queues",
        "Visit during sunset for the most romantic atmosphere",
        "Bring a camera for stunning photo opportunities",
        "Consider dining at one of the tower's restaurants"
      ],
      "highlights": [
        "360-degree views of Paris",
        "Romantic sunset timing",
        "Iconic landmark experience",
        "Perfect for couples"
      ]
    },
    "metadata": {
      "model": "gemini-2.5-flash",
      "generation_time": 0.8,
      "confidence": 0.91,
      "word_count": 67
    }
  }
}
```

### POST /api/ai/translate-content

Translate trip content using AI-powered translation.

**Request Body:**
```json
{
  "content": {
    "text": "Visit the beautiful Louvre Museum and see the Mona Lisa",
    "type": "activity_description"
  },
  "target_language": "fr",
  "options": {
    "preserve_formatting": true,
    "cultural_adaptation": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "translated_content": {
      "text": "Visitez le magnifique Musée du Louvre et admirez la Joconde",
      "language": "fr",
      "confidence": 0.96
    },
    "original": {
      "text": "Visit the beautiful Louvre Museum and see the Mona Lisa",
      "language": "en"
    },
    "metadata": {
      "model": "gemini-2.5-flash",
      "translation_time": 0.3,
      "cultural_adaptations": []
    }
  }
}
```

## Image Analysis Endpoints

### POST /api/ai/analyze-image

Analyze uploaded images for travel-related content.

**Request Body (multipart/form-data):**
```
image: [image file]
context: {
  "type": "receipt",
  "trip_id": "trip-uuid",
  "expected_content": "restaurant_receipt"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "type": "receipt",
      "confidence": 0.94,
      "extracted_data": {
        "merchant_name": "Le Petit Bistro",
        "date": "2024-06-16",
        "time": "19:30",
        "total_amount": 67.50,
        "currency": "EUR",
        "items": [
          {
            "name": "Coq au Vin",
            "quantity": 1,
            "price": 24.00
          },
          {
            "name": "Ratatouille",
            "quantity": 1,
            "price": 18.50
          },
          {
            "name": "Wine (Bordeaux)",
            "quantity": 1,
            "price": 25.00
          }
        ],
        "tax": 6.75,
        "tip": 0.00
      },
      "location": {
        "address": "15 Rue de la Paix, 75001 Paris",
        "coordinates": { "lat": 48.8698, "lng": 2.3314 }
      }
    },
    "suggestions": {
      "expense_category": "food",
      "split_suggestion": "equal",
      "tags": ["dinner", "french_cuisine", "romantic"]
    },
    "metadata": {
      "model": "gemini-vision-pro",
      "processing_time": 2.1,
      "image_size": "1024x768"
    }
  }
}
```

## Usage Analytics Endpoints

### GET /api/ai/usage

Get AI usage statistics for the current user.

**Query Parameters:**
- `period` (string) - Time period: `day`, `week`, `month`, `year`
- `start_date` (ISO date, optional) - Start date for custom period
- `end_date` (ISO date, optional) - End date for custom period

**Response (200):**
```json
{
  "success": true,
  "data": {
    "current_period": {
      "period": "month",
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "requests_used": 245,
      "requests_limit": 1000,
      "requests_remaining": 755
    },
    "usage_breakdown": {
      "chat": 180,
      "itinerary_generation": 25,
      "recommendations": 30,
      "image_analysis": 10
    },
    "cost_breakdown": {
      "total_cost": 12.45,
      "cost_by_model": {
        "gemini-2.5-flash": 8.20,
        "gemini-vision-pro": 4.25
      }
    },
    "trends": {
      "daily_average": 8.2,
      "peak_day": "2024-01-15",
      "peak_usage": 35
    }
  }
}
```

## Error Handling

### Common Error Codes

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request format",
  "details": {
    "message": "Message content is required",
    "field": "message"
  }
}
```

#### 402 Payment Required
```json
{
  "success": false,
  "error": "Subscription upgrade required",
  "details": {
    "current_tier": "premium",
    "required_tier": "ai-assistant",
    "feature": "AI chat",
    "upgrade_url": "/pricing"
  }
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": {
    "limit": 1000,
    "used": 1000,
    "reset_date": "2024-02-01T00:00:00Z",
    "retry_after": 3600
  }
}
```

#### 503 Service Unavailable
```json
{
  "success": false,
  "error": "AI service temporarily unavailable",
  "details": {
    "service": "gemini-2.5-flash",
    "estimated_recovery": "2024-01-15T11:00:00Z",
    "fallback_available": true
  }
}
```

## Best Practices

### Optimization Tips

1. **Context Management**: Provide relevant context for better responses
2. **Request Batching**: Combine related requests when possible
3. **Caching**: Cache responses for repeated queries
4. **Error Handling**: Implement robust error handling and fallbacks
5. **Rate Limiting**: Monitor usage to avoid hitting limits

### Security Considerations

1. **Input Validation**: Validate all input data
2. **Content Filtering**: Filter inappropriate content
3. **Privacy Protection**: Don't include sensitive information in requests
4. **Token Management**: Secure API token storage and rotation
5. **Audit Logging**: Log AI interactions for security monitoring
