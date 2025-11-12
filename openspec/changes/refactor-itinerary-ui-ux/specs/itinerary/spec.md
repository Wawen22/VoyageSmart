# Itinerary Capability - Specification Deltas

## MODIFIED Requirements

### Requirement: Timeline View Display
The system SHALL display trip itinerary as an interactive vertical timeline with glass-morphism design, showing days and activities in chronological order with visual connectors between days.

#### Scenario: Timeline with multiple days
- **GIVEN** user has a trip with 5 days and multiple activities per day
- **WHEN** user opens itinerary page
- **THEN** system displays vertical timeline with all 5 days connected by visual timeline connectors
- **AND** each day shows as an expandable glass card with date, summary metrics, and activities
- **AND** activities within each day are displayed with time indicators and glass design
- **AND** timeline includes smooth scroll and animations

#### Scenario: Empty day in timeline
- **GIVEN** user has a day with no activities
- **WHEN** timeline displays that day
- **THEN** day card shows empty state with "Add Activity" prompt
- **AND** user can click to add first activity
- **AND** empty state includes helpful suggestions

#### Scenario: Timeline scroll behavior
- **GIVEN** user has a long trip with 20+ days
- **WHEN** user scrolls the timeline
- **THEN** system maintains smooth scrolling performance
- **AND** implements virtual scrolling for lists >30 days
- **AND** preserves scroll position on navigation back

### Requirement: Activity Card Display
The system SHALL display each activity as a glass-morphism card with priority indicator, time badges, location, cost, notes preview, and quick action buttons.

#### Scenario: Activity card with all details
- **GIVEN** user has an activity with complete information (name, time, location, cost, notes, priority high)
- **WHEN** card is displayed
- **THEN** shows red priority indicator bar on left edge
- **AND** displays time badge with clock icon (e.g., "14:00 - 16:00")
- **AND** displays location badge with map pin icon
- **AND** displays cost badge with currency icon (e.g., "€25")
- **AND** shows notes preview (truncated if long)
- **AND** displays quick action buttons (view, edit, move, delete) on hover
- **AND** applies glass-morphism effect with animated background orbs

#### Scenario: Activity card hover interaction
- **GIVEN** user views activity card
- **WHEN** user hovers mouse over card
- **THEN** card scales up slightly (1.02x)
- **AND** shadow intensifies
- **AND** quick action buttons become visible
- **AND** animation is smooth with 300ms transition

#### Scenario: Activity priority colors
- **GIVEN** activities with different priorities
- **WHEN** displayed in timeline
- **THEN** High priority (1) shows red left border and red orbs
- **AND** Medium priority (2) shows orange left border and orange orbs
- **AND** Low priority (3) shows blue left border and blue orbs

### Requirement: Day Card Display
The system SHALL display each day as an expandable glass card with formatted date, activity summary, progress indicator, and quick add button.

#### Scenario: Collapsed day card
- **GIVEN** user views timeline with multiple days
- **WHEN** day card is in collapsed state
- **THEN** shows glass header with formatted date (e.g., "Lunedì 15 Gennaio 2024")
- **AND** displays summary: activity count, total cost, estimated duration
- **AND** shows progress bar (e.g., "60% completed")
- **AND** displays expand/collapse toggle icon
- **AND** shows hover effects on glass card

#### Scenario: Expanded day card
- **GIVEN** user clicks on collapsed day card
- **WHEN** card expands
- **THEN** shows all activities in timeline order
- **AND** displays day notes if present
- **AND** shows "Add Activity" button
- **AND** expansion animation is smooth with spring physics
- **AND** activities are vertically stacked with spacing

#### Scenario: Day summary calculations
- **GIVEN** day has 4 activities: 2 completed, 2 planned, total cost €120
- **WHEN** summary is displayed
- **THEN** shows "4 activities"
- **AND** shows "€120" total cost
- **AND** shows estimated total duration (sum of activity durations)
- **AND** progress indicator shows 50% (2 out of 4 completed)

## ADDED Requirements

### Requirement: Drag and Drop Activities
The system SHALL support dragging activities between days with visual feedback, ghost elements, and optimistic updates.

