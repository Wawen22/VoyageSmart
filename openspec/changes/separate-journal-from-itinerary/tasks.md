## 1. Implementation
- [x] 1.1 Create the new Journal page at `src/app/trips/[id]/journal/page.tsx`, reusing existing components from `src/components/journal/*`.
- [x] 1.2 Update `src/components/trips/PersistentTripActions.tsx` to add a new link to the `/trips/[id]/journal` page.
- [x] 1.3 Refactor `src/app/trips/[id]/itinerary/page.tsx` to remove all Journal-related tabs, state, and rendering logic.
- [x] 1.4 Update the `isTripPlannerPage` logic in `src/components/layout/MobileNavbar.tsx` to correctly handle the new separate journal page.
- [x] 1.5 Update the marketing copy in `src/app/page.tsx` to reflect that Itinerary and Journal are now separate features.

## 2. Validation
- [x] 2.1 Write a unit test for the new Journal page to ensure it renders correctly and fetches data.
- [x] 2.2 Update unit tests for `PersistentTripActions.tsx` to verify the presence and correctness of the new Journal link.
- [x] 2.3 Update tests for the `itinerary/page.tsx` to ensure all journal-related elements have been removed.
- [x] 2.4 Write a new Playwright E2E test to verify the user flow: clicking the "Journal" link in the Trip Actions and successfully navigating to the dedicated Journal page.
- [x] 2.5 Manually test the entire trip planning flow (Itinerary, Journal, Accommodations, etc.) to ensure the separation has not introduced any regressions and the app remains stable.