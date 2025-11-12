# Itinerary UI/UX Refactor - Technical Design

## Context

L'attuale sezione itinerary utilizza una struttura basica con layout a lista e componenti poco coerenti con il design system dell'applicazione. Il refactor mira a creare un'esperienza moderna e fluida mantenendo la compatibilità con il data layer esistente.

**Constraints:**
- Mantenere header esistente (già ottimizzato)
- Non modificare schema database o API
- Supportare dark/light mode
- Compatibilità browser moderni (Chrome, Safari, Firefox)
- Performance su mobile (target: <3s load time)

**Stakeholders:**
- End users (miglioramento UX)
- Development team (manutenibilità)
- Product team (metriche engagement)

## Goals / Non-Goals

### Goals
- Creare esperienza visuale moderna con glassmorphism
- Migliorare drasticamente UX mobile
- Ridurre tempo per aggiungere/modificare attività del 40%
- Implementare interazioni intuitive (drag & drop, quick actions)
- Mantenere performance eccellente (<2s load)

### Non-Goals
- Modificare schema database o API backend
- Aggiungere features completamente nuove (es: condivisione social)
- Supportare browser legacy (IE11)
- Redesign di altre sezioni (focus solo su itinerary)

## Architecture Overview

### Component Structure

```
ItineraryPage
├── Header (existing, preserved)
├── ViewSwitcher (List/Timeline/Calendar/Map)
├── FiltersBar (NEW)
│   ├── SearchInput
│   ├── CategoryFilter
│   └── SortOptions
├── MainContent
│   ├── TimelineView (NEW - default)
│   │   ├── DayCard (refactored)
│   │   │   ├── DayHeader
│   │   │   ├── DaySummary
│   │   │   └── ActivityList
│   │   │       └── ActivityCard (refactored)
│   │   └── TimelineConnector
│   ├── CalendarView (refactored)
│   ├── MapView (enhanced)
│   └── EmptyState (NEW)
├── FloatingActionButton (mobile only)
└── Modals
    ├── ActivityModal (refactored)
    ├── DayModal (refactored)
    ├── BulkActionsModal (NEW)
    └── MoveActivityModal (existing)
```

### Data Flow

```
Page Load
  ↓
SessionStorage Check → Cache Hit? → Use Cache
  ↓ (miss)
Supabase Fetch → Transform → Display
  ↓
User Interaction → Optimistic Update → API Call
  ↓
Success? → Confirm UI | Rollback UI
```

## Decisions

### Decision 1: Timeline View as Default
**What:** Sostituire la vista lista con una timeline verticale moderna

**Why:**
- Più intuitiva per visualizzare cronologia giorno per giorno
- Permette migliore visualizzazione dei collegamenti temporali
- Design più moderno e ingaggiante
- Facilita comprensione del flusso del viaggio

**Alternatives considered:**
1. Mantenere lista esistente - Respinta: non abbastanza visuale
2. Gantt chart - Respinta: troppo complessa per mobile
3. Kanban board - Respinta: non adatta per timeline cronologica

**Implementation:**
```tsx
// TimelineView.tsx
- Giorni disposti verticalmente con connettori
- Ogni giorno è una DayCard espandibile
- Attività mostrate in timeline orizzontale dentro ogni giorno
- Visual connectors tra giorni (linea verticale)
- Drag & drop tra giorni con visual feedback
```

### Decision 2: Glassmorphism Design System
**What:** Applicare glassmorphism completo su tutti i componenti

**Why:**
- Coerenza con resto dell'app (expenses, chat già usano glassy)
- Design moderno e attraente
- Migliora leggibilità con backdrop blur
- Supporta dark mode naturalmente

**Alternatives considered:**
1. Material Design - Respinta: troppo comune
2. Flat design - Respinta: non abbastanza distintivo
3. Neumorphism - Respinta: problemi accessibility

**Implementation:**
```tsx
// Riutilizzare classi esistenti da globals.css:
- glass-card - Card base
- glass-button-primary - CTA buttons
- glass-info-card - Info panels
- animate-glass-fade-in - Entrance animations
- glass-grid-pattern - Background patterns

// Colori orb gradients per categoria:
- Food: from-orange-500/30 to-amber-500/30
- Culture: from-purple-500/30 to-pink-500/30
- Transport: from-blue-500/30 to-cyan-500/30
- Accommodation: from-teal-500/30 to-emerald-500/30
- General: from-blue-500/30 to-purple-500/30
```