#### Scenario: Drag activity to different day
- **GIVEN** user views timeline with multiple days
- **WHEN** user drags an activity from Day 1 to Day 2
- **THEN** activity shows ghost element following cursor
- **AND** drop zones on other days highlight with colored border
- **AND** on drop, activity immediately moves to new day in UI
- **AND** system sends update to database
- **AND** shows success toast notification
- **AND** provides undo option in toast

#### Scenario: Drag activity with touch
- **GIVEN** user on mobile device
- **WHEN** user long-presses activity card
- **THEN** card lifts with haptic feedback (if supported)
- **AND** enters drag mode with visual indication
- **AND** user can drag to other days by moving finger
- **AND** drop zones are highlighted and enlarged for easier targeting

#### Scenario: Drag feedback
- **GIVEN** user is dragging an activity
- **WHEN** drag is in progress
- **THEN** original position shows placeholder/gap
- **AND** ghost element follows cursor with 60% opacity and slight rotation
- **AND** target drop zone shows border highlight
- **AND** other activities shift to show where item will be inserted

### Requirement: Filters and Search
The system SHALL provide filters bar with search, category filter, priority filter, and sort options to help users find and organize activities.

#### Scenario: Search activities by name
- **GIVEN** user has 50+ activities across multiple days
- **WHEN** user types "museum" in search box
- **THEN** timeline filters to show only days with activities matching "museum"
- **AND** matching text is highlighted in results
- **AND** search is real-time (updates as user types)
- **AND** shows count of results (e.g., "3 activities found")

#### Scenario: Filter by category
- **GIVEN** user opens category filter dropdown
- **WHEN** user selects "Food" and "Culture" categories
- **THEN** timeline shows only activities in those categories
- **AND** filter chips appear above timeline showing active filters
- **AND** user can click chip to remove individual filter
- **AND** "Clear all" button appears to reset filters

#### Scenario: Sort activities
- **GIVEN** user opens sort dropdown
- **WHEN** user selects "Sort by: Cost (High to Low)"
- **THEN** activities within each day reorder by cost descending
- **AND** sort preference persists during session
- **AND** sort indicator shows active sort in UI

### Requirement: Bulk Operations
The system SHALL support selecting multiple activities for bulk actions like delete and move.

#### Scenario: Enable selection mode
- **GIVEN** user views timeline with activities
- **WHEN** user clicks "Select" button in filters bar
- **THEN** checkboxes appear on all activity cards
- **AND** bulk action toolbar appears at bottom
- **AND** select all/none buttons become available

#### Scenario: Bulk delete activities
- **GIVEN** user has selected 5 activities across 2 days
- **WHEN** user clicks "Delete Selected" in bulk toolbar
- **THEN** system shows confirmation dialog
- **AND** on confirm, all selected activities are removed from UI
- **AND** system sends delete requests to database
- **AND** shows success toast with undo option
- **AND** selection mode exits automatically

#### Scenario: Bulk move activities
- **GIVEN** user has selected 3 activities
- **WHEN** user clicks "Move Selected" and chooses target day
- **THEN** all selected activities move to target day
- **AND** activities maintain their relative order
- **AND** system updates database
- **AND** shows success notification

### Requirement: Quick Actions
The system SHALL provide quick action buttons on activity cards for common operations: view details, edit, move, and delete.

#### Scenario: Quick edit activity
- **GIVEN** user views activity card with edit button
- **WHEN** user clicks edit button (pencil icon)
- **THEN** activity modal opens with form pre-filled
- **AND** modal uses glass-morphism design
- **AND** form is organized in sections (details, time, location, cost, notes)
- **AND** validation provides real-time feedback

#### Scenario: Quick delete activity
- **GIVEN** user views activity card
- **WHEN** user clicks delete button (trash icon)
- **THEN** delete button pulses and changes to red "Confirm" state
- **AND** clicking again confirms and deletes activity
- **AND** clicking elsewhere cancels delete
- **AND** deleted activity is removed from UI with fade-out animation
- **AND** undo toast appears for 5 seconds

