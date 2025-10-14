The current trip card implementation (`InteractiveTripCard`) is functional but has a complex, monolithic design that makes it difficult to update and modernize. The user wants to refactor the UI/UX to be more "modern and cool" while adhering to the existing glassmorphism design system.

This change introduces a new, cleaner `ModernTripCard` component that encapsulates the new design and separates concerns more effectively.

**Key Goals:**
- Refactor the trip card UI to be more modern, visually appealing, and aligned with the glassmorphism guide.
- Improve code structure by creating a new `ModernTripCard` component.
- Preserve all existing functionality (status indicators, hover effects, etc.).
- Add a new "favorite" feature to enhance user interaction.

**Non-Goals:**
- This change will not alter the data model or any backend APIs.
- It will not affect the "map" view mode on the dashboard.

**Affected Specs:**
- `trip-card-experience` (NEW)
