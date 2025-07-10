# Trip Management

VoyageSmart's trip management system provides comprehensive tools for creating, organizing, and managing your travel plans. This feature serves as the foundation for all other functionality in the application.

## 🎯 Overview

Trip management in VoyageSmart allows you to:
- Create and configure trips with detailed information
- Organize multiple trips in a centralized dashboard
- Set privacy and sharing preferences
- Manage trip participants and permissions
- Clone existing trips as templates
- Track trip progress and status

## ✨ Key Features

### Trip Creation

#### Basic Trip Information
- **Trip Name**: Give your trip a memorable title
- **Description**: Add detailed information about your trip
- **Destinations**: Add multiple destinations with specific details
- **Dates**: Set start and end dates for your trip
- **Trip Type**: Categorize your trip (vacation, business, adventure, etc.)

#### Advanced Configuration
- **Budget**: Set an overall trip budget with currency selection
- **Privacy Settings**: Control who can view your trip
- **Accommodation Preferences**: Specify preferred accommodation types
- **Notes**: Add additional planning notes and considerations

### Trip Dashboard

The trip dashboard provides a comprehensive overview of all your trips:

#### Trip Cards
Each trip is displayed as an informative card showing:
- Trip name and destination(s)
- Travel dates and duration
- Number of participants
- Budget information
- Trip status and progress
- Quick action buttons

#### Filtering and Sorting
- **Filter by Status**: Upcoming, ongoing, completed, or draft trips
- **Sort Options**: By date, name, destination, or creation date
- **Search**: Find trips quickly by name or destination
- **View Options**: Grid or list view for different preferences

### Trip Configuration

#### Privacy and Sharing
```typescript
interface TripPrivacySettings {
  isPrivate: boolean;           // Private or shared trip
  allowParticipantInvites: boolean;  // Can participants invite others
  viewPermissions: 'all' | 'participants' | 'admins';
  editPermissions: 'admins' | 'all_participants';
}
```

#### Trip Preferences
```typescript
interface TripPreferences {
  currency: string;             // Default currency for expenses
  tripType: string;            // vacation, business, adventure, etc.
  accommodation: string;        // hotel, airbnb, hostel, etc.
  notes: string;               // Additional planning notes
  destinations: Destination[]; // Multiple destinations with details
}
```

## 🚀 Creating a Trip

### Step-by-Step Process

#### 1. Basic Information
```typescript
// Trip creation form data
interface TripFormData {
  name: string;                // Required: Trip name
  description?: string;        // Optional: Trip description
  destinations: Destination[]; // At least one destination required
  startDate?: string;         // Optional: Trip start date
  endDate?: string;           // Optional: Trip end date
  tripType?: string;          // Optional: Trip category
}
```

#### 2. Destination Management
```typescript
interface Destination {
  name: string;               // Destination name (e.g., "Paris, France")
  country?: string;           // Country name
  region?: string;            // State/region
  coordinates?: {             // GPS coordinates for mapping
    lat: number;
    lng: number;
  };
  notes?: string;             // Destination-specific notes
}
```

#### 3. Budget and Preferences
- Set overall trip budget with currency selection
- Choose accommodation preferences
- Add planning notes and special considerations
- Configure privacy and sharing settings

#### 4. Participant Setup
After creating a trip, you can:
- Invite participants via email
- Assign roles (admin, participant, viewer)
- Set sharing permissions
- Configure expense splitting ratios

### Trip Creation Example

```typescript
const createTrip = async (formData: TripFormData) => {
  try {
    // Create the trip record
    const { data: trip, error } = await supabase
      .from('trips')
      .insert([{
        name: formData.name,
        description: formData.description,
        destination: formData.destinations[0]?.name, // Primary destination
        start_date: formData.startDate,
        end_date: formData.endDate,
        is_private: formData.isPrivate,
        budget_total: formData.budgetTotal,
        owner_id: user.id,
        preferences: {
          currency: formData.currency,
          trip_type: formData.tripType,
          accommodation: formData.accommodation,
          notes: formData.notes,
          destinations: formData.destinations
        }
      }])
      .select()
      .single();

    // Add owner as admin participant
    await supabase
      .from('trip_participants')
      .insert([{
        trip_id: trip.id,
        user_id: user.id,
        role: 'admin',
        invitation_status: 'accepted'
      }]);

    return trip;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};
```

## 👥 Participant Management

### Roles and Permissions