#### Scenario: Quick view activity details
- **GIVEN** user clicks view button (eye icon) on activity
- **WHEN** details modal opens
- **THEN** shows all activity information in readable format
- **AND** displays location on small map if coordinates available
- **AND** shows weather forecast if available
- **AND** provides edit and delete actions from modal

### Requirement: Smart Suggestions
The system SHALL provide intelligent suggestions for locations, times, and detect conflicts or budget issues.

#### Scenario: Location autocomplete
- **GIVEN** user is adding/editing activity and typing location
- **WHEN** user types "Coloss"
- **THEN** dropdown shows suggestions: "Colosseum, Rome", "Recent: Colosseo..."
- **AND** suggestions include recent locations from same trip
- **AND** selecting suggestion fills location and coordinates
- **AND** shows location on map preview

#### Scenario: Time slot suggestion
- **GIVEN** user adding activity to day with existing activities at 9:00-11:00 and 14:00-16:00
- **WHEN** user opens time picker
- **THEN** system suggests available slots: "11:00-13:00" or "16:00-18:00"
- **AND** highlights suggested slots
- **AND** shows icon if slot overlaps with existing activity (conflict warning)

#### Scenario: Budget warning
- **GIVEN** trip has total budget €1000, current total €950
- **WHEN** user adds activity with cost €100
- **THEN** system shows warning icon and message "Over budget by €50"
- **AND** activity card shows warning badge
- **AND** day summary shows over-budget indicator
- **AND** user can still save (warning, not blocking)

#### Scenario: Conflict detection
- **GIVEN** day has activity at 14:00-16:00
- **WHEN** user tries to add activity at 15:00-17:00
- **THEN** system shows warning "Overlaps with [Activity Name]"
- **AND** both activities show conflict indicator
- **AND** timeline highlights overlapping time visually
- **AND** user can resolve by adjusting times or confirming overlap

### Requirement: Mobile Floating Action Button
The system SHALL display a floating action button (FAB) on mobile devices for quick access to add activity.

#### Scenario: FAB display on mobile
- **GIVEN** user views itinerary on mobile device (viewport <768px)
- **WHEN** page loads
- **THEN** FAB appears at bottom-right corner with glass design
- **AND** shows plus icon with primary color gradient
- **AND** has ripple animation on tap

#### Scenario: FAB hide on scroll
- **GIVEN** user scrolls down timeline on mobile
- **WHEN** scrolling in downward direction
- **THEN** FAB slides down and hides with smooth animation
- **AND** when user scrolls up, FAB reappears
- **AND** animation is 300ms with ease-out timing

#### Scenario: FAB tap action
- **GIVEN** user taps FAB on mobile
- **WHEN** tap is detected
- **THEN** opens activity modal as bottom sheet
- **AND** bottom sheet slides up with smooth animation
- **AND** modal is pre-configured for quick add (minimal required fields)
- **AND** keyboard appears automatically on first input field

### Requirement: Mobile Bottom Sheet Modals
The system SHALL display modals as bottom sheets on mobile devices for better touch accessibility.

#### Scenario: Activity modal as bottom sheet
- **GIVEN** user on mobile device opens activity modal
- **WHEN** modal appears
- **THEN** slides up from bottom of screen (not centered)
- **AND** takes full width of screen
- **AND** shows drag handle at top for dismissal
- **AND** background is dimmed with backdrop
- **AND** can be dismissed by swiping down or tapping backdrop

#### Scenario: Bottom sheet keyboard handling
- **GIVEN** bottom sheet modal is open with form
- **WHEN** user focuses on text input
- **THEN** keyboard appears and modal adjusts height
- **AND** focused input remains visible above keyboard
- **AND** modal is scrollable if content exceeds visible area
- **AND** closing keyboard doesn't dismiss modal

### Requirement: Swipe Gestures for Navigation
The system SHALL support swipe gestures on mobile to navigate between days.

#### Scenario: Swipe to next day
- **GIVEN** user views Day 1 on mobile
- **WHEN** user swipes left
- **THEN** timeline scrolls to Day 2 with smooth animation
- **AND** day cards swap with slide transition
- **AND** visual indicator shows current day position (e.g., "Day 2 of 7")

