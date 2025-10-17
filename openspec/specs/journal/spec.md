# journal Specification

## Purpose
TBD - created by archiving change separate-journal-from-itinerary. Update Purpose after archive.
## Requirements
### Requirement: Itinerary Page Excludes Journal Features
The itinerary screen MUST only surface itinerary-specific tools and content.

#### Scenario: Itinerary page no longer displays Journal content
- GIVEN a user is viewing the "Itinerary" page for a trip
- WHEN the page loads
- THEN the user SHOULD only see itinerary-related information and controls
- AND the user SHOULD NOT see any tabs or links to switch to a "Journal" view within this page.

### Requirement: Trip Actions Provide Journal Shortcut
The persistent trip actions MUST offer an entry point to the dedicated journal experience.

#### Scenario: Trip Actions sidebar includes a direct link to the Journal
- GIVEN a user is on any page within a specific trip
- WHEN the user views the "Trip Actions" sidebar
- THEN the user SHOULD see a distinct "Journal" action item with a clear icon and label.
- AND WHEN the user clicks the "Journal" action item
- THEN the user SHOULD be navigated to the dedicated `/trips/[id]/journal` page for that trip.

### Requirement: Dedicated Journal Page Experience
The product MUST provide a standalone journal page where travellers can manage their memories.

#### Scenario: Dedicated Journal page displays journal content
- GIVEN a user has navigated to the `/trips/[id]/journal` page
- WHEN the page loads
- THEN the system SHOULD fetch and display all journal entries, media, and timeline information associated with that trip.
- AND the user SHOULD have access to all journal-related actions, such as creating a new entry, uploading media, and switching between timeline, gallery, and entry views.

