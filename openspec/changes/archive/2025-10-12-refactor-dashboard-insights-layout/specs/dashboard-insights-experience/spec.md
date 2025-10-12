## ADDED Requirements
### Requirement: Integrated Mobile Analytics Snapshot
The dashboard MUST surface the analytics snapshot inside the Travel & Analytics Insights module on mobile viewports instead of using a standalone card.

#### Scenario: Analytics inline on small screens
- **GIVEN** a signed-in user views the dashboard on a viewport ≤ 1024px wide
- **WHEN** the Travel & Analytics Insights module renders
- **THEN** the analytics snapshot content (metrics header, highlight chips, and key totals) appears within that module
- **AND** no separate analytics card appears elsewhere on the dashboard for the same content

### Requirement: Glassmorphism Travel Insights Layout
The Travel & Analytics Insights module MUST present its content within modern glassmorphism-styled cards that align with the dashboard design system.

#### Scenario: Modern glass cards for insights
- **GIVEN** a user loads the dashboard on any supported viewport
- **WHEN** the Travel & Analytics Insights module is displayed
- **THEN** its primary segments (analytics snapshot, insight cards, top destinations) use translucent layered cards, rounded corners, and soft shadows consistent with the dashboard's glassy aesthetic
- **AND** spacing and typography establish a clear hierarchy between the analytics snapshot and supporting insights
