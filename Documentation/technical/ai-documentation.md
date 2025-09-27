# AI Documentation

This document provides comprehensive technical documentation for VoyageSmart's AI features, including architecture, implementation details, and integration guidelines.

## Overview

VoyageSmart leverages advanced AI technologies to enhance the travel planning experience through intelligent recommendations, natural language processing, and automated assistance.

## AI Architecture

### Core Components

**AI Service Layer**
```
┌─────────────────────────────────────────┐
│              Frontend                   │
├─────────────────────────────────────────┤
│           API Gateway                   │
├─────────────────────────────────────────┤
│          AI Orchestrator                │
├─────────────────────────────────────────┤
│  ┌─────────────┬─────────────┬─────────┐ │
│  │ Gemini AI   │ OpenAI GPT  │ Custom  │ │
│  │ Service     │ Service     │ Models  │ │
│  └─────────────┴─────────────┴─────────┘ │
├─────────────────────────────────────────┤
│         Data Processing Layer           │
├─────────────────────────────────────────┤
│            Database Layer               │
└─────────────────────────────────────────┘
```

**AI Service Integration**
- **Primary**: Google Gemini AI for conversational AI
- **Secondary**: OpenAI GPT for specialized tasks
- **Custom Models**: Fine-tuned models for specific use cases
- **Fallback**: Rule-based systems for reliability

### Data Flow

**Request Processing**
1. User input received via API
2. Input validation and sanitization
3. Context enrichment with user data
4. AI service selection based on request type
5. Response generation and post-processing
6. Result caching and logging

**Context Management**
```typescript
interface AIContext {
  user_id: string;
  session_id: string;
  trip_context?: {
    trip_id: string;
    destination: string;
    dates: DateRange;
    travelers: number;
    budget: number;
  };
  conversation_history: Message[];
  user_preferences: UserPreferences;
  location_context?: LocationData;
}
```

## AI Services Implementation

### Gemini AI Integration

**Service Configuration**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
  }

  async generateResponse(prompt: string, context: AIContext): Promise<string> {
    try {
      const enrichedPrompt = this.buildPrompt(prompt, context);
      const result = await this.model.generateContent(enrichedPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini AI error:', error);
      throw new AIServiceError('Failed to generate response');
    }
  }

  private buildPrompt(userPrompt: string, context: AIContext): string {
    return `
      You are VoyageSmart's AI travel assistant. 
      
      User Context:
      - Trip: ${context.trip_context?.destination || 'Not specified'}
      - Dates: ${context.trip_context?.dates || 'Not specified'}
      - Budget: ${context.trip_context?.budget || 'Not specified'}
      - Travelers: ${context.trip_context?.travelers || 1}
      
      User Preferences:
      ${JSON.stringify(context.user_preferences, null, 2)}
      
      Conversation History:
      ${context.conversation_history.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}
      
      User Query: ${userPrompt}
      
      Provide helpful, accurate travel advice. Be concise but informative.
    `;
  }
}
```

### Custom Model Training

**Recommendation Model**
```python
# Training script for custom recommendation model
import tensorflow as tf
from sklearn.model_selection import train_test_split

class TravelRecommendationModel:
    def __init__(self):
        self.model = self.build_model()
    
    def build_model(self):
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(100,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(10, activation='softmax')  # 10 recommendation categories
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self, user_data, preferences, labels):
        X_train, X_test, y_train, y_test = train_test_split(
            user_data, labels, test_size=0.2, random_state=42
        )
        
        self.model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_data=(X_test, y_test),
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=10),
                tf.keras.callbacks.ModelCheckpoint('best_model.h5', save_best_only=True)
            ]
        )
```

## AI Features Implementation

### Conversational AI

**Chat Interface**
```typescript
// AI Chat API endpoint
export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();
    
    // Validate input
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Get user context
    const userContext = await getUserContext(context.user_id);
    
    // Process with AI
    const aiResponse = await aiOrchestrator.processMessage(message, {
      ...context,
      ...userContext
    });
    
    // Save conversation
    await saveConversation(context.user_id, message, aiResponse);
    
    return NextResponse.json({
      response: aiResponse,
      context: context
    });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
  }
}
```

**Message Processing**
```typescript
class AIOrchestrator {
  async processMessage(message: string, context: AIContext): Promise<string> {
    // Determine intent
    const intent = await this.classifyIntent(message);
    
    // Route to appropriate service
    switch (intent) {
      case 'recommendation':
        return await this.handleRecommendation(message, context);
      case 'expense_query':
        return await this.handleExpenseQuery(message, context);
      case 'itinerary_planning':
        return await this.handleItineraryPlanning(message, context);
      case 'general_travel':
        return await this.handleGeneralTravel(message, context);
      default:
        return await this.handleGeneral(message, context);
    }
  }
  
  private async classifyIntent(message: string): Promise<string> {
    // Use lightweight model for intent classification
    const classification = await this.intentClassifier.classify(message);
    return classification.intent;
  }
}
```

### Smart Recommendations

**Recommendation Engine**
```typescript
interface RecommendationRequest {
  user_id: string;
  trip_id?: string;
  category: 'accommodation' | 'activity' | 'restaurant' | 'transportation';
  location: {
    latitude: number;
    longitude: number;
    radius?: number;
  };
  preferences: UserPreferences;
  budget_range?: {
    min: number;
    max: number;
  };
}

class RecommendationEngine {
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    // Get base recommendations from database
    const baseRecommendations = await this.getBaseRecommendations(request);
    
    // Apply AI scoring
    const scoredRecommendations = await this.scoreRecommendations(
      baseRecommendations,
      request
    );
    
    // Apply filters and ranking
    const filteredRecommendations = this.applyFilters(
      scoredRecommendations,
      request
    );
    
