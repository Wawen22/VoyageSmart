# 🤖 VoyageSmart ChatBot - Implementazioni

Questo documento descrive tutte le implementazioni del ChatBot per VoyageSmart, incluse quelle completate e quelle da implementare.

## ✅ **IMPLEMENTAZIONE COMPLETATA: ACCOMMODATIONS**

### **Funzionalità implementate**
- ✅ Conversazione guidata per aggiungere alloggi
- ✅ Parsing intelligente avanzato (es: "320 euro" → costo=320, valuta=EUR)
- ✅ Componenti UI interattivi (menu dropdown, date picker)
- ✅ Salvataggio diretto con pulsante "Conferma e Salva"
- ✅ Gestione errori e retry
- ✅ Reset completo del contesto conversazionale
- ✅ Suggerimenti contestuali (nascosti durante inserimento)

### **Architettura implementata**

#### **1. Servizi Core**
```
src/lib/services/
├── aiConversationService.ts          # Logica principale conversazione
├── conversationStateService.ts       # Gestione stato e validazione
└── intelligentParsingService.ts      # Parsing avanzato input utente
```

#### **2. Componenti UI**
```
src/components/ai/
├── ChatBot.tsx                       # Componente principale
├── ConversationComponents.tsx        # UI components (selettori, riepilogo)
└── ConversationUIHandler.tsx         # Gestore componenti UI
```

#### **3. Flusso di implementazione**
1. **Rilevamento richiesta**: `detectAccommodationRequest()`
2. **Avvio conversazione**: `startAccommodationCollection()`
3. **Raccolta dati**: Ciclo campo per campo con parsing intelligente
4. **Validazione**: Parsing intelligente + fallback tradizionale
5. **Riepilogo**: Componente `DataSummary` con conferma
6. **Salvataggio**: Dispatch Redux + aggiornamento DB
7. **Completamento**: Reset contesto + messaggio successo

#### **4. Parsing Intelligente**
- **Tipo alloggio**: Riconoscimento diretto ("hotel" → "hotel")
- **Date**: Formati multipli (ISO, europeo, americano)
- **Costo + Valuta**: "320 euro" → costo=320, valuta=EUR
- **Valute**: Simboli e testi ("€", "euro", "EUR")

#### **5. Gestione Stato**
```typescript
interface ConversationContext {
  state: 'idle' | 'collecting_data' | 'confirming_accommodation' | 'saving_accommodation';
  currentField: AccommodationField;
  data: AccommodationData;
  completedFields: AccommodationField[];
  retryCount: number;
}
```

---

## 🚀 **PROSSIME IMPLEMENTAZIONI**

## **1. TRASPORTI** 🚗

### **Obiettivo**
Implementare conversazione guidata per aggiungere trasporti (voli, treni, autobus, auto a noleggio).

### **Campi da gestire**
```typescript
interface TransportationData {
  type: 'flight' | 'train' | 'bus' | 'car_rental' | 'other';
  name: string;                    // Nome/codice (es: "Ryanair FR1234")
  departure_location: string;
  arrival_location: string;
  departure_date: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  booking_reference?: string;
  cost?: number;
  currency?: string;
  notes?: string;
}
```

### **Parsing Intelligente da implementare**
- **Codici volo**: "FR1234", "AZ123", "LH456"
- **Compagnie**: "Ryanair", "Alitalia", "Lufthansa"
- **Rotte**: "Roma-Parigi", "Milano → Londra"
- **Orari**: "14:30", "ore 14:30", "alle 2:30 PM"
- **Date + orari**: "15 marzo alle 14:30"
- **Costo completo**: "Volo Ryanair da Roma a Parigi, 89 euro"

### **Componenti UI necessari**
- `TransportationTypeSelector` (flight, train, bus, car_rental)
- `LocationSelector` (con autocomplete città/aeroporti)
- `TimeSelector` (orari partenza/arrivo)
- `RouteSelector` (andata/ritorno)

### **Trigger di rilevamento**
```typescript
const transportationTriggers = [
  'aggiungi volo', 'nuovo volo', 'prenota volo',
  'aggiungi treno', 'nuovo treno', 'prenota treno',
  'aggiungi trasporto', 'nuovo trasporto',
  'volo per', 'treno per', 'autobus per'
];
```

---

## **2. SPESE** 💰

### **Obiettivo**
Conversazione per aggiungere spese con parsing automatico e gestione partecipanti.

### **Campi da gestire**
```typescript
interface ExpenseData {
  description: string;
  amount: number;
  currency: string;
  category: 'food' | 'transportation' | 'accommodation' | 'activities' | 'shopping' | 'other';
  date: string;
  paid_by: string;                 // User ID
  participants: ExpenseParticipant[];
  receipt_url?: string;
  notes?: string;
}

interface ExpenseParticipant {
  user_id: string;
  amount_owed: number;
  is_paid: boolean;
}
```

