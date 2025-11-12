# 📚 Itinerary UI/UX Refactor - Implementation Guide

## 🎯 Quick Start

Questa change proposal contiene il piano completo per il refactor UI/UX della sezione `/itinerary`. 

### 📂 File Structure

```
refactor-itinerary-ui-ux/
├── README.md                    ← You are here
├── proposal.md                  ← Why, What, Impact
├── design.md                    ← Technical decisions & architecture
├── tasks.md                     ← Implementation checklist
├── VISUAL_OVERVIEW.md          ← Visual guide & mockups
└── specs/
    └── itinerary/
        └── spec.md              ← Requirements deltas
```

### 🔍 Where to Start

1. **Understanding the Change**
   - Read `proposal.md` for high-level overview
   - Check `VISUAL_OVERVIEW.md` for visual design specs
   - Review `design.md` for technical decisions

2. **Implementation**
   - Follow `tasks.md` checklist sequentially
   - Reference `design.md` for patterns and guidelines
   - Use `specs/itinerary/spec.md` for acceptance criteria

3. **Validation**
   ```bash
   # Verify proposal is valid
   npx openspec validate refactor-itinerary-ui-ux --strict
   
   # View change summary
   npx openspec show refactor-itinerary-ui-ux
   
   # See spec differences
   npx openspec diff refactor-itinerary-ui-ux
   ```

---

## 📋 Document Overview

### [`proposal.md`](./proposal.md)
**Purpose**: Executive summary of the change  
**Contains**:
- Why we need this refactor
- What's changing (components, features, UX)
- Impact on users and codebase
- Migration strategy (4-week plan)
- Success metrics and risks

**Read when**: You need to understand the business case and scope

### [`design.md`](./design.md)
**Purpose**: Technical blueprint for implementation  
**Contains**:
- Architecture decisions (Timeline view, Glassmorphism, dnd-kit, etc.)
- Component specifications (DayCard, ActivityCard, etc.)
- Mobile optimizations (bottom sheets, FAB, swipes)
- Performance strategy (virtual scroll, caching, optimistic updates)
- Animation specifications
- Accessibility guidelines
- Testing strategy

**Read when**: You're implementing features and need technical guidance

### [`tasks.md`](./tasks.md)
**Purpose**: Step-by-step implementation checklist  
**Contains**:
- 11 major sections with ~200 subtasks
- Organized by phase (Foundation → Features → Views → Polish)
- Unit/Integration/E2E test requirements
- Documentation requirements
- Deployment checklist

**Read when**: You're tracking progress and completing work

### [`VISUAL_OVERVIEW.md`](./VISUAL_OVERVIEW.md)
**Purpose**: Visual design reference and mockups  
**Contains**:
- ASCII art mockups of components
- Color palette and gradient specifications
- Component architecture diagrams
- Animation specifications
- Before/after comparison
- Success metrics dashboard

**Read when**: You need to see what components should look like

### [`specs/itinerary/spec.md`](./specs/itinerary/spec.md)
**Purpose**: Requirements and acceptance criteria  
**Contains**:
- ADDED requirements (new features)
- MODIFIED requirements (enhanced existing)
- Detailed scenarios (GIVEN/WHEN/THEN format)
- Acceptance criteria for each feature

**Read when**: You need to verify feature completion and write tests

---

## 🎨 Key Design Principles

### 1. Glassmorphism Everywhere
```tsx
// Use existing glass classes from globals.css
<div className="glass-card rounded-2xl p-6">
  <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />
  <div className="relative z-10">{children}</div>
</div>
```

### 2. Timeline as Primary View
- Vertical timeline with visual connectors
- Days are expandable glass cards
- Activities shown chronologically with time indicators
- Drag & drop between days

### 3. Mobile-First
- Bottom sheets instead of centered modals
- Floating Action Button (FAB) for quick add
- Swipe gestures for navigation
- Touch-optimized controls (min 44x44px)

