## Why
The `/dashboard` hero section currently renders the greeting card and Weather widget with mismatched alignment, leaving the cards offset and visually unbalanced. This hurts first impressions and makes the primary widgets appear disconnected.

## What Changes
- Refine the dashboard hero container so the greeting (“Good morning”) and Weather widget share a consistent responsive layout (side-by-side on desktop, stacked and centered on smaller viewports).
- Normalize card sizing, spacing, and vertical alignment between the widgets to achieve a cohesive look.
- Tweak the Weather widget styling so its content remains centered within the new layout and adapts cleanly to the revised widths.

## Impact
- Affected specs: `dashboard-overview`
- Affected code: `src/app/dashboard/page.tsx`, `src/components/dashboard/ModernDashboardHeader.tsx`, `src/components/dashboard/WeatherWidget.tsx`, shared dashboard layout utilities (e.g., spacing helpers, container classes)
