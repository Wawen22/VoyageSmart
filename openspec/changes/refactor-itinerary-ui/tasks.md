## 1. Implementation
- [ ] 1.1 Capture current itinerary behaviours, dependencies, and UI pain points to anchor regression coverage.
- [ ] 1.2 Extract itinerary data orchestration into `useItineraryController` with cache + Supabase handling.
- [ ] 1.3 Scaffold the new itinerary shell, navigation, and layout components with responsive grid structure.
- [ ] 1.4 Rebuild day and activity presenters using the glass design system while preserving CRUD flows.
- [ ] 1.5 Integrate calendar, map, journal, and proactive suggestion panels via shared context + suspense boundaries.
- [ ] 1.6 Reconnect modals, AI wizard, and floating actions through the new controller without regressions.
- [ ] 1.7 Apply glass-inspired styling tokens (colors, typography, shadows, motion) across components.
- [ ] 1.8 Implement accessibility enhancements, mobile-first patterns, and prefers-reduced-motion safeguards.
- [ ] 1.9 Update/create unit and integration tests for the controller and components.
- [ ] 1.10 Refresh or add Playwright scenarios and document rollout considerations.

## 2. Validation
- [ ] 2.1 `npm run lint` and `npm run typecheck`.
- [ ] 2.2 `npm run test` (unit/integration) with focus on itinerary slices/components.
- [ ] 2.3 `npm run test:e2e -- --grep "itinerary"` (or equivalent filtered suite).
- [ ] 2.4 Manual UX review across breakpoints with accessibility audit.
