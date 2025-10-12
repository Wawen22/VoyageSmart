## 1. Implementation
- [x] 1.1 Audit the current `/dashboard` layout structure to identify containers controlling the hero greeting and Weather widget placement.
- [x] 1.2 Update the layout (container, grid/flex utilities, spacing) so the widgets align horizontally on desktop and stack centered on tablet/mobile.
- [x] 1.3 Adjust `ModernDashboardHeader` styling or wrapper to match the Weather widget height and centering rules.
- [x] 1.4 Refine `WeatherWidget` styling to remain centered inside the shared container and support the new responsive widths.
- [x] 1.5 Verify the updates do not break other dashboard widgets or introduce layout regressions.

## 2. Quality
- [x] 2.1 Manually test `/dashboard` across breakpoints (mobile ≤640px, tablet ≈768px, desktop ≥1024px) to confirm alignment and centering.
- [x] 2.2 Run `npm run lint` (and relevant smoke tests if impacted) to ensure no tooling failures.
