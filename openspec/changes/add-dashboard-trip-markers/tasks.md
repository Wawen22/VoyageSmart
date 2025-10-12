## 1. Implementation
- [x] 1.1 Rebuild `TripsMapView` marker rendering with a Mapbox GeoJSON source/layer pipeline that plots one point per trip and respects feature state.
- [x] 1.2 Ensure trip coordinate resolution falls back gracefully (preferences → cached geocode → destination string) before feeding the map source.
- [x] 1.3 Refresh marker visuals, hover, and selection behavior to match the glassmorphism system while using native Mapbox interactions/popups.
- [x] 1.4 Keep selection/hover/popup state resilient across style changes, filtering, and trips lacking coordinates.

## 2. Validation
- [ ] 2.1 Manually QA the dashboard map view (desktop + mobile breakpoints) to confirm markers, styling, and interactions perform as expected. _(Pending: local Next.js binary unavailable in this environment; please run visual QA when feasible.)_
