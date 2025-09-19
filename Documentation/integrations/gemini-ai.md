# Gemini AI Integration

## Overview

Google's Gemini AI powers VoyageSmart's intelligent features, providing natural language processing, trip recommendations, itinerary generation, and conversational assistance. This integration enables users to interact with their travel plans using natural language and receive AI-powered suggestions.

## Setup and Configuration

### Environment Variables

```bash
# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_AI_DEFAULT_PROVIDER=gemini
GEMINI_MODEL=gemini-pro
GEMINI_VISION_MODEL=gemini-pro-vision
```

### Installation

```bash
npm install @google/generative-ai
```

### Basic Setup

```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export class GeminiService {
  private model: any;
  private visionModel: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async generateContentWithImage(prompt: string, imageData: string): Promise<string> {
    try {
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini vision error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async generateStream(prompt: string): Promise<AsyncIterable<string>> {
    try {
      const result = await this.model.generateContentStream(prompt);
      
      async function* streamGenerator() {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          yield chunkText;
        }
      }

      return streamGenerator();
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw new Error('Failed to generate streaming content');
    }
  }
}
```

## AI Assistant Implementation

### Chat Service

```typescript
// lib/ai/chatService.ts
import { GeminiService } from './gemini';
import { Trip, Activity, Expense } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tripId?: string;
  context?: any;
}

export interface ChatContext {
  trip?: Trip;
  activities?: Activity[];
  expenses?: Expense[];
  userPreferences?: any;
  currentLocation?: string;
}

export class ChatService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async sendMessage(
    message: string,
    context: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const prompt = this.buildPrompt(message, context, conversationHistory);
    return await this.geminiService.generateContent(prompt);
  }

  async sendStreamingMessage(
    message: string,
    context: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<AsyncIterable<string>> {
    const prompt = this.buildPrompt(message, context, conversationHistory);
    return await this.geminiService.generateStream(prompt);
  }

  private buildPrompt(
    message: string,
    context: ChatContext,
    history: ChatMessage[]
  ): string {
    let prompt = `You are VoyageSmart AI, a helpful travel planning assistant. You help users plan trips, manage expenses, find activities, and answer travel-related questions.

Current Context:`;

    if (context.trip) {
      prompt += `
Trip: ${context.trip.name}
Destination: ${context.trip.destination}
Dates: ${context.trip.start_date} to ${context.trip.end_date}
Budget: ${context.trip.budget} ${context.trip.currency}`;
    }

    if (context.activities && context.activities.length > 0) {
      prompt += `
Planned Activities:
${context.activities.map(a => `- ${a.title} (${a.date} at ${a.start_time})`).join('\n')}`;
    }

    if (context.expenses && context.expenses.length > 0) {
      const totalExpenses = context.expenses.reduce((sum, e) => sum + e.amount, 0);
      prompt += `
Expenses: ${totalExpenses} ${context.trip?.currency || 'USD'} spent so far`;
    }

    if (context.currentLocation) {
      prompt += `
Current Location: ${context.currentLocation}`;
    }

    if (history.length > 0) {
      prompt += `

Conversation History:
${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}`;
    }

    prompt += `

User Message: ${message}

Please provide a helpful, accurate, and contextual response. If suggesting activities, include practical details like timing, cost estimates, and booking information when relevant. Format your response clearly with bullet points or numbered lists when appropriate.`;

    return prompt;
  }
}
```

### Itinerary Generation

```typescript
// lib/ai/itineraryGenerator.ts
import { GeminiService } from './gemini';
import { Trip, Activity } from '@/types';

export interface ItineraryPreferences {
  interests: string[];
  budgetLevel: 'low' | 'medium' | 'high';
  pace: 'relaxed' | 'moderate' | 'packed';
  groupSize: number;
  mobility?: string;
  dietary?: string[];
  avoid?: string[];
}

export interface GeneratedItinerary {
  days: {
    date: string;
    activities: Partial<Activity>[];
  }[];
  summary: {
    totalActivities: number;
    estimatedCost: number;
    recommendations: string[];
  };
}

export class ItineraryGenerator {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async generateItinerary(
    trip: Trip,
    preferences: ItineraryPreferences
  ): Promise<GeneratedItinerary> {
    const prompt = this.buildItineraryPrompt(trip, preferences);
    const response = await this.geminiService.generateContent(prompt);
    
    try {
      return this.parseItineraryResponse(response, trip);
    } catch (error) {
      console.error('Failed to parse itinerary response:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  private buildItineraryPrompt(trip: Trip, preferences: ItineraryPreferences): string {
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return `Generate a detailed ${days}-day itinerary for a trip to ${trip.destination}.

Trip Details:
- Destination: ${trip.destination}
- Start Date: ${trip.start_date}
- End Date: ${trip.end_date}
- Budget: ${trip.budget} ${trip.currency}
- Duration: ${days} days

Preferences:
- Interests: ${preferences.interests.join(', ')}
- Budget Level: ${preferences.budgetLevel}
- Pace: ${preferences.pace}
- Group Size: ${preferences.groupSize}
${preferences.mobility ? `- Mobility: ${preferences.mobility}` : ''}
${preferences.dietary?.length ? `- Dietary Restrictions: ${preferences.dietary.join(', ')}` : ''}
${preferences.avoid?.length ? `- Avoid: ${preferences.avoid.join(', ')}` : ''}

Please provide a JSON response with the following structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "title": "Activity Name",
          "description": "Brief description",
          "start_time": "HH:MM",
          "duration": 120,
          "location": {
            "name": "Location Name",
            "address": "Full Address"
          },
          "category": "sightseeing|food|culture|entertainment|shopping|nature",
          "estimated_cost": 25.00,
          "notes": "Additional tips or information"
        }
      ]
    }
  ],
  "summary": {
    "total_activities": 15,
    "estimated_total_cost": 450.00,
    "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
  }
}

Ensure activities are:
1. Realistic and well-timed
2. Appropriate for the group size and preferences
3. Within the specified budget range
4. Logically ordered by location and time
5. Include a mix of must-see attractions and local experiences

Provide only the JSON response, no additional text.`;
  }

  private parseItineraryResponse(response: string, trip: Trip): GeneratedItinerary {
    // Clean the response to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and transform the response
    const startDate = new Date(trip.start_date);
    
    return {
      days: parsed.days.map((day: any, index: number) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + index);
        
        return {
          date: dayDate.toISOString().split('T')[0],
          activities: day.activities.map((activity: any) => ({
            title: activity.title,
            description: activity.description,
            start_time: activity.start_time,
            duration: activity.duration || 120,
            location: activity.location,
            category: activity.category || 'sightseeing',
            cost: activity.estimated_cost || 0,
            notes: activity.notes
          }))
        };
      }),
      summary: {
        totalActivities: parsed.summary.total_activities || 0,
        estimatedCost: parsed.summary.estimated_total_cost || 0,
        recommendations: parsed.summary.recommendations || []
      }
    };
  }
}
```

### Smart Recommendations

```typescript
// lib/ai/recommendationService.ts
import { GeminiService } from './gemini';
import { Trip, Activity, Expense } from '@/types';

export interface RecommendationRequest {
  type: 'restaurant' | 'activity' | 'accommodation' | 'transportation';
  location: string;
  preferences?: string[];
  budget?: number;
  timeOfDay?: string;
  duration?: number;
}

export interface Recommendation {
  title: string;
  description: string;
  category: string;
  estimatedCost: number;
  rating?: number;
  location: {
    name: string;
    address: string;
  };
  tips: string[];
  bookingInfo?: string;
}

export class RecommendationService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async getRecommendations(
    request: RecommendationRequest,
    context?: { trip?: Trip; currentActivities?: Activity[] }
  ): Promise<Recommendation[]> {
    const prompt = this.buildRecommendationPrompt(request, context);
    const response = await this.geminiService.generateContent(prompt);
    
    try {
      return this.parseRecommendations(response);
    } catch (error) {
      console.error('Failed to parse recommendations:', error);
      return [];
    }
  }

  async getPersonalizedSuggestions(
    trip: Trip,
    userHistory: { activities: Activity[]; expenses: Expense[] }
  ): Promise<string[]> {
    const prompt = `Based on the user's travel history and current trip, provide 5 personalized suggestions.

Current Trip:
- Destination: ${trip.destination}
- Dates: ${trip.start_date} to ${trip.end_date}
- Budget: ${trip.budget} ${trip.currency}

User's Previous Activities:
${userHistory.activities.slice(-10).map(a => `- ${a.title} (${a.category})`).join('\n')}

User's Spending Patterns:
- Average expense: ${userHistory.expenses.reduce((sum, e) => sum + e.amount, 0) / userHistory.expenses.length}
- Common categories: ${this.getTopCategories(userHistory.expenses)}

Provide 5 specific, actionable suggestions that match their interests and budget. Format as a simple list.`;

    const response = await this.geminiService.generateContent(prompt);
    return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
  }

  private buildRecommendationPrompt(
    request: RecommendationRequest,
    context?: { trip?: Trip; currentActivities?: Activity[] }
  ): string {
    let prompt = `Recommend ${request.type}s in ${request.location}.

Requirements:
- Type: ${request.type}
- Location: ${request.location}`;

    if (request.preferences?.length) {
      prompt += `\n- Preferences: ${request.preferences.join(', ')}`;
    }

    if (request.budget) {
      prompt += `\n- Budget: Around ${request.budget}`;
    }

    if (request.timeOfDay) {
      prompt += `\n- Time: ${request.timeOfDay}`;
    }

    if (request.duration) {
      prompt += `\n- Duration: ${request.duration} minutes`;
    }

    if (context?.trip) {
      prompt += `\n\nTrip Context:
