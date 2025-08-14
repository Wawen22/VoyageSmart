# Gemini AI Integration

<div align="center">
  <h3>🤖 AI-Powered Travel Intelligence</h3>
  <p>Complete guide to integrating Google's Gemini AI for intelligent travel planning features.</p>
</div>

---

## 🧠 Overview

VoyageSmart leverages Google's Gemini AI to provide intelligent travel planning assistance, automated itinerary generation, and personalized travel recommendations. This integration powers the AI Assistant and various smart features throughout the platform.

### Key Features

- **Conversational AI Assistant** - Natural language travel planning assistance
- **Intelligent Itinerary Generation** - Automated activity suggestions and scheduling
- **Smart Expense Analysis** - AI-powered expense categorization and insights
- **Personalized Recommendations** - Context-aware travel suggestions
- **Route Optimization** - Intelligent travel route planning
- **Content Generation** - Travel descriptions and recommendations

---

## 🔧 Setup & Configuration

### Google AI Studio Setup

1. **Create Google AI Project**
   - Visit [Google AI Studio](https://aistudio.google.com)
   - Create a new project
   - Enable Gemini API access

2. **Generate API Key**
   ```bash
   # Get your API key from Google AI Studio
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Configure Rate Limits**
   ```javascript
   // Rate limiting configuration
   {
     requestsPerMinute: 60,
     requestsPerDay: 1500,
     tokensPerMinute: 32000,
     tokensPerDay: 50000
   }
   ```

### Environment Variables

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.7

# Feature Flags
ENABLE_AI_ASSISTANT=true
ENABLE_AI_ITINERARY_GENERATION=true
ENABLE_AI_EXPENSE_ANALYSIS=true
```

---

## 💻 Implementation

### Gemini Client Setup

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});

