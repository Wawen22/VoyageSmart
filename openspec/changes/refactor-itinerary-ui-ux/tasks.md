# Itinerary UI/UX Refactor - Implementation Tasks

## 1. Setup & Foundation

### 1.1 Project Setup
- [ ] 1.1.1 Install dependencies (@dnd-kit/core, @tanstack/react-virtual)
- [ ] 1.1.2 Create new component directory structure
- [ ] 1.1.3 Setup Storybook stories for new components (optional)
- [ ] 1.1.4 Create type definitions for new components

### 1.2 Base Components
- [ ] 1.2.1 Create `ActivityCard` component with glassmorphism
  - Priority indicator (colored left border)
  - Time, location, cost badges
  - Status indicator
  - Quick actions (view, edit, move, delete)
  - Hover animations
  - Dark mode support
  
- [ ] 1.2.2 Create `DayCard` component with timeline design
  - Glass header with date
  - Summary bar (activities count, total cost, duration)
  - Progress indicator
  - Expand/collapse animation
  - Quick add button
  - Timeline connector visual
  
- [ ] 1.2.3 Create `TimelineConnector` component
  - Vertical line between days
  - Animated dots/circles
  - Responsive design

### 1.3 Unit Tests
- [ ] 1.3.1 Test ActivityCard rendering and interactions
- [ ] 1.3.2 Test DayCard expand/collapse behavior
- [ ] 1.3.3 Test priority and status indicators

## 2. Timeline View Implementation

### 2.1 Core Timeline
- [ ] 2.1.1 Create `TimelineView` component
  - Vertical layout with days
  - Scroll behavior
  - Empty state handling
  
- [ ] 2.1.2 Integrate DayCard in TimelineView
  - Map days to DayCards
  - Handle expand/collapse state
  - Maintain scroll position
  
- [ ] 2.1.3 Integrate ActivityCard in DayCard
  - Map activities to ActivityCards
  - Sort by start time
  - Handle empty activities state

### 2.2 Drag & Drop
- [ ] 2.2.1 Setup DndContext in TimelineView
- [ ] 2.2.2 Make ActivityCard draggable
  - Add drag handle
  - Ghost element during drag
  - Visual feedback
  
- [ ] 2.2.3 Make DayCard droppable
  - Highlight drop zone
  - Handle drop events
  - Update database
  
- [ ] 2.2.4 Add drag & drop animations
  - Smooth transitions
  - Drop confirmation
  - Undo toast notification

### 2.3 Integration
- [ ] 2.3.1 Replace current list view with TimelineView
- [ ] 2.3.2 Connect to existing data fetching
- [ ] 2.3.3 Handle loading states with skeletons
- [ ] 2.3.4 Handle error states

## 3. Interactions & Features

### 3.1 Filters & Search
- [ ] 3.1.1 Create `FiltersBar` component
  - Search input with icon
  - Category multi-select
  - Priority filter
  - Sort dropdown
  
- [ ] 3.1.2 Implement search functionality
  - Real-time filtering
  - Highlight matching text
  - Clear search button
  
- [ ] 3.1.3 Implement category filter
  - Multi-select with checkboxes
  - Icon per category
  - Apply/clear buttons
  
- [ ] 3.1.4 Implement sort functionality
  - Sort by time, priority, cost, name
  - Persist sort preference
  - Visual indicator for active sort

### 3.2 Quick Actions
- [ ] 3.2.1 Implement quick edit inline
  - Edit activity name inline
  - Edit time inline
  - Save on blur/enter
  
- [ ] 3.2.2 Create `BulkActions` component
  - Select mode toggle
  - Checkbox on activities
  - Bulk delete
  - Bulk move
  - Select all/none
  
- [ ] 3.2.3 Add context menu (desktop)
  - Right-click on activity
  - Quick actions menu
  - Keyboard shortcuts

### 3.3 Smart Features
- [ ] 3.3.1 Add location autocomplete
  - Integrate with existing location picker
  - Recent locations
  - Popular destinations
  
- [ ] 3.3.2 Implement time slot suggestions
  - Based on existing activities
  - Avoid overlaps
  - Smart defaults (lunch at 12-14, dinner at 19-21)
  
- [ ] 3.3.3 Add budget warnings
  - Calculate total vs budget
  - Warning badge if over budget
  - Visual indicator on activities
  
- [ ] 3.3.4 Implement conflict detection
  - Detect overlapping activities
  - Warning icon on conflicts
  - Suggestion to resolve

### 3.4 Modals Redesign
- [ ] 3.4.1 Refactor `ActivityModal`
  - Apply glassmorphism
  - Organize form in sections
  - Improve validation feedback
  - Add location map picker
  - Add category selector with icons
  
- [ ] 3.4.2 Refactor `DayModal`
  - Apply glassmorphism
  - Improve date picker
  - Add weather forecast preview
  
- [ ] 3.4.3 Create `BulkActionsModal`
  - Confirm bulk delete
  - Bulk move day selector
  - Cancel/confirm actions

## 4. Views Enhancement

