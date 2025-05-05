# VoyageSmart Technical Documentation

Questo documento fornisce una panoramica tecnica del progetto VoyageSmart, inclusi il setup del progetto, le ottimizzazioni delle prestazioni implementate e le raccomandazioni per miglioramenti futuri.

## Indice
- [Setup del Progetto](#setup-del-progetto)
  - [Attività Completate](#attività-completate)
  - [Struttura del Progetto](#struttura-del-progetto)
  - [Come Eseguire il Progetto](#come-eseguire-il-progetto)
  - [Dettagli del Progetto Supabase](#dettagli-del-progetto-supabase)
- [Ottimizzazioni delle Prestazioni](#ottimizzazioni-delle-prestazioni)
  - [Ottimizzazioni Implementate](#ottimizzazioni-implementate)
  - [Raccomandazioni per Ottimizzazioni Future](#raccomandazioni-per-ottimizzazioni-future)
  - [Test delle Prestazioni](#test-delle-prestazioni)

## Setup del Progetto

### Attività Completate

#### 1. Inizializzazione del Progetto
- Creata la struttura del progetto Next.js con TypeScript
- Configurati ESLint, Prettier e TypeScript
- Creata la struttura di base del progetto con app router
- Configurato Tailwind CSS per lo styling

#### 2. Setup Supabase
- Creato un nuovo progetto Supabase: `voyage-smart`
- URL del progetto: https://ijtfwzxwthunsujobvsk.supabase.co
- Creato lo schema del database con le seguenti tabelle:
  - users
  - trips
  - trip_participants
  - itinerary_days
  - transportation
  - accommodations
  - activities
  - expenses
  - expense_participants
  - documents
  - trip_media
  - chat_messages
- Configurate le politiche Row Level Security (RLS) per tutte le tabelle
- Creata la funzione per la divisione delle spese
- Corretta la politica RLS per la tabella trips che causava ricorsione infinita
- Creati i bucket di storage per documenti, ricevute e media
- Implementata l'integrazione con Mapbox per la visualizzazione delle posizioni

#### 3. Pagine di Autenticazione
- Create le pagine di base per login e registrazione
- Configurato il client Supabase per l'autenticazione

#### 4. Configurazione dell'Ambiente
- Create le variabili d'ambiente per Supabase e altri servizi
- Configurato Next.js

### Funzionalità Completate

#### 1. Sistema di Autenticazione
- Implementati gli hook di autenticazione Supabase
- Creata la funzionalità di reset della password
- Configurate le route protette con middleware
- Implementata la gestione del profilo utente

#### 2. Funzionalità di Gestione Viaggi
- Creato il form di creazione viaggio
- Implementate le pagine di elenco e dettaglio viaggi
- Aggiunta la funzionalità di modifica ed eliminazione viaggi
- Implementata la gestione dei partecipanti al viaggio

#### 3. Timeline Itinerario
- Creato il componente timeline con viste a elenco e calendario
- Implementata la gestione di giorni e attività
- Aggiunta l'integrazione con le mappe per visualizzare le posizioni
- Implementato lo spostamento delle attività tra i giorni

#### 4. Tracciamento Budget e Spese
- Creato il form di inserimento spese
- Implementata la funzionalità di divisione spese
- Aggiunte categorie di spesa e filtri
- Implementato il supporto multi-valuta

#### 5. Bucket di Storage
- Completata la configurazione dei bucket di storage per:
  - trip_documents
  - trip_receipts
  - trip_media
  - user_avatars
- Implementato l'upload e la gestione dei file

#### 6. Gestione Alloggi
- Creata la sezione alloggi con operazioni CRUD
- Implementata l'integrazione con le mappe per le posizioni degli alloggi
- Aggiunto l'upload di documenti per le prenotazioni degli alloggi

#### 7. Gestione Trasporti
- Creata la sezione trasporti con operazioni CRUD
- Implementata l'integrazione con le mappe per i percorsi di trasporto
- Aggiunto il supporto per diversi tipi di trasporto
- Implementato l'upload di documenti per i biglietti di trasporto

#### 8. Funzionalità di Collaborazione
- Implementato il sistema di invito utenti
- Creata la funzionalità di chat di gruppo
- Aggiunti permessi basati sui ruoli

### Struttura del Progetto

```
voyage-smart/
├── public/              # Asset statici
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # Componenti React
│   ├── lib/             # Funzioni di utilità e librerie
│   ├── styles/          # Stili globali
│   └── utils/           # Funzioni helper
├── supabase/            # Configurazione e schema Supabase
├── .env.local.example   # Esempio di variabili d'ambiente
├── .eslintrc.json       # Configurazione ESLint
├── .prettierrc          # Configurazione Prettier
├── next.config.js       # Configurazione Next.js
├── package.json         # Dipendenze del progetto
├── postcss.config.js    # Configurazione PostCSS
├── tailwind.config.js   # Configurazione Tailwind CSS
└── tsconfig.json        # Configurazione TypeScript
```

### Come Eseguire il Progetto

1. **Clonare il repository**
   ```bash
   git clone https://github.com/yourusername/voyage-smart.git
   cd voyage-smart
   ```

2. **Installare le dipendenze**
   ```bash
   npm install
   ```

3. **Configurare le variabili d'ambiente**
   Copiare il file di esempio delle variabili d'ambiente e aggiornarlo con le proprie credenziali:
   ```bash
   cp .env.local.example .env.local
   ```
   Modificare `.env.local` e aggiungere le proprie credenziali Supabase e altre chiavi API.

4. **Avviare il server di sviluppo**
   ```bash
   npm run dev
   ```
   L'applicazione sarà disponibile all'indirizzo http://localhost:3000.

### Dettagli del Progetto Supabase

- Nome del progetto: voyage-smart
- ID del progetto: ijtfwzxwthunsujobvsk
- Regione: eu-central-1
- URL: https://ijtfwzxwthunsujobvsk.supabase.co

Lo schema del database è stato configurato secondo le specifiche nel file README.md, con tutte le tabelle, relazioni e politiche di sicurezza necessarie.

## Ottimizzazioni delle Prestazioni

### Ottimizzazioni Implementate

#### 1. Ottimizzazioni del Caricamento Dati

- **Richieste API Parallele**: Sostituite le query Supabase sequenziali con `Promise.all` per l'esecuzione parallela nella sezione Itinerario.
- **Caching dei Dati**: Implementata una cache in memoria per i dati dell'itinerario, degli alloggi e dei trasporti con una scadenza di 5 minuti per evitare richieste ridondanti.
- **Caching con Session Storage**: Aggiunto il caching nel browser tramite session storage per i dati del viaggio, dell'itinerario, degli alloggi, dei trasporti e delle spese.
- **Pattern di Query Ottimizzati**: Sostituite le query multiple per le attività giornaliere con una singola query per tutte le attività, raggruppandole poi per giorno.

#### 2. Ottimizzazioni del Middleware

- **Refresh Selettivo della Sessione**: Modificato il middleware per aggiornare la sessione di autenticazione solo quando necessario (vicino alla scadenza o per le route di autenticazione).
- **Controllo Scadenza Sessione**: Aggiunta una logica per verificare se una sessione è vicina alla scadenza prima di aggiornarla.

#### 3. Miglioramenti UI/UX durante il Caricamento

- **Skeleton Loaders**: Aggiunti loader scheletro dettagliati per le sezioni Itinerario, Alloggi, Trasporti e Spese per migliorare la percezione delle prestazioni.
- **Animazioni Avanzate**: Implementate animazioni fluide per transizioni tra pagine e interazioni utente con effetti personalizzati (fade, slide, scale, flip).
- **Lazy Loading**: Implementato il caricamento lazy per componenti pesanti come i modal e la vista calendario.
- **Suspense Boundaries**: Aggiunti i confini React Suspense attorno ai componenti caricati in modo lazy.
- **Memoizzazione dei Componenti**: Implementata la memoizzazione per componenti come AccommodationCard, TransportationCard e ExpenseCard per evitare re-render non necessari.
- **Feedback Visivo**: Aggiunti effetti di animazione per fornire feedback visivo durante le interazioni dell'utente.

### Raccomandazioni per Ottimizzazioni Future

#### 1. Code Splitting

- Implementare il code splitting basato sulle route per ridurre la dimensione iniziale del bundle.
- Utilizzare import dinamici per librerie di grandi dimensioni come `react-big-calendar`.

```javascript
// Esempio di code splitting basato sulle route
const DashboardPage = dynamic(() => import('@/components/pages/DashboardPage'), {
  loading: () => <DashboardSkeleton />
});
```

#### 2. Ottimizzazione delle Immagini

- Implementare immagini responsive con srcset per diverse dimensioni di dispositivi.
- Utilizzare il componente Image di Next.js con impostazioni appropriate di dimensione e qualità.
- Considerare l'implementazione del lazy loading per le immagini sotto la piega.

#### 3. Ottimizzazione della Gestione dello Stato

- Rivedere la struttura dello store Redux per minimizzare i re-render non necessari.
- Implementare la memoizzazione per calcoli costosi utilizzando `useMemo` e `useCallback`.
- Considerare l'uso di `createEntityAdapter` di Redux Toolkit per uno stato normalizzato.

#### 4. Ottimizzazione delle Query del Database

- Aggiungere indici appropriati ai campi frequentemente interrogati in Supabase.
- Implementare la paginazione per grandi set di dati.
- Utilizzare le policy RLS in modo efficiente per minimizzare il trasferimento di dati non necessari.

#### 5. Ottimizzazione della Rete

- Implementare HTTP/2 per connessioni multiplexate.
- Aggiungere header di cache appropriati per gli asset statici.
- Considerare l'implementazione di un service worker per funzionalità offline e caching.

#### 6. Monitoraggio e Analisi

- Implementare il monitoraggio delle prestazioni con strumenti come Sentry o New Relic.
- Aggiungere marker API di timing utente per i percorsi di rendering critici.
- Configurare il monitoraggio degli utenti reali (RUM) per tracciare l'esperienza utente effettiva.

### Test delle Prestazioni

Per verificare l'efficacia di queste ottimizzazioni, considera di implementare:

1. **Test Lighthouse**: Eseguire regolarmente audit Lighthouse per tracciare i punteggi di prestazione.
2. **Monitoraggio Web Vitals**: Monitorare i Core Web Vitals (LCP, FID, CLS) in produzione.
3. **Test di Carico**: Utilizzare strumenti come k6 o Artillery per simulare scenari di traffico elevato.

## Prossimi Passi

### 1. Setup App Mobile
- Inizializzare React Native con Expo
- Configurare la struttura del codice condivisa tra web e mobile
- Implementare componenti UI responsive

### 2. Funzionalità Avanzate
- Implementare la pianificazione dei percorsi con Mapbox
- Aggiungere aggiornamenti in tempo reale per i contenuti condivisi
- Implementare ricerca e filtri avanzati
- Aggiungere funzionalità di analisi e reportistica
