# Glassmorphism Implementation Guide

## Quick Reference for Developers

This guide provides quick copy-paste examples for implementing the glassmorphism design system in VoyageSmart components.

---

## 1. Basic Glass Card

### Usage
Use for standard content containers, info cards, and widget backgrounds.

### Code Example
```tsx
<div className="glass-info-card rounded-2xl p-6 hover:scale-[1.02] transition-all duration-500">
  {/* Animated background orbs */}
  <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-all duration-700" />
  <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-700" />
  
  {/* Subtle grid pattern */}
  <div className="absolute inset-0 opacity-5 glass-grid-pattern" />
  
  {/* Your content here */}
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

---

## 2. Action Button with Glass Effect

### Usage
Use for primary action buttons, CTAs, and interactive elements.

### Code Example
```tsx
<button className="group relative glass-action-card px-6 py-3.5 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl">
  {/* Animated background orbs */}
  <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-all duration-700 group-hover:scale-150" />
  <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-all duration-700 group-hover:scale-150" />
  
  {/* Grid pattern */}
  <div className="absolute inset-0 opacity-5 glass-grid-pattern" />
  
  {/* Shimmer effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
  
  {/* Button content */}
  <div className="relative flex items-center gap-3 font-semibold text-foreground">
    <Icon className="h-5 w-5" />
    <span>Button Text</span>
  </div>
</button>
```

---

## 3. Icon Container with Glass

### Usage
Use for icon badges, status indicators, and decorative elements.

### Code Example
```tsx
<div className="relative">
  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300">
    <Icon className="h-5 w-5 text-primary" />
  </div>
  {/* Pulse ring on hover */}
  <div className="absolute inset-0 rounded-xl border-2 border-primary/50 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
</div>
```

---

## 4. Loading Skeleton with Glass

### Usage
Use for loading states while content is being fetched.

### Code Example
```tsx
<div className="glass-card rounded-2xl p-6 animate-pulse relative overflow-hidden">
  {/* Animated background orbs */}
  <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-50 animate-pulse" />
  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
  
  <div className="relative z-10 space-y-4">
    <div className="h-5 bg-white/10 dark:bg-white/5 rounded-lg w-32 backdrop-blur-sm" />
    <div className="h-4 bg-white/10 dark:bg-white/5 rounded-lg w-24 backdrop-blur-sm" />
  </div>
</div>
```

---

## 5. Weather-Specific Orb Colors

### Usage
Dynamic orb colors based on conditions (weather, status, etc.)

### Code Example
```tsx
const getOrbColor = (condition: string, secondary = false) => {
  const colors = {
    'sunny': secondary 
      ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.4), rgba(249, 115, 22, 0.3))' 
      : 'linear-gradient(135deg, rgba(250, 204, 21, 0.5), rgba(251, 146, 60, 0.4))',
    'rainy': secondary 
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3))' 
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(99, 102, 241, 0.4))',
    // Add more conditions...
  };
  return colors[condition] || colors['sunny'];
};

// Usage
<div 
  className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30"
  style={{ background: getOrbColor(condition) }}
/>
```

---

## 6. Mobile-Optimized Glass Button

### Usage
Use for mobile touch interfaces with active states.

### Code Example
```tsx
<button className="group relative glass-action-card px-6 py-3 rounded-2xl overflow-hidden transition-all duration-500 active:scale-95 shadow-lg active:shadow-2xl">
  {/* Orbs */}
  <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full blur-2xl opacity-50 group-active:opacity-70 transition-all duration-700" />
  
  {/* Grid pattern */}
  <div className="absolute inset-0 opacity-5 glass-grid-pattern" />
  
  {/* Shimmer on tap */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-1000" />
  
  {/* Content */}
  <div className="relative flex items-center gap-3 text-foreground">
    <Icon className="h-5 w-5" />
    <span>Tap Me</span>
  </div>
</button>
```

---

## 7. Small Glass Cards (Weather Details Style)

### Usage
Use for metric displays, stat cards, and detail panels.

### Code Example
```tsx
<div className="glass-card rounded-xl p-3 text-center hover:scale-105 transition-all duration-300">
  <div className="flex items-center justify-center mb-2">
    <div className="p-2 rounded-lg bg-blue-500/10">
      <Icon className="h-4 w-4 text-blue-500" />
    </div>
  </div>
  <div className="text-xs text-muted-foreground mb-1">Label</div>
  <div className="text-sm font-bold text-foreground">Value</div>
</div>
```

---

## 8. Dialog/Modal with Glass

### Usage
Use for dialogs, modals, and overlay panels.

### Code Example
```tsx
<DialogContent className="glass-card">
  <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      Dialog Title
    </DialogTitle>
  </DialogHeader>
  
  <div className="space-y-4">
    {/* Dialog content */}
  </div>
</DialogContent>
```

---

## Color Palette Reference

### Primary Orb Colors
```tsx
// Blue/Purple (Analytics, Primary Actions)
from-blue-500/30 to-purple-500/30

// Purple/Pink (Secondary Actions)
from-purple-500/30 to-pink-500/30

// Emerald/Teal (Success, Positive)
from-emerald-500/30 to-teal-500/30

// Orange/Red (Warning, Active)
from-orange-500/30 to-red-500/30

// Cyan/Blue (Info, Weather)
from-cyan-500/30 to-blue-500/30
```

### Icon Container Colors
```tsx
// Blue
bg-blue-500/10 + text-blue-500

// Purple
bg-purple-500/10 + text-purple-500

// Emerald
bg-emerald-500/10 + text-emerald-500

// Cyan
bg-cyan-500/10 + text-cyan-500

// Orange
bg-orange-500/10 + text-orange-500
```

---

## Animation Timing Reference

```tsx
// Quick interactions (hover, focus)
duration-300

// Standard transitions (scale, opacity)
duration-500

// Slow, dramatic effects (orb expansion)
duration-700

// Shimmer/sweep effects
duration-1000
```

---

## Best Practices

### DO:
✅ Use `relative` on parent containers
✅ Use `absolute` for orbs and overlays
✅ Use `z-10` or higher for content
✅ Combine multiple effects for depth
✅ Use `group` for coordinated hover effects
✅ Test in both light and dark modes

### DON'T:
❌ Stack too many blur effects (performance)
❌ Use solid backgrounds (breaks glass effect)
❌ Forget mobile optimization
❌ Overuse animations (can be distracting)
❌ Ignore accessibility (maintain contrast)

---

## Performance Tips

1. **Limit blur layers**: Max 2-3 blur effects per component
2. **Use transform over position**: Hardware accelerated
3. **Optimize orb count**: 2-3 orbs maximum
4. **Reduce motion**: Respect `prefers-reduced-motion`
5. **Mobile optimization**: Reduce blur intensity on mobile

---

## Accessibility Considerations

- Maintain 4.5:1 contrast ratio for text
- Ensure focus states are visible
- Support keyboard navigation
- Provide alternative text for icons
- Test with screen readers
- Respect reduced motion preferences

---

## Quick Checklist

Before committing glassmorphism components:

- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Hover effects smooth
- [ ] Mobile touch works
- [ ] No performance issues
- [ ] Accessible contrast
- [ ] Keyboard navigable
- [ ] Reduced motion support

