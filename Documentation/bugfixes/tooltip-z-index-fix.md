# Tooltip Z-Index Fix - Free Plan Limit Tooltips

## Issue Description
The "Free Plan Limit" tooltips in the ACCOMMODATIONS and TRANSPORTATION sections were being hidden or obscured - they appeared to be rendering behind other UI elements instead of appearing on top when triggered.

## Root Cause
The issue was caused by **multiple stacking context problems**:

1. **Overflow Clipping**: The parent `<header>` element had `overflow-hidden` which clipped tooltips extending beyond its boundaries
2. **Stacking Context Isolation**: The main header content container had `z-10`, creating a new stacking context that limited child z-index values
3. **Relative Z-Index**: Even with `z-[99999]` on tooltips, they were constrained within their parent's stacking context
4. **Navigation Bar Overlap**: The navigation bar had `z-20`, potentially overlapping tooltip content

### Technical Details
- **Location**: Header sections in both accommodations and transportation detail pages
- **CSS Properties**:
  - `overflow-hidden` on `<header>` element (clipping issue)
  - `z-10` on main header content container (stacking context issue)
  - `z-20` on navigation bar (potential overlap)
- **Effect**: Created multiple barriers preventing tooltips from displaying correctly
- **Z-index Hierarchy**: Tooltips needed to be in a higher stacking context than their parent containers

## Solution Implemented

### Changes Made

#### 1. Header Overflow Fix

**Accommodations** (`src/app/trips/[id]/accommodations/page.tsx` Line 220-222):
```tsx
// Before
<header className="relative overflow-hidden mb-6">
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background/95 to-teal-500/10 backdrop-blur-xl"></div>

// After
<header className="relative overflow-visible mb-6">
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background/95 to-teal-500/10 backdrop-blur-xl overflow-hidden"></div>
```

**Transportation** (`src/app/trips/[id]/transportation/page.tsx` Line 227-229):
```tsx
// Before
<header className="relative overflow-hidden mb-6">
  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-background/95 to-cyan-500/10 backdrop-blur-xl"></div>

// After
<header className="relative overflow-visible mb-6">
  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-background/95 to-cyan-500/10 backdrop-blur-xl overflow-hidden"></div>
```

#### 2. Stacking Context Fix

**Accommodations** (Line 249):
```tsx
// Before
<div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10 trip-header-mobile accommodations-header-mobile">

// After
<div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-30 trip-header-mobile accommodations-header-mobile">
```

**Transportation** (Line 256):
```tsx
// Before
<div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10 trip-header-mobile transportation-header-mobile">

// After
<div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-30 trip-header-mobile transportation-header-mobile">
```

#### 3. Tooltip Container Z-Index

**All tooltip containers** (Mobile and Desktop in both pages):
```tsx
// Before
<div className="relative group/limit-mobile">

// After
<div className="relative group/limit-mobile z-[9999]">
```

Applied to:
- Accommodations Mobile (Line 292)
- Accommodations Desktop (Line 361)
- Transportation Mobile (Line 299)
- Transportation Desktop (Line 368)
- Quick Navigation Sidebar (Line 214)

#### 4. Sidebar Background Effects Containment

