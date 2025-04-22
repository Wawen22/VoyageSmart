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
  - Accesso completo a tutte le funzionalità
  - Gestione alloggi (Accommodations)
  - Gestione trasporti (Transportation)
  - Supporto prioritario

### Piano AI (Coming Soon)
- **Prezzo**: €9.99/mese
- **Vantaggi**:
  - Tutte le funzionalità Premium
  - Assistente AI per la pianificazione
  - Ottimizzazione percorsi
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
- `UpgradePrompt`: Componente per mostrare un prompt di upgrade
- `TripLimitPrompt`: Componente per mostrare un prompt quando si raggiunge il limite di viaggi
- `PricingPage`: Pagina per visualizzare e selezionare i piani di abbonamento

### Funzioni di Controllo Accesso
- `isSubscribed(tier)`: Verifica se l'utente è abbonato a un determinato piano
- `canCreateTrip()`: Verifica se l'utente può creare un nuovo viaggio
- `canAccessFeature(feature)`: Verifica se l'utente può accedere a una funzionalità premium

### Integrazione nelle Pagine
- Controllo di accesso nella pagina Accommodations
- Controllo di accesso nella pagina Transportation
- Controllo del limite di viaggi nella pagina New Trip

## Prossimi Passi

1. **Integrazione con Stripe**
   - Implementare il processo di pagamento
   - Gestire webhook per aggiornamenti di abbonamento
   - Implementare fatturazione e ricevute

2. **Dashboard Amministrativa**
   - Creare una dashboard per monitorare gli abbonamenti
   - Visualizzare metriche di conversione
   - Gestire gli abbonamenti degli utenti

3. **Miglioramenti UX**
   - Aggiungere notifiche per abbonamenti in scadenza
   - Implementare un processo di onboarding per nuovi utenti premium
   - Migliorare la pagina di pricing con più dettagli e testimonianze

4. **Funzionalità AI**
   - Sviluppare le funzionalità AI per il piano AI
   - Implementare l'integrazione con OpenAI o Google Gemini
   - Creare un'interfaccia utente per l'assistente AI