    // Return top recommendations
    return filteredRecommendations.slice(0, 10);
  }
  
  private async scoreRecommendations(
    recommendations: BaseRecommendation[],
    request: RecommendationRequest
  ): Promise<ScoredRecommendation[]> {
    const scoringPromises = recommendations.map(async (rec) => {
      const score = await this.calculateAIScore(rec, request);
      return { ...rec, ai_score: score };
    });
    
    return Promise.all(scoringPromises);
  }
}
```

### Expense Categorization

**Smart Categorization**
```typescript
class ExpenseCategorizer {
  async categorizeExpense(expense: ExpenseInput): Promise<ExpenseCategory> {
    // Extract features from expense
    const features = this.extractFeatures(expense);
    
    // Use AI model for categorization
    const prediction = await this.categoryModel.predict(features);
    
    // Apply business rules
    const finalCategory = this.applyBusinessRules(prediction, expense);
    
    return {
      category: finalCategory,
      confidence: prediction.confidence,
      suggested_subcategory: prediction.subcategory
    };
  }
  
  private extractFeatures(expense: ExpenseInput): FeatureVector {
    return {
      merchant_name: expense.merchant,
      amount: expense.amount,
      location: expense.location,
      time_of_day: new Date(expense.date).getHours(),
      day_of_week: new Date(expense.date).getDay(),
      description_keywords: this.extractKeywords(expense.description)
    };
  }
}
```

## Performance Optimization

### Caching Strategy

**Multi-Level Caching**
```typescript
class AICache {
  private redis: Redis;
  private memoryCache: Map<string, any>;
  
  async get(key: string): Promise<any> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // Check Redis cache
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

**Response Caching**
```typescript
// Cache AI responses for similar queries
const getCacheKey = (message: string, context: AIContext): string => {
  const contextHash = crypto
    .createHash('md5')
    .update(JSON.stringify({
      trip_id: context.trip_context?.trip_id,
      user_preferences: context.user_preferences
    }))
    .digest('hex');
  
  const messageHash = crypto
    .createHash('md5')
    .update(message.toLowerCase().trim())
    .digest('hex');
  
  return `ai_response:${messageHash}:${contextHash}`;
};
```

### Rate Limiting

**AI Service Rate Limiting**
```typescript
class AIRateLimiter {
  private limits = new Map<string, RateLimit>();
  
  async checkLimit(userId: string, service: string): Promise<boolean> {
    const key = `${userId}:${service}`;
    const limit = this.limits.get(key) || this.createLimit();
    
    if (limit.requests >= limit.maxRequests) {
      const timeLeft = limit.resetTime - Date.now();
      if (timeLeft > 0) {
        throw new RateLimitError(`Rate limit exceeded. Try again in ${timeLeft}ms`);
      }
      // Reset limit
      limit.requests = 0;
      limit.resetTime = Date.now() + limit.windowMs;
    }
    
    limit.requests++;
    this.limits.set(key, limit);
    return true;
  }
  
  private createLimit(): RateLimit {
    return {
      requests: 0,
      maxRequests: 100, // 100 requests per hour
      windowMs: 60 * 60 * 1000,
      resetTime: Date.now() + (60 * 60 * 1000)
    };
  }
}
```

## Monitoring and Analytics

### AI Performance Metrics

**Metrics Collection**
```typescript
interface AIMetrics {
  response_time: number;
  token_usage: number;
  user_satisfaction: number;
  error_rate: number;
  cache_hit_rate: number;
  cost_per_request: number;
}

class AIMetricsCollector {
  async recordMetrics(
    service: string,
    operation: string,
    metrics: AIMetrics
  ): Promise<void> {
    await this.metricsDB.insert('ai_metrics', {
      service,
      operation,
      ...metrics,
      timestamp: new Date()
    });
    
    // Send to monitoring service
    await this.monitoringService.gauge('ai.response_time', metrics.response_time, {
      service,
      operation
    });
  }
}
```

### Error Handling

**AI Service Fallbacks**
```typescript
class AIServiceWithFallback {
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const services = [
      this.primaryService,
      this.secondaryService,
      this.fallbackService
    ];
    
    for (const service of services) {
      try {
        const response = await service.process(request);
        return response;
      } catch (error) {
        console.warn(`Service ${service.name} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All AI services unavailable');
  }
}
```

## Security Considerations

### Input Validation

**Prompt Injection Prevention**
```typescript
class PromptValidator {
  private dangerousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s*:\s*you\s+are/i,
    /\[INST\]/i,
    /<\|system\|>/i
  ];
  
  validateInput(input: string): boolean {
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(input)) {
        throw new SecurityError('Potentially malicious input detected');
      }
    }
    
    // Length validation
    if (input.length > 4000) {
      throw new ValidationError('Input too long');
    }
    
    return true;
  }
}
```

### Data Privacy

**PII Scrubbing**
```typescript
class PIIScrubber {
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
  };
  
  scrubPII(text: string): string {
    let scrubbed = text;
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      scrubbed = scrubbed.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
    }
    
    return scrubbed;
  }
}
```

## Deployment and Scaling

### Infrastructure

**AI Service Deployment**
```yaml
# docker-compose.yml for AI services
version: '3.8'
services:
  ai-orchestrator:
    build: ./ai-services
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
      - postgres
    
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=voyagesmart_ai
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
```

**Scaling Configuration**
```typescript
// Auto-scaling based on request volume
const scalingConfig = {
  minInstances: 2,
  maxInstances: 10,
  targetCPUUtilization: 70,
  targetMemoryUtilization: 80,
  scaleUpCooldown: 300, // 5 minutes
  scaleDownCooldown: 600 // 10 minutes
};
```

For additional AI implementation details, refer to the specific service documentation or contact the AI development team.