### Decision 3: Component-First Refactor
**What:** Rifattorizzare bottom-up partendo dai componenti atomici

**Why:**
- Permette riutilizzo massimo
- Facilita testing isolato
- Deployment incrementale possibile
- Reduce blast radius

**Alternatives considered:**
1. Top-down refactor - Respinta: richiede big bang deployment
2. Parallel implementation - Respinta: duplicazione codice
3. Feature flag approach - Considerata: troppo complessa per questo caso

**Implementation order:**
1. ActivityCard + DayCard (settimana 1)
2. TimelineView (settimana 2)
3. Filters + Quick actions (settimana 2-3)
4. Calendar/Map refactor (settimana 3)
5. Mobile optimizations (settimana 4)

### Decision 4: Drag & Drop con dnd-kit
**What:** Usare @dnd-kit/core per drag & drop

**Why:**
- Migliore performance di react-beautiful-dnd
- Supporto touch nativo
- Accessibilità built-in
- Migliore tree-shaking

**Alternatives considered:**
1. react-beautiful-dnd - Respinta: deprecated, pesante
2. react-dnd - Respinta: API complessa
3. Custom implementation - Respinta: troppo effort, accessibility issues

**Implementation:**
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// ActivityCard draggable
// DayCard droppable
// Visual feedback con CSS transforms
```

### Decision 5: Virtual Scrolling per Performance
**What:** Implementare virtual scrolling per liste lunghe (>30 giorni)

**Why:**
- Prevent performance issues con trip lunghi
- Smooth scrolling anche con 100+ attività
- Memory footprint ridotto

**Alternatives considered:**
1. Pagination - Respinta: interrompe flusso visivo
2. Infinite scroll - Respinta: non adatto per timeline
3. Nessuna ottimizzazione - Respinta: performance issues certi

**Implementation:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Solo per liste >30 items
// Mantiene 5 items buffer sopra/sotto viewport
```

## Component Specifications