### 4.1 Calendar View Refactor
- [ ] 4.1.1 Apply glassmorphism to calendar
  - Glass cards for events
  - Hover effects
  - Click to view details
  
- [ ] 4.1.2 Add event tooltips
  - Show on hover
  - Activity preview
  - Click to edit
  
- [ ] 4.1.3 Add quick add to calendar
  - Click on day to add activity
  - Modal with pre-filled date
  
- [ ] 4.1.4 Improve mobile calendar
  - Larger touch targets
  - Swipeable months
  - Bottom sheet modals

### 4.2 Map View Enhancement
- [ ] 4.2.1 Custom markers with glassmorphism
  - Category-specific icons
  - Glass background
  - Priority indicator
  
- [ ] 4.2.2 Add clustering for nearby activities
  - Cluster markers
  - Expand on click
  - Show count
  
- [ ] 4.2.3 Implement route visualization
  - Connect activities of same day
  - Show travel time/distance
  - Color code by day
  
- [ ] 4.2.4 Add side panel for selected activity
  - Show details
  - Edit/delete actions
  - Navigate to next/prev activity

### 4.3 Empty States
- [ ] 4.3.1 Create timeline empty state
  - Illustration
  - CTA to add first day
  - Helpful tips
  
- [ ] 4.3.2 Create day empty state
  - Add activity prompt
  - Suggestions based on location
  
- [ ] 4.3.3 Create filtered empty state
  - "No results" message
  - Clear filters CTA

## 5. Mobile Optimization

### 5.1 Responsive Design
- [ ] 5.1.1 Make DayCard mobile-responsive
  - Stack elements vertically
  - Larger touch targets
  - Compact summary
  
- [ ] 5.1.2 Make ActivityCard mobile-responsive
  - Single column badges
  - Larger action buttons
  - Swipe actions (edit, delete)
  
- [ ] 5.1.3 Optimize FiltersBar for mobile
  - Collapsible filters
  - Bottom sheet on mobile
  - Sticky position

### 5.2 Mobile-Specific Components
- [ ] 5.2.1 Create `FloatingActionButton`
  - Fixed bottom-right position
  - Hide on scroll down
  - Show on scroll up
  - Ripple animation
  
- [ ] 5.2.2 Implement bottom sheet modals
  - Replace centered modals on mobile
  - Swipe to dismiss
  - Smooth animations
  
- [ ] 5.2.3 Add swipe gestures
  - Swipe left/right to navigate days
  - Swipe on activity for quick actions
  - Visual feedback

### 5.3 Touch Optimizations
- [ ] 5.3.1 Increase touch target sizes (min 44x44px)
- [ ] 5.3.2 Add haptic feedback (if supported)
- [ ] 5.3.3 Optimize drag & drop for touch
  - Long press to initiate drag
  - Visual feedback
  - Easy drop zones

## 6. Performance Optimization

### 6.1 Loading & Caching
- [ ] 6.1.1 Implement skeleton loading
  - DayCard skeleton
  - ActivityCard skeleton
  - Smooth transitions
  
- [ ] 6.1.2 Setup sessionStorage caching
  - Cache fetched data
  - 5-minute TTL
  - Invalidate on mutations
  
- [ ] 6.1.3 Implement lazy loading for views
  - Lazy load CalendarView
  - Lazy load MapView
  - Lazy load ItineraryWizard
  
- [ ] 6.1.4 Add virtual scrolling for long lists
  - Use @tanstack/react-virtual
  - Only for >30 days
  - Maintain scroll position

### 6.2 Optimistic Updates
- [ ] 6.2.1 Implement for activity creation
  - Update UI immediately
  - Send API request
  - Rollback on error
  
- [ ] 6.2.2 Implement for activity updates
  - Inline edits
  - Drag & drop
  - Status changes
  
- [ ] 6.2.3 Implement for activity deletion
  - Remove from UI
  - Undo toast
  - Rollback if needed

### 6.3 Bundle Optimization
- [ ] 6.3.1 Code split by route
- [ ] 6.3.2 Lazy load heavy dependencies
- [ ] 6.3.3 Optimize images and icons
- [ ] 6.3.4 Remove unused code

## 7. Polish & Accessibility

### 7.1 Animations
- [ ] 7.1.1 Polish expand/collapse animations
  - Spring physics
  - Smooth timing
  - Respect prefers-reduced-motion
  
- [ ] 7.1.2 Add micro-interactions
  - Button hover effects
  - Card hover lift
  - Badge animations
  
- [ ] 7.1.3 Implement glass fade-in animations
  - Stagger children
  - Entrance delays
  - Exit animations

### 7.2 Accessibility
- [ ] 7.2.1 Implement keyboard navigation
  - Tab order
  - Arrow key navigation in timeline
  - Keyboard shortcuts (Ctrl+N, Ctrl+F, etc.)
  
- [ ] 7.2.2 Add ARIA labels and roles
  - All buttons and actions
  - Dynamic content
  - Status announcements
  
- [ ] 7.2.3 Ensure color contrast
  - Test with contrast checker
  - Minimum 4.5:1 for text
  - Minimum 3:1 for icons
  