#### Scenario: Swipe to previous day
- **GIVEN** user views Day 3 on mobile
- **WHEN** user swipes right
- **THEN** timeline scrolls back to Day 2
- **AND** animation flows in reverse direction
- **AND** maintains scroll position within day

#### Scenario: Swipe on activity for quick actions
- **GIVEN** user views activity card on mobile
- **WHEN** user swipes left on activity card
- **THEN** reveals action buttons (edit, delete) on right side
- **AND** card shifts left to show buttons
- **AND** tapping elsewhere closes revealed actions
- **AND** swiping right closes actions with animation

### Requirement: Calendar View Glass Design
The system SHALL display calendar view with glass-morphism design for events and interactive tooltips.

#### Scenario: Calendar with glass events
- **GIVEN** user switches to calendar view
- **WHEN** calendar displays activities
- **THEN** each activity appears as glass card on calendar
- **AND** color-coded by category with gradient orbs
- **AND** shows activity name and time
- **AND** uses glassmorphism effect on event cards

#### Scenario: Calendar event hover
- **GIVEN** user hovers over calendar event
- **WHEN** mouse is over event
- **THEN** tooltip appears with activity details
- **AND** event card scales up slightly
- **AND** shows preview: name, time, location, cost
- **AND** tooltip has glass design with backdrop blur

#### Scenario: Quick add from calendar
- **GIVEN** user viewing calendar
- **WHEN** user clicks on empty date cell
- **THEN** activity modal opens with date pre-filled
- **AND** modal uses glass design
- **AND** user can quickly add activity for that date

### Requirement: Map View Enhanced
The system SHALL display map view with custom glass markers, clustering, route visualization, and interactive side panel.

#### Scenario: Custom glass markers
- **GIVEN** user switches to map view
- **WHEN** map displays activities with coordinates
- **THEN** each activity shows as custom marker with glass design
- **AND** marker shows category icon (food, culture, etc.)
- **AND** marker has priority color indicator
- **AND** clicking marker opens side panel with details

#### Scenario: Activity clustering
- **GIVEN** map has multiple activities in close proximity
- **WHEN** map zooms out
- **THEN** nearby activities group into cluster marker
- **AND** cluster shows count of activities
- **AND** cluster has glass design with gradient
- **AND** clicking cluster zooms to show individual markers

#### Scenario: Route visualization
- **GIVEN** day has 4 activities with coordinates
- **WHEN** user views map with that day selected
- **THEN** system draws route line connecting activities in time order
- **AND** route line is color-coded by day
- **AND** shows estimated travel time/distance on route
- **AND** route includes direction arrows

#### Scenario: Map side panel
- **GIVEN** user clicks activity marker on map
- **WHEN** marker is selected
- **THEN** side panel slides in from right showing activity details
- **AND** panel uses glass design
- **AND** shows all activity info, edit/delete buttons
- **AND** provides next/prev buttons to navigate to adjacent activities
- **AND** clicking map background closes side panel

### Requirement: Optimistic Updates
The system SHALL update UI immediately for user actions and rollback on errors.

#### Scenario: Optimistic activity creation
- **GIVEN** user submits form to create activity
- **WHEN** form is valid and submitted
- **THEN** activity immediately appears in timeline with temporary ID
- **AND** system sends API request in background
- **AND** on success, replaces temporary ID with real ID from database
- **AND** on error, removes activity from UI and shows error toast
- **AND** entire flow appears instant to user (<100ms UI update)

#### Scenario: Optimistic activity update
- **GIVEN** user edits activity inline and presses enter
- **WHEN** new value is provided
- **THEN** UI updates immediately with new value
- **AND** API request sent in background
- **AND** on success, confirms update
- **AND** on error, reverts to original value and shows error
- **AND** shows loading indicator on item being updated