### DayCard (Refactored)

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│ 📅 Lunedì 15 Gennaio 2024          [...]    │ <- Header glass
│ ─────────────────────────────────────────── │
│ 🎯 4 activities • €120 • 8h                 │ <- Summary
│ ▓▓▓▓▓▓░░░░ 60% completed                    │ <- Progress
│                                              │
│ [+ Add Activity]                             │ <- Quick add
│                                              │
│ ┌─ 09:00 ─────────────────────────────────┐│
│ │ 🍳 Breakfast at Local Café         [≡]  ││ <- ActivityCard
│ │ 📍 Via Roma, 123 • €15                   ││
│ │ [✓] [✏️] [🗑️]                            ││
│ └─────────────────────────────────────────┘│
│   │                                          │
│   └─ 11:00 ────────────────────────────────│
│      🏛️ Museum Tour...                      │
│                                              │
└─────────────────────────────────────────────┘
```

**Props:**
```tsx
interface DayCardProps {
  day: ItineraryDay;
  activities: Activity[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddActivity: () => void;
  onEditDay: () => void;
  onDeleteDay: () => void;
}
```

**Features:**
- Glassmorphism background with animated orbs
- Smooth expand/collapse with spring animation
- Summary bar con metriche aggregate
- Progress indicator animato
- Quick actions su hover
- Responsive: stack vertical su mobile

### ActivityCard (Refactored)

**Visual Design:**
```
┌────────────────────────────────────────────┐
│▌ 🎨 Art Gallery Visit           High       │ <- Priority bar (left)
│▌ ──────────────────────────────────────── │
│▌ ⏰ 14:00 - 16:00  📍 Downtown  💰 €25    │ <- Badges
│▌                                           │
│▌ "Don't miss the Renaissance collection"  │ <- Notes preview
│▌                                           │
│▌ 👁️ View • ✏️ Edit • 📤 Move • 🗑️ Delete │ <- Actions
└────────────────────────────────────────────┘
```

**Priority Colors:**
- High (1): Red left border + red-500/20 orbs
- Medium (2): Orange left border + orange-500/20 orbs
- Low (3): Blue left border + blue-500/20 orbs

**Status Indicators:**
- Planned: Blue badge
- Confirmed: Green badge with checkmark
- Completed: Gray with checkmark, opacity 0.7
- Cancelled: Red badge, strikethrough text

**Interactions:**
- Hover: Scale 1.02, shadow intensifies
- Drag: Ghost element follows cursor
- Select mode: Checkbox appears on left
- Long press (mobile): Context menu

### FiltersBar (NEW)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 🔍 [Search activities...]    🎯 Category ▾       │
│                              ⚡ Priority ▾        │
│                              📊 Sort: Time ▾      │
└──────────────────────────────────────────────────┘
```

**Features:**
- Search: Real-time filter su name, location, notes
- Category filter: Multi-select con icone
- Priority filter: High/Medium/Low
- Sort: Time, Priority, Cost, Name
- Clear all button quando filters attivi

### FloatingActionButton (Mobile)

**Design:**
```
        [+]  <- FAB bottom-right
        Glass effect
        Primary gradient
        Ripple on tap
```

**Behavior:**
- Fixed position bottom-right
- Hides on scroll down
- Shows on scroll up
- Opens quick add modal on tap
- Scale animation on press

## Mobile Optimizations

### Responsive Breakpoints
```scss
// Tailwind breakpoints
xs: 0-639px     // Mobile small
sm: 640-767px   // Mobile large
md: 768-1023px  // Tablet
lg: 1024+px     // Desktop
```

### Mobile-Specific Features

**Bottom Sheet Modals:**
```tsx
// Instead of centered modals, use bottom sheets on mobile
<BottomSheet isOpen={showModal}>
  <ActivityForm />
</BottomSheet>
```

**Swipe Gestures:**
```tsx
// Swipe left/right to navigate days
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => goToNextDay(),
  onSwipedRight: () => goToPrevDay(),
});
```

**Touch-Optimized Controls:**
- Minimum touch target: 44x44px
- Increased spacing between actions
- Larger drag handles
- Haptic feedback on actions (if supported)

**Compact Cards:**
```tsx
// Mobile ActivityCard: single column, badges wrap
<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <div className="flex flex-wrap gap-1">
    {badges.map(badge => <Badge key={badge} />)}
  </div>
  <div className="flex gap-1 ml-auto">
    {actions.map(action => <ActionButton key={action} />)}
  </div>
</div>
```

## Performance Strategy

### Loading Strategy
```tsx
// 1. Initial load: Show skeleton
<ItinerarySkeleton count={3} />

// 2. Load visible viewport
const visibleDays = days.slice(0, 5);

// 3. Lazy load rest
useEffect(() => {
  if (isNearBottom) {
    loadMoreDays();
  }
}, [isNearBottom]);
```

### Cache Strategy
```typescript
// SessionStorage for recent views
const CACHE_KEY = `itinerary_${tripId}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// On load
const cached = sessionStorage.getItem(CACHE_KEY);
if (cached && !isExpired(cached)) {
  return JSON.parse(cached);
}

// On fetch success
sessionStorage.setItem(CACHE_KEY, JSON.stringify({
  timestamp: Date.now(),
  data: itineraryData
}));
```

### Optimistic Updates
```typescript
// Activity creation
const handleAddActivity = async (formData) => {
  const tempId = `temp_${Date.now()}`;
  
  // 1. Update UI immediately
  setActivities(prev => [...prev, { ...formData, id: tempId }]);
  
  // 2. Send to API
  try {
    const { data } = await supabase
      .from('activities')
      .insert(formData)
      .select();
    
    // 3. Replace temp with real
    setActivities(prev => 
      prev.map(a => a.id === tempId ? data[0] : a)
    );
  } catch (error) {
    // 4. Rollback on error
    setActivities(prev => prev.filter(a => a.id !== tempId));
    toast.error('Failed to add activity');
  }
};
```

### Bundle Size Optimization
```javascript
// Lazy load heavy components
const CalendarView = lazy(() => import('./CalendarView'));
const MapView = lazy(() => import('./MapView'));
const ItineraryWizard = lazy(() => import('./ItineraryWizard'));

// Code splitting by route
// itinerary page: ~150KB
// calendar lib: ~100KB (lazy)
// map lib: ~80KB (lazy)
```

## Animation Specifications

### Transitions
```scss
// Card expand/collapse
.day-card {
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

// Activity card hover
.activity-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.activity-card:hover {
  transform: translateY(-4px) scale(1.02);
}

// Glass fade in
@keyframes glass-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    backdrop-filter: blur(12px);
  }
}
```

### Drag & Drop Animations
```tsx
// Ghost element during drag
const dragOverlay = (
  <div className="opacity-60 rotate-3 scale-95">
    <ActivityCard {...activity} />
  </div>
);

