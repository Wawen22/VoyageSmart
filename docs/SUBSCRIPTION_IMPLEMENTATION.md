# Implementazione del Sistema di Abbonamenti in VoyageSmart

Questo documento descrive l'implementazione del sistema di abbonamenti in VoyageSmart, inclusi i piani disponibili, le funzionalità limitate e i dettagli tecnici.

## Piani di Abbonamento

### Piano Free
- **Prezzo**: Gratuito
- **Limitazioni**:
  - Massimo 3 viaggi per utente
  - Nessun accesso alle sezioni Accommodations e Transportation
- **Funzionalità incluse**:
  - Pianificazione itinerari di base
  - Gestione spese
  - Collaborazione con altri utenti
  - Chat di gruppo

### Piano Premium
- **Prezzo**: €4.99/mese
- **Vantaggi**:
  - Viaggi illimitati
  - Gestione alloggi (Accommodations)
  - Gestione trasporti (Transportation)
  - Supporto prioritario

### Piano AI Assistant (Attivo)
- **Prezzo**: €9.99/mese
- **Vantaggi**:
  - Tutte le funzionalità Premium
  - Assistente AI per la pianificazione
  - Wizard AI per generazione attività
  - Suggerimenti personalizzati
  - Accesso anticipato a nuove funzionalità

## Implementazione Tecnica

### Database
- Tabella `subscriptions`: Memorizza i dettagli degli abbonamenti
  - `id`: UUID
  - `user_id`: UUID (riferimento a auth.users)
  - `tier`: Tipo di abbonamento ('free', 'premium', 'ai')
  - `status`: Stato dell'abbonamento ('active', 'inactive', 'canceled')
  - `current_period_start`: Data di inizio periodo
  - `current_period_end`: Data di fine periodo
  - `cancel_at_period_end`: Booleano
  - Altri campi per la gestione dei pagamenti

- Tabella `user_subscriptions`: Collega gli utenti ai loro abbonamenti
  - `id`: UUID
  - `user_id`: UUID (riferimento a auth.users)
  - `tier`: Tipo di abbonamento ('free', 'premium', 'ai')
  - `status`: Stato dell'abbonamento ('active', 'inactive', 'canceled')
  - `valid_until`: Data di scadenza

### Componenti Frontend
- `SubscriptionProvider`: Context provider per gestire lo stato dell'abbonamento
- `SubscriptionContext`: Context per accedere alle informazioni sull'abbonamento
- `useSubscription`: Hook per accedere alle funzionalità dell'abbonamento
- `UpgradePrompt`: Componente per mostrare un prompt di upgrade per funzionalità Premium
- `AIUpgradePrompt`: Componente per mostrare un prompt di upgrade per funzionalità AI
- `TripLimitPrompt`: Componente per mostrare un prompt quando si raggiunge il limite di viaggi
- `PricingPage`: Pagina per visualizzare e selezionare i piani di abbonamento

### Funzioni di Controllo Accesso
- `isSubscribed(tier)`: Verifica se l'utente è abbonato a un determinato piano
- `canCreateTrip()`: Verifica se l'utente può creare un nuovo viaggio
- `canAccessFeature(feature)`: Verifica se l'utente può accedere a una funzionalità premium
  - Supporta i tipi di feature: 'accommodations', 'transportation', 'ai_assistant'

### Integrazione nelle Pagine
- Controllo di accesso nella pagina Accommodations (richiede piano Premium o AI)
- Controllo di accesso nella pagina Transportation (richiede piano Premium o AI)
- Controllo di accesso alle funzionalità AI (richiede piano AI)
  - Assistente AI in tutte le pagine del viaggio
  - Wizard AI per generazione attività nell'itinerario
- Controllo del limite di viaggi nella pagina New Trip (limite di 3 per utenti Free)

## Stato Attuale

### Integrazione con Stripe ✅
- ✅ Implementato il processo di pagamento con Stripe
- ✅ Configurati webhook per aggiornamenti di abbonamento
- ✅ Implementato sistema di fatturazione e ricevute
- ✅ Creato sistema di tracciamento cronologia sottoscrizioni

### Funzionalità AI ✅
- ✅ Sviluppate le funzionalità AI per il piano AI
- ✅ Implementata l'integrazione con Google Gemini
- ✅ Creata un'interfaccia utente per l'assistente AI
- ✅ Implementato il Wizard AI per generazione attività
- ✅ Limitato l'accesso alle funzionalità AI solo agli utenti con piano AI
- ✅ Implementata visualizzazione ricca delle attività generate
- ✅ Aggiunta visualizzazione su mappa interattiva con Mapbox

## Prossimi Passi

1. **Automazione Sottoscrizioni**
   - Configurare un cron job per verificare periodicamente le sottoscrizioni scadute
   - Aggiungere notifiche email per cambiamenti di stato delle sottoscrizioni
   - Implementare sistema di promemoria per abbonamenti in scadenza

2. **Dashboard Amministrativa**
   - Creare una dashboard per monitorare gli abbonamenti
   - Visualizzare metriche di conversione
   - Gestire gli abbonamenti degli utenti

3. **Miglioramenti UX**
   - Implementare un processo di onboarding per nuovi utenti premium
   - Migliorare la pagina di pricing con più dettagli e testimonianze
   - Aggiungere periodo di prova gratuito per il piano AI

4. **Funzionalità AI Avanzate**
   - Implementare suggerimenti proattivi basati sull'AI
   - Aggiungere funzionalità di ottimizzazione percorsi
   - Implementare analisi predittiva per costi e affluenza
