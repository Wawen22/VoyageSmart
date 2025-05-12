# AI Features in VoyageSmart

VoyageSmart integrates powerful AI capabilities to enhance the travel planning experience. This document provides a detailed overview of the AI features available in VoyageSmart.

## Overview

VoyageSmart's AI features are designed to make travel planning easier and more personalized. These features are available exclusively to users with an "AI Assistant" subscription plan.

## AI Travel Assistant

The AI Travel Assistant is an intelligent chatbot that provides personalized information and suggestions based on your trip details.

### Key Features

- **Contextual Awareness**: The assistant has access to your complete trip context, including dates, destinations, participants, accommodations, transportation, and itinerary.
- **Personalized Responses**: Responses are tailored to your specific trip details.
- **Minimizable Interface**: The assistant can be minimized while you navigate through different pages of your trip.
- **Suggested Questions**: The interface provides suggested questions to help you get started.
- **Persistent State**: The assistant remembers your conversation even as you navigate between different pages.

### Technical Implementation

The AI Travel Assistant is implemented using:

- Google's Gemini API (model: gemini-1.5-flash-latest)
- React component: `ChatBot.tsx`
- API endpoint: `/api/ai/chat`

### Example Code

Here's a simplified example of how the AI Travel Assistant is implemented:

```tsx
// ChatBot.tsx
import React, { useState, useEffect } from 'react';
import { useTripContext } from '@/contexts/TripContext';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const { tripData } = useTripContext();

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    try {
      // Send request to AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          tripContext: tripData, // Include trip context
        }),
      });
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
  };

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${tripData.id}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [tripData.id]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${tripData.id}`, JSON.stringify(messages));
    }
  }, [messages, tripData.id]);

  return (
    <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-header">
        <h3>AI Travel Assistant</h3>
        <button onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? 'Expand' : 'Minimize'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
          </div>
          
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your trip..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;
```

## Itinerary Generation Wizard

The Itinerary Generation Wizard is a step-by-step tool that uses AI to automatically generate personalized activities for your trip.

### Key Features

- **Guided Interface**: Step-by-step wizard interface
- **Predefined Themes**: Selection of travel themes (Adventure, Cultural, Relaxation, etc.)
- **Interactive Day Selection**: Visual selection of days to plan
- **Personalized Activity Generation**: AI-generated activities based on preferences
- **Rich Visualization**: Timeline and map views of generated activities
- **Pre-save Editing**: Ability to modify or remove activities before saving
- **Mapbox Integration**: Interactive map with color-coded markers

### Technical Implementation

The Itinerary Generation Wizard is implemented using:

- Google's Gemini API
- React component: `ItineraryWizard.tsx`
- Supporting components: `ActivityTimeline.tsx`, `ActivityMapView.tsx`
- Mapbox for map visualization

### Example Code

Here's a simplified example of the activity generation function:

```typescript
// api/ai/generate-activities.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tripData, selectedDays, preferences, theme } = req.body;

    // Create prompt for Gemini AI
    const prompt = `
      Generate a detailed itinerary for a trip to ${tripData.destination} 
      for the following days: ${selectedDays.join(', ')}.
      
      Trip details:
      - Destination: ${tripData.destination}
      - Trip dates: ${tripData.start_date} to ${tripData.end_date}
      - Theme: ${theme}
      - Preferences: ${preferences}
      
      For each day, generate 3-5 activities with the following information:
      - Name
      - Type (sightseeing, food, adventure, etc.)
      - Start time (in 24-hour format)
      - End time (in 24-hour format)
      - Location (specific address or place name)
      - Brief description
      
      Format the response as a JSON array of activities.
    `;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const activitiesJson = extractJsonFromText(text);
    const activities = JSON.parse(activitiesJson);
    
    // Process activities (add coordinates, etc.)
    const processedActivities = await processActivities(activities);
    
    return res.status(200).json({ activities: processedActivities });
  } catch (error) {
    console.error('Error generating activities:', error);
    return res.status(500).json({ error: 'Failed to generate activities' });
  }
}

// Helper function to extract JSON from text
function extractJsonFromText(text) {
  const jsonRegex = /\[\s*\{.*\}\s*\]/s;
  const match = text.match(jsonRegex);
  return match ? match[0] : '[]';
}

// Process activities to add coordinates
async function processActivities(activities) {
  // Add geocoding logic here
  return activities;
}
```

## Future AI Features

VoyageSmart is continuously developing new AI features to enhance the travel planning experience:

### Proactive Suggestions

- Automatic suggestions based on trip context
- Intelligent notifications for upcoming activities
- Personalized recommendations based on user preferences

### Route Optimization

- Analysis and optimization of travel routes
- Suggestions to reduce travel time and costs
- Optimized visualization of routes on maps

### Predictive Analytics

- Prediction of costs and crowds
- Suggestions to avoid peak seasons
- Budget analysis and saving suggestions

---

Next: [Trip Management](./trip-management.md)