### **Parsing Intelligente da implementare**
- **Importo + valuta**: "25.50 euro", "$30", "£15"
- **Categoria automatica**: "pizza" → food, "taxi" → transportation
- **Data + importo**: "Ieri ho speso 25 euro per la cena"
- **Divisione**: "Cena per 4 persone, 80 euro" → 20 euro a testa
- **Descrizione + categoria**: "Colazione al bar, 8 euro" → food

### **Componenti UI necessari**
- `CategorySelector` (con icone e suggerimenti)
- `ParticipantSelector` (membri del viaggio)
- `SplitCalculator` (divisione automatica/manuale)
- `ReceiptUploader` (foto scontrino)

---

## **3. ITINERARIO** 📅

### **Obiettivo**
Aggiunta attività e giorni tramite conversazione naturale.

### **Campi da gestire**
```typescript
interface ItineraryData {
  day_date: string;
  activities: ActivityData[];
}

interface ActivityData {
  name: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  cost?: number;
  currency?: string;
  category: 'sightseeing' | 'food' | 'entertainment' | 'shopping' | 'transport' | 'other';
  notes?: string;
}
```

### **Parsing Intelligente da implementare**
- **Attività + orario**: "Visita Colosseo alle 10:00"
- **Durata**: "Museo per 2 ore", "dalle 10 alle 12"
- **Località + attività**: "Pranzo in Trastevere"
- **Giorno + multiple attività**: "Domani: Colosseo, pranzo, Fontana di Trevi"
- **Costo attività**: "Biglietto museo 15 euro"

---

## **4. MIGLIORAMENTI AI** 🧠

### **Parsing Multi-campo**
Riconoscere più informazioni in un singolo messaggio:
```
"Volo Ryanair FR1234 da Roma a Parigi il 15 marzo alle 14:30, costa 89 euro"
↓
type: flight
name: Ryanair FR1234  
departure: Roma
arrival: Parigi
date: 2024-03-15
time: 14:30
cost: 89
currency: EUR
```

### **Suggerimenti Intelligenti**
- Basati sui dati esistenti del viaggio
- Suggerimenti di completamento automatico
- Rilevamento pattern comuni dell'utente

### **Correzione Automatica**
- Rilevare errori comuni (date, importi, località)
- Suggerire correzioni
- Validazione incrociata dei dati

---

## **5. FUNZIONALITÀ AVANZATE** ⚡

### **Ricerca e Filtri**
```
"Mostrami le spese di marzo"
"Voli per Parigi"
"Alloggi sopra i 100 euro"
"Attività di domani"
```

### **Analisi e Report**
```
"Quanto ho speso in totale?"
"Qual è la spesa media giornaliera?"
"Riassunto spese per categoria"
"Budget rimanente"
```

### **Promemoria e Notifiche**
```
"Ricordami di fare il check-in 24h prima del volo"
"Avvisami quando mancano 2 giorni al viaggio"
```

---

## **6. INTEGRAZIONE SERVIZI ESTERNI** 🌐

### **API da integrare**
- **Voli**: Skyscanner, Amadeus (prezzi e orari real-time)
- **Meteo**: OpenWeatherMap (previsioni destinazioni)
- **Mappe**: Google Maps, Mapbox (distanze, tempi)
- **Valute**: ExchangeRate-API (tassi cambio)
- **Luoghi**: Google Places (autocomplete località)

---

## **📋 ROADMAP IMPLEMENTAZIONE**

### **Fase 1: Trasporti** (Settimana 1-2)
1. Creare `transportationConversationService.ts`
2. Implementare parsing codici volo e rotte
3. Creare componenti UI per trasporti
4. Integrare con Redux store
5. Testing e debugging

### **Fase 2: Spese** (Settimana 3-4)
1. Implementare parsing importi e categorie
2. Gestione partecipanti e divisione
3. Upload ricevute
4. Calcoli automatici
5. Testing divisione spese

### **Fase 3: Itinerario** (Settimana 5-6)
1. Parsing attività e orari
2. Gestione giorni multipli
3. Integrazione calendario
4. Suggerimenti località
5. Testing flusso completo

### **Fase 4: Miglioramenti** (Settimana 7-8)
1. Parsing multi-campo
2. Suggerimenti intelligenti
3. Analisi e report
4. Ottimizzazioni performance
5. Testing completo

---

## **🛠️ PATTERN DI IMPLEMENTAZIONE**

Seguire sempre questo pattern per ogni nuova implementazione:

1. **Servizio Conversazione**: `handle[Entity]Conversation()`
2. **Servizio Stato**: Gestione contesto e validazione
3. **Parsing Intelligente**: Funzioni specifiche per l'entità
4. **Componenti UI**: Selettori e form interattivi
5. **Integrazione ChatBot**: Rilevamento trigger e gestione flusso
6. **Redux Integration**: Actions e reducers
7. **Testing**: Unit test e test integrazione
8. **Documentation**: Aggiornare questo documento

---

**📝 Nota**: Questo documento verrà aggiornato man mano che implementiamo nuove funzionalità.