- [ ] 7.2.4 Add focus indicators
  - Visible focus ring
  - Skip to main content
  - Focus management in modals
  
- [ ] 7.2.5 Test with screen readers
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (macOS/iOS)

### 7.3 Dark Mode
- [ ] 7.3.1 Test all components in dark mode
- [ ] 7.3.2 Adjust glass opacity for readability
- [ ] 7.3.3 Test orb colors in dark theme
- [ ] 7.3.4 Ensure icons are visible

## 8. Testing

### 8.1 Unit Tests
- [ ] 8.1.1 Test ActivityCard component
- [ ] 8.1.2 Test DayCard component
- [ ] 8.1.3 Test TimelineView component
- [ ] 8.1.4 Test FiltersBar component
- [ ] 8.1.5 Test BulkActions component
- [ ] 8.1.6 Test drag & drop utilities
- [ ] 8.1.7 Test filter/search logic

### 8.2 Integration Tests
- [ ] 8.2.1 Test add activity flow
- [ ] 8.2.2 Test edit activity flow
- [ ] 8.2.3 Test delete activity flow
- [ ] 8.2.4 Test move activity flow
- [ ] 8.2.5 Test bulk operations
- [ ] 8.2.6 Test filters and search
- [ ] 8.2.7 Test view switching

### 8.3 E2E Tests (Playwright)
- [ ] 8.3.1 Test complete itinerary workflow
  - Navigate to itinerary
  - Add day
  - Add multiple activities
  - Edit activity
  - Move activity
  - Delete activity
  
- [ ] 8.3.2 Test drag & drop
  - Drag activity to different day
  - Verify update in database
  
- [ ] 8.3.3 Test mobile experience
  - Test on mobile viewport
  - Test swipe gestures
  - Test bottom sheets
  
- [ ] 8.3.4 Test calendar view
  - Switch to calendar
  - Add activity from calendar
  - Edit from calendar
  
- [ ] 8.3.5 Test map view
  - Switch to map
  - Click marker
  - View activity details

### 8.4 Performance Testing
- [ ] 8.4.1 Run Lighthouse CI
  - Performance score >90
  - Accessibility score >95
  - Best practices score >90
  
- [ ] 8.4.2 Test with large datasets
  - 50+ days
  - 200+ activities
  - Check performance
  
- [ ] 8.4.3 Test on real devices
  - iPhone (iOS Safari)
  - Android (Chrome)
  - Tablet (iPad)

### 8.5 Cross-Browser Testing
- [ ] 8.5.1 Test on Chrome
- [ ] 8.5.2 Test on Safari
- [ ] 8.5.3 Test on Firefox
- [ ] 8.5.4 Test on Edge

## 9. Documentation

### 9.1 Code Documentation
- [ ] 9.1.1 Add JSDoc comments to new components
- [ ] 9.1.2 Document props and types
- [ ] 9.1.3 Add usage examples
- [ ] 9.1.4 Document utilities and helpers

### 9.2 User Documentation
- [ ] 9.2.1 Update Documentation/features/itinerary-planning.md
- [ ] 9.2.2 Create migration guide for users
- [ ] 9.2.3 Add tooltips and help text in UI
- [ ] 9.2.4 Create video tutorial (optional)

### 9.3 Technical Documentation
- [ ] 9.3.1 Document new component architecture
- [ ] 9.3.2 Document drag & drop implementation
- [ ] 9.3.3 Document performance optimizations
- [ ] 9.3.4 Update README with new features

## 10. Deployment

### 10.1 Pre-Deployment
- [ ] 10.1.1 Final code review
- [ ] 10.1.2 Run all tests
- [ ] 10.1.3 Check bundle size
- [ ] 10.1.4 Update CHANGELOG

### 10.2 Deployment
- [ ] 10.2.1 Merge to main branch
- [ ] 10.2.2 Deploy to staging
- [ ] 10.2.3 Smoke test on staging
- [ ] 10.2.4 Deploy to production

### 10.3 Post-Deployment
- [ ] 10.3.1 Monitor error logs
- [ ] 10.3.2 Monitor performance metrics
- [ ] 10.3.3 Collect user feedback
- [ ] 10.3.4 Plan iterations based on feedback

## 11. Rollback Plan (If Needed)

- [ ] 11.1 Identify critical issues
- [ ] 11.2 Revert PR merge
- [ ] 11.3 Clear user caches
- [ ] 11.4 Monitor error rates
- [ ] 11.5 Fix issues in development
- [ ] 11.6 Redeploy after thorough testing

## Timeline Estimate

- **Week 1**: Tasks 1.1 - 2.3 (Foundation + Timeline)
- **Week 2**: Tasks 3.1 - 3.4 (Interactions & Features)
- **Week 3**: Tasks 4.1 - 5.3 (Views + Mobile)
- **Week 4**: Tasks 6.1 - 10.3 (Performance + Polish + Deploy)

**Total**: ~4 weeks full-time development

## Notes

- Prioritize mobile experience from the start
- Test on real devices frequently
- Get feedback early and iterate
- Keep performance in mind throughout
- Document as you go
