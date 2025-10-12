## Implementation
- [x] Audit `TripsMapView` and related hooks to centralize any summary data needed by the Map insights panel.
- [x] Remove the floating Map insights overlay from the map component while keeping map interactions intact.
- [x] Extend `MapInsightsPanel` to render the relocated metrics (trip totals, status counts, budgets, countdown).
- [x] Surface a mobile-visible control that allows toggling from map view back to the list/grid view.

## Validation
- [x] Manually verify on desktop that the map renders without an overlaid card and that the right-side panel includes the moved metrics.
- [x] Manually verify on a narrow viewport (≤640px) that the list toggle is obvious and switches views correctly.
