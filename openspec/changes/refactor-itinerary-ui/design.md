## Overview
This refactor introduces a layered itinerary experience that separates data orchestration from presentation. A dedicated controller hook powers a glass-themed layout with modular panels, ensuring responsive behaviour and easier maintenance while keeping Supabase and Redux contracts intact.

## Architecture
- **Controller Layer**: `useItineraryController` centralises trip/day/activity fetching, caching, optimistic updates, and permission checks. It exposes typed selectors and command functions consumed by UI components.
- **Layout Shell**: A new `ItineraryShell` component composes loading, error, and content states. Inside, `ItineraryLayout` arranges navigation, primary content, and contextual panels using CSS Grid with responsive breakpoints.
- **Presentation Components**: Day/activity cards, nav rail, header, and floating actions live under `components/itinerary/v2`. They consume context instead of local state setters, reducing prop drilling.
- **Lazy Modules**: Heavy features (map, calendar, AI wizard, journal) remain lazily loaded but now sit behind suspense boundaries managed by the shell to guarantee consistent skeletons and error fallbacks.

## Data Flow
1. The shell initialises `useItineraryController`, which first checks Redux cache, then sessionStorage, and finally Supabase when data is stale.
2. Controller exposes derived collections for list, calendar, and map modes; commands update Redux and session cache before awaiting Supabase responses.
3. Feature panels (e.g., AI wizard, modals) register with the controller to read/write state, keeping behaviour parity with the current implementation.

## UI Structure
- **Header**: Displays trip summary, date range, and primary CTAs within a translucent panel with layered depth.
- **Navigation Rail / Toolbar**: Hosts view toggles, filters, and proactive suggestion access; collapses into a top toolbar on tablet and a bottom sheet entry point on mobile.
- **Primary Timeline**: Shows day columns with expandable glass cards, drag affordances, and inline stats. Mobile renders horizontally scrollable day chips with vertical activity lists.
- **Context Panel**: Switches between map, calendar, and journal tabs; becomes a drawer on smaller screens.
- **Floating Actions**: Provides FABs for adding days/activities and launching the AI wizard in mobile contexts.

## Styling System
- **Surfaces**: Use `backdrop-blur-md`, `bg-white/60` (light) and `bg-slate-900/50` (dark) with subtle borders `border-white/30` or `border-slate-700/50`.
- **Typography**: Align with existing Tailwind tokens; headings `text-2xl md:text-3xl`, body `text-sm md:text-base`, accent labels `tracking-tight`.
- **Motion**: Apply `transition-all duration-250 ease-out`, `motion-safe:animate-fade-in`, and disable large transitions under `prefers-reduced-motion`.
- **Shadow/Depth**: Employ layered drop shadows (`shadow-[0_8px_32px_-12px_rgba(15,23,42,0.35)]`) combined with faint inner borders to reinforce the glass aesthetic.

## Risks & Mitigations
- **Regression Risk**: Preserve all handler signatures and Redux actions; add controller tests and snapshot coverage.
- **Performance**: Maintain lazy loading, memoise derived data, and consider virtualization for long itineraries.
- **Accessibility**: Ensure high-contrast overlays and keyboard navigation for collapsible sections and modals.
