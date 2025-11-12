# Refactor Itinerary UI/UX - Complete Redesign

## Why

La sezione `/itinerary` attuale è caotica, poco intuitiva e poco moderna. L'interfaccia presenta numerosi problemi di usabilità:
- Layout confusionario con troppi elementi visivi non organizzati
- Mancanza di gerarchia visiva chiara tra giorni e attività
- Interazioni poco intuitive per aggiungere/modificare elementi
- Design non coerente con il resto dell'applicazione (manca glassmorphism)
- Vista calendario poco efficace e difficile da navigare
- Vista mappa basica senza interazioni fluide
- Mobile experience frammentata e difficile da usare

Il refactor completo migliorerà drasticamente l'esperienza utente rendendo la pianificazione del viaggio un'esperienza moderna, fluida e piacevole.

## What Changes

### Design System & Visual Identity
- **Implementazione completa glassmorphism** - Applicare lo stesso design system presente in expenses, chat e altre sezioni
- **Timeline verticale moderna** - Sostituire la vista lista con una timeline visuale fluida con linee connettive e indicatori temporali
- **Color coding intelligente** - Sistema di colori per categorie di attività (cibo, cultura, trasporti, ecc.)
- **Icone e visual feedback** - Set completo di icone moderne per ogni tipo di attività
- **Animazioni smooth** - Transizioni fluide per ogni interazione (expand/collapse, drag & drop, ecc.)

### Layout & Structure
- **Header unificato** - Mantenere l'header esistente con glassmorphism
- **Timeline View (default)** - Vista principale con timeline verticale moderna
  - Giorni con card glass espandibili/collassabili
  - Attività visualizzate in card glass con connettori visivi
  - Indicatori temporali chiari e visibili
  - Drag & drop naturale tra giorni
  
- **Calendar View (migliorata)** - Vista calendario completamente ridisegnata
  - Design glassmorphism per eventi
  - Tooltip informativi su hover
  - Click rapido per aggiungere attività
  - Mini-preview delle attività al passaggio del mouse
  
- **Map View (potenziata)** - Vista mappa interattiva migliorata
  - Marker personalizzati con glassmorphism
  - Cluster intelligente per attività vicine
  - Route visualization tra attività dello stesso giorno
  - Side panel con dettagli attività selezionata

### Components Modernization
- **ActivityCard** - Card completamente ridisegnata con:
  - Design glassmorphism
  - Priority indicator visivo (barra colorata laterale)
  - Time badge con icone
  - Location badge con icone mappa
  - Cost badge con icone valuta
  - Quick actions (edit, delete, move) con icone hover
  - Status indicator (planned, confirmed, completed)
  
- **DayCard** - Card giorno ridisegnata con:
  - Header glassmorphism con data formattata
  - Summary bar (totale attività, costo stimato, durata)
  - Progress indicator per attività completate
  - Quick add button sempre visibile
  - Smooth expand/collapse animation
  
- **EmptyState** - Stati vuoti migliorati con:
  - Illustrazioni moderne
  - CTA chiari e visibili
  - Suggerimenti contestuali
  
- **ActivityModal** - Modale completamente ridisegnata:
  - Design glassmorphism
  - Form organizzato in sezioni logiche
  - Field validations con feedback visivo
  - Location picker con mappa integrata
  - Time picker intuitivo
  - Category selector con icone

### Interactions & UX
- **Drag & Drop potenziato**
  - Visual feedback durante il drag (ghost element)
  - Drop zones evidenziati
  - Smooth animations
  - Undo action disponibile
  
- **Quick Actions**
  - Add activity button floating (FAB) su mobile
  - Quick edit inline per campi semplici
  - Bulk operations (select multiple activities)
  - Context menu su right-click (desktop)
  
- **Smart Suggestions**
  - Auto-complete per locations comuni
  - Time slot suggestions basati su attività esistenti
  - Budget warnings se si supera il totale
  - Conflict detection (attività sovrapposte)
  
- **Filters & Search**
  - Search bar per cercare attività
  - Filters per tipo, status, priority
  - Sort options (tempo, priority, costo)