export async function generateAIResponse(prompt: string, context?: any) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Failed to generate AI response');
  }
}
```

### AI Assistant Implementation

```typescript
// pages/api/ai/chat.ts
import { geminiModel } from '../../../lib/gemini';
import { getTripContext } from '../../../lib/trip-context';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, tripId, context } = req.body;
    const userId = req.user.id;

    // Get trip context if provided
    let tripContext = '';
    if (tripId) {
      const trip = await getTripContext(tripId, userId);
      tripContext = formatTripContext(trip, context);
    }

    // Create AI prompt
    const prompt = createChatPrompt(message, tripContext);

    // Generate AI response
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse response for suggestions
    const suggestions = extractSuggestions(aiResponse);

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        suggestions,
        metadata: {
          responseTime: Date.now() - startTime,
          tokensUsed: result.response.usageMetadata?.totalTokenCount,
          contextUsed: {
            tripId,
            contextType: context
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function createChatPrompt(message: string, tripContext: string): string {
  return `
You are VoyageSmart's AI travel assistant. You help users plan amazing trips with personalized recommendations and practical advice.

${tripContext ? `TRIP CONTEXT:\n${tripContext}\n` : ''}

USER MESSAGE: ${message}

Please provide a helpful, friendly response with:
1. Direct answer to the user's question
2. Practical travel advice
3. Specific recommendations when appropriate
4. Actionable suggestions they can implement

Format your response in markdown with emojis for better readability.
If you suggest activities, restaurants, or places, include practical details like:
- Location/address
- Estimated cost
- Best time to visit
- Booking requirements

Keep responses concise but informative (max 500 words).
`;
}
```

### Itinerary Generation

```typescript
// lib/ai/itinerary-generator.ts
export async function generateItinerary(params: ItineraryParams) {
  const {
    destination,
    startDate,
    endDate,
    preferences,
    constraints,
    budget
  } = params;

  const prompt = `
Generate a detailed travel itinerary for:

DESTINATION: ${destination}
DATES: ${startDate} to ${endDate}
BUDGET: ${budget} per day
INTERESTS: ${preferences.interests.join(', ')}
PACE: ${preferences.pace}
GROUP TYPE: ${preferences.groupType}

CONSTRAINTS:
- Daily budget: ${constraints.dailyBudget}
- Mobility: ${constraints.mobility}
- Dietary restrictions: ${constraints.dietaryRestrictions?.join(', ') || 'None'}

Please create a day-by-day itinerary with:
1. 3-4 activities per day
2. Realistic timing and travel between locations
3. Mix of must-see attractions and local experiences
4. Restaurant recommendations for meals
5. Estimated costs for each activity
6. Practical tips and booking information

Format as JSON with this structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "name": "Activity name",
          "type": "sightseeing|food|culture|nature|entertainment",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "location": "Full address",
          "coordinates": {"lat": 0, "lng": 0},
          "estimatedCost": 0,
          "description": "Brief description",
          "tips": "Practical advice"
        }
      ]
    }
  ],
  "summary": {
    "totalActivities": 0,
    "totalEstimatedCost": 0,
    "highlights": ["Top recommendations"]
  }
}
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Fallback: try to parse the entire response
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to generate itinerary:', error);
    throw new Error('Failed to generate itinerary');
  }
}
```

---

## 🎯 AI Features Implementation

### Smart Expense Analysis

```typescript
// lib/ai/expense-analyzer.ts
export async function analyzeExpenses(expenses: Expense[]) {
  const expenseData = expenses.map(e => ({
    description: e.description,
    amount: e.amount,
    category: e.category,
    date: e.date
  }));

  const prompt = `
Analyze these travel expenses and provide insights:

EXPENSES:
${JSON.stringify(expenseData, null, 2)}

Please provide:
1. Spending patterns analysis
2. Budget optimization suggestions
3. Category breakdown insights
4. Unusual or noteworthy expenses
5. Cost-saving recommendations

Format as JSON:
{
  "insights": {
    "totalSpent": 0,
    "averageDaily": 0,
    "topCategories": [{"category": "", "amount": 0, "percentage": 0}],
    "patterns": ["Pattern descriptions"],
    "recommendations": ["Cost-saving suggestions"]
  },
  "alerts": [
    {
      "type": "warning|info|success",
      "message": "Alert message",
      "suggestion": "Actionable suggestion"
    }
  ]
}
`;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}
```

### Route Optimization

```typescript
// lib/ai/route-optimizer.ts
export async function optimizeRoute(activities: Activity[], options: RouteOptions) {
  const prompt = `
Optimize the route for these activities to minimize travel time:

ACTIVITIES:
${activities.map(a => `
- ${a.name} at ${a.location}
  Time: ${a.startTime} - ${a.endTime}
  Coordinates: ${a.coordinates?.lat}, ${a.coordinates?.lng}
`).join('\n')}

CONSTRAINTS:
- Transportation: ${options.transportMode}
- Start location: ${options.startLocation}
- End location: ${options.endLocation}
- Break duration: ${options.breakDuration} minutes

Optimize for minimal travel time while respecting:
1. Activity time preferences
2. Logical flow between locations
3. Meal times and breaks
4. Transportation availability

Return optimized route as JSON:
{
  "optimizedRoute": [
    {
      "order": 1,
      "activity": {...},
      "suggestedTime": "HH:MM-HH:MM",
      "travelFromPrevious": {
        "duration": 0,
        "distance": "X km",
        "mode": "walking|driving|transit"
      }
    }
  ],
  "summary": {
    "totalTravelTime": 0,
    "totalDistance": "X km",
    "optimizationScore": 85,
    "timeSaved": 0
  }
}
`;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}
```

---

## 🔒 Security & Rate Limiting

### API Key Security

```typescript
// lib/ai/security.ts
export class AISecurityManager {
  private static instance: AISecurityManager;
  private requestCounts = new Map<string, number>();
  private lastReset = Date.now();

  static getInstance() {
    if (!this.instance) {
      this.instance = new AISecurityManager();
    }
    return this.instance;
  }

  async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const hoursSinceReset = (now - this.lastReset) / (1000 * 60 * 60);

    // Reset counters every hour
    if (hoursSinceReset >= 1) {
      this.requestCounts.clear();
      this.lastReset = now;
    }

    const userRequests = this.requestCounts.get(userId) || 0;
    const userLimit = await this.getUserLimit(userId);

    if (userRequests >= userLimit) {
      return false;
    }

    this.requestCounts.set(userId, userRequests + 1);
    return true;
  }

  private async getUserLimit(userId: string): Promise<number> {
    // Check user subscription level
    const subscription = await getUserSubscription(userId);
    
    switch (subscription?.plan) {
      case 'ai-assistant':
        return 50; // 50 requests per hour
      case 'premium':
        return 200; // 200 requests per hour
      default:
        return 10; // 10 requests per hour for free users
    }
  }
}
```

### Input Sanitization

```typescript
// lib/ai/sanitization.ts
export function sanitizeAIInput(input: string): string {
  // Remove potentially harmful content
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  // Limit input length
  if (sanitized.length > 2000) {
    return sanitized.substring(0, 2000) + '...';
  }

  return sanitized;
}

export function validateAIRequest(request: any): boolean {
  // Validate request structure
  if (!request.message || typeof request.message !== 'string') {
    return false;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /jailbreak/i,
    /pretend you are/i
  ];

  return !suspiciousPatterns.some(pattern => 
    pattern.test(request.message)
  );
}
```

---

## 📊 Monitoring & Analytics

### AI Usage Tracking

```typescript
// lib/ai/analytics.ts
export async function trackAIUsage(event: AIEvent) {
  await analytics.track('AI Usage', {
    feature: event.feature,
    userId: event.userId,
    tokensUsed: event.tokensUsed,
    responseTime: event.responseTime,
    success: event.success,
    errorType: event.error?.type,
    timestamp: new Date().toISOString()
  });

  // Store in database for detailed analysis
  await supabase.from('ai_usage_logs').insert({
    user_id: event.userId,
    feature: event.feature,
    tokens_used: event.tokensUsed,
    response_time_ms: event.responseTime,
    success: event.success,
    error_message: event.error?.message,
    created_at: new Date().toISOString()
  });
}
```

### Performance Monitoring

```typescript
// lib/ai/monitoring.ts
export class AIPerformanceMonitor {
  static async measureAICall<T>(
    operation: () => Promise<T>,
    metadata: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      await this.logSuccess(metadata, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logError(metadata, duration, error);
      throw error;
    }
  }

  private static async logSuccess(metadata: any, duration: number) {
    console.log(`AI operation successful: ${metadata.feature} (${duration}ms)`);
    // Log to monitoring service
  }

  private static async logError(metadata: any, duration: number, error: any) {
    console.error(`AI operation failed: ${metadata.feature} (${duration}ms)`, error);
    // Log to error tracking service
  }
}
```

---

## 🧪 Testing AI Features

### Mock AI Responses

```typescript
// test-utils/ai-mocks.ts
export const mockAIResponses = {
  chat: {
    success: "Great question! Here are some recommendations for Rome...",
    error: "I'm sorry, I couldn't process that request right now."
  },
  itinerary: {
    success: {
      days: [
        {
          date: "2024-07-16",
          activities: [
            {
              name: "Visit Colosseum",
              type: "sightseeing",
              startTime: "09:00",
              endTime: "11:00",
              location: "Piazza del Colosseo, 1, Rome",
              estimatedCost: 25
            }
          ]
        }
      ]
    }
  }
};

export function mockGeminiAPI() {
  jest.mock('../lib/gemini', () => ({
    generateAIResponse: jest.fn().mockResolvedValue(
      mockAIResponses.chat.success
    ),
    generateItinerary: jest.fn().mockResolvedValue(
      mockAIResponses.itinerary.success
    )
  }));
}
```

### AI Feature Tests

```typescript
// __tests__/ai/chat.test.ts
import { mockGeminiAPI } from '../../test-utils/ai-mocks';

describe('AI Chat Feature', () => {
  beforeEach(() => {
    mockGeminiAPI();
  });

  it('should generate appropriate travel advice', async () => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What should I see in Rome?",
        tripId: "test-trip-id"
      })
    });

    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.response).toContain('Rome');
    expect(data.data.suggestions).toBeDefined();
  });
});
```

---

## 🔗 Related Documentation

- **[API Endpoints](../api/ai-endpoints.md)** - AI API reference
- **[Security Guidelines](../development/security-implementations.md)** - AI security practices
- **[Testing Guide](../development/testing.md)** - Testing AI features

---

<div align="center">
  <p>
    <a href="./stripe.md">← Back to Stripe</a> •
    <a href="./README.md">Back to Integrations Overview</a>
  </p>
</div>