### 4. Performance First
- Virtual scrolling for >30 days
- Lazy loading for heavy views (Calendar, Map)
- Optimistic UI updates
- SessionStorage caching (5min TTL)

### 5. Accessibility First
- Keyboard navigation (Tab, Arrow keys, shortcuts)
- ARIA labels and roles
- Color contrast (4.5:1 text, 3:1 icons)
- Screen reader tested

---

## 🛠️ Implementation Workflow

### Phase 1: Foundation (Week 1)
```bash
# 1. Install dependencies
npm install @dnd-kit/core @dnd-kit/sortable @tanstack/react-virtual

# 2. Create base components
src/components/itinerary/
├── ActivityCard.tsx        ← Start here
├── DayCard.tsx
├── TimelineConnector.tsx
└── TimelineView.tsx

# 3. Write unit tests
src/__tests__/components/itinerary/
├── ActivityCard.test.tsx
└── DayCard.test.tsx
```

**Checklist**: Tasks 1.1 - 2.3 in `tasks.md`

### Phase 2: Features (Week 2)
```bash
# 1. Add interactions
src/components/itinerary/
├── FiltersBar.tsx          ← Filters & search
├── BulkActions.tsx         ← Multi-select
└── ActivityQuickAdd.tsx    ← Quick add

# 2. Implement drag & drop
# Reference: design.md → "Decision 3: Drag & Drop"

# 3. Add optimistic updates
# Reference: design.md → "Optimistic Updates"
```

**Checklist**: Tasks 3.1 - 3.4 in `tasks.md`

### Phase 3: Views (Week 3)
```bash
# 1. Refactor CalendarView
src/components/itinerary/CalendarView.tsx

# 2. Enhance MapView
src/components/itinerary/ItineraryMapView.tsx

# 3. Mobile optimizations
src/components/itinerary/
├── FloatingActionButton.tsx
└── BottomSheet.tsx
```

**Checklist**: Tasks 4.1 - 5.3 in `tasks.md`

### Phase 4: Polish (Week 4)
```bash
# 1. Performance
- Implement virtual scrolling
- Add lazy loading
- Optimize bundle size

# 2. Accessibility
- Keyboard navigation
- ARIA labels
- Screen reader testing

# 3. Testing
- E2E tests with Playwright
- Performance testing (Lighthouse)
- Cross-browser testing
```

**Checklist**: Tasks 6.1 - 10.3 in `tasks.md`

---

## 🎯 Acceptance Criteria

### Core Features
- [ ] Timeline view displays all days with visual connectors
- [ ] Activities show with glass design and priority colors
- [ ] Drag & drop works between days with visual feedback
- [ ] Search and filters work in real-time
- [ ] Mobile FAB and bottom sheets implemented
- [ ] Optimistic updates for all mutations
- [ ] Performance: <2s load time, >90 Lighthouse score

### Visual Design
- [ ] Glassmorphism applied to all components
- [ ] Animations smooth (60fps)
- [ ] Color coding by category and priority
- [ ] Responsive: mobile, tablet, desktop
- [ ] Dark mode support

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### Testing
- [ ] Unit tests: >80% coverage
- [ ] Integration tests for user flows
- [ ] E2E tests for critical paths
- [ ] Performance tests pass

---

## 📚 Reference Materials

### Code Examples

**ActivityCard with Glass Design**
```tsx
// Reference: VISUAL_OVERVIEW.md → "ActivityCard Design"
// Reference: design.md → "Component Specifications → ActivityCard"

<div className="glass-card rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300">
  {/* Priority bar */}
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl" />
  
  {/* Animated orbs */}
  <div className="absolute -top-10 -right-10 w-28 h-28 bg-red-500/20 rounded-full blur-2xl" />
  
  {/* Content */}
  <div className="relative z-10">
    <h3 className="font-bold">{activity.name}</h3>
    <div className="flex gap-2 mt-2">
      <Badge icon={Clock}>{formatTime(activity.start_time)}</Badge>
      <Badge icon={MapPin}>{activity.location}</Badge>
      <Badge icon={DollarSign}>{formatCurrency(activity.cost)}</Badge>
    </div>
  </div>
</div>
```

