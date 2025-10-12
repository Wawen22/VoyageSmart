## ADDED Requirements
### Requirement: Primary Destination Marker Coverage
The dashboard map view MUST render exactly one marker for every trip that resolves to a primary (or fallback) destination with coordinates.

#### Scenario: Trips with destinations show markers
- **GIVEN** a signed-in user opens the dashboard map view
- **AND** their filtered trips include at least two trips whose primary destinations have coordinates
- **WHEN** the map finishes rendering
- **THEN** each of those trips appears as one marker positioned at its destination coordinates
- **AND** selecting a marker focuses the corresponding trip as today

### Requirement: Resilient Handling for Unmapped Trips
The dashboard map view MUST continue to operate when some trips lack destination coordinates.

#### Scenario: Trips without coordinates do not break rendering
- **GIVEN** the filtered trip set includes a trip missing destination coordinates
- **WHEN** the map renders
- **THEN** no marker is created for that trip
- **AND** the map, marker controls, and insights panel remain functional for the other trips

### Requirement: Consistent Modern Marker Styling
Trip markers MUST adopt the glassy/glassmorphism styling motifs used elsewhere in the dashboard and surface hover/selection states that match the design system.

#### Scenario: Marker styling matches system design
- **GIVEN** the dashboard map renders markers for multiple trips
- **WHEN** the user hovers or selects a marker
- **THEN** the marker glow, halo, and outline adjust smoothly in place without disappearing from the map
- **AND** the visual feedback differentiates hovered versus selected markers while remaining consistent with existing map controls

### Requirement: Robust Trip Map Interactions
The dashboard trip map MUST preserve hover highlights, selection focus, and popups even when the map style changes or the filtered trip list updates.

#### Scenario: Map retains state across style updates
- **GIVEN** the user selects a trip marker and then switches the map style or changes the dashboard filters
- **WHEN** the map reloads its style and the markers re-render
- **THEN** the selected trip remains focused with its popup reinstated when still present in the filtered results
- **AND** hover cues recover automatically without requiring a manual page refresh
