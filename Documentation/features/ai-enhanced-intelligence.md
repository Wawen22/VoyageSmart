# AI Assistant - Enhanced Intelligence & Smart Filtering

## Overview

L'AI Assistant è stato significativamente migliorato con funzionalità di filtraggio intelligente, riconoscimento dello stato di saldamento delle spese, e suggerimenti contestuali dinamici.

## Nuove Funzionalità Implementate

### 1. **Suggerimenti Rapidi Contestuali**

**Suggerimenti Dinamici per Sezione Expenses:**
- `Le mie spese (X)` - Mostra solo le spese pagate dall'utente corrente
- `Spese non saldate (X)` - Filtra le spese con pagamenti in sospeso
- `Analisi per categoria` - Breakdown delle spese per categoria
- `Situazione budget` - Analisi completa del budget
- `Consigli per risparmiare` - Suggerimenti per ottimizzare le spese

**Suggerimenti Dinamici per Sezione Itinerary:**
- `Itinerario completo (X giorni)` - Mostra tutto l'itinerario
- `Attività di oggi` - Focus sulle attività odierne
- `Tutte le attività (X)` - Lista completa delle attività
- `Suggerimenti attività` - Consigli per nuove attività

**Suggerimenti Intelligenti:**
- I numeri tra parentesi mostrano la quantità effettiva di dati
- I suggerimenti appaiono solo se ci sono dati rilevanti
- Suggerimenti diversi per sezioni vuote vs popolate

### 2. **Filtraggio Intelligente delle Spese**

**Tipi di Filtro Supportati:**

**A. Filtro "Le Mie Spese"**
- Parole chiave: `"le mie spese"`, `"mie spese"`, `"ho pagato"`, `"ho speso"`
- Mostra solo le spese pagate dall'utente corrente
- Calcola il totale speso personalmente

**B. Filtro "Spese Non Saldate"**
- Parole chiave: `"non saldate"`, `"non pagate"`, `"in sospeso"`, `"pending"`
- Filtra spese con status "pending" o partecipanti non pagati
- Evidenzia i debiti rimanenti

**C. Filtro "Spese Saldate"**
- Parole chiave: `"spese saldate"`, `"spese pagate"`, `"già pagate"`
- Mostra solo spese completamente saldate
- Status "settled" o tutti i partecipanti pagati

**D. Filtro per Categoria**
- Parole chiave: `"spese cibo"`, `"categoria trasporto"`, etc.
- Filtra per categoria specifica
- Supporta: cibo, trasporto, alloggio, attività, shopping, varie

### 3. **Riconoscimento Stato di Saldamento**

**Indicatori Visivi:**
- ✅ `[SALDATO]` - Spesa completamente pagata
- ⏳ `[IN SOSPESO]` - Pagamenti pendenti
- ❌ `[NON SALDATO]` - Nessun pagamento effettuato
- ⚠️ `[PARZIALMENTE SALDATO: X/Y]` - Alcuni partecipanti hanno pagato

**Analisi Intelligente:**
- Calcolo automatico dei debiti rimanenti
- Identificazione di chi deve ancora pagare
- Suggerimenti per saldare i debiti

### 4. **Contesto Utente Corrente**

**Informazioni Personalizzate:**
- ID utente corrente incluso nel contesto AI
- Filtraggio automatico per "le mie spese"
- Calcolo dei rimborsi dovuti all'utente
- Suggerimenti personalizzati per bilanciare i pagamenti

## Esempi di Utilizzo

### Scenario 1: Filtraggio Spese Personali

**Utente:** "Mostrami le mie spese"

**AI Response:**
```
**FILTRO APPLICATO:** Spese pagate dall'utente corrente (3 su 8 totali)

**Situazione Budget:**
- Spese filtrate: 245.50 EUR (3 spese mostrate)
- Hai pagato il 35% delle spese totali

**Spese Filtrate:**
- Cena ristorante: 85.00 EUR (15/01, pagato da te) [✅ SALDATO]
- Biglietti museo: 60.50 EUR (16/01, pagato da te) [⏳ IN SOSPESO]
- Taxi aeroporto: 100.00 EUR (14/01, pagato da te) [✅ SALDATO]

**Suggerimenti:**
- Controlla se devi ricevere rimborsi per il taxi
- Ricorda ai partecipanti di pagare la loro parte per i biglietti museo
```

### Scenario 2: Spese Non Saldate

