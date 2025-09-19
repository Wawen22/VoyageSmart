# Creating a Trip

## Overview

This tutorial will guide you through creating your first trip in VoyageSmart, from initial setup to inviting participants and organizing your travel plans. By the end of this tutorial, you'll have a fully configured trip ready for detailed planning.

## Prerequisites

- Active VoyageSmart account
- Basic familiarity with the VoyageSmart interface
- Trip destination and dates in mind

## Step 1: Accessing Trip Creation

### From Dashboard

1. **Navigate to Dashboard**
   - Log into your VoyageSmart account
   - Click on "Dashboard" in the main navigation

2. **Start New Trip**
   - Click the "Create New Trip" button (prominent blue button)
   - Or use the "+" icon in the trips section
   - Alternatively, use the keyboard shortcut `Ctrl+N` (Windows) or `Cmd+N` (Mac)

### From Trips Page

1. **Go to Trips**
   - Click "Trips" in the main navigation
   - Click "New Trip" button in the top-right corner

## Step 2: Basic Trip Information

### Trip Details Form

Fill out the essential trip information:

#### Trip Name
```
Example: "Summer Adventure in Japan"
Tips:
- Use descriptive names for easy identification
- Include destination or theme
- Keep it under 100 characters
- Avoid special characters that might cause issues
```

#### Destination
```
Example: "Tokyo, Japan"
Tips:
- Use the location search feature for accuracy
- Select from suggested locations when possible
- Include country for international trips
- Be specific (city rather than just country)
```

#### Travel Dates
```
Start Date: June 15, 2024
End Date: June 25, 2024
Tips:
- Double-check dates for accuracy
- Consider time zones for international travel
- Allow buffer days for travel time
- Check local holidays and events
```

#### Budget (Optional)
```
Example: $3,000 USD
Tips:
- Set realistic budget expectations
- Include all trip expenses (flights, accommodation, food, activities)
- You can adjust this later as plans develop
- Consider currency for international trips
```

#### Description (Optional)
```
Example: "A 10-day cultural exploration of Japan, focusing on traditional temples, modern technology, and authentic cuisine experiences."
Tips:
- Describe the trip's purpose and goals
- Mention key activities or themes
- Help participants understand the trip vision
- Keep it concise but informative
```

### Advanced Settings

#### Privacy Settings
- **Private Trip**: Only invited participants can view
- **Public Trip**: Visible to other VoyageSmart users (with restrictions)

#### Trip Type
- Business
- Leisure
- Family
- Adventure
- Cultural
- Romantic
- Solo

## Step 3: Trip Configuration

### Currency Selection

Choose the primary currency for your trip:

```typescript
// Common currency options
const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
];
```

**Tips:**
- Choose the currency you'll primarily use at the destination
- You can track expenses in multiple currencies
- Exchange rates are automatically updated

### Time Zone

The system automatically detects the destination time zone, but you can adjust if needed:

```
Destination: Tokyo, Japan
Time Zone: Asia/Tokyo (UTC+9)
```

### Group Settings

#### Maximum Participants
- Set a limit if needed (useful for accommodation constraints)
- Leave unlimited for flexible group size

#### Participant Permissions
- **Default Role**: Set the default role for new participants
- **Invitation Requirements**: Require approval for new participants

## Step 4: Creating the Trip

### Review and Create

1. **Review Information**
   - Double-check all entered information
   - Ensure dates and destination are correct
   - Verify budget and currency settings

2. **Create Trip**
   - Click "Create Trip" button
   - Wait for confirmation message
   - You'll be redirected to the trip dashboard

### Confirmation

Upon successful creation, you'll see:
- Trip dashboard with basic information
- Confirmation message
- Options for next steps (invite participants, add activities, etc.)

## Step 5: Initial Trip Setup

### Trip Dashboard Overview

Your new trip dashboard includes:

