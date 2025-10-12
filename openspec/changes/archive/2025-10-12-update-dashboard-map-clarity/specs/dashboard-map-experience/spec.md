## ADDED Requirements
### Requirement: Unobstructed Dashboard Map
The dashboard map view MUST keep the interactive map free from cards or overlays that hide a meaningful portion of the map.

#### Scenario: Metrics available without blocking map
- **GIVEN** a signed-in user with trips opens the dashboard map view on desktop
- **WHEN** the map finishes loading
- **THEN** no insights card overlays the map canvas
- **AND** the insights panel adjacent to the map contains the information formerly shown in the overlay

### Requirement: Map Insights Panel Summary
The map insights panel MUST surface key trip metrics derived from the currently filtered trips.

#### Scenario: Summary metrics align with filtered trips
- **GIVEN** the user filters trips in the dashboard and opens the map view
- **WHEN** the map insights panel renders
- **THEN** it shows the total number of filtered trips, a breakdown per trip status, the combined budget per currency, and the next departure countdown when available

### Requirement: Mobile Map Exit Control
Mobile users MUST have an obvious control to leave the map view and return to the list/grid view.

#### Scenario: List toggle visible on small screens
- **GIVEN** the user is on a viewport ≤ 640px wide while in map view
- **WHEN** the dashboard renders interaction controls
- **THEN** a clearly labeled control to switch back to the list/grid view is visible and actionable
- **AND** activating it returns the dashboard to the non-map view
