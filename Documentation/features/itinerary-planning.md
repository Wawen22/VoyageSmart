# Itinerary Planning

VoyageSmart's itinerary planning system provides comprehensive tools for organizing your daily activities, creating detailed schedules, and visualizing your trip timeline. This feature is the heart of trip planning in VoyageSmart.

## 🎯 Overview

The itinerary planning system allows you to:
- Create detailed daily schedules with activities
- View your itinerary in multiple formats (list, calendar, map)
- Organize activities by time, location, and priority
- Collaborate with trip participants on planning
- Integrate with AI features for smart suggestions
- Track activity costs and booking information

## ✨ Key Features

### Multiple View Modes

#### List View
- **Chronological Display**: Activities organized by date and time
- **Day-by-Day Breakdown**: Clear separation of each travel day
- **Quick Actions**: Add, edit, or delete activities inline
- **Status Tracking**: Visual indicators for planned, confirmed, and completed activities

#### Calendar View
- **Monthly Overview**: See your entire trip at a glance
- **Drag-and-Drop**: Move activities between days easily
- **Time Slots**: Visual time blocks for better scheduling
- **Conflict Detection**: Automatic detection of scheduling conflicts

#### Map View
- **Geographic Visualization**: See activities plotted on an interactive map
- **Route Optimization**: Visual representation of travel routes
- **Location Clustering**: Group nearby activities for efficient planning
- **Distance Calculation**: Automatic travel time estimates between activities

### Activity Management

#### Activity Types
```typescript
interface Activity {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: ActivityType;
  description?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  start_time?: string;
  end_time?: string;
  estimated_duration: number;  // in minutes
  cost?: number;
  currency: string;
  priority: 1 | 2 | 3 | 4 | 5;  // 1 = highest priority
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  booking_reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type ActivityType = 
  | 'sightseeing'
  | 'dining'
  | 'entertainment'
  | 'shopping'
  | 'transportation'
  | 'accommodation'
  | 'outdoor'
  | 'cultural'
  | 'business'
  | 'other';
```

#### Activity Creation
```typescript
const createActivity = async (activityData: Partial<Activity>) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        trip_id: activityData.trip_id,
        day_id: activityData.day_id,
        name: activityData.name,
        type: activityData.type || 'other',
        location: activityData.location,
        start_time: activityData.start_time,
        end_time: activityData.end_time,
        estimated_duration: activityData.estimated_duration || 60,
        cost: activityData.cost,
        currency: activityData.currency || 'USD',
        priority: activityData.priority || 3,
        status: 'planned',
        notes: activityData.notes,
        created_by: user.id
      }])
      .select()
      .single();

    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};
```

### Day Management

#### Itinerary Days
```typescript
interface ItineraryDay {
  id: string;
  trip_id: string;
  day_date: string;           // ISO date string
  notes?: string;
  weather_forecast?: WeatherData;
  activities: Activity[];     // Populated activities for the day
  created_at: string;
  updated_at: string;
}

interface WeatherData {
  temperature: { min: number; max: number };
  condition: string;          // sunny, cloudy, rainy, etc.
  humidity: number;
  wind_speed: number;
  precipitation_chance: number;
}
```

#### Automatic Day Generation
```typescript
const generateItineraryDays = async (tripId: string, startDate: string, endDate: string) => {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    const dayData = {
      trip_id: tripId,
      day_date: date.toISOString().split('T')[0],
      notes: null
    };
    
    days.push(dayData);
  }
  
  const { data, error } = await supabase
    .from('itinerary_days')
    .insert(days)
    .select();
    
  return data;
};
```

## 🗓️ Calendar Integration

### Calendar View Features

#### Time Slot Management
- **Hourly Slots**: Activities can be scheduled in hourly time slots
- **Duration Visualization**: Activities show their duration visually
- **Overlap Detection**: Automatic detection and warning of scheduling conflicts
- **Free Time Calculation**: Automatic calculation of available time slots

#### Drag-and-Drop Functionality
```typescript
const handleActivityDrop = async (activityId: string, newDayId: string, newTime?: string) => {
  try {
    const updateData: Partial<Activity> = {
      day_id: newDayId,
      updated_at: new Date().toISOString()
    };
    
    if (newTime) {
      updateData.start_time = newTime;
      // Calculate end time based on duration
      const activity = await getActivity(activityId);
      const startTime = new Date(`2000-01-01T${newTime}`);
      const endTime = new Date(startTime.getTime() + activity.estimated_duration * 60000);
      updateData.end_time = endTime.toTimeString().slice(0, 5);
    }
    
    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', activityId)
      .select()
      .single();
      
    return data;
  } catch (error) {
    console.error('Error moving activity:', error);
    throw error;
  }
};
```

