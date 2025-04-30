# Assistente AI di VoyageSmart - Documentazione Completa

Questo documento fornisce una documentazione completa dell'Assistente AI implementato in VoyageSmart, inclusa l'implementazione attuale, le funzionalità, i prossimi passi e le guide per il test.

**Ultimo aggiornamento:** Miglioramento dell'interfaccia utente dell'assistente AI, ottimizzazione del prompt di sistema per risposte più pertinenti, miglioramento della formattazione delle risposte con separazione chiara tra elementi e utilizzo di elenchi.

## Indice
- [Panoramica](#panoramica)
- [Implementazione Attuale](#implementazione-attuale)
- [Componenti Principali](#componenti-principali)
- [Funzionalità](#funzionalità)
- [Come Testare l'Assistente AI](#come-testare-lassistente-ai)
- [Implementazione Tecnica](#implementazione-tecnica)
- [Roadmap per Miglioramenti Futuri](#roadmap-per-miglioramenti-futuri)
- [Prossimi Passi](#prossimi-passi)
- [Considerazioni Tecniche](#considerazioni-tecniche)
- [Conclusione](#conclusione)

## Panoramica

L'Assistente AI di VoyageSmart è un chatbot intelligente integrato nella pagina del viaggio che utilizza l'API Gemini di Google per generare risposte pertinenti alle domande degli utenti, con accesso al contesto completo del viaggio. L'assistente aiuta gli utenti nella pianificazione e gestione dei loro viaggi, fornendo informazioni, suggerimenti e risposte a domande specifiche sul viaggio.

## Implementazione Attuale

L'Assistente AI di VoyageSmart è stato ulteriormente migliorato per offrire un'esperienza utente più fluida e risposte più pertinenti. Le principali migliorie includono:

1. **Interfaccia utente ottimizzata**: L'assistente è ora più intuitivo e accessibile in tutte le pagine del viaggio.

2. **Prompt di sistema migliorato**: Il sistema è stato ottimizzato per generare risposte più pertinenti e contestuali, evitando ripetizioni inutili.

3. **Formattazione migliorata delle risposte**: Le risposte ora presentano una chiara separazione tra diversi elementi (alloggi, trasporti, itinerari) utilizzando formattazione appropriata con asterischi (**) e interruzioni di riga.

4. **Visualizzazione ottimizzata di elenchi**: Quando vengono mostrati più elementi (come alloggi o attività), questi vengono formattati correttamente con elenchi puntati e interruzioni di riga.

5. **Messaggi iniziali più concisi**: L'assistente ora fornisce messaggi iniziali più brevi che includono solo le informazioni essenziali (nome del viaggio, date e partecipanti).

L'assistente continua ad avere accesso al contesto completo del viaggio:

- **Dettagli del viaggio**: nome, destinazione, date, descrizione
- **Partecipanti**: nomi e ruoli
- **Alloggi**: nomi, tipi, date di check-in/check-out, indirizzi
- **Trasporti**: tipi, provider, orari, luoghi di partenza/arrivo
- **Itinerario**: giorni, attività pianificate
- **Spese**: budget totale, spese effettuate, categorie

L'assistente è disponibile in tutte le pagine del viaggio grazie all'implementazione nel layout condiviso, e la conversazione persiste tra le diverse pagine, permettendo all'utente di continuare la conversazione senza interruzioni quando naviga tra le sezioni.

## Componenti Principali

L'implementazione dell'Assistente AI è composta da diversi componenti:

1. **ChatBot.tsx**: Componente React che fornisce l'interfaccia utente per l'assistente
2. **chat/route.ts**: Endpoint API che gestisce le richieste dal frontend e comunica con l'API Gemini
3. **tripContextService.ts**: Servizio che recupera il contesto completo del viaggio
4. **geminiService.ts**: Servizio che gestisce le chiamate all'API Gemini di Google

### 1. Servizio Gemini

Il servizio Gemini (`src/lib/services/geminiService.ts`) gestisce le chiamate all'API Gemini di Google. Utilizza la libreria ufficiale `@google/generative-ai` per comunicare con l'API.

Funzionalità principali:
- Inizializzazione del modello Gemini Pro
- Generazione di risposte basate sul prompt dell'utente
- Inclusione del contesto del viaggio nelle richieste
- Gestione degli errori

### 2. Endpoint API

L'endpoint API (`src/app/api/ai/chat/route.ts`) gestisce le richieste dal frontend. Riceve il messaggio dell'utente e il contesto del viaggio, e restituisce la risposta generata dall'API Gemini.

Funzionalità principali:
- Verifica dell'autenticazione dell'utente
- Validazione dei dati della richiesta
- Chiamata al servizio Gemini
- Gestione degli errori

### 3. Servizio Contesto

Il servizio contesto (`src/lib/services/tripContextService.ts`) raccoglie tutte le informazioni del viaggio da Supabase e le formatta in un oggetto strutturato che viene utilizzato per fornire contesto all'assistente AI.

Informazioni raccolte:
- Dettagli base del viaggio (nome, descrizione, destinazione, date)
- Partecipanti
- Alloggi
- Trasporti
- Attività
- Spese
- Giorni dell'itinerario

### 4. Componente UI

Il componente UI (`src/components/ai/ChatBot.tsx`) fornisce l'interfaccia utente per interagire con l'assistente AI. È un componente React che mostra una finestra di chat fluttuante in tutte le pagine del viaggio.

Funzionalità principali:
- Visualizzazione dei messaggi
- Invio di messaggi all'API
- Indicatore di caricamento durante la generazione della risposta
- Possibilità di minimizzare, espandere o chiudere la finestra di chat
- Disponibile in tutte le pagine del viaggio grazie all'implementazione nel layout condiviso (`src/app/trips/[id]/layout.tsx`)
- Persistenza della conversazione tra le diverse pagine del viaggio tramite localStorage
- Pulsante per cancellare la conversazione e ricominciare da capo

## Funzionalità

L'assistente AI può aiutare gli utenti con:

1. **Informazioni sul viaggio**: Fornire dettagli su destinazioni, date, partecipanti, ecc.
2. **Suggerimenti**: Offrire consigli su attività, ristoranti, attrazioni, ecc.
3. **Pianificazione**: Aiutare nella pianificazione dell'itinerario
4. **Gestione del budget**: Fornire consigli su come gestire le spese
5. **Rispondere a domande**: Rispondere a domande generali sul viaggio

L'assistente AI offre:

- **Interfaccia utente intuitiva** con possibilità di minimizzare, espandere o chiudere la finestra
- **Generazione di risposte** utilizzando l'API Gemini 1.5 Flash
- **Contesto completo del viaggio**:
  - Dettagli del viaggio (nome, destinazioni multiple, date, budget)
  - Partecipanti (nomi, ruoli, email)
  - Alloggi (se disponibili)
  - Trasporti (se disponibili)
  - Attività (se disponibili)
- **Gestione degli errori** con messaggi di fallback in caso di problemi

## Come Testare l'Assistente AI

1. **Avvia l'applicazione**:
   ```bash
   npm run dev
   ```

2. **Accedi all'applicazione** e naviga alla pagina di un viaggio.

3. **Interagisci con l'Assistente AI**:
   - Dovresti vedere l'assistente AI nell'angolo in basso a destra della pagina
   - Puoi minimizzare, espandere o chiudere l'assistente usando i pulsanti nell'intestazione
   - Invia messaggi nella casella di testo in basso

4. **Prova diverse domande sul contesto del viaggio**:
   - "Quali sono le date del mio viaggio?"
   - "Qual è la destinazione del viaggio?"
   - "Chi partecipa a questo viaggio?"
   - "Qual è il budget per questo viaggio?"
   - "Quali alloggi sono prenotati per questo viaggio?"
   - "Quali trasporti sono prenotati?"

5. **Prova domande generali**:
   - "Cosa puoi fare per aiutarmi?"
   - "Suggeriscimi cosa vedere a [destinazione]"
   - "Come posso pianificare meglio il mio viaggio?"
   - "Quali sono i migliori ristoranti a [destinazione]?"
   - "Cosa dovrei mettere in valigia per questo viaggio?"

## Implementazione Tecnica

### Contesto Completo del Viaggio

```typescript
// In src/app/trips/[id]/page.tsx
// Passaggio dei dati del viaggio al componente ChatBot
<ChatBot
  tripId={id as string}
  tripName={trip?.name || 'Viaggio'}
  tripData={trip ? {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    destination: trip.destination,
    destinations: trip.destinations || [trip.destination],
    startDate: trip.start_date,
    endDate: trip.end_date,
    budget: trip.budget_total,
    currency: trip.currency || 'EUR',
    participants: participants || [],
    isPrivate: trip.is_private,
    createdAt: trip.created_at,
    owner: trip.owner_id,
    accommodations: trip.accommodations || [],
    transportation: trip.transportation || [],
    activities: trip.activities || []
  } : undefined}
/>

// In src/app/api/ai/chat/route.ts
// Creazione del prompt con il contesto completo
let promptText = `Sei un assistente di viaggio intelligente per l'app VoyageSmart.
Stai aiutando l'utente con il suo viaggio "${tripContext.trip?.name || tripName || 'senza nome'}" a ${tripContext.trip?.destination || 'destinazione sconosciuta'}.`;

// Aggiungi un promemoria per l'assistente di mantenere il contesto
promptText += `
IMPORTANTE: Ricorda sempre questi dettagli del viaggio nelle tue risposte e non contraddirli mai, ma NON ripeterli all'inizio di ogni risposta:
- Nome del viaggio: ${tripContext.trip?.name || tripName || 'senza nome'}
- Destinazioni: ${tripContext.trip?.destinations && tripContext.trip.destinations.length > 0
    ? tripContext.trip.destinations.join(', ')
    : tripContext.trip?.destination || 'destinazione sconosciuta'}
- Date: ${tripContext.trip?.startDate ? `dal ${tripContext.trip.startDate} al ${tripContext.trip.endDate}` : 'date non specificate'}
- Budget: ${tripContext.trip?.budget ? `${tripContext.trip.budget} ${tripContext.trip.currency || 'EUR'}` : 'non specificato'}
- Partecipanti: ${tripContext.participants && tripContext.participants.length > 0
    ? tripContext.participants.map(p => p.name || p.full_name || p.email || 'Partecipante').join(', ')
    : 'non specificati'}

MOLTO IMPORTANTE:
1. NON iniziare le tue risposte con "Ciao!" o simili frasi introduttive.
2. Rispondi direttamente alla domanda dell'utente in modo naturale e conversazionale.
3. Quando mostri elenchi di elementi (alloggi, trasporti, attività), usa una formattazione chiara con:
   - Interruzioni di riga tra elementi diversi
   - Asterischi (**) per evidenziare i titoli delle sezioni
   - Elenchi puntati per elementi multipli dello stesso tipo
4. Mantieni le risposte concise ma complete, evitando ripetizioni inutili.
`;
```

### Recupero del Contesto

Il servizio `getTripContext` recupera tutti i dati del viaggio da Supabase:

```typescript
export async function getTripContext(tripId: string) {
  try {
    // Recupera i dettagli base del viaggio
    const { data: tripData } = await supabase
      .from('trips')
      .select(`*`)
      .eq('id', tripId)
      .single();

    // Recupera i partecipanti, alloggi, trasporti, attività, spese, ecc.

    // Formatta i dati per il contesto
    const tripContext = {
      trip: { /* dettagli del viaggio */ },
      participants: [ /* partecipanti */ ],
      accommodations: [ /* alloggi */ ],
      transportation: [ /* trasporti */ ],
      itinerary: [ /* giorni e attività */ ],
      expenses: { /* spese */ }
    };

    return tripContext;
  } catch (error) {
    // In caso di errore, restituisci un contesto minimo
    return {
      trip: {
        id: tripId,
        name: 'Viaggio',
        destination: 'Destinazione sconosciuta'
      },
      error: 'Non è stato possibile recuperare tutti i dettagli del viaggio'
    };
  }
}
```

### Caricamento Automatico del Contesto

Il componente ChatBot carica automaticamente il contesto all'avvio:

```typescript
// Carica il contesto del viaggio all'avvio
useEffect(() => {
  const loadContext = async () => {
    try {
      // Invia un messaggio di sistema per caricare il contesto
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Carica il contesto del viaggio e presentati',
          tripId,
          tripName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Aggiorna il messaggio iniziale con le informazioni del viaggio
        setMessages([{
          role: 'assistant',
          content: data.message
        }]);
        setContextLoaded(true);
      }
    } catch (error) {
      console.error('Errore nel caricamento del contesto:', error);
    }
  };

  loadContext();
}, [tripId, tripName]);
```

## Roadmap per Miglioramenti Futuri

### Fase 1: Migliorare il Contesto del Viaggio ✅

L'assistente ora ha accesso al contesto completo del viaggio, inclusi:

- **Dettagli completi del viaggio**: destinazioni multiple, date, partecipanti ✅
- **Budget**: totale e valuta ✅
- **Partecipanti**: nomi, ruoli, email ✅
- **Alloggi**: nomi, tipi, date (se disponibili) ✅
- **Trasporti**: tipi, provider, orari (se disponibili) ✅
- **Attività**: nomi, tipi, orari (se disponibili) ✅
- **Disponibilità in tutte le pagine del viaggio** ✅
- **Miglioramento delle risposte per evitare ripetizioni** ✅
- **Ottimizzazione del messaggio iniziale per renderlo più conciso** ✅
- **Persistenza della conversazione tra le diverse pagine del viaggio** ✅
- **Integrazione dell'itinerario nel contesto dell'assistente** ✅

### Fase 2: Aggiungere Persistenza e Memoria ✅

- **Salvare la cronologia dei messaggi** in localStorage ✅
- **Caricare la cronologia** quando l'utente naviga tra le pagine ✅
- **Implementare memoria contestuale** per riferimenti a messaggi precedenti
- **Aggiungere la possibilità di cancellare la conversazione** ✅

### Fase 3: Implementare Funzionalità Specifiche

- **Generazione di itinerari** basati su destinazione, durata e preferenze
- **Ottimizzazione dei percorsi** per attività giornaliere
- **Suggerimenti personalizzati** basati sulle preferenze dell'utente
- **Integrazione con dati meteo** per consigli basati sulle condizioni atmosferiche

### Fase 4: Migliorare l'Interfaccia Utente

- **Supporto per messaggi formattati** (markdown, link, elenchi)
- **Suggerimenti di domande predefinite**
- **Tema personalizzabile** (chiaro/scuro)
- **Notifiche per nuovi messaggi**
- **Animazioni e transizioni** per un'esperienza più fluida

### Fase 5: Ottimizzare le Prestazioni

- **Implementare caching** per risposte comuni
- **Utilizzare streaming** per risposte lunghe
- **Ottimizzare i prompt** per ridurre i token utilizzati
- **Implementare rate limiting** per evitare abusi

## Prossimi Passi

### 1. Completare l'Integrazione del Contesto del Viaggio ✅

La versione attuale utilizza un contesto di viaggio completo che recupera i dati reali dal database:

1. ✅ Risolti i problemi con la funzione `getTripContext` originale
2. ✅ Testato il recupero dei dati per ogni tipo di informazione (partecipanti, alloggi, trasporti, attività, spese)
3. ✅ Formattati correttamente i dati per l'uso con l'API Gemini
4. ✅ Implementato l'assistente in tutte le pagine del viaggio
5. ✅ Migliorato il prompt per utilizzare correttamente le informazioni sugli alloggi e i trasporti
6. ✅ Ottimizzato il messaggio iniziale dell'assistente per renderlo più conciso
7. ✅ Implementata la persistenza della conversazione tra le diverse pagine del viaggio
8. ✅ Aggiunta la possibilità di cancellare la conversazione
9. ✅ Integrato l'itinerario completo nel contesto dell'assistente

### 2. Migliorare l'Interfaccia Utente ✅

L'interfaccia utente è stata migliorata per offrire una migliore esperienza utente:

1. ✅ Ottimizzata la visualizzazione dell'assistente in tutte le pagine del viaggio
2. ✅ Aggiunto indicatore di digitazione durante il caricamento delle risposte
3. ✅ Migliorata la formattazione dei messaggi con separazione chiara tra elementi
4. ✅ Implementata la persistenza della chat tra le diverse pagine
5. ✅ Aggiunto pulsante per cancellare la conversazione

Ulteriori miglioramenti pianificati:
1. Aggiungere animazioni e transizioni più fluide
2. Implementare un tema personalizzabile (chiaro/scuro)
3. Aggiungere notifiche per nuovi messaggi

### 3. Migliorare il Prompt di Sistema ✅

Il prompt di sistema è stato migliorato per ottenere risposte più pertinenti:

1. ✅ Espanso il prompt con istruzioni dettagliate sul formato delle risposte
2. ✅ Aggiunte istruzioni specifiche per evitare ripetizioni e saluti standard
3. ✅ Incluse linee guida per la formattazione di elenchi e sezioni
4. ✅ Ottimizzato per risposte più concise e dirette

Ulteriori miglioramenti pianificati:
1. Aggiungere esempi di domande e risposte nel prompt
2. Includere istruzioni più specifiche per diversi tipi di richieste (informazioni, suggerimenti, pianificazione)
3. Continuare a testare e iterare il prompt per migliorare ulteriormente la qualità delle risposte

### 4. Implementare Funzionalità Avanzate

Una volta completata l'implementazione base, possiamo aggiungere funzionalità avanzate:

1. **Generazione di itinerari**: Implementare la generazione automatica di itinerari basati su destinazione, durata e preferenze
2. **Ottimizzazione percorsi**: Aggiungere l'ottimizzazione dei percorsi giornalieri
3. **Suggerimenti proattivi**: Fornire suggerimenti proattivi basati sul contesto
4. **Analisi predittiva**: Implementare l'analisi predittiva per costi e affluenza

### 5. Testare e Ottimizzare

Prima di rilasciare la funzionalità, dobbiamo testarla e ottimizzarla:

1. Testare l'assistente con diversi tipi di domande e richieste
2. Ottimizzare le prestazioni (ridurre i tempi di risposta)
3. Implementare il caching per le risposte comuni
4. Aggiungere meccanismi di fallback in caso di errori

## Considerazioni Tecniche

### Gestione Token e Costi

Le API di AI hanno costi basati sull'utilizzo. È importante:

1. Implementare limiti di utilizzo per piano
2. Monitorare l'utilizzo dei token
3. Ottimizzare i prompt per ridurre i costi
4. Implementare caching per richieste comuni

### Privacy e Sicurezza

1. Non inviare dati personali sensibili alle API esterne
2. Implementare filtri per i contenuti generati
3. Ottenere consenso esplicito dagli utenti per l'utilizzo dei loro dati

### Prestazioni

1. Implementare caching lato server per risposte comuni
2. Utilizzare streaming per risposte lunghe
3. Mostrare feedback visivo durante l'elaborazione
4. Implementare fallback in caso di errori API

## Conclusione

L'Assistente AI di VoyageSmart è stato ulteriormente migliorato con ottimizzazioni dell'interfaccia utente e del prompt di sistema, offrendo agli utenti un'esperienza più fluida e risposte più pertinenti. Le principali migliorie includono:

1. **Interfaccia utente ottimizzata** con migliore accessibilità in tutte le pagine del viaggio
2. **Prompt di sistema migliorato** per generare risposte più pertinenti e contestuali
3. **Formattazione migliorata delle risposte** con chiara separazione tra elementi e utilizzo appropriato di elenchi
4. **Messaggi iniziali più concisi** che includono solo le informazioni essenziali
5. **Persistenza della conversazione** tra le diverse pagine del viaggio

L'assistente continua ad avere accesso al contesto completo del viaggio, inclusi dettagli, partecipanti, alloggi, trasporti, itinerario e spese, permettendogli di fornire risposte personalizzate e specifiche per ogni viaggio.

I prossimi passi includono l'aggiunta di esempi di domande e risposte nel prompt, l'implementazione di funzionalità avanzate come la generazione di itinerari e l'ottimizzazione dei percorsi, e il continuo miglioramento dell'interfaccia utente per renderla ancora più intuitiva e piacevole da utilizzare.

Per qualsiasi problema o domanda sull'implementazione, consulta il codice sorgente nei file:
- `src/components/ai/ChatBot.tsx`
- `src/app/api/ai/chat/route.ts`
- `src/lib/services/tripContextService.ts`
- `src/lib/services/geminiService.ts`
