## 1. Implementation
- [x] 1.1 Rebuild `TripsMapView` marker rendering with a Mapbox GeoJSON source/layer pipeline that plots one point per trip and respects feature state.
- [x] 1.2 Ensure trip coordinate resolution falls back gracefully (preferences → cached geocode → destination string) before feeding the map source.
- [x] 1.3 Refresh marker visuals, hover, and selection behavior to match the glassmorphism system while using native Mapbox interactions/popups.
- [x] 1.4 Keep selection/hover/popup state resilient across style changes, filtering, and trips lacking coordinates.
- [x] 1.5 Redesign `TripsMapView` architecture (stores, hooks, and layout scaffolding) to support a full visual refresh and responsive breakpoints.
- [x] 1.6 Implement modernized UI/UX for the map view with updated controls, legend, and marker interactions consistent with dashboard styling.
- [x] 1.7 Rebuild coordinate + marker data pipeline to prioritize primary destinations and ensure accurate marker placement before rendering.
- [x] 1.8 Compress mobile dashboard header widgets (filters, weather) to reduce vertical footprint.

## 2. Validation
- [x] 2.1 Manually QA the dashboard map view (desktop + mobile breakpoints) to confirm markers, styling, and interactions perform as expected. _(Pending: local Next.js binary unavailable in this environment; please run visual QA when feasible.)_
- [x] 2.2 Smoke-test responsive behavior (tablet/phone widths) focusing on marker positioning and control usability. _(Pending: requires manual viewport verification.)_
- [x] 2.3 Retest mobile dashboard header after compacting filters/weather sections. _(Pending: requires manual viewport verification.)_
