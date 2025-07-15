# AI Assistant - Sistema di Suggerimenti Migliorato

## Overview

Il sistema di suggerimenti dell'AI Assistant è stato completamente riprogettato per offrire suggerimenti intelligenti, contestuali e sempre utili, combinando suggerimenti specifici per sezione con suggerimenti cross-section per tutte le funzionalità del viaggio.

## Architettura del Sistema

### Logica di Priorità

**1. Suggerimenti Specifici per Sezione (Priorità Alta)**
- Massimo 4 suggerimenti specifici per la sezione corrente
- Basati sui dati effettivamente disponibili
- Includono contatori dinamici quando rilevante

**2. Suggerimenti Cross-Section (Priorità Media)**
- Suggerimenti per altre sezioni con dati disponibili
- Solo se non si è già in quella sezione
- Mantengono sempre l'accesso alle funzionalità principali

**3. Suggerimenti Generali (Priorità Bassa)**
- Panoramica viaggio e suggerimenti destinazione
- Riempiono gli spazi se ci sono meno di 6 suggerimenti totali

### Distribuzione Suggerimenti

**Totale Massimo**: 6 suggerimenti
**Distribuzione**:
- 2-4 suggerimenti specifici per sezione
- 2-4 suggerimenti cross-section
- Bilanciamento automatico per ottimizzare l'utilità

## Suggerimenti per Sezione

### 📊 **Sezione Expenses**

**Suggerimenti Specifici:**
- `Le mie spese (X)` - Solo spese pagate dall'utente
- `Spese non saldate (X)` - Pagamenti in sospeso
- `Analisi per categoria` - Breakdown dettagliato
- `Situazione budget` - Analisi completa budget
- `Consigli per risparmiare` - Ottimizzazione spese

**Cross-Section Disponibili:**
- `Mostrami l'itinerario` (se disponibile)
- `Dettagli sui miei alloggi` (se disponibili)
- `Info sui miei trasporti` (se disponibili)
- `Cosa fare a [destinazione]`

### 🗓️ **Sezione Itinerary**

**Suggerimenti Specifici:**
- `Itinerario completo (X giorni)` - Vista completa
- `Attività di oggi` - Focus giornaliero
- `Tutte le attività (X)` - Lista completa attività
- `Suggerimenti attività` - Nuove idee

**Cross-Section Disponibili:**
- `Situazione budget` (se spese disponibili)
- `Dettagli sui miei alloggi` (se disponibili)
- `Info sui miei trasporti` (se disponibili)
- `Cosa fare a [destinazione]`

### 🏨 **Sezione Accommodations**

**Suggerimenti Specifici:**
- `Dettagli alloggi` - Informazioni complete
- `Check-in/Check-out` - Date e orari
- `Servizi disponibili` - Amenities e facilities

**Cross-Section Disponibili:**
- `Mostrami l'itinerario` (se disponibile)
- `Situazione budget` (se spese disponibili)
- `Info sui miei trasporti` (se disponibili)
- `Cosa fare a [destinazione]`

### 🚗 **Sezione Transportation**

**Suggerimenti Specifici:**
- `Info trasporti` - Dettagli completi
- `Orari partenza` - Schedule e timing
- `Alternative trasporto` - Opzioni aggiuntive

**Cross-Section Disponibili:**
- `Mostrami l'itinerario` (se disponibile)
- `Situazione budget` (se spese disponibili)
- `Dettagli sui miei alloggi` (se disponibili)
- `Cosa fare a [destinazione]`

### 🏠 **Sezione Overview (Default)**

**Suggerimenti Generali:**
- `Panoramica viaggio` - Vista completa
- `Cosa fare a [destinazione]` - Suggerimenti attività

**Cross-Section Disponibili:**
- `Mostrami l'itinerario` (se disponibile)
- `Situazione budget` (se spese disponibili)
- `Dettagli sui miei alloggi` (se disponibili)
- `Info sui miei trasporti` (se disponibili)