### Calendar Customization
- **View Options**: Day, week, or month view
- **Time Format**: 12-hour or 24-hour time display
- **Color Coding**: Activities colored by type or priority
- **Timezone Support**: Automatic timezone conversion for destinations

## 🗺️ Map Integration

### Interactive Map Features

#### Activity Visualization
```typescript
interface MapActivity {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  type: ActivityType;
  start_time?: string;
  status: string;
  cost?: number;
}

const renderActivityMarkers = (activities: MapActivity[]) => {
  return activities.map(activity => (
    <Marker
      key={activity.id}
      longitude={activity.coordinates.lng}
      latitude={activity.coordinates.lat}
      onClick={() => showActivityDetails(activity)}
    >
      <ActivityMarker activity={activity} />
    </Marker>
  ));
};
```

#### Route Planning
- **Optimal Routes**: Calculate best routes between activities
- **Transportation Modes**: Walking, driving, public transit options
- **Travel Time Estimates**: Realistic travel time calculations
- **Route Visualization**: Visual routes drawn on the map

#### Location Services
- **Geocoding**: Automatic coordinate lookup for addresses
- **Nearby Suggestions**: Find activities near your current location
- **Location Clustering**: Group nearby activities for efficient planning
- **Offline Maps**: Download maps for offline access

## 🤖 AI-Powered Planning

### Itinerary Generation Wizard

The AI Wizard can automatically generate comprehensive itineraries:

#### Wizard Process
1. **Preference Collection**: Gather user preferences and interests
2. **Day Selection**: Choose which days to generate activities for
3. **AI Generation**: Create personalized activities using Gemini AI
4. **Review and Edit**: Allow users to modify generated activities
5. **Integration**: Add approved activities to the itinerary

#### Smart Suggestions
```typescript
interface ActivitySuggestion {
  name: string;
  type: ActivityType;
  description: string;
  location: string;
  estimated_duration: number;
  estimated_cost: number;
  confidence_score: number;    // AI confidence in recommendation
  reasoning: string;           // Why this activity was suggested
  alternatives: string[];      // Alternative options
}

const getAISuggestions = async (tripContext: TripContext, dayDate: string) => {
  const response = await fetch('/api/ai/suggest-activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tripContext,
      dayDate,
      existingActivities: getCurrentDayActivities(dayDate)
    })
  });
  
  return response.json();
};
```

### Intelligent Optimization

#### Schedule Optimization
- **Travel Time Minimization**: Optimize activity order to reduce travel
- **Opening Hours Consideration**: Ensure activities are scheduled during operating hours
- **Crowd Avoidance**: Suggest optimal times to avoid crowds
- **Weather Integration**: Adjust outdoor activities based on weather forecasts

#### Budget Optimization
- **Cost-Aware Suggestions**: Recommend activities within budget constraints
- **Value Analysis**: Highlight best value activities and experiences
- **Alternative Options**: Provide budget-friendly alternatives
- **Spending Tracking**: Monitor spending against daily budgets

## 📱 Mobile Experience

### Mobile-Optimized Features

#### Touch-Friendly Interface
- **Swipe Gestures**: Swipe between days and views
- **Touch Interactions**: Tap to expand activity details
- **Mobile Calendar**: Optimized calendar view for small screens
- **Quick Actions**: Fast access to common actions

#### Location-Based Features
- **GPS Integration**: Use current location for nearby suggestions
- **Check-In System**: Check in to activities as you complete them
- **Real-Time Updates**: Live updates on activity status and changes
- **Offline Access**: View itinerary without internet connection

### Progressive Web App (PWA)
- **Offline Functionality**: Access itinerary without internet
- **Push Notifications**: Reminders for upcoming activities
- **Home Screen Installation**: Install as a native app
- **Background Sync**: Sync changes when connection is restored

## 🔄 Collaboration Features

### Real-Time Collaboration

