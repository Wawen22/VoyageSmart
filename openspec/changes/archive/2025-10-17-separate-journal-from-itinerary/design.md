# Design: Separate Journal from Itinerary

## Current Implementation

Currently, the ITINERARY and JOURNAL features are combined into a single page at `/trips/[id]/itinerary`. This page uses a tabbed interface to switch between the two features. The file `src/app/trips/[id]/journal/page.tsx` simply redirects to the itinerary page with the journal tab pre-selected.

## Proposed Changes

To improve user experience and create a more modular architecture, we will separate the JOURNAL into its own dedicated page.

1.  **New Journal Page**: The existing redirect at `src/app/trips/[id]/journal/page.tsx` will be replaced with a new, standalone Journal page. This page will reuse the existing components from `src/components/journal/*` to display journal entries, the media gallery, and the memories timeline.

2.  **Updated Trip Actions**: The `src/components/trips/PersistentTripActions.tsx` component, which renders the "TRIP ACTIONS" sidebar, will be modified to include a direct link to the new `/trips/[id]/journal` page. This will provide users with clear and direct access to the Journal feature.

3.  **Simplified Itinerary Page**: The `src/app/trips/[id]/itinerary/page.tsx` file will be refactored to remove all Journal-related tabs, state management, and rendering logic. This will streamline the Itinerary page and focus it solely on its core functionality.

4.  **Routing and Navigation**: The mobile navigation in `src/components/layout/MobileNavbar.tsx` will be updated to reflect the new, separate routes for Itinerary and Journal.

5.  **Marketing and Documentation**: The marketing copy on the main landing page (`src/app/page.tsx`) and any relevant documentation will be updated to accurately describe the separated Itinerary and Journal features.