- Destination: ${context.trip.destination}
- Trip Budget: ${context.trip.budget} ${context.trip.currency}`;
    }

    if (context?.currentActivities?.length) {
      prompt += `\n\nAlready Planned:
${context.currentActivities.map(a => `- ${a.title}`).join('\n')}`;
    }

    prompt += `

Provide 3-5 recommendations in JSON format:
[
  {
    "title": "Name",
    "description": "Brief description",
    "category": "specific category",
    "estimated_cost": 25.00,
    "rating": 4.5,
    "location": {
      "name": "Location Name",
      "address": "Full Address"
    },
    "tips": ["Tip 1", "Tip 2"],
    "booking_info": "How to book or visit"
  }
]

Focus on highly-rated, authentic local experiences that match the preferences and budget.`;

    return prompt;
  }

  private parseRecommendations(response: string): Recommendation[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((rec: any) => ({
        title: rec.title,
        description: rec.description,
        category: rec.category,
        estimatedCost: rec.estimated_cost || 0,
        rating: rec.rating,
        location: rec.location,
        tips: rec.tips || [],
        bookingInfo: rec.booking_info
      }));
    } catch (error) {
      console.error('Failed to parse recommendations JSON:', error);
      return [];
    }
  }

  private getTopCategories(expenses: Expense[]): string {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)
      .join(', ');
  }
}
```

## React Components

### AI Chat Component

```typescript
// components/ai/AIChat.tsx
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatService, ChatMessage, ChatContext } from '@/lib/ai/chatService';

interface AIChatProps {
  context: ChatContext;
  onSuggestionSelect?: (suggestion: any) => void;
}

export function AIChat({ context, onSuggestionSelect }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatService = useRef(new ChatService());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your VoyageSmart AI assistant. I can help you with trip planning, activity suggestions, expense management, and travel advice. ${context.trip ? `I see you're planning a trip to ${context.trip.destination}. ` : ''}How can I assist you today?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      tripId: context.trip?.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        tripId: context.trip?.id
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(true);

      // Get streaming response
      const stream = await chatService.current.sendStreamingMessage(
        input,
        context,
        messages
      );

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }

      setIsStreaming(false);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                  {isStreaming && message.role === 'assistant' && message.content && (
                    <span className="animate-pulse">▋</span>
                  )}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your trip..."
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

### Gemini Error Types

```typescript
// lib/errors/geminiErrors.ts
export class GeminiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export function handleGeminiError(error: any): GeminiError {
  if (error.message?.includes('API key')) {
    return new GeminiError('Invalid Gemini API key', 'INVALID_API_KEY', 401);
  }
  
  if (error.message?.includes('quota')) {
    return new GeminiError('Gemini API quota exceeded', 'QUOTA_EXCEEDED', 429);
  }
  
  if (error.message?.includes('safety')) {
    return new GeminiError('Content blocked by safety filters', 'SAFETY_BLOCK', 400);
  }

  return new GeminiError(error.message || 'Unknown Gemini error');
}
```

## Usage Tracking

### AI Usage Monitor

```typescript
// lib/ai/usageTracker.ts
export class AIUsageTracker {
  async trackUsage(
    userId: string,
    feature: string,
    tokensUsed: number,
    cost: number
  ): Promise<void> {
    // Track AI usage for billing and analytics
    await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        feature,
        tokens_used: tokensUsed,
        cost,
        timestamp: new Date().toISOString()
      });
  }

  async getUserUsage(userId: string, period: 'day' | 'month' = 'month'): Promise<{
    totalTokens: number;
    totalCost: number;
    remainingTokens: number;
  }> {
    const startDate = new Date();
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 1);
    }

    const { data } = await supabase
      .from('ai_usage')
      .select('tokens_used, cost')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());

    const totalTokens = data?.reduce((sum, usage) => sum + usage.tokens_used, 0) || 0;
    const totalCost = data?.reduce((sum, usage) => sum + usage.cost, 0) || 0;

    // Get user's subscription limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();

    const limits = {
      free: 0,
      premium: 0,
      ai: 1000
    };

    const limit = limits[subscription?.tier as keyof typeof limits] || 0;
    const remainingTokens = Math.max(0, limit - totalTokens);

    return {
      totalTokens,
      totalCost,
      remainingTokens
    };
  }
}
```

## Best Practices

### Gemini Integration Guidelines

1. **Prompt Engineering**
   - Be specific and clear in prompts
   - Provide context and examples
   - Use structured output formats (JSON)
   - Handle edge cases in responses

2. **Performance Optimization**
   - Use streaming for long responses
   - Implement response caching
   - Optimize prompt length
   - Monitor token usage

3. **Error Handling**
   - Implement retry logic
   - Handle rate limits gracefully
   - Provide fallback responses
   - Log errors for debugging

4. **Security**
   - Validate all inputs
   - Sanitize outputs
   - Implement content filtering
   - Monitor for abuse

5. **User Experience**
   - Show loading states
   - Provide typing indicators
   - Enable conversation history
   - Allow response regeneration