#### Quick Stats
- Trip duration (calculated automatically)
- Current participant count
- Budget status
- Planning progress

#### Action Items
- [ ] Invite participants
- [ ] Plan itinerary
- [ ] Book accommodations
- [ ] Arrange transportation
- [ ] Set up expense tracking

### Essential First Steps

#### 1. Invite Participants

**Add Travel Companions:**
```
1. Click "Invite Participants" button
2. Enter email addresses or select from contacts
3. Choose participant roles:
   - Admin: Can manage all aspects
   - Editor: Can add/edit activities and expenses
   - Viewer: Can view but not edit
4. Add personal invitation message
5. Send invitations
```

**Invitation Example:**
```
Subject: Join me for Summer Adventure in Japan!

Hi [Name],

I'm planning an amazing trip to Japan from June 15-25, 2024, and I'd love for you to join me! 

The trip will focus on cultural exploration, including visits to traditional temples, experiencing modern technology, and enjoying authentic Japanese cuisine.

Click the link below to view the trip details and let me know if you're interested:
[Trip Link]

Looking forward to traveling together!

Best regards,
[Your Name]
```

#### 2. Set Trip Preferences

**Configure Trip Settings:**
- Accommodation preferences (hotel, Airbnb, hostel)
- Transportation preferences (flight, train, car)
- Activity interests (culture, food, nature, nightlife)
- Budget distribution (accommodation 40%, food 30%, activities 20%, misc 10%)

#### 3. Create Initial Itinerary Structure

**Set Up Days:**
```
Day 1 (June 15): Arrival in Tokyo
Day 2 (June 16): Tokyo Exploration
Day 3 (June 17): Cultural Sites
...
Day 10 (June 25): Departure
```

## Step 6: Collaboration Setup

### Participant Management

#### Invitation Status Tracking
- **Pending**: Invitation sent, awaiting response
- **Accepted**: Participant joined the trip
- **Declined**: Participant declined invitation
- **Expired**: Invitation expired (auto-expires after 7 days)

#### Role Management
```typescript
interface ParticipantRole {
  owner: {
    permissions: ['all'];
    description: 'Full control over trip';
  };
  admin: {
    permissions: ['edit_trip', 'manage_participants', 'manage_expenses'];
    description: 'Can manage most trip aspects';
  };
  editor: {
    permissions: ['edit_activities', 'add_expenses', 'edit_accommodations'];
    description: 'Can contribute to trip planning';
  };
  viewer: {
    permissions: ['view_trip', 'view_expenses'];
    description: 'Can view trip information';
  };
}
```

### Communication Setup

#### Trip Comments
- Enable comments on activities and expenses
- Set notification preferences
- Configure comment moderation if needed

#### Notification Settings
- Email notifications for trip updates
- Push notifications for mobile app
- Digest emails for daily/weekly summaries

## Step 7: Trip Organization

### Categories and Tags

#### Activity Categories
- Sightseeing
- Food & Dining
- Transportation
- Accommodation
- Entertainment
- Shopping
- Cultural
- Adventure

#### Custom Tags
Create custom tags for better organization:
- #MustSee
- #BudgetFriendly
- #GroupActivity
- #WeatherDependent
- #BookingRequired

### Templates and Shortcuts

#### Save as Template
If you plan similar trips in the future:
1. Go to Trip Settings
2. Click "Save as Template"
3. Choose what to include (activities, structure, settings)
4. Name your template
5. Use for future trips

#### Quick Actions
Set up quick actions for common tasks:
- Add standard activities
- Create expense categories
- Set up accommodation templates
- Configure transportation options

## Step 8: Integration Setup

### Calendar Integration

#### Sync with External Calendars
```
1. Go to Trip Settings > Integrations
2. Select calendar service (Google, Outlook, Apple)
3. Authorize VoyageSmart access
4. Choose sync options:
   - Import existing events
   - Export trip activities
   - Two-way synchronization
```

