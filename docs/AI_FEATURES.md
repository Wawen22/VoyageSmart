# Funzionalità AI in VoyageSmart

Questo documento descrive le funzionalità AI implementate in VoyageSmart, il loro funzionamento e le restrizioni di accesso.

## Panoramica

VoyageSmart integra funzionalità di intelligenza artificiale per migliorare l'esperienza di pianificazione dei viaggi. Queste funzionalità sono disponibili esclusivamente per gli utenti con abbonamento "AI Assistant", ora attivo e disponibile per tutti gli utenti.

## Funzionalità AI Disponibili

### 1. Assistente AI di Viaggio

L'Assistente AI è un chatbot intelligente che fornisce informazioni e suggerimenti personalizzati sul viaggio dell'utente.

**Caratteristiche principali:**
- Accesso al contesto completo del viaggio (date, destinazioni, partecipanti, alloggi, trasporti, itinerario)
- Risposte personalizzate basate sui dettagli specifici del viaggio
- Interfaccia minimizzabile presente in tutte le pagine del viaggio
- Domande suggerite per facilitare l'interazione
- Persistenza dello stato di minimizzazione tra le sessioni

**Implementazione tecnica:**
- Integrazione con l'API Gemini di Google (modello gemini-1.5-flash-latest)
- Componente React `ChatBot.tsx` per l'interfaccia utente
- Endpoint API `/api/ai/chat` per l'elaborazione delle richieste

### 2. Wizard di Generazione Attività

Il Wizard di Generazione Attività è uno strumento guidato che utilizza l'AI per creare automaticamente attività personalizzate per l'itinerario di viaggio.

**Caratteristiche principali:**
- Interfaccia guidata passo-passo
- Selezione di temi di viaggio predefiniti
- Selezione interattiva dei giorni dell'itinerario
- Generazione di attività personalizzate in base alle preferenze
- Visualizzazione delle attività generate in formato timeline e mappa
- Possibilità di modificare o rimuovere attività prima del salvataggio

**Implementazione tecnica:**
- Integrazione con l'API Gemini di Google
- Componente React `ItineraryWizard.tsx` per l'interfaccia utente
- Componenti ausiliari per la visualizzazione delle attività (`ActivityTimeline.tsx`, `ActivityMapView.tsx`)
- Integrazione con Mapbox per la visualizzazione su mappa

## Restrizioni di Accesso

Le funzionalità AI sono disponibili esclusivamente per gli utenti con abbonamento "AI Assistant". Gli utenti con piani Free o Premium non hanno accesso a queste funzionalità.

**Implementazione delle restrizioni:**
- Utilizzo del hook `useSubscription` per verificare il tipo di abbonamento dell'utente
- Funzione `canAccessFeature('ai_assistant')` per controllare l'accesso
- Componente `AIUpgradePrompt` per invitare gli utenti a fare l'upgrade quando tentano di accedere a funzionalità AI

## Miglioramenti Recenti

Le seguenti funzionalità AI sono state recentemente migliorate:

1. **Assistente AI di Viaggio**
   - Interfaccia utente ottimizzata con migliore accessibilità in tutte le pagine del viaggio
   - Prompt di sistema migliorato per generare risposte più pertinenti e contestuali
   - Formattazione migliorata delle risposte con chiara separazione tra elementi
   - Messaggi iniziali più concisi che includono solo le informazioni essenziali
   - Persistenza della conversazione tra le diverse pagine del viaggio

2. **Wizard di Generazione Attività**
   - Visualizzazione ricca delle attività con icone specifiche per tipo
   - Timeline interattiva per visualizzare le attività organizzate per giorno
   - Selezione dei giorni migliorata con pulsanti interattivi
   - Visualizzazione su mappa interattiva con Mapbox
   - Geocodifica automatica delle location per ottenere le coordinate precise
   - Marker colorati in base al tipo di attività con numerazione progressiva
   - Modalità fullscreen per una visualizzazione più ampia della mappa

## Prossimi Sviluppi

Le seguenti funzionalità AI sono in fase di sviluppo:

1. **Suggerimenti Proattivi**
   - Suggerimenti automatici basati sul contesto del viaggio
   - Notifiche intelligenti per attività imminenti
   - Raccomandazioni personalizzate basate sulle preferenze dell'utente

2. **Ottimizzazione Percorsi**
   - Analisi e ottimizzazione degli spostamenti
   - Suggerimenti per ridurre tempi di viaggio e costi
   - Visualizzazione ottimizzata dei percorsi sulla mappa

3. **Analisi Predittiva**
   - Previsione di costi e affluenza
   - Suggerimenti per evitare periodi di alta stagione
   - Analisi del budget e suggerimenti per risparmiare

## Integrazione con il Sistema di Abbonamenti

Il sistema di abbonamenti di VoyageSmart è stato aggiornato per includere il piano "AI Assistant" che sblocca tutte le funzionalità AI. Gli utenti possono effettuare l'upgrade dalla pagina Pricing o tramite i prompt di upgrade mostrati quando tentano di accedere a funzionalità AI.

---

© 2025 Voyage Smart (Wawen22). Tutti i diritti riservati.