**Utente:** "Quali spese non sono ancora state saldate?"

**AI Response:**
```
**FILTRO APPLICATO:** Spese non ancora saldate (2 su 8 totali)

**ATTENZIONE - SPESE NON SALDATE:**
Ci sono 2 spese con pagamenti in sospeso per un totale di 125.50 EUR.

**Spese Non Saldate:**
- Biglietti museo: 60.50 EUR [⚠️ PARZIALMENTE SALDATO: 2/4]
- Cena gruppo: 65.00 EUR [❌ NON SALDATO]

**Suggerimenti:**
- Invia promemoria ai partecipanti che devono pagare
- Usa un'app per dividere le spese se il gruppo è numeroso
- Calcola i rimborsi necessari per bilanciare i pagamenti
```

### Scenario 3: Analisi per Categoria

**Utente:** "Spese per categoria"

**AI Response:**
```
**Situazione Budget:**
Budget totale: 1000 EUR
Spese totali: 687.50 EUR (69% utilizzato)

**Spese per Categoria:**
- **Cibo**: 285.00 EUR (41% del totale)
- **Trasporti**: 200.50 EUR (29% del totale)
- **Attività**: 150.00 EUR (22% del totale)
- **Shopping**: 52.00 EUR (8% del totale)

**Stato Pagamenti:**
- 6 spese completamente saldate
- 2 spese con pagamenti in sospeso

**Suggerimenti:**
- Il cibo rappresenta la categoria più alta - considera di cucinare occasionalmente
- Buon controllo sui trasporti - continua a usare mezzi pubblici
- Budget rimanente permette ancora qualche attività extra
```

## Implementazione Tecnica

### File Modificati

1. **`src/components/ai/ChatBot.tsx`**
   - Suggerimenti dinamici basati sui dati effettivi
   - Contatori intelligenti nei pulsanti
   - Rilevamento sezione corrente migliorato

2. **`src/app/api/ai/chat/route.ts`**
   - Funzione `analyzeExpenseFilterRequest()` per analisi intelligente
   - Funzione `getExpenseSettlementStatus()` per stato pagamenti
   - Logica di filtraggio avanzata
   - Suggerimenti proattivi basati sui debiti

3. **`src/app/trips/[id]/layout.tsx`**
   - Inclusione `currentUserId` nel tripData
   - Accesso completo ai dati utente

### Algoritmi di Filtraggio

**Filtro Spese Utente:**
```typescript
filteredExpenses = expenses.filter(expense => 
  expense.paid_by === currentUserId
);
```

**Filtro Spese Non Saldate:**
```typescript
filteredExpenses = expenses.filter(expense => 
  expense.status === 'pending' || 
  expense.participants?.some(p => !p.is_paid)
);
```

**Analisi Stato Saldamento:**
```typescript
function getExpenseSettlementStatus(expense) {
  if (expense.status === 'settled') return '[✅ SALDATO]';
  if (expense.status === 'pending') return '[⏳ IN SOSPESO]';
  
  const paidCount = expense.participants?.filter(p => p.is_paid).length;
  const totalCount = expense.participants?.length;
  
  if (paidCount === totalCount) return '[✅ COMPLETAMENTE SALDATO]';
  if (paidCount === 0) return '[❌ NON SALDATO]';
  return `[⚠️ PARZIALMENTE SALDATO: ${paidCount}/${totalCount}]`;
}
```

## Benefici per l'Utente

### Esperienza Migliorata
- **Filtraggio Preciso**: Vede solo i dati richiesti
- **Informazioni Chiare**: Stato pagamenti sempre visibile
- **Suggerimenti Intelligenti**: Consigli basati sui dati reali
- **Interfaccia Dinamica**: Pulsanti che si adattano ai contenuti

### Gestione Finanziaria
- **Controllo Personale**: Tracciamento delle proprie spese
- **Gestione Debiti**: Identificazione rapida dei pagamenti in sospeso
- **Analisi Dettagliata**: Breakdown per categoria e partecipante
- **Azioni Concrete**: Suggerimenti specifici per risolvere i debiti

## Conclusione

L'AI Assistant ora offre un'esperienza significativamente più intelligente e personalizzata per la gestione delle spese, con capacità di filtraggio avanzate, riconoscimento dello stato dei pagamenti, e suggerimenti contestuali che si adattano dinamicamente ai dati disponibili e alla sezione corrente dell'applicazione.