#### Scenario: Optimistic activity deletion
- **GIVEN** user confirms delete on activity
- **WHEN** delete is confirmed
- **THEN** activity fades out and removes from UI immediately
- **AND** shows undo toast for 5 seconds
- **AND** API request sent in background
- **AND** if undo clicked, restores activity before API completes
- **AND** on API error, restores activity and shows error toast

### Requirement: Virtual Scrolling Performance
The system SHALL implement virtual scrolling for trips with more than 30 days to maintain performance.

#### Scenario: Virtual scrolling activation
- **GIVEN** user has trip with 50 days
- **WHEN** timeline renders
- **THEN** only renders days in viewport plus 5-item buffer above/below
- **AND** maintains smooth 60fps scrolling
- **AND** renders additional days as user scrolls
- **AND** unrenders days far from viewport

#### Scenario: Scroll position preservation
- **GIVEN** user scrolls to Day 30 in virtual list
- **WHEN** user navigates away and returns
- **THEN** timeline scrolls back to Day 30 position
- **AND** scroll position is restored within 200ms
- **AND** no visible flash or jump

### Requirement: Skeleton Loading States
The system SHALL display skeleton screens with glass design during data loading.

#### Scenario: Initial page load skeleton
- **GIVEN** user navigates to itinerary page
- **WHEN** data is being fetched
- **THEN** displays skeleton with glass cards
- **AND** shows 3 day skeletons with pulsing animation
- **AND** each day skeleton has activity placeholders
- **AND** skeleton matches final layout structure
- **AND** transitions smoothly to real content when loaded

#### Scenario: Skeleton with animated orbs
- **GIVEN** skeleton is displayed
- **WHEN** user sees loading state
- **THEN** skeleton cards have glass background with animated orbs
- **AND** orbs pulse and float for visual interest
- **AND** background has subtle grid pattern
- **AND** loading doesn't feel static or broken

## MODIFIED Requirements

### Requirement: View Mode Switching
The system SHALL provide view switcher for List/Timeline, Calendar, and Map views with glass design and smooth transitions.

#### Scenario: Switch between views
- **GIVEN** user is on Timeline view
- **WHEN** user clicks "Calendar" in view switcher
- **THEN** content fades out with 300ms animation
- **AND** Calendar view fades in with glass design
- **AND** view preference persists in session
- **AND** data is preserved across view switches (no re-fetch)

#### Scenario: View switcher on mobile
- **GIVEN** user views itinerary on mobile
- **WHEN** view switcher is displayed
- **THEN** shows as compact pills with icons
- **AND** uses glass background
- **AND** active view is highlighted with color
- **AND** smooth slide animation on switch

### Requirement: Activity Modal Form
The system SHALL display activity modal with glass design, organized sections, validation, and enhanced pickers.

#### Scenario: Modal with sections
- **GIVEN** user opens activity modal
- **WHEN** modal displays
- **THEN** form is organized in sections: Details, Time, Location, Cost, Notes
- **AND** uses glass design with animated orbs
- **AND** sections are visually separated
- **AND** form is scrollable on mobile

#### Scenario: Category selector with icons
- **GIVEN** user in activity modal selects category
- **WHEN** category field is clicked
- **THEN** dropdown shows categories with icons (🍴 Food, 🏛️ Culture, etc.)
- **AND** icons are colored by category
- **AND** selecting category updates activity icon
- **AND** category affects orb gradient colors

#### Scenario: Location picker with map
- **GIVEN** user enters location in activity form
- **WHEN** location field is focused
- **THEN** shows autocomplete suggestions
- **AND** displays small map preview below field
- **AND** selecting suggestion shows location on map
- **AND** user can click map to fine-tune coordinates
- **AND** coordinates are saved with activity

#### Scenario: Time picker smart defaults
- **GIVEN** user selects start time in activity form
- **WHEN** start time is chosen (e.g., 14:00)
- **THEN** end time auto-suggests 1 hour later (15:00)
- **AND** user can adjust end time manually
- **AND** system validates end time is after start time
- **AND** shows duration badge (e.g., "1h duration")

## REMOVED Requirements

None. All existing functionality is preserved, only enhanced with new UI/UX.

## RENAMED Requirements

None. Requirement names remain the same but content is expanded/improved.
