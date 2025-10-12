## ADDED Requirements
### Requirement: Dashboard hero and weather alignment
The system SHALL present the greeting hero card and Weather widget within a shared responsive layout that keeps them visually aligned, balanced, and centered on desktop and mobile viewports.

#### Scenario: Desktop alignment
- **GIVEN** an authenticated user opens `/dashboard` on a viewport ≥1024px
- **WHEN** the greeting hero and Weather widget render
- **THEN** both widgets appear in the same horizontal row, share consistent top alignment, and maintain even horizontal spacing within their container.

#### Scenario: Mobile stacking
- **GIVEN** an authenticated user opens `/dashboard` on a viewport ≤768px
- **WHEN** the greeting hero and Weather widget render
- **THEN** the widgets stack vertically, each centered within the viewport, with spacing that keeps the layout balanced and readable.

#### Scenario: Weather content centering
- **GIVEN** the Weather widget loads inside the shared container
- **THEN** its internal content remains centered and responsive to the container width so elements do not appear offset relative to the greeting hero card.