## Esempi di Configurazione

### Scenario 1: Utente in Sezione Expenses con Dati Completi

**Suggerimenti Mostrati:**
1. `Le mie spese (3)` *(specifico)*
2. `Spese non saldate (2)` *(specifico)*
3. `Analisi per categoria` *(specifico)*
4. `Mostrami l'itinerario` *(cross-section)*
5. `Dettagli sui miei alloggi` *(cross-section)*
6. `Info sui miei trasporti` *(cross-section)*

### Scenario 2: Utente in Sezione Itinerary senza Spese

**Suggerimenti Mostrati:**
1. `Itinerario completo (5 giorni)` *(specifico)*
2. `Attività di oggi` *(specifico)*
3. `Tutte le attività (12)` *(specifico)*
4. `Suggerimenti attività` *(specifico)*
5. `Dettagli sui miei alloggi` *(cross-section)*
6. `Cosa fare a Roma` *(cross-section)*

### Scenario 3: Utente in Overview con Pochi Dati

**Suggerimenti Mostrati:**
1. `Panoramica viaggio` *(generale)*
2. `Cosa fare a Milano` *(generale)*
3. `Mostrami l'itinerario` *(cross-section)*
4. `Come tracciare le spese` *(cross-section)*

## Logica di Contatori Dinamici

### Contatori Intelligenti
```typescript
// Esempi di contatori dinamici
`Le mie spese (${userExpenses.length})` // Numero spese utente
`Spese non saldate (${unpaidExpenses.length})` // Spese in sospeso
`Itinerario completo (${tripData.itinerary.length} giorni)` // Giorni pianificati
`Tutte le attività (${totalActivities})` // Attività totali
```

### Condizioni di Visibilità
```typescript
// I suggerimenti appaiono solo se ci sono dati rilevanti
if (userExpenses.length > 0) {
  // Mostra "Le mie spese (X)"
}

if (unpaidExpenses.length > 0) {
  // Mostra "Spese non saldate (X)"
}
```

## Benefici del Sistema

### 🎯 **Sempre Rilevante**
- Suggerimenti basati sui dati effettivi
- Nessun suggerimento per sezioni vuote
- Contatori che mostrano la quantità di informazioni

### 🔄 **Accesso Completo**
- Sempre possibile accedere alle altre sezioni
- Suggerimenti cross-section mantengono la navigabilità
- Bilanciamento tra specifico e generale

### 📊 **Intelligente e Dinamico**
- Adattamento automatico ai contenuti
- Priorità basata sulla sezione corrente
- Massimizzazione dell'utilità con 6 suggerimenti

### 🎨 **Esperienza Utente Ottimale**
- Suggerimenti sempre utili e actionable
- Interfaccia pulita e organizzata
- Accesso rapido a tutte le funzionalità

## Implementazione Tecnica

### Algoritmo di Selezione
```typescript
const maxSpecific = Math.min(questions.length, 4);
const maxCrossSection = Math.max(0, 6 - maxSpecific);

const finalQuestions = [
  ...questions.slice(0, maxSpecific),
  ...crossSectionQuestions.slice(0, maxCrossSection)
];
```

### Condizioni Cross-Section
```typescript
// Solo se non siamo già in quella sezione E ci sono dati
if (currentSection !== 'expenses' && tripData?.expenses?.length > 0) {
  // Aggiungi suggerimento budget
}
```

## Conclusione

Il nuovo sistema di suggerimenti offre un'esperienza bilanciata che:
- **Prioritizza** i suggerimenti più rilevanti per la sezione corrente
- **Mantiene** l'accesso a tutte le funzionalità principali
- **Adatta** dinamicamente i contenuti ai dati disponibili
- **Ottimizza** l'utilizzo dello spazio con 6 suggerimenti mirati

Questo garantisce che l'utente abbia sempre suggerimenti utili e pertinenti, indipendentemente dalla sezione in cui si trova o dai dati disponibili nel suo viaggio.