#### Calendar Settings
- Time zone handling
- Event visibility (private/public)
- Reminder settings
- Conflict detection

### External Services

#### Booking Integration
- Connect with booking platforms
- Import confirmation emails
- Sync reservation details
- Track booking status

#### Weather Integration
- Enable weather forecasts
- Set weather alerts
- Plan weather-dependent activities
- Receive packing suggestions

## Common Issues and Solutions

### Issue: Can't Create Trip

**Possible Causes:**
- Network connectivity issues
- Browser compatibility problems
- Account limitations (subscription tier)
- Server maintenance

**Solutions:**
1. Check internet connection
2. Try different browser or clear cache
3. Verify account status and subscription
4. Contact support if issues persist

### Issue: Invitation Emails Not Received

**Possible Causes:**
- Email in spam folder
- Incorrect email address
- Email server delays
- Blocked sender

**Solutions:**
1. Check spam/junk folders
2. Verify email addresses
3. Resend invitations
4. Use alternative contact methods

### Issue: Date/Time Confusion

**Possible Causes:**
- Time zone differences
- Date format confusion
- Daylight saving time changes

**Solutions:**
1. Verify time zone settings
2. Use ISO date format when possible
3. Confirm dates with all participants
4. Set clear time zone references

## Best Practices

### Trip Planning Tips

1. **Start Early**
   - Create trips 2-3 months in advance
   - Allow time for participant coordination
   - Book popular activities early

2. **Clear Communication**
   - Set expectations upfront
   - Use descriptive trip names and descriptions
   - Regular updates to participants

3. **Flexible Planning**
   - Build in buffer time
   - Have backup plans
   - Allow for spontaneous activities

4. **Budget Management**
   - Set realistic budgets
   - Track expenses from the start
   - Communicate budget constraints clearly

5. **Documentation**
   - Keep important documents accessible
   - Share confirmation numbers
   - Maintain emergency contact information

### Collaboration Guidelines

1. **Role Assignment**
   - Assign appropriate roles based on involvement
   - Clearly communicate responsibilities
   - Review and adjust roles as needed

2. **Decision Making**
   - Establish decision-making processes
   - Use voting features for group decisions
   - Set deadlines for responses

3. **Information Sharing**
   - Share relevant information promptly
   - Use comments for discussions
   - Keep all participants informed

## Next Steps

After creating your trip:

1. **[Planning an Itinerary](./planning-an-itinerary.md)** - Learn to create detailed day-by-day plans
2. **[Managing Expenses](./managing-expenses.md)** - Set up expense tracking and splitting
3. **[Using AI Features](./using-ai-features.md)** - Leverage AI for trip planning assistance

## Additional Resources

### Video Tutorials
- [Creating Your First Trip (5 min)](https://voyagesmart.app/tutorials/creating-trip)
- [Inviting Participants (3 min)](https://voyagesmart.app/tutorials/inviting-participants)
- [Trip Settings Overview (7 min)](https://voyagesmart.app/tutorials/trip-settings)

### Templates
- [Business Trip Template](https://voyagesmart.app/templates/business-trip)
- [Family Vacation Template](https://voyagesmart.app/templates/family-vacation)
- [Adventure Travel Template](https://voyagesmart.app/templates/adventure-travel)

### Support
- **Help Center**: [help.voyagesmart.app](https://help.voyagesmart.app)
- **Community Forum**: [community.voyagesmart.app](https://community.voyagesmart.app)
- **Email Support**: support@voyagesmart.app
- **Live Chat**: Available 24/7 in the app

## Conclusion

Creating a trip in VoyageSmart is designed to be intuitive and comprehensive. By following this tutorial, you've learned how to set up a trip from scratch, configure essential settings, invite participants, and prepare for detailed planning.

Remember that trip creation is just the beginning - the real power of VoyageSmart comes from collaborative planning, intelligent recommendations, and comprehensive trip management throughout your travel journey.
