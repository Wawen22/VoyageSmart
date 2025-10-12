## Why
- The dashboard map currently displays trips but lacks per-trip markers derived from their primary destinations, making it harder to visually parse where each trip is located.
- Users requested a cleaner, more modern map experience aligned with the glassy styling used elsewhere in the product.

## What Changes
- Plot a single marker for every trip that has a primary destination (or fallback destination) when viewing the dashboard map.
- Refactor the dashboard map to feed a GeoJSON source and custom circle layers so hover/selection states, popups, and zooming stay reliable even through style swaps.
- Style those markers and associated map UI elements with the existing glassmorphism-inspired design language for visual consistency.
- Ensure the map gracefully handles trips without mapped destinations without regressing existing interactions.

## Impact
- Frontend-only changes within the dashboard map experience; no API or database updates expected.
- Requires updates to `src/components/dashboard/TripsMapView.tsx` (and related styling assets, if any).
- Medium refactor risk where map rendering logic now depends on Mapbox sources/layers and feature state; regression testing should focus on marker visibility, popups, and insights panel behaviour.