#### Admin Role
- Full access to all trip features
- Can edit trip details and settings
- Can invite and remove participants
- Can delete the trip
- Can manage expenses and budgets

#### Participant Role
- Can view and edit trip content
- Can add activities, expenses, and media
- Can invite other participants (if enabled)
- Cannot delete the trip or remove other participants

#### Viewer Role
- Read-only access to trip information
- Can view itinerary, expenses, and media
- Cannot edit or add content
- Cannot invite other participants

### Invitation System

#### Sending Invitations
```typescript
const inviteParticipant = async (tripId: string, email: string, role: string) => {
  try {
    const { data, error } = await supabase
      .from('trip_participants')
      .insert([{
        trip_id: tripId,
        invited_email: email,
        role: role,
        invitation_status: 'pending'
      }])
      .select()
      .single();

    // Send invitation email
    await sendInvitationEmail(email, tripId, role);
    
    return data;
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw error;
  }
};
```

#### Managing Invitations
- **Pending**: Invitation sent but not yet accepted
- **Accepted**: User has joined the trip
- **Declined**: User has declined the invitation
- **Expired**: Invitation has expired (after 7 days)

## 📊 Trip Analytics

### Trip Statistics
- Total number of activities planned
- Total estimated expenses
- Number of participants
- Trip duration and progress
- Completion percentage

### Progress Tracking
- **Planning Phase**: Trip created, basic information added
- **Active Planning**: Participants added, itinerary being built
- **Ready to Travel**: All major components planned
- **In Progress**: Trip is currently happening
- **Completed**: Trip has ended, memories being added

## 🔄 Trip Templates and Cloning

### Cloning Existing Trips
```typescript
const cloneTrip = async (originalTripId: string, newTripData: Partial<TripFormData>) => {
  try {
    // Get original trip data
    const { data: originalTrip } = await supabase
      .from('trips')
      .select('*')
      .eq('id', originalTripId)
      .single();

    // Create new trip with modified data
    const { data: newTrip } = await supabase
      .from('trips')
      .insert([{
        ...originalTrip,
        id: undefined, // Let database generate new ID
        name: newTripData.name || `${originalTrip.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
        owner_id: user.id,
        ...newTripData
      }])
      .select()
      .single();

    // Optionally clone itinerary, accommodations, etc.
    await cloneTripContent(originalTripId, newTrip.id);

    return newTrip;
  } catch (error) {
    console.error('Error cloning trip:', error);
    throw error;
  }
};
```

### Template System
- Save trips as templates for future use
- Share templates with the community
- Browse popular trip templates
- Customize templates before creating trips

## 🔒 Privacy and Security

### Privacy Levels
- **Private**: Only you can see the trip
- **Shared**: Invited participants can view and edit
- **Public**: Anyone with the link can view (read-only)

### Data Protection
- All trip data is protected by Row Level Security (RLS)
- Participants can only access trips they're invited to
- Trip owners have full control over their data
- Secure invitation system with email verification

## 📱 Mobile Experience

### Mobile-Optimized Features
- Touch-friendly trip creation interface
- Swipe gestures for trip navigation
- Quick actions for common tasks
- Offline viewing of trip information
- GPS integration for location-based features

### Mobile-Specific UI
- Collapsible trip cards for better mobile viewing
- Bottom sheet modals for trip actions
- Optimized forms for mobile input
- Voice input for trip descriptions and notes

## 🔧 Advanced Features

### Bulk Operations
- Select multiple trips for bulk actions
- Archive completed trips
- Export trip data
- Batch privacy setting updates

### Integration Features
- Import trips from other travel apps
- Export to calendar applications
- Share trip summaries via social media
- Generate trip reports and summaries

### Automation
- Automatic trip status updates based on dates
- Smart suggestions for trip improvements
- Proactive notifications for important dates
- Integration with AI features for enhanced planning

## 📈 Performance Considerations

### Optimization Strategies
- Lazy loading of trip details
- Efficient pagination for large trip lists
- Caching of frequently accessed trip data
- Optimistic updates for better user experience

### Scalability
- Support for unlimited trips (Premium plan)
- Efficient database queries with proper indexing
- CDN integration for fast global access
- Real-time updates for collaborative features

---

**Related Features:**
- [Itinerary Planning](./itinerary-planning.md) - Plan your trip activities
- [Collaboration](./collaboration.md) - Work with other travelers
- [Expenses](./expenses.md) - Manage trip budgets and costs