**Quick Navigation Sidebar** (`src/components/trips/PersistentTripActions.tsx` Lines 204-207):
```tsx
// Before
<div className={`absolute inset-0 bg-gradient-to-br ${action.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
<div className={`absolute -top-12 -right-12 w-24 h-24 ${action.glowColor} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>

// After - Wrapped in overflow-hidden container
<div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
  <div className={`absolute inset-0 bg-gradient-to-br ${action.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
  <div className={`absolute -top-12 -right-12 w-24 h-24 ${action.glowColor} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>
</div>
```

### Strategy
1. **Remove overflow clipping**: Changed `overflow-hidden` to `overflow-visible` on parent containers
2. **Preserve background containment**:
   - Moved `overflow-hidden` to background gradient divs (pages)
   - Added wrapper with `overflow-hidden` for hover effects (sidebar)
3. **Elevate stacking context**: Increased main header content z-index from `z-10` to `z-30`
4. **Maximize tooltip visibility**: Added `z-[9999]` to tooltip container divs
5. **Maintain tooltip z-index**: Kept `z-[9999]` on tooltip content divs

## Affected Components

### Accommodations Page (`src/app/trips/[id]/accommodations/page.tsx`)
- **Header element** (Line 220): Changed to `overflow-visible`
- **Background div** (Line 222): Added `overflow-hidden`
- **Main content container** (Line 249): Changed from `z-10` to `z-30`
- **Mobile tooltip container** (Line 292): Added `z-[9999]`
- **Mobile tooltip** (Lines 302-316): Now properly visible above the limit indicator
- **Desktop tooltip container** (Line 361): Added `z-[9999]`
- **Desktop tooltip** (Lines 371-385): Now properly visible above the limit indicator

### Transportation Page (`src/app/trips/[id]/transportation/page.tsx`)
- **Header element** (Line 227): Changed to `overflow-visible`
- **Background div** (Line 229): Added `overflow-hidden`
- **Main content container** (Line 256): Changed from `z-10` to `z-30`
- **Mobile tooltip container** (Line 299): Added `z-[9999]`
- **Mobile tooltip** (Lines 309-323): Now properly visible above the limit indicator
- **Desktop tooltip container** (Line 368): Added `z-[9999]`
- **Desktop tooltip** (Lines 378-392): Now properly visible above the limit indicator

### Quick Navigation Sidebar (`src/components/trips/PersistentTripActions.tsx`)
- **Main container** (Line 157): Changed to `overflow-visible`
- **Action item** (Line 197): Changed to `overflow-visible`
- **Background effects wrapper** (Line 204): Added new wrapper with `overflow-hidden` to contain hover effects
- **Tooltip container** (Line 214): Changed from `z-20` to `z-[9999]`
- **Tooltip** (Lines 220-234): Now properly visible above the info icon in sidebar

## Testing Recommendations

1. **Visual Testing**:
   - Navigate to a trip's Accommodations page
   - Hover over (desktop) or tap (mobile) the "FREE PLAN LIMIT" indicator
   - Verify tooltip appears fully visible above the indicator
   - Repeat for Transportation page

2. **Responsive Testing**:
   - Test on mobile viewport (< 768px)
   - Test on desktop viewport (>= 768px)
   - Verify tooltips work correctly in both layouts

3. **Background Effects**:
   - Verify that animated background orbs are still properly contained
   - Verify gradient backgrounds don't overflow
   - Check that glassmorphism effects remain intact

4. **Z-Index Stacking**:
   - Verify tooltips appear above all other content
   - Test with other overlays (modals, dropdowns) to ensure proper stacking

## Side Effects

### Positive
- Tooltips now properly visible in both sections
- Consistent behavior across mobile and desktop
- No impact on existing z-index hierarchy

### Potential Concerns
- Background elements are still contained by their own `overflow-hidden` wrapper
- No visual regression expected as the header itself doesn't need overflow clipping

## Related Issues

- Original tooltip positioning fix: Changed tooltips from below to above trigger (see `tooltip-positioning-fix.md`)
- Z-index documentation: All tooltips use `z-[99999]` for maximum visibility
- This fix complements the positioning fix by ensuring the container doesn't clip the tooltips

## Rollback Instructions

If issues arise, revert the changes:

1. Change `overflow-visible` back to `overflow-hidden` on `<header>` elements
2. Remove `overflow-hidden` from the background gradient divs
3. Consider alternative solutions like using CSS portals or repositioning tooltips

## Future Improvements

1. **Portal-based Tooltips**: Consider using React portals to render tooltips at the document root level, completely avoiding parent overflow issues
2. **Tooltip Library**: Migrate to a dedicated tooltip library like Radix UI Tooltip or Floating UI that handles positioning and stacking automatically
3. **Dynamic Positioning**: Implement logic to detect available space and position tooltips accordingly (above/below/left/right)
4. **Accessibility**: Ensure tooltips are accessible with keyboard navigation and screen readers

## Notes

- The `overflow-hidden` on the header was likely added to contain animated background elements
- By moving `overflow-hidden` to the specific background div, we maintain the intended visual effect while allowing tooltips to be visible
- The animated background elements div already has `overflow-hidden` (line 225 in accommodations, line 232 in transportation), providing redundant containment
- This is a minimal, surgical fix that addresses the root cause without affecting other functionality