#### Multi-User Editing
```typescript
// Real-time activity updates using Supabase realtime
const subscribeToActivityUpdates = (tripId: string) => {
  return supabase
    .channel(`trip-${tripId}-activities`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'activities',
      filter: `trip_id=eq.${tripId}`
    }, (payload) => {
      handleActivityUpdate(payload);
    })
    .subscribe();
};
```

#### Participant Contributions
- **Activity Suggestions**: Participants can suggest activities
- **Voting System**: Vote on proposed activities
- **Comments and Notes**: Add comments to activities
- **Assignment System**: Assign activities to specific participants

### Permission Management
- **View Permissions**: Control who can see the itinerary
- **Edit Permissions**: Control who can modify activities
- **Admin Controls**: Trip owners have full control
- **Participant Roles**: Different permission levels for participants

## 📊 Analytics and Insights

### Itinerary Analytics

#### Planning Metrics
- **Activity Distribution**: Breakdown by type, time, and location
- **Budget Allocation**: Spending distribution across activities
- **Time Utilization**: How time is allocated throughout the trip
- **Completion Rate**: Percentage of planned activities completed

#### Optimization Insights
- **Travel Efficiency**: Analysis of travel time between activities
- **Cost Efficiency**: Value analysis of planned activities
- **Schedule Balance**: Balance between active and relaxing activities
- **Local vs Tourist**: Mix of tourist attractions and local experiences

### Reporting Features
- **Itinerary Export**: Export to PDF, calendar, or other formats
- **Sharing Options**: Share itinerary with non-participants
- **Print-Friendly**: Optimized layouts for printing
- **Summary Reports**: High-level overview of trip plans

## 🔧 Advanced Features

### Template System

#### Itinerary Templates
```typescript
interface ItineraryTemplate {
  id: string;
  name: string;
  description: string;
  destination: string;
  duration_days: number;
  activities: TemplateActivity[];
  tags: string[];
  rating: number;
  usage_count: number;
  created_by: string;
  is_public: boolean;
}

const applyTemplate = async (templateId: string, tripId: string) => {
  const template = await getItineraryTemplate(templateId);
  const tripDays = await getTripDays(tripId);
  
  // Map template activities to trip days
  const activitiesToCreate = template.activities.map((templateActivity, index) => ({
    ...templateActivity,
    trip_id: tripId,
    day_id: tripDays[index % tripDays.length].id,
    created_by: user.id
  }));
  
  return createActivities(activitiesToCreate);
};
```

### Import/Export Features

#### Data Import
- **Calendar Import**: Import from Google Calendar, Outlook, etc.
- **Spreadsheet Import**: Import from Excel or CSV files
- **Travel App Import**: Import from other travel planning apps
- **Email Parsing**: Extract itinerary from confirmation emails

#### Data Export
- **Calendar Export**: Export to calendar applications
- **PDF Generation**: Create printable itinerary documents
- **Sharing Links**: Generate shareable itinerary links
- **API Export**: Export data via API for integrations

## 🛠️ Technical Implementation

### Database Schema

#### Optimized Queries
```sql
-- Get activities for a specific day with location data
SELECT 
  a.*,
  ST_X(a.coordinates) as longitude,
  ST_Y(a.coordinates) as latitude
FROM activities a
WHERE a.day_id = $1
ORDER BY a.start_time ASC, a.priority ASC;

-- Get activities within a geographic area
SELECT a.*
FROM activities a
WHERE a.trip_id = $1
  AND ST_DWithin(
    a.coordinates,
    ST_MakePoint($2, $3)::geography,
    $4  -- radius in meters
  );
```

#### Performance Optimization
- **Indexed Queries**: Optimized database indexes for fast retrieval
- **Caching Strategy**: Cache frequently accessed itinerary data
- **Lazy Loading**: Load activity details on demand
- **Batch Operations**: Efficient bulk updates for multiple activities

### Real-Time Features
- **WebSocket Connections**: Real-time updates for collaborative editing
- **Conflict Resolution**: Handle simultaneous edits gracefully
- **Offline Sync**: Queue changes for sync when connection is restored
- **Push Notifications**: Notify participants of itinerary changes

---

**Related Features:**
- [Trip Management](./trip-management.md) - Create and manage trips
- [AI Features](./ai-features.md) - AI-powered itinerary generation
- [Collaboration](./collaboration.md) - Plan together with others
- [Expenses](./expenses.md) - Track activity costs
