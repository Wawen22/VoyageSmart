# AI Assistant - Expense Page Integration

## Overview

L'AI Assistant ora ha accesso completo alla sezione `/expenses` del viaggio e fornisce suggerimenti specifici e contestuali quando l'utente si trova in questa sezione.

## Funzionalità Implementate

### 1. **Accesso ai Dati delle Spese**

**Trip Layout Enhancement**
- Aggiunto fetch delle spese nel layout del viaggio (`src/app/trips/[id]/layout.tsx`)
- Include spese con dettagli dei partecipanti e stato dei pagamenti
- Passa i dati delle spese al componente ChatBot tramite `tripData.expenses`

**Struttura Dati:**
```typescript
interface ExpenseData {
  id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  paid_by: string;
  paid_by_name: string;
  split_type: string;
  status: string;
  participants: ExpenseParticipant[];
}
```

### 2. **Consapevolezza della Pagina Corrente**

**Page Detection**
- Il ChatBot rileva automaticamente la sezione corrente tramite `usePathname()`
- Supporta rilevamento per: `expenses`, `itinerary`, `accommodations`, `transportation`, `documents`, `media`, `overview`
- Passa l'informazione `currentSection` all'API AI

**Sezioni Supportate:**
- `/expenses` → Suggerimenti per gestione spese e budget
- `/itinerary` → Consigli per pianificazione attività
- `/accommodations` → Informazioni su alloggi
- `/transportation` → Assistenza con trasporti
- `/documents` → Gestione documenti di viaggio
- `/media` → Organizzazione foto e video
- Default → Assistenza generale

### 3. **Suggerimenti Specifici per Expenses**

**Quando l'utente è nella sezione `/expenses`, l'AI fornisce:**

**Suggerimenti Automatici:**
- Promemoria per registrare spese immediatamente
- Consigli per salvare ricevute importanti
- Suggerimenti per categorizzazione corretta
- Aiuto per bilanciare pagamenti tra partecipanti
- Alternative economiche quando il budget è limitato
- Controlli regolari del budget rimanente

**Risposte Proattive:**
- **Budget**: Analisi situazione attuale con consigli specifici
- **Categorie**: Ottimizzazione della categorizzazione spese
- **Pagamenti**: Gestione rimborsi e divisioni
- **Risparmio**: Consigli pratici per la destinazione

**Formato Strutturato:**
```markdown
**Situazione Budget:**
[Analisi dettagliata del budget attuale]

**Spese per Categoria:**
[Breakdown dettagliato per categoria]

**Suggerimenti:**
[Consigli specifici e actionable]
```

### 4. **Messaggio Iniziale Personalizzato**

**Per la sezione Expenses:**
```
**Benvenuto al tuo assistente di viaggio per "[nome viaggio]"!**

Sono qui per aiutarti con il tuo viaggio dal [data inizio] al [data fine] con [partecipanti].

**Sezione Spese Attiva**: Posso aiutarti con la gestione del budget, 
analisi delle spese, consigli per risparmiare, e divisione dei costi 
tra i partecipanti.
```

## Esempi di Utilizzo

### Domande Supportate nella Sezione Expenses

1. **Analisi Budget**
   - "Come va il nostro budget?"
   - "Quanto abbiamo speso finora?"
   - "Quanto ci resta da spendere?"

2. **Gestione Categorie**
   - "Quali sono le nostre spese principali?"
   - "Quanto spendiamo per il cibo?"
   - "Come possiamo categorizzare meglio?"

3. **Divisione Spese**
   - "Chi ha pagato di più?"
   - "Come dividiamo questa spesa?"
   - "Chi deve ancora pagare?"

4. **Consigli per Risparmiare**
   - "Come possiamo risparmiare?"
   - "Ci sono alternative più economiche?"
   - "Consigli per il budget rimanente?"

### Risposte AI Specifiche

**Esempio - Analisi Budget:**
```
**Situazione Budget:**
Hai utilizzato il 65% del budget (650€ su 1000€) con ancora 4 giorni di viaggio.

**Spese per Categoria:**
- **Cibo**: 280€ (43% del totale)
- **Trasporti**: 200€ (31% del totale)  
- **Attività**: 170€ (26% del totale)

**Suggerimenti:**
- Considera di cucinare qualche pasto in appartamento
- Usa i trasporti pubblici per gli spostamenti locali
- Cerca attrazioni gratuite o con sconti per gruppi
```

## Implementazione Tecnica

### File Modificati

1. **`src/app/trips/[id]/layout.tsx`**
   - Aggiunto fetch delle spese con partecipanti
   - Incluso `expenses` nel `tripData` passato al ChatBot

2. **`src/components/ai/ChatBot.tsx`**
   - Aggiunto `usePathname()` per rilevamento sezione
   - Incluso `currentSection` nelle chiamate API
   - Aggiornata interfaccia `TripData` con `expenses`

3. **`src/app/api/ai/chat/route.ts`**
   - Aggiunta funzione `getSectionDescription()`
   - Incluso contesto sezione corrente nel prompt AI
   - Aggiunto suggerimenti specifici per sezione expenses
   - Personalizzato messaggio iniziale per expenses

### Flusso dei Dati

```
Layout → Fetch Expenses → ChatBot → API → AI Response
   ↓         ↓              ↓        ↓        ↓
 Database   Process      Detect   Context   Smart
 Query      Data         Section  Aware     Suggestions
```

## Validazione

### Test Cases

1. **✅ Accesso Dati Spese**
   - Spese caricate correttamente nel layout
   - Dati passati al ChatBot con partecipanti
   - Struttura dati consistente

2. **✅ Rilevamento Sezione**
   - URL `/expenses` rilevato correttamente
   - `currentSection` passato all'API
   - Contesto specifico applicato

3. **✅ Suggerimenti Specifici**
   - Messaggi personalizzati per sezione expenses
   - Suggerimenti proattivi inclusi
   - Formato strutturato applicato

4. **✅ Integrazione Completa**
   - AI Assistant visibile nella pagina expenses
   - Accesso completo ai dati del viaggio
   - Risposte contestuali e utili

### Benefici per l'Utente

- **Accesso Immediato**: AI Assistant disponibile direttamente nella sezione expenses
- **Contesto Completo**: Accesso a tutti i dati delle spese e del viaggio
- **Suggerimenti Intelligenti**: Consigli specifici per la gestione finanziaria
- **Esperienza Fluida**: Integrazione naturale con l'interfaccia esistente

## Conclusione

L'AI Assistant ora fornisce un supporto completo e contestuale per la gestione delle spese, migliorando significativamente l'esperienza utente nella sezione `/expenses` con suggerimenti intelligenti e accesso completo ai dati finanziari del viaggio.
