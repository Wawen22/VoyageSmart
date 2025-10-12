## Why
- The dashboard map view currently displays a Map insights card directly on top of the map, reducing the available viewport and making the map feel cluttered.
- On mobile devices, the control to exit the map view and return to the list/grid view disappears, leaving users stuck.

## What Changes
- Remove the floating Map insights card from the TripsMapView overlay and relocate its useful metrics into the existing Map insights panel beside the map.
- Extend the Map insights panel to surface trip totals, status breakdown, budget summary, and next departure details formerly shown in the overlay.
- Ensure a clearly visible control is available on mobile to switch from map view back to the list/grid view.

## Impact
- UI-only adjustments to dashboard components; no data model or API changes expected.
- Requires updates to `src/components/dashboard/TripsMapView.tsx` and `src/app/dashboard/page.tsx`, plus related styling tweaks.
- Mobile navigation regression is resolved, improving usability for handset users.
