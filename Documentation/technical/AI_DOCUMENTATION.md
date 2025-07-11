# AI Documentation

This document provides comprehensive documentation for the AI features implemented in VoyageSmart, including the Travel Assistant chatbot and the AI-powered Itinerary Generation Wizard.

## 📋 Table of Contents
- [Overview](#overview)
- [AI Travel Assistant](#ai-travel-assistant)
- [AI Itinerary Generation Wizard](#ai-itinerary-generation-wizard)
- [Technical Implementation](#technical-implementation)
- [Configuration](#configuration)
- [Usage Guidelines](#usage-guidelines)
- [Future Enhancements](#future-enhancements)

## 🤖 Overview

VoyageSmart integrates Google's Gemini AI to provide intelligent travel assistance and automated itinerary generation. The AI features are designed to enhance the user experience by providing personalized recommendations and automating repetitive tasks.

### Key Features
- **Travel Assistant Chatbot**: Context-aware conversational AI for trip-related queries
- **Itinerary Generation Wizard**: Automated activity generation based on user preferences
- **Trip Context Integration**: AI has access to complete trip information for relevant responses
- **Subscription-based Access**: AI features are available only to users with AI Assistant subscription

## 🗣️ AI Travel Assistant

### Features
- **Context-aware responses** based on current trip information
- **Trip-specific information** including accommodations, transportation, and itinerary
- **Natural language processing** for understanding user queries
- **Formatted responses** with proper structure and readability
- **Real-time trip data integration**

### Implementation Details

#### System Prompt
The AI assistant uses a comprehensive system prompt that includes:
- Role definition as a travel assistant
- Trip context (name, dates, participants)
- Accommodation details
- Transportation information
- Itinerary activities
- Response formatting guidelines

#### Context Integration
```typescript
// Trip context is dynamically built and includes:
- Trip basic information (name, dates, participants)
- Accommodations with locations and dates
- Transportation with routes and times (formatted with correct timezone)
- Itinerary activities organized by day (with local time formatting)
- Expense information (if relevant)
```

#### Timezone Handling
All timestamps from the database (TIMESTAMP WITH TIME ZONE) are properly converted to Italian local time (Europe/Rome timezone) before being displayed to users or passed to the AI. This ensures:
- Transportation times show correct local departure/arrival times
- Activity times respect Italian timezone (UTC+1 in winter, UTC+2 in summer)
- Consistent time display across all components

#### Response Formatting
- Clear separation between different types of information
- Use of asterisks (**) for emphasis
- Proper line breaks and lists for readability
- Concise initial responses with essential information
- **NEW**: Visual components for structured data display

#### Visual Components Integration
The AI Assistant now supports rich visual components that match the UI/UX of the original sections:

**Available Components:**
- `AITransportationCard` - Displays transportation with icons, routes, and times
- `AIItineraryView` - Shows itinerary organized by days with activities
- `AIAccommodationCard` - Displays accommodations with details and ratings
- `AIExpenseCard` - Shows expenses with category colors and split information
- `AIDataContainer` - Unified container for all data types

**Special Markers:**
The AI uses special markers to trigger visual components:
- `[AI_DATA:transportation]` or `[AI_DATA:transportation:3]` - Transportation data
- `[AI_DATA:itinerary]` or `[AI_DATA:itinerary:5]` - Itinerary data
- `[AI_DATA:accommodations]` or `[AI_DATA:accommodations:2]` - Accommodation data
- `[AI_DATA:expenses]` or `[AI_DATA:expenses:10]` - Expense data

**Intelligent Context Recognition:**
The AI automatically detects when users are discussing specific aspects of their trip and includes appropriate visual components without requiring explicit commands. The system is designed to be precise and avoid showing irrelevant components.

**Selective Recognition System:**
- Uses specific keyword matching to avoid false positives
- Implements anti-overlap logic to prevent multiple components from appearing together
- Prioritizes the most relevant component when multiple matches are detected
- Only activates when the user's intent is clearly focused on a specific data type

**Transportation Examples:**
- "A che ora parte il volo?" → Shows only transportation components
- "Come arriviamo a destinazione?" → Displays only transportation options
- "Orario di partenza del treno?" → Shows only relevant transport details

**Itinerary Examples:**
- "Cosa facciamo domani?" → Shows only next day's activities (limited to 1 day)
- "Programma del giorno?" → Displays only daily itinerary
- "Attività pianificate?" → Shows only planned activities

**Accommodation Examples:**
- "Dove dormiamo?" → Shows only accommodation details
- "Dettagli dell'hotel?" → Displays only hotel information
- "Check-in dell'alloggio?" → Shows only accommodation data

**Expense Examples:**
- "Quanto abbiamo speso?" → Shows only expense breakdown
- "Spese del viaggio?" → Displays only expense details
- "Budget utilizzato?" → Shows only expense summary

**Anti-Overlap Logic:**
- If multiple components would be triggered, shows only the most relevant one
- Prioritizes based on specific keywords in the user's question
- Prevents visual clutter and confusion
- Maintains focus on the user's actual request

**Smart Limiting:**
- Automatically limits large datasets (>10 items show first 10)
- Recognizes specific requests ("domani" shows 1 day, "ultime spese" shows last 10)
- Respects "tutto/tutti" keywords to show complete data
- Applies context-aware filtering based on user intent

### Usage
1. Users click the "Assistente AI" button in any trip section
2. AI modal opens with trip context pre-loaded
3. Users can ask questions about their trip
4. AI provides contextual responses based on trip data

## 🧙‍♂️ AI Itinerary Generation Wizard

### Features
- **Step-by-step wizard interface** for collecting user preferences
- **Date selection** with visual day buttons
- **Trip theme integration** for context-aware generation
- **Specific user requests** handling (e.g., "breakfast at 9 AM")
- **Time constraint respect** (e.g., "before 16:00")
- **Location-specific suggestions** based on trip destinations
- **Pre-save editing capabilities**
- **Batch activity generation**

### Wizard Flow
1. **Welcome Screen**: Introduction and start button
2. **Date Selection**: Choose specific days for activity generation
3. **Preferences Collection**: Gather user preferences and specific requests
4. **Activity Generation**: AI generates activities based on inputs
5. **Review & Edit**: Users can review and modify generated activities
6. **Save to Itinerary**: Activities are added to the trip itinerary

### Implementation Details

#### Activity Generation Process
```typescript
// The wizard collects:
- Selected dates for activity generation
- User preferences and specific requests
- Trip theme and context
- Time constraints and preferences
- Location preferences within the trip area
```

#### AI Prompt Structure
The wizard uses specialized prompts that include:
- Trip context and theme
- Selected dates and existing activities
- User-specific requests and preferences
- Time and location constraints
- Output format specifications for structured data

#### Generated Activity Format
```json
{
  "day": "2024-01-15",
  "time": "09:00",
  "title": "Activity Title",
  "description": "Detailed activity description",
  "location": "Specific location",
  "duration": "2 hours",
  "category": "food" | "culture" | "nature" | "entertainment"
}
```

## 🔧 Technical Implementation

### API Integration
- **Google Gemini AI**: Using 'gemini-2.0-flash-exp' model
- **API Key**: Configured via environment variables
- **Rate Limiting**: Implemented to prevent abuse
- **Error Handling**: Comprehensive error handling for API failures

### Backend Implementation
```typescript
// API endpoint: /api/ai/chat
- Handles both assistant chat and wizard requests
- Validates user subscription status
- Builds context from trip data
- Formats responses appropriately
```

### Frontend Components
- **AIAssistant**: Main chatbot component
- **AIWizard**: Itinerary generation wizard
- **Subscription checks**: Ensures only authorized users access AI features
- **Loading states**: Proper loading indicators during AI processing

### Security Considerations
- **Subscription validation**: Server-side checks for AI plan access
- **Input sanitization**: All user inputs are sanitized
- **Rate limiting**: Prevents excessive API usage
- **Error handling**: Graceful degradation when AI services are unavailable

## ⚙️ Configuration

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Subscription Requirements
- AI features require an active "AI Assistant" subscription plan
- Subscription status is checked on both frontend and backend
- Users without subscription see upgrade prompts

### Model Configuration
- **Model**: gemini-2.0-flash-exp
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: Configured based on use case
- **Safety Settings**: Configured to block harmful content

## 📖 Usage Guidelines

### Best Practices
1. **Provide clear context** in user queries
2. **Use specific requests** in the wizard for better results
3. **Review generated activities** before saving
4. **Combine AI suggestions** with manual planning for best results

### Limitations
- AI responses are based on available trip data
- Generated activities may need manual adjustment
- Time constraints may not always be perfectly respected
- Location suggestions are based on general knowledge, not real-time data

### Tips for Better Results
- Include specific time preferences in wizard requests
- Mention preferred activity types or themes
- Provide location preferences within the trip area
- Use the editing feature to refine generated activities

## 🚀 Future Enhancements

### Planned Improvements
- **Proactive suggestions** based on trip patterns
- **Weather integration** for activity recommendations
- **Local event integration** for timely suggestions
- **Multi-language support** for international trips
- **Learning from user preferences** for personalized suggestions

### Advanced Features
- **Smart expense categorization** using AI
- **Automatic itinerary optimization** based on location and time
- **Real-time travel updates** and suggestions
- **Integration with booking platforms** for seamless reservations
- **Voice interface** for hands-free interaction

### Technical Improvements
- **Caching of AI responses** for better performance
- **Offline mode** with pre-generated suggestions
- **Advanced context understanding** with trip history
- **Integration with external APIs** for real-time data
- **Custom model fine-tuning** for travel-specific responses

## 🔍 Monitoring and Analytics

### Performance Metrics
- AI response time and accuracy
- User satisfaction with generated activities
- Subscription conversion rates for AI features
- Feature usage patterns and adoption

### Error Tracking
- API failure rates and error types
- User feedback on AI responses
- Subscription validation issues
- Performance bottlenecks

---

The AI features in VoyageSmart are continuously evolving based on user feedback and technological advancements. This documentation will be updated as new features are implemented and existing ones are improved.