**Drag & Drop Setup**
```tsx
// Reference: design.md → "Decision 4: Drag & Drop"

import { DndContext, closestCenter } from '@dnd-kit/core';

function TimelineView() {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveActivity(active.id, over.id);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      {days.map(day => (
        <DayCard key={day.id} day={day} />
      ))}
    </DndContext>
  );
}
```

### Design Patterns

**Optimistic Update Pattern**
```typescript
// Reference: design.md → "Optimistic Updates"

const handleAddActivity = async (formData) => {
  const tempId = `temp_${Date.now()}`;
  
  // 1. Update UI immediately
  setActivities(prev => [...prev, { ...formData, id: tempId }]);
  
  // 2. Send to API
  try {
    const { data } = await supabase.from('activities').insert(formData);
    
    // 3. Replace temp with real
    setActivities(prev => prev.map(a => a.id === tempId ? data[0] : a));
  } catch (error) {
    // 4. Rollback on error
    setActivities(prev => prev.filter(a => a.id !== tempId));
    toast.error('Failed to add activity');
  }
};
```

---

## 🐛 Troubleshooting

### Common Issues

**Glass effect not visible**
```tsx
// Make sure parent has relative positioning
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20..." />
  <div className="relative z-10">{content}</div>
</div>
```

**Drag & drop not working on mobile**
```tsx
// Use long press for touch devices
import { useLongPress } from '@dnd-kit/core';

const { listeners, setNodeRef } = useDraggable({
  id: activity.id,
  activationConstraint: {
    delay: 250, // Long press delay
    tolerance: 5
  }
});
```

**Virtual scroll position jumps**
```tsx
// Use stable item keys
<VirtualList
  getItemKey={(index) => days[index].id} // Not index!
  estimateSize={() => 400}
/>
```

### Getting Help

1. Check `design.md` for technical decisions
2. Review `VISUAL_OVERVIEW.md` for visual specs
3. Refer to existing glassmorphism components in:
   - `src/app/trips/[id]/expenses/page.tsx`
   - `src/app/trips/[id]/chat/page.tsx`
4. Ask questions in team chat with context

---

## ✅ Definition of Done

A task is complete when:

- [ ] Code implemented per spec
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Glass design applied consistently
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark mode tested
- [ ] Accessibility verified
- [ ] Performance tested (no regressions)
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Lighthouse score >90
- [ ] No console errors/warnings
- [ ] Bundle size acceptable (<500KB increase)
- [ ] Tested on real devices (iOS Safari, Android Chrome)
- [ ] Accessibility audit complete

### Deployment Steps
```bash
# 1. Merge to main
git checkout main
git merge feature/refactor-itinerary-ui-ux

# 2. Deploy to staging
npm run deploy:staging

# 3. Smoke test staging
npm run test:e2e:staging

# 4. Deploy to production
npm run deploy:production

# 5. Monitor
# - Error logs (Sentry)
# - Performance (Lighthouse CI)
# - User feedback
```

### Rollback Plan
```bash
# If critical issues found
git revert [commit-hash]
npm run deploy:production

# Clear user caches
# Update status page
# Fix issues in dev
# Redeploy when ready
```

---

## 📞 Contacts

- **Proposal Author**: AI Agent
- **Review Required**: Product Team, Development Team
- **Questions**: Open issue in project repository

---

## 📈 Progress Tracking

Track progress by checking off tasks in `tasks.md`:

```bash
# View progress
grep -c "- \[x\]" tasks.md  # Completed
grep -c "- \[ \]" tasks.md  # Remaining

# Update task
# Edit tasks.md and change [ ] to [x]
```

---

**Status**: ✅ Proposal validated and ready for review

```bash
$ npx openspec validate refactor-itinerary-ui-ux --strict
✓ Change 'refactor-itinerary-ui-ux' is valid
```

**Next Step**: Get approval and start Phase 1 implementation! 🚀
