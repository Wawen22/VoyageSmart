## ADDED Requirements
### Requirement: Itinerary Shell Composition
The itinerary section MUST use a shell component that separates data orchestration from presentation while preserving all existing CRUD and feature integrations.

#### Scenario: Shell loads itinerary data with controller
- **GIVEN** a user opens `/trips/:id/itinerary`
- **WHEN** the shell initialises
- **THEN** it MUST load trip, days, activities, permissions, and journal context via `useItineraryController`
- **AND** it MUST provide loading, error, and ready states without blocking lazy features.

#### Scenario: Feature integrations remain accessible
- **GIVEN** the shell is ready
- **WHEN** the user launches the AI wizard, map view, calendar view, or journal tools
- **THEN** those modules MUST receive the same data and handlers as the current implementation
- **AND** no existing functionality may regress.

### Requirement: Responsive Layout Modes
The itinerary UI MUST present a glass-styled, responsive layout that adapts to desktop, tablet, and mobile breakpoints.

#### Scenario: Desktop layout renders three-pane structure
- **GIVEN** the viewport width is ≥ 1024px
- **WHEN** the page renders
- **THEN** it MUST display a navigation rail, primary timeline, and contextual panel arranged via CSS Grid
- **AND** the contextual panel MUST show map, calendar, or journal tabs without overlapping the timeline.

#### Scenario: Mobile layout prioritises timeline and floating actions
- **GIVEN** the viewport width is < 640px
- **WHEN** the page renders
- **THEN** it MUST collapse navigation into a toolbar or sheet, stack panels vertically, and expose primary actions through floating buttons
- **AND** all CRUD controls MUST remain reachable with touch-friendly targets.

### Requirement: Glass Design System
The redesigned components MUST adopt the app’s glassy aesthetic with consistent typography, spacing, and motion tokens.

#### Scenario: Day and activity cards follow glass styling
- **GIVEN** a day or activity card renders
- **WHEN** it is displayed in light or dark mode
- **THEN** it MUST use translucent surfaces (`backdrop-blur`, semi-transparent backgrounds), rounded corners, and soft shadows defined in the design guidelines
- **AND** hover/focus states MUST animate smoothly while respecting `prefers-reduced-motion`.

### Requirement: Accessibility and Performance Controls
The itinerary experience MUST sustain accessibility and performance guarantees despite the visual overhaul.

#### Scenario: Keyboard and screen reader support
- **GIVEN** a keyboard or screen reader user interacts with the itinerary
- **WHEN** navigating days, activities, or modals
- **THEN** focus order MUST be logical, interactive elements MUST expose labels and states, and ARIA attributes MUST reflect expand/collapse status.

#### Scenario: Large itineraries remain performant
- **GIVEN** an itinerary contains more than 14 days or high activity volume
- **WHEN** the user scrolls or switches views
- **THEN** the UI MUST avoid jank by batching state updates, memoising derived data, and lazily rendering heavy panels as defined in the design plan.
