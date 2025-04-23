# Voyage Smart

![Voyage Smart Logo](https://via.placeholder.com/200x80?text=Voyage+Smart)

## 📋 Indice
- [Panoramica](#panoramica)
- [Obiettivi](#obiettivi)
- [Stack Tecnologico](#stack-tecnologico)
- [Architettura](#architettura)
- [Funzionalità Core](#funzionalità-core)
- [Roadmap di Sviluppo](#roadmap-di-sviluppo)
- [Modello di Business](#modello-di-business)
- [Metriche di Successo](#metriche-di-successo)
- [Standard di Codice](#standard-di-codice)
- [Setup del Progetto](#setup-del-progetto)
- [Integrazione con Stripe](#integrazione-con-stripe)
- [Licenza](#licenza)

## 📱 Panoramica

Voyage Smart è un'applicazione mobile e web dedicata alla pianificazione completa dei viaggi, progettata per semplificare l'organizzazione di itinerari, la gestione dei costi e la collaborazione con altri viaggiatori. L'app integra funzionalità di intelligenza artificiale opzionali per assistere gli utenti nella pianificazione, offrendo al contempo un controllo completo sulla gestione manuale.

## 🎯 Obiettivi

- Fornire uno strumento completo per la pianificazione di viaggi (trasporti, alloggi, attività, budget)
- Semplificare la gestione e divisione dei costi tra i partecipanti
- Facilitare la collaborazione in tempo reale tra più viaggiatori
- Offrire un'esperienza utente intuitiva sia per la pianificazione manuale che assistita dall'IA
- Creare un archivio personale di ricordi di viaggio facilmente consultabile

## 💻 Stack Tecnologico

### Frontend
- **Mobile**: React Native con Expo
- **Web**: React.js con Next.js
- **State Management**: Redux Toolkit + RTK Query
- **UI/UX**:
  - Styled Components
  - React Native Paper (mobile)
  - MUI (web)
  - Mapbox/Google Maps per visualizzazioni geografiche

### Backend
- **Database**: Supabase (PostgreSQL)
- **Autenticazione**: Supabase Auth
- **Storage**: Supabase Storage
- **Serverless Functions**: Supabase Edge Functions (Deno)
- **Realtime**: Supabase Realtime

### Servizi di AI/ML
- **Generazione itinerari**: OpenAI API / Google Gemini API
- **OCR per documenti**: Tesseract.js / Cloud Vision API
- **Analisi predittiva**: Modelli personalizzati con TensorFlow

### Integrazioni Esterne
- **Mappe**: Mapbox / Google Maps API
- **Meteo**: OpenWeatherMap API
- **Valute**: Exchange Rates API
- **Trasporti**: SkyScanner/Kiwi API, Transit API
- **Calendario**: Google Calendar, Apple Calendar API

### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (web), EAS (Expo Application Services) per mobile
- **Monitoraggio**: Sentry
- **Analytics**: Mixpanel / PostHog

## 🏗️ Architettura

### Schema del Database Supabase

```
users
  id, email, full_name, avatar_url, preferences, created_at, last_login

trips
  id, name, description, start_date, end_date, destination, preferences,
  is_private, budget_total, owner_id (FK -> users.id), created_at, updated_at

trip_participants
  id, trip_id (FK), user_id (FK), role, share_ratio, invited_email, invitation_status, created_at

itinerary_days
  id, trip_id (FK), day_date, notes, weather_forecast, created_at, updated_at

transportation
  id, trip_id (FK), day_id (FK), type, provider, booking_reference, departure_time,
  departure_location, arrival_time, arrival_location, notes, status, cost, currency,
  documents, created_at, updated_at

accommodations
  id, trip_id (FK), name, type, check_in_date, check_out_date, address, coordinates,
  booking_reference, contact_info, cost, currency, documents, notes, created_at, updated_at

activities
  id, trip_id (FK), day_id (FK), name, type, start_time, end_time, location, coordinates,
  booking_reference, priority, cost, currency, notes, status, created_at, updated_at

expenses
  id, trip_id (FK), category, amount, currency, date, description, paid_by (FK),
  split_type, receipt_url, status, created_at, updated_at

expense_participants
  id, expense_id (FK), user_id (FK), amount, currency, is_paid, created_at

documents
  id, trip_id (FK), user_id (FK), type, name, file_url, extracted_data, created_at, updated_at

trip_media
  id, trip_id (FK), day_id (FK), user_id (FK), type, url, caption, location,
  coordinates, tags, created_at
```

### Bucket Storage

- `trip-documents`: Documenti di viaggio (biglietti, voucher, etc.)
- `trip-receipts`: Ricevute e fatture
- `trip-media`: Foto e video dei viaggi
- `user-avatars`: Immagini profilo utenti

### Funzioni RPC

- `calculate_expense_splits`: Calcola chi deve pagare cosa
- `optimize_itinerary_route`: Ottimizza percorso giornaliero
- `generate_trip_summary`: Genera riepiloghi automatici
- `check_accommodation_availability`: Verifica disponibilità alloggi
- `invite_users_to_trip`: Gestisce inviti e permessi

## 🔥 Funzionalità Core

### 1. Gestione Viaggi
- **Creazione e configurazione**: Setup viaggi con dettagli base, preferenze, clonazione viaggi esistenti
- **Dashboard**: Panoramica visuale, timeline interattiva, mappa con POI, visualizzazione budget
- **Gestione dati**: Archiviazione, modifica e condivisione informazioni viaggio

### 2. Pianificazione Itinerari
- **Trasporti**: Registrazione voli, treni, auto a noleggio, trasferimenti, gestione soste intermedie, caricamento documenti
- **Alloggi**: Gestione prenotazioni, dettagli contatti, visualizzazione su mappa, caricamento documenti
- **Attività**: Pianificazione visite ed eventi, sistema di priorità, gestione prenotazioni
- **Timeline giornaliera**: Vista dettagliata, gestione orari, avvisi per sovrapposizioni
- **Visualizzazione mappa**: Mappa interattiva con tutti gli alloggi, trasporti, attività e punti di interesse

### 3. Gestione Budget e Spese
- **Pianificazione**: Budget complessivo e per categorie, previsioni costi
- **Tracciamento**: Registrazione spese, scansione ricevute, multi-valuta
- **Divisione costi**: Gestione quote partecipanti, sistema "chi deve cosa a chi"

### 4. Collaborazione
- **Gestione partecipanti**: Inviti, permessi personalizzabili, chat di gruppo
- **Modifica in tempo reale**: Editing simultaneo, commenti, voti per decisioni
- **Condivisione**: Generazione itinerari visuali, opzioni privacy granulari

### 5. Intelligenza Artificiale (Opzionale)
- **Pianificazione assistita**: Generazione itinerari, ottimizzazione percorsi
- **Assistente virtuale**: Chatbot integrato, consigli personalizzati
- **Analisi predittiva**: Previsione affluenze, suggerimenti per risparmio tempo

### 6. Gestione Documenti
- **Archivio centralizzato**: Organizzazione documenti, disponibilità offline
- **OCR**: Estrazione dati automatica da biglietti e prenotazioni
- **Informazioni pratiche**: Database integrato per destinazioni, requisiti visti

### 7. Diario di Viaggio
- **Memorizzazione ricordi**: Note giornaliere, tracciamento percorsi effettivi
- **Galleria multimediale**: Organizzazione foto/video, album collaborativi
- **Condivisione social**: Template visuali, riassunti automatici

## 📅 Roadmap di Sviluppo

### Fase 0: Preparazione e Setup ✅
- ✅ Setup ambiente di sviluppo (ESLint, TypeScript, etc.)
- ✅ Configurazione Supabase e politiche di sicurezza
- ✅ Design dell'architettura frontend e schema DB
- ✅ Prototipazione interfacce chiave

### Fase 1: MVP ✅
- **Autenticazione e gestione utenti** ✅
  - ✅ Login/registrazione con Supabase Auth
  - ✅ Profilo utente e preferenze
  - ✅ Sistema recupero password

- **Creazione e gestione viaggi** ✅
  - ✅ UI creazione nuovo viaggio
  - ✅ Dashboard riassuntiva
  - ✅ Pagina dettaglio viaggio

- **Itinerari base** ✅
  - ✅ Timeline visuale
  - ✅ CRUD per giorni e attività
  - ✅ Sistema gestione orari
  - ✅ Visualizzazione base su mappa
  - ✅ Vista calendario

- **Trasporti e alloggi base** ✅
  - ✅ Form creazione/modifica
  - ✅ Visualizzazione in timeline
  - ✅ Storage informazioni prenotazioni
  - ✅ Visualizzazione su mappa
  - ✅ Upload documenti

- **Budget semplice** ✅
  - ✅ Impostazione budget complessivo
  - ✅ Aggiunta spese
  - ✅ Dashboard per categoria
  - ✅ Divisione spese

- **Collaborazione essenziale** ✅
  - ✅ Sistema inviti
  - ✅ Permessi base
  - ✅ Notifiche per modifiche
  - ✅ Chat di gruppo

### Fase 2: Espansione (In corso) 🔄
- **Miglioramento itinerari** 🔄
  - ✅ Ottimizzazione percorsi
  - 🔄 Filtri e ricerca POI
  - 🔄 Avvisi per pianificazione irrealistica

- **Gestione spese avanzata** ✅
  - ✅ Supporto multi-valuta
  - ✅ OCR per scansione ricevute
  - ✅ Algoritmo "chi deve cosa a chi"

- **Gestione documenti** ✅
  - ✅ System upload multipli
  - ✅ OCR per estrazione dati
  - 🔄 Reminder documenti necessari

- **Collaborazione avanzata** ✅
  - ✅ Chat di gruppo
  - ✅ Sistema commenti
  - 🔄 Polling e voti per decisioni

- **Diario di viaggio e media** 🔄
  - 🔄 Diario giornaliero
  - 🔄 Galleria foto organizzata
  - 🔄 Timeline ricordi post-viaggio

- **Integrazioni API esterne** 🔄
  - 🔄 Dati meteo
  - 🔄 Tassi di cambio
  - 🔄 Informazioni trasporti

- **UI/UX Avanzata** ✅
  - ✅ Tema chiaro/scuro
  - ✅ Animazioni e transizioni
  - ✅ Layout responsive ottimizzato
  - ✅ Feedback visivo migliorato

### Fase 3: Funzionalità Avanzate (12 mesi post-lancio)
- **Integrazione IA**
  - Servizio generazione itinerari
  - Ottimizzazione percorsi avanzata
  - Analisi predittiva costi e affluenza

- **Automazione sottoscrizioni**
  - [To Do] Configurare un cron job (es. Vercel Cron Jobs, AWS Lambda con EventBridge, ecc.) che chiami periodicamente l'endpoint `/api/cron/check-subscriptions` (ad esempio una volta al giorno) per verificare e aggiornare tutte le sottoscrizioni scadute.

- **Assistente virtuale**
  - Chatbot per domande frequenti
  - NLP per query in linguaggio naturale
  - Suggerimenti pro-attivi

- **Monetizzazione e piani premium** ✅
  - ✅ Sistema abbonamenti con Supabase
  - ✅ Paywall per funzionalità premium (Accommodations, Transportation)
  - ✅ Limite di 3 viaggi per utenti free
  - ✅ Pagina Pricing con piani Free, Premium e AI (coming soon)
  - Dashboard amministrativa ricavi

- **Funzionalità innovative**
  - Modalità esplorazione con realtà aumentata
  - Calcolo impronta carbonio
  - Filtri accessibilità avanzati

- **Espansione piattaforma**
  - API pubblica
  - Widget embedabili
  - Marketplace template viaggi

## 💰 Modello di Business

### Piano Gratuito
- 2 viaggi attivi contemporaneamente
- Funzionalità base di pianificazione e budget
- Max 3 partecipanti per viaggio
- 500MB storage per foto e documenti
- Annunci non invasivi

### Piano Premium (€4.99/mese o €49.99/anno)
- Viaggi illimitati
- Tutte le funzionalità avanzate
- Partecipanti illimitati
- 10GB storage
- Nessun annuncio
- Accesso prioritario alle novità
- Supporto premium

### Piano Famiglia/Gruppo (€9.99/mese o €99.99/anno)
- Vantaggi del Piano Premium
- Condivisione con 6 membri
- 30GB storage condiviso
- Dashboard famiglia centralizzata

### In-App Purchases
- Pacchetti funzionalità IA (€2.99 per viaggio)
- Guide destinazioni premium (€1.99-4.99)
- Template viaggio tematici (€0.99-2.99)
- Storage aggiuntivo (€1.99 per 5GB)

## 📊 Metriche di Successo

### Metriche Utente
- Utenti attivi mensili (MAU)
- Retention rate a 7, 30 e 90 giorni
- Tempo medio sessione
- Funnel conversione (registrazione → creazione viaggio → completamento)
- Net Promoter Score (NPS)
- Tasso utilizzo per feature

### Metriche Tecniche
- Tempo caricamento pagine
- Crash rate
- API response time
- Error rate
- Utilizzo database e storage
- Test coverage

### Metriche Business
- Tasso conversione da free a premium
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
- MRR (Monthly Recurring Revenue)
- Churn rate abbonamenti

## 📝 Standard di Codice

- Utilizzo di TypeScript per tutto il codice
- Naming conventions: camelCase per variabili/funzioni, PascalCase per componenti/classi
- ESLint e Prettier per formattazione consistente
- Test obbligatori per funzionalità critiche (Jest, React Testing Library)
- Documentazione con JSDoc per funzioni e componenti principali
- Commit seguendo Conventional Commits (feat, fix, docs, etc.)
- Code review obbligatorie per PR

## 🚀 Setup del Progetto

1. **Clonazione repository**
   ```bash
   git clone https://github.com/tuaorganizzazione/voyage-smart.git
   cd voyage-smart
   npm install
   ```

2. **Setup Supabase**
   ```bash
   supabase init
   supabase start
   ```

3. **Configurazione variabili d'ambiente**
   ```bash
   # Crea .env.local
   cp .env.example .env.local
   # Modifica con le tue credenziali Supabase e Stripe
   ```

4. **Esecuzione migrazioni**
   ```bash
   npm run db:migrate
   ```

5. **Avvio applicazione**
   ```bash
   # Web
   npm run dev --port=3000

   # Stripe CLI per webhook (in un altro terminale)
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook

   # Mobile (richiede Expo CLI)
   npm run mobile
   ```

## 💳 Integrazione con Stripe

VoyageSmart utilizza Stripe per gestire i pagamenti e le sottoscrizioni. Ecco come funziona l'integrazione:

### Setup Stripe

1. **Configurazione delle variabili d'ambiente**
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
   NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_your_ai_price_id
   ```

2. **Avvio del listener Stripe per i webhook**
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

### Flusso di pagamento

1. L'utente clicca su "Upgrade to Premium" nella pagina di gestione sottoscrizioni
2. L'app crea una sessione di checkout con Stripe
3. L'utente viene reindirizzato al form di pagamento di Stripe
4. Dopo il pagamento, l'utente viene reindirizzato alla pagina di successo
5. Stripe invia un webhook all'endpoint `/api/stripe/webhook`
6. L'app aggiorna lo stato della sottoscrizione dell'utente nel database

### Test dei pagamenti

Per testare i pagamenti in ambiente di sviluppo, usa le carte di test di Stripe:

- **Numero carta**: 4242 4242 4242 4242
- **Data di scadenza**: Qualsiasi data futura
- **CVC**: Qualsiasi 3 cifre
- **Nome**: Qualsiasi nome
- **Indirizzo**: Qualsiasi indirizzo

### Debugging

Per testare e debuggare l'integrazione con Stripe, puoi utilizzare l'endpoint di test:

```
http://localhost:3000/subscription
```

Scorri fino in fondo alla pagina per trovare il componente di test che ti permette di:
- Verificare lo stato attuale della sottoscrizione
- Simulare un upgrade a Premium
- Eseguire test di debug per verificare le policy RLS e l'autenticazione

## 📄 Licenza

Questo progetto è proprietario e confidenziale. Tutti i diritti riservati.

---

© 2025 Voyage Smart. Tutti i diritti riservati.