### Mobile Optimization
- **Bottom Navigation** - Tab bar per switch veloce tra views
- **Swipe Gestures** - Swipe left/right per navigare tra giorni
- **Compact Cards** - Design ottimizzato per schermi piccoli
- **Touch-friendly Controls** - Pulsanti e zone touch più grandi
- **Floating Action Button** - FAB per aggiungere attività velocemente

### Performance & Technical
- **Lazy Loading** - Componenti pesanti caricati on-demand
- **Virtual Scrolling** - Per liste lunghe di attività
- **Optimistic Updates** - UI si aggiorna immediatamente prima del server
- **Cache Strategy** - SessionStorage per dati visualizzati di recente
- **Skeleton Loading** - Skeleton screens durante caricamento

## Impact

### Affected Specs
- `specs/itinerary/spec.md` - Requirements completamente rivisti

### Affected Code
- `src/app/trips/[id]/itinerary/page.tsx` - Refactor completo del layout principale
- `src/components/itinerary/DaySchedule.tsx` - Nuovo componente DayCard con timeline
- `src/components/itinerary/ActivityItem.tsx` - Nuovo componente ActivityCard redesign
- `src/components/itinerary/CalendarView.tsx` - Refactor completo calendario
- `src/components/itinerary/ItineraryMapView.tsx` - Miglioramenti mappa
- `src/components/itinerary/ActivityModal.tsx` - Redesign modale attività
- `src/components/itinerary/DayModal.tsx` - Redesign modale giorno
- **NEW**: `src/components/itinerary/TimelineView.tsx` - Nuova vista timeline principale
- **NEW**: `src/components/itinerary/ActivityQuickAdd.tsx` - Quick add component
- **NEW**: `src/components/itinerary/BulkActions.tsx` - Bulk operations
- **NEW**: `src/components/itinerary/FiltersBar.tsx` - Filters e search
- **NEW**: `src/components/itinerary/FloatingActionButton.tsx` - FAB mobile

### User Experience Changes
- **Learning Curve**: La nuova UI è più intuitiva ma richiede adattamento per utenti abituati alla vecchia interfaccia
- **Performance**: Miglioramenti nelle performance grazie a lazy loading e ottimizzazioni
- **Mobile First**: Esperienza mobile drasticamente migliorata
- **Accessibility**: Migliorata accessibilità con focus states e keyboard navigation

### Breaking Changes
Nessuna breaking change a livello di dati/API. Solo cambio di UI/UX:
- Layout completamente diverso (ma dati rimangono gli stessi)
- Posizione controlli cambiata (ma funzionalità mantenute)
- Nuove features additive (non rimuovono funzionalità esistenti)

## Migration Strategy

### Phase 1: Core Components (Week 1)
1. Creare nuovi componenti base (ActivityCard, DayCard)
2. Implementare TimelineView come nuova vista principale
3. Applicare glassmorphism e design system

### Phase 2: Interactions (Week 2)
1. Implementare drag & drop migliorato
2. Aggiungere quick actions e bulk operations
3. Implementare filters e search

### Phase 3: Views Enhancement (Week 3)
1. Refactor CalendarView
2. Migliorare MapView
3. Ottimizzare mobile experience

### Phase 4: Polish & Optimization (Week 4)
1. Performance optimizations
2. Animations polish
3. Accessibility improvements
4. Testing completo

## Success Metrics

- User satisfaction score: target >4.5/5
- Time to add activity: ridotto del 40%
- Mobile engagement: aumento del 60%
- Error rate: ridotto del 50%
- Page load time: <2s (attualmente ~3-4s)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Utenti non gradiscono il nuovo design | Alto | Beta testing con gruppo selezionato, feedback loop |
| Performance degradation su mobile | Medio | Lazy loading, virtual scrolling, testing su dispositivi reali |
| Breaking existing workflows | Medio | Mantenere funzionalità esistenti, solo riorganizzare UI |
| Tempo implementazione > stimato | Basso | Approccio incrementale, deploy progressivo |

## Open Questions

1. Vogliamo mantenere la possibilità di tornare alla vecchia UI per un periodo di transizione?
2. Quali metriche di successo sono prioritarie?
3. Ci sono particolari requisiti di accessibilità da considerare?
