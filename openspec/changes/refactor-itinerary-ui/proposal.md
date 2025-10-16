## Why
The existing itinerary page mixes UI logic with data orchestration, relies on dated visual styles, and delivers an uneven mobile experience. Refactoring the section with a modern glass-inspired layout, responsive structure, and clearer component hierarchy will improve usability, maintainability, and performance without changing back-end contracts.

## What Changes
- Rebuild the itinerary page around a new shell/layout architecture that separates data control, navigation, and content panels.
- Redesign day and activity presenters using glassy cards, consistent spacing, and smooth motion while keeping all current CRUD capabilities.
- Preserve integrations (AI wizard, maps, calendar, journal, proactive suggestions) by routing them through shared context and lazy boundaries.
- Introduce a responsive grid system with dedicated mobile states and accessibility improvements.
- Document design guidelines (colors, typography, shadows, motion) so implementation aligns with the broader app system.

## Impact
- Requires coordinated UI updates across `src/app/trips/[id]/itinerary` and `src/components/itinerary` along with new shared hooks/services.
- No API or data contract changes; Supabase queries and Redux slice remain compatible.
- Demands new component tests and visual regressions to safeguard existing behaviors.
