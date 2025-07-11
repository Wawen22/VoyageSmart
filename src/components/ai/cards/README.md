# AI Visual Components

Questa cartella contiene i componenti specializzati per l'AI Assistant che forniscono visualizzazioni ricche e coerenti con l'UI/UX delle sezioni originali di VoyageSmart.

## Componenti Disponibili

### AITransportationCard
Visualizza i dati di trasporto con design coerente alla sezione Transportation.

**Caratteristiche:**
- Icone specifiche per tipo di trasporto (aereo, treno, bus, auto, nave)
- Visualizzazione route (partenza → arrivo)
- Orari formattati correttamente per il fuso orario italiano
- Badge di stato (confermato, in attesa, cancellato)
- Costi con valuta
- Riferimenti di prenotazione

### AIItineraryView
Mostra l'itinerario organizzato per giorni con attività dettagliate.

**Caratteristiche:**
- Organizzazione per giorni con date formattate
- Attività con orari, location e note
- Badge colorati per categorie di attività
- Supporto per limitare il numero di giorni visualizzati
- Note del giorno
- Costi delle attività

### AIAccommodationCard
Visualizza gli alloggi con tutti i dettagli rilevanti.

**Caratteristiche:**
- Icone per tipo di alloggio
- Date di check-in/check-out
- Indirizzo e informazioni di contatto
- Rating con stelle
- Calcolo automatico del numero di notti
- Badge per tipo di alloggio
- Documenti allegati

### AIExpenseCard
Mostra le spese con categorizzazione e colori distintivi.

**Caratteristiche:**
- Icone e colori specifici per categoria
- Informazioni su chi ha pagato
- Tipo di divisione (uguale, personalizzato)
- Date formattate
- Valuta e importi
- Location della spesa

### AIDataContainer
Container unificato che gestisce la visualizzazione di liste di dati.

**Caratteristiche:**
- Header con icona e conteggio elementi
- Supporto per limitare il numero di elementi
- Indicatore per elementi aggiuntivi
- Gestione di stati vuoti
- Layout responsive

## Utilizzo

### Marcatori Speciali
L'AI Assistant riconosce questi marcatori per attivare i componenti visuali:

```
[AI_DATA:transportation]        # Tutti i trasporti
[AI_DATA:transportation:3]      # Primi 3 trasporti
[AI_DATA:itinerary]            # Tutto l'itinerario  
[AI_DATA:itinerary:5]          # Primi 5 giorni
[AI_DATA:accommodations]       # Tutti gli alloggi
[AI_DATA:accommodations:2]     # Primi 2 alloggi
[AI_DATA:expenses]             # Tutte le spese
[AI_DATA:expenses:10]          # Prime 10 spese
```

### Riconoscimento Automatico Intelligente

L'AI Assistant ora riconosce automaticamente il contesto delle conversazioni e include i componenti visuali appropriati senza richiedere comandi espliciti.

**Esempi di Riconoscimento Automatico:**

**Trasporti:**
- "A che ora parte il volo?" → Mostra automaticamente i trasporti
- "Come arriviamo a Milano?" → Include componenti trasporto
- "Che mezzi usiamo per spostarci?" → Visualizza tutti i trasporti

**Itinerario:**
- "Cosa facciamo domani?" → Mostra le attività del giorno successivo
- "Qual è il programma di oggi?" → Visualizza l'itinerario del giorno
- "Dove andiamo questo pomeriggio?" → Include attività programmate

**Alloggi:**
- "Dove dormiamo stasera?" → Mostra dettagli alloggio
- "Com'è l'hotel?" → Visualizza informazioni accommodation
- "A che ora è il check-in?" → Include dettagli alloggio

**Spese:**
- "Quanto abbiamo speso?" → Mostra riepilogo spese
- "Chi ha pagato la cena?" → Visualizza dettagli spese
- "Qual è il budget rimanente?" → Include analisi spese

**Limitazione Intelligente:**
- Datasets grandi (>10 elementi) vengono automaticamente limitati
- Richieste specifiche ("domani", "ultime spese") applicano filtri appropriati
- Keywords "tutto/tutti" mostrano i dati completi

## Integrazione

### FormattedAIResponse
Il componente `FormattedAIResponse` è stato aggiornato per:
- Riconoscere i marcatori speciali nel contenuto AI
- Renderizzare i componenti appropriati
- Passare i dati del viaggio ai componenti
- Mantenere la formattazione markdown per il resto del contenuto

### ChatBot
Il componente `ChatBot` passa automaticamente i dati del viaggio a `FormattedAIResponse` per abilitare la visualizzazione dei componenti.

## Design System

### Colori e Temi
- Coerenza con il design system di VoyageSmart
- Supporto per dark/light mode
- Colori specifici per categorie (spese, attività)
- Border colorati per identificazione rapida

### Responsive Design
- Layout ottimizzato per mobile e desktop
- Testo e icone scalabili
- Gestione overflow per contenuti lunghi
- Spacing consistente

### Accessibilità
- Supporto screen reader
- Contrasto colori adeguato
- Navigazione da tastiera
- Aria labels appropriati

## Timezone Handling

Tutti i componenti utilizzano le funzioni di utilità aggiornate per gestire correttamente il fuso orario italiano:
- `formatTimeLocal()` - Orari in formato HH:MM
- `formatDateLocal()` - Date in formato italiano
- Gestione automatica dell'ora legale

## Manutenzione

Per aggiungere nuovi tipi di dati:
1. Creare un nuovo componente AI nella cartella `cards/`
2. Aggiungere il supporto in `AIDataContainer`
3. Aggiornare `FormattedAIResponse` per riconoscere il nuovo marcatore
4. Aggiornare le istruzioni AI nell'API endpoint
5. Aggiornare questa documentazione