// Drop zone highlight
const dropZoneClass = isDraggingOver 
  ? "ring-2 ring-primary/50 bg-primary/5" 
  : "";
```

## Accessibility

### Keyboard Navigation
```tsx
// Tab order
1. View switcher
2. Filters
3. Search input
4. Day cards (expandable)
5. Activity cards
6. Action buttons

// Shortcuts
Ctrl/Cmd + N: New activity
Ctrl/Cmd + F: Focus search
Escape: Close modals
Enter: Confirm actions
Arrow keys: Navigate timeline
```

### Screen Reader Support
```tsx
// ARIA labels
<button aria-label="Add new activity to Monday, January 15">
  <PlusIcon />
</button>

<div role="region" aria-label="Itinerary timeline">
  {days.map(day => (
    <article 
      key={day.id}
      aria-labelledby={`day-${day.id}-title`}
    >
      <h2 id={`day-${day.id}-title`}>
        {formatDate(day.date)}
      </h2>
    </article>
  ))}
</div>
```

### Color Contrast
- Text on glass: min 4.5:1 contrast
- Icons: min 3:1 contrast
- Focus indicators: 3px solid ring
- Status badges: test with color blindness simulators

## Testing Strategy

### Unit Tests
```typescript
// Component tests
describe('ActivityCard', () => {
  it('renders activity details correctly');
  it('shows priority indicator with correct color');
  it('handles edit action');
  it('handles delete with confirmation');
  it('supports drag and drop');
});
```

### Integration Tests
```typescript
// User flows
describe('Add Activity Flow', () => {
  it('opens modal on FAB click');
  it('validates form fields');
  it('saves activity optimistically');
  it('shows success toast');
  it('updates timeline');
});
```

### E2E Tests (Playwright)
```typescript
test('itinerary timeline workflow', async ({ page }) => {
  await page.goto('/trips/123/itinerary');
  
  // Check timeline renders
  await expect(page.locator('.timeline-view')).toBeVisible();
  
  // Add activity
  await page.click('[aria-label="Add activity"]');
  await page.fill('[name="name"]', 'Lunch');
  await page.click('button:has-text("Save")');
  
  // Verify activity appears
  await expect(page.locator('text=Lunch')).toBeVisible();
});
```

### Performance Tests
```typescript
// Lighthouse CI
- Performance score: >90
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
```

## Migration Plan

### Phase 1: Foundation (Week 1)
- [ ] Setup new component structure
- [ ] Implement ActivityCard with glassmorphism
- [ ] Implement DayCard with timeline connectors
- [ ] Basic drag & drop
- [ ] Unit tests

### Phase 2: Core Features (Week 2)
- [ ] Implement TimelineView as default
- [ ] Add FiltersBar (search, category, sort)
- [ ] Quick actions (add, edit, delete)
- [ ] Bulk operations
- [ ] Optimistic updates

### Phase 3: Views Enhancement (Week 3)
- [ ] Refactor CalendarView with glassmorphism
- [ ] Enhance MapView with routes
- [ ] Improve modals (bottom sheets on mobile)
- [ ] Add empty states
- [ ] Integration tests

### Phase 4: Polish (Week 4)
- [ ] Mobile optimizations (FAB, swipes, bottom sheets)
- [ ] Performance optimizations (virtual scroll, lazy load)
- [ ] Accessibility audit
- [ ] Animation polish
- [ ] E2E tests
- [ ] Documentation

### Rollback Plan
Se ci sono problemi critici:
1. Revert PR merge
2. Restore previous page component
3. Clear user cache (sessionStorage)
4. Monitor error rates
5. Fix issues in dev
6. Redeploy dopo testing

## Open Questions

1. **Undo/Redo**: Implementare stack undo/redo per drag & drop?
   - **Proposta**: Sì, con Ctrl+Z / Cmd+Z, stack max 10 azioni
   
2. **Offline support**: Cache activities per uso offline?
   - **Proposta**: Fase 2, usare service worker per cache

3. **Real-time collaboration**: Mostrare editing di altri utenti?
   - **Proposta**: Out of scope, possibile feature futura

4. **Template activities**: Salvare attività come templates?
   - **Proposta**: Out of scope per questo refactor

5. **AI suggestions position**: Dove mostrare AI wizard button?
   - **Proposta**: Mantenere posizione attuale (floating), ma con glassmorphism
