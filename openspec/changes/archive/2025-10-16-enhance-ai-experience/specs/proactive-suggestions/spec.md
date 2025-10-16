## ADDED Requirements

### Requirement: Proactive AI Suggestions
The system MUST provide proactive suggestions to the user based on their trip context and preferences.

#### Scenario: Upcoming Trip Reminder
- GIVEN a user has an upcoming trip in 3 days
- WHEN the user opens the app
- THEN the system SHOULD show a notification with a packing list suggestion.

#### Scenario: In-Trip Activity Suggestion
- GIVEN a user is on a trip and has some free time in their itinerary
- WHEN the user is near a point of interest
- THEN the system SHOULD send a push notification suggesting a visit to the point of interest.
