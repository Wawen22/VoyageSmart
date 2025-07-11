import { NextRequest, NextResponse } from 'next/server';
import { getTripContext } from '@/lib/services/tripContextService';
import { queueAIRequest, getQueueStats } from '@/lib/services/aiQueueService';
import { aiAnalytics } from '@/lib/services/aiAnalyticsService';
import { validateInput, aiChatSchema, validateSecurity } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { formatTimeLocal, formatDateLocal } from '@/lib/utils';
import { applyRateLimit } from '@/lib/rate-limit';

// Funzione per analizzare automaticamente il contenuto e aggiungere marcatori appropriati
function enhanceResponseWithVisualComponents(response: string, userMessage: string, tripContext: any): string {
  if (!tripContext) return response;

  let enhancedResponse = response;
  const lowerUserMessage = userMessage.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Parole chiave SPECIFICHE per identificare il contesto (più restrittive)
  const transportKeywords = [
    'volo', 'voli', 'aereo', 'aeroporto', 'partenza', 'arrivo', 'treno', 'treni', 'stazione',
    'autobus', 'bus', 'auto a noleggio', 'noleggio auto', 'trasporto', 'trasporti',
    'come arriviamo', 'come andiamo', 'mezzi di trasporto', 'biglietto', 'biglietti',
    'ferry', 'nave', 'traghetto', 'metro', 'metropolitana', 'taxi', 'uber', 'transfer',
    'terminal', 'gate', 'binario', 'piattaforma', 'scalo', 'coincidenza', 'ritardo',
    'orario partenza', 'orario arrivo', 'che ora parte', 'che ora arriva'
  ];

  const itineraryKeywords = [
    'itinerario', 'programma giornaliero', 'attività pianificate', 'cosa facciamo', 'dove andiamo',
    'programma del giorno', 'programma di domani', 'programma di oggi',
    'attività di domani', 'attività di oggi', 'cosa è previsto',
    'schedule', 'agenda del viaggio', 'pianificazione', 'cosa visitiamo',
    'tour programmati', 'escursioni pianificate', 'visite programmate'
  ];

  const accommodationKeywords = [
    'hotel', 'albergo', 'alloggio', 'alloggi', 'appartamento', 'dove dormiamo',
    'dove alloggiamo', 'dove soggiorniamo', 'check-in', 'check-out', 'prenotazione hotel',
    'booking alloggio', 'resort', 'b&b', 'bed and breakfast', 'ostello', 'airbnb',
    'struttura ricettiva', 'sistemazione', 'pernottamento'
  ];

  const expenseKeywords = [
    'spese del viaggio', 'costi del viaggio', 'budget del viaggio', 'quanto abbiamo speso',
    'quanto è costato', 'chi ha pagato', 'divisione spese', 'split delle spese',
    'conto totale', 'spese sostenute', 'esborso', 'pagamenti effettuati',
    'riepilogo spese', 'bilancio del viaggio'
  ];

  // Funzione helper per verificare se ci sono parole chiave (più restrittiva)
  const hasKeywords = (keywords: string[], text: string) => {
    return keywords.some(keyword => {
      // Verifica che la keyword sia presente come parola completa o frase
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(text) || text.includes(keyword.toLowerCase());
    });
  };

  // Funzione per determinare se la domanda è SPECIFICAMENTE su un argomento
  const isSpecificallyAbout = (keywords: string[], userMessage: string, response: string) => {
    const userHasKeywords = hasKeywords(keywords, userMessage);
    const responseHasKeywords = hasKeywords(keywords, response);

    // Deve essere presente nella domanda dell'utente O nella risposta dell'AI
    // ma non in entrambe contemporaneamente per evitare falsi positivi
    return userHasKeywords || responseHasKeywords;
  };

  // Verifica se la risposta già contiene marcatori per evitare duplicati
  const hasTransportMarker = enhancedResponse.includes('[AI_DATA:transportation]');
  const hasItineraryMarker = enhancedResponse.includes('[AI_DATA:itinerary]');
  const hasAccommodationMarker = enhancedResponse.includes('[AI_DATA:accommodations]');
  const hasExpenseMarker = enhancedResponse.includes('[AI_DATA:expenses]');

  // Funzione per determinare il limite di elementi da mostrare
  const getItemLimit = (userMessage: string, totalItems: number) => {
    // Se l'utente chiede "tutto" o "tutti", non limitare
    if (userMessage.includes('tutto') || userMessage.includes('tutti') || userMessage.includes('completo')) {
      return '';
    }

    // Se ci sono molti elementi, limita automaticamente
    if (totalItems > 10) return ':10';
    if (totalItems > 5) return ':5';
    return '';
  };

  // Conta quanti tipi di componenti sarebbero attivati per evitare sovrapposizioni
  let componentsToAdd = 0;
  const shouldShowTransport = !hasTransportMarker && isSpecificallyAbout(transportKeywords, lowerUserMessage, lowerResponse);
  const shouldShowItinerary = !hasItineraryMarker && isSpecificallyAbout(itineraryKeywords, lowerUserMessage, lowerResponse);
  const shouldShowAccommodation = !hasAccommodationMarker && isSpecificallyAbout(accommodationKeywords, lowerUserMessage, lowerResponse);
  const shouldShowExpenses = !hasExpenseMarker && isSpecificallyAbout(expenseKeywords, lowerUserMessage, lowerResponse);

  if (shouldShowTransport) componentsToAdd++;
  if (shouldShowItinerary) componentsToAdd++;
  if (shouldShowAccommodation) componentsToAdd++;
  if (shouldShowExpenses) componentsToAdd++;

  // Se più di un componente sarebbe attivato, sii più selettivo
  // Mostra solo il componente più rilevante basato sulla domanda dell'utente
  if (componentsToAdd > 1) {
    // Priorità basata su parole chiave specifiche nella domanda dell'utente
    if (lowerUserMessage.includes('alloggi') || lowerUserMessage.includes('hotel') || lowerUserMessage.includes('dove dormiamo')) {
      // Solo alloggi
      if (shouldShowAccommodation && tripContext.accommodations && tripContext.accommodations.length > 0) {
        const limit = getItemLimit(lowerUserMessage, tripContext.accommodations.length);
        enhancedResponse += `\n\n[AI_DATA:accommodations${limit}]`;
      }
    } else if (lowerUserMessage.includes('trasporti') || lowerUserMessage.includes('volo') || lowerUserMessage.includes('treno')) {
      // Solo trasporti
      if (shouldShowTransport && tripContext.transportation && tripContext.transportation.length > 0) {
        const limit = getItemLimit(lowerUserMessage, tripContext.transportation.length);
        enhancedResponse += `\n\n[AI_DATA:transportation${limit}]`;
      }
    } else if (lowerUserMessage.includes('itinerario') || lowerUserMessage.includes('programma') || lowerUserMessage.includes('attività')) {
      // Solo itinerario
      if (shouldShowItinerary && tripContext.itinerary && tripContext.itinerary.length > 0) {
        let limit = '';
        if (lowerUserMessage.includes('domani') || lowerUserMessage.includes('oggi') ||
            lowerUserMessage.includes('ieri') || /\b(primo|secondo|terzo|quarto|quinto)\s+giorno\b/.test(lowerUserMessage)) {
          limit = ':1';
        } else {
          limit = getItemLimit(lowerUserMessage, tripContext.itinerary.length);
        }
        enhancedResponse += `\n\n[AI_DATA:itinerary${limit}]`;
      }
    } else if (lowerUserMessage.includes('spese') || lowerUserMessage.includes('budget') || lowerUserMessage.includes('quanto')) {
      // Solo spese
      if (shouldShowExpenses && tripContext.expenses && tripContext.expenses.length > 0) {
        let limit = '';
        if (lowerUserMessage.includes('ultime') || lowerUserMessage.includes('recenti')) {
          limit = ':10';
        } else {
          limit = getItemLimit(lowerUserMessage, tripContext.expenses.length);
        }
        enhancedResponse += `\n\n[AI_DATA:expenses${limit}]`;
      }
    }
    // Se nessuna priorità specifica, non aggiungere nulla per evitare confusione
  } else {
    // Se solo un componente è rilevante, aggiungilo
    if (shouldShowTransport && tripContext.transportation && tripContext.transportation.length > 0) {
      const limit = getItemLimit(lowerUserMessage, tripContext.transportation.length);
      enhancedResponse += `\n\n[AI_DATA:transportation${limit}]`;
    }

    if (shouldShowItinerary && tripContext.itinerary && tripContext.itinerary.length > 0) {
      let limit = '';
      if (lowerUserMessage.includes('domani') || lowerUserMessage.includes('oggi') ||
          lowerUserMessage.includes('ieri') || /\b(primo|secondo|terzo|quarto|quinto)\s+giorno\b/.test(lowerUserMessage)) {
        limit = ':1';
      } else {
        limit = getItemLimit(lowerUserMessage, tripContext.itinerary.length);
      }
      enhancedResponse += `\n\n[AI_DATA:itinerary${limit}]`;
    }

    if (shouldShowAccommodation && tripContext.accommodations && tripContext.accommodations.length > 0) {
      const limit = getItemLimit(lowerUserMessage, tripContext.accommodations.length);
      enhancedResponse += `\n\n[AI_DATA:accommodations${limit}]`;
    }

    if (shouldShowExpenses && tripContext.expenses && tripContext.expenses.length > 0) {
      let limit = '';
      if (lowerUserMessage.includes('ultime') || lowerUserMessage.includes('recenti')) {
        limit = ':10';
      } else {
        limit = getItemLimit(lowerUserMessage, tripContext.expenses.length);
      }
      enhancedResponse += `\n\n[AI_DATA:expenses${limit}]`;
    }
  }

  return enhancedResponse;
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  let tripId: string | undefined;
  let message: string | undefined;

  try {
    // Apply rate limiting first
    const { rateLimitResult, headers } = applyRateLimit(request);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for AI chat', {
        clientId: request.headers.get('x-forwarded-for') || 'unknown',
        remaining: rateLimitResult.remaining
      });

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Hai fatto troppe richieste. Riprova tra qualche minuto.'
        },
        {
          status: 429,
          headers
        }
      );
    }

    // Ottieni i dati dalla richiesta
    const requestData = await request.json();
    const { message: requestMessage, tripId: requestTripId, tripName, tripData, isInitialMessage } = requestData;

    // Assign to outer scope variables
    tripId = requestTripId;
    message = requestMessage;

    // Log della richiesta
    logger.apiRequest('POST', '/api/ai/chat', 200, 0, {
      hasMessage: !!message,
      hasTripId: !!tripId,
      isInitialMessage
    });

    console.log('=== API Chat chiamata ===');
    console.log('Message:', message);
    console.log('Trip ID:', tripId);
    console.log('Trip Name:', tripName);
    console.log('Trip Data passati direttamente:', tripData);
    console.log('È il messaggio iniziale?', isInitialMessage);

    // Validazione input con schema Zod
    const validation = validateInput(aiChatSchema, {
      message,
      trip_id: tripId
    });

    if (!validation.success) {
      logger.warn('AI Chat validation failed', {
        errors: validation.errors,
        tripId
      });
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // Controllo sicurezza per il messaggio
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const securityCheck = validateSecurity(message);
    if (!securityCheck.safe) {
      logger.security('Potential security threat in AI chat message', {
        issues: securityCheck.issues,
        tripId,
        messageLength: message.length
      });
      return NextResponse.json(
        { error: 'Message contains potentially unsafe content' },
        { status: 400 }
      );
    }

    // Verifica che l'ID del viaggio sia valido
    if (!tripId) {
      logger.warn('Invalid trip ID provided', { tripId });
      return NextResponse.json(
        { error: 'Trip ID is required', message: 'Mi dispiace, non riesco a trovare informazioni su questo viaggio.' },
        { status: 400 }
      );
    }

    // Recupera il contesto del viaggio
    logger.debug('Starting trip context retrieval', { tripId });
    let tripContext;

    // Se abbiamo i dati del viaggio passati direttamente, li utilizziamo
    if (tripData) {
      console.log('Utilizzo i dati del viaggio passati direttamente');

      // Crea un contesto con i dati passati direttamente
      tripContext = {
        trip: {
          id: tripId,
          name: tripData.name || tripName || 'Viaggio',
          description: tripData.description || '',
          destination: tripData.destination || 'destinazione sconosciuta',
          destinations: tripData.destinations || [tripData.destination].filter(Boolean),
          startDate: tripData.startDate || '',
          endDate: tripData.endDate || '',
          budget: tripData.budget || 0,
          currency: tripData.currency || 'EUR',
          isPrivate: tripData.isPrivate || false,
          createdAt: tripData.createdAt || '',
          owner: tripData.owner || ''
        },
        participants: Array.isArray(tripData.participants) ?
          tripData.participants.map(p => ({
            name: p.name || p.full_name || p.email || 'Partecipante',
            email: p.email || '',
            role: p.role || 'Partecipante'
          })) : [],
        accommodations: Array.isArray(tripData.accommodations) ?
          tripData.accommodations.map(a => ({
            name: a.name || 'Alloggio',
            type: a.type || '',
            checkIn: a.check_in_date || a.checkIn || '',
            checkOut: a.check_out_date || a.checkOut || '',
            address: a.address || ''
          })) : [],
        transportation: Array.isArray(tripData.transportation) ?
          tripData.transportation.map(t => ({
            type: t.type || 'Trasporto',
            provider: t.provider || '',
            departureTime: t.departure_time || t.departureTime || '',
            departureLocation: t.departure_location || t.departureLocation || '',
            arrivalTime: t.arrival_time || t.arrivalTime || '',
            arrivalLocation: t.arrival_location || t.arrivalLocation || ''
          })) : [],
        // Gestisci sia le attività dirette che l'itinerario completo
        activities: Array.isArray(tripData.activities) ?
          tripData.activities.map(a => ({
            name: a.name || 'Attività',
            type: a.type || '',
            startTime: a.start_time || a.startTime || '',
            endTime: a.end_time || a.endTime || '',
            location: a.location || ''
          })) : [],
        // Aggiungi l'itinerario completo se disponibile
        itinerary: Array.isArray(tripData.itinerary) ?
          tripData.itinerary.map(day => ({
            id: day.id,
            day_date: day.day_date || day.date,
            date: day.day_date || day.date,
            notes: day.notes,
            activities: Array.isArray(day.activities) ?
              day.activities.map(activity => ({
                id: activity.id,
                name: activity.name || 'Attività',
                type: activity.type || '',
                start_time: activity.start_time || activity.startTime || '',
                startTime: activity.start_time || activity.startTime || '',
                end_time: activity.end_time || activity.endTime || '',
                endTime: activity.end_time || activity.endTime || '',
                location: activity.location || '',
                notes: activity.notes || '',
                day_id: activity.day_id
              })) : []
          })) : [],
        expenses: {
          items: [],
          total: tripData.budget || 0,
          currency: tripData.currency || 'EUR'
        }
      };

      console.log('Contesto creato dai dati passati direttamente:', JSON.stringify(tripContext).substring(0, 200) + '...');
    } else {
      // Altrimenti, prova a recuperare il contesto dal database
      console.log('Recupero contesto completo per il viaggio:', tripId);

      try {
        tripContext = await getTripContext(tripId);
        console.log('Contesto recuperato con successo:', JSON.stringify(tripContext).substring(0, 200) + '...');
      } catch (contextError) {
        console.error('Errore nel recupero del contesto:', contextError);
        // Crea un contesto minimo in caso di errore
        tripContext = {
          trip: {
            id: tripId,
            name: tripName || 'Viaggio',
            destination: 'destinazione sconosciuta'
          },
          participants: [],
          accommodations: [],
          transportation: [],
          itinerary: [],
          expenses: {
            items: [],
            total: 0,
            currency: 'EUR'
          }
        };
      }
    }

    // Log del contesto finale
    console.log('Contesto finale utilizzato:', {
      tripName: tripContext.trip?.name,
      destination: tripContext.trip?.destination,
      startDate: tripContext.trip?.startDate,
      endDate: tripContext.trip?.endDate,
      participantsCount: tripContext.participants?.length || 0,
      participants: tripContext.participants?.map(p => p.name || p.full_name || p.email || 'Partecipante'),
      accommodationsCount: tripContext.accommodations?.length || 0,
      transportationCount: tripContext.transportation?.length || 0,
      itineraryDaysCount: tripContext.itinerary?.length || 0,
      itinerarySample: tripContext.itinerary && tripContext.itinerary.length > 0
        ? {
            dayDate: tripContext.itinerary[0].day_date,
            activitiesCount: tripContext.itinerary[0].activities?.length || 0,
            activitySample: tripContext.itinerary[0].activities && tripContext.itinerary[0].activities.length > 0
              ? {
                  name: tripContext.itinerary[0].activities[0].name,
                  location: tripContext.itinerary[0].activities[0].location
                }
              : 'No activities'
          }
        : 'No itinerary days'
    });

    // Prepara il prompt con il contesto del viaggio
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
1. NON iniziare MAI le tue risposte con "Ciao!" o simili saluti.
2. Rispondi direttamente alla domanda dell'utente in modo naturale e conversazionale.
3. Quando mostri elenchi di elementi (alloggi, trasporti, attività), usa una formattazione chiara con:
   - Interruzioni di riga tra elementi diversi
   - Asterischi (**) per evidenziare i titoli delle sezioni
   - Elenchi puntati per elementi multipli dello stesso tipo
4. Mantieni le risposte concise ma complete, evitando ripetizioni inutili.
5. Usa sempre una linea vuota tra elementi di un elenco quando contengono più di una riga di informazioni.
`;

    // Aggiungi dettagli sugli alloggi se disponibili
    if (tripContext.accommodations && tripContext.accommodations.length > 0) {
      promptText += `
- Alloggi: ${tripContext.accommodations.map(a => `${a.name} (${a.type || 'non specificato'})`).join(', ')}`;
    }

    // Aggiungi dettagli sui trasporti se disponibili
    if (tripContext.transportation && tripContext.transportation.length > 0) {
      promptText += `
- Trasporti: ${tripContext.transportation.map(t => `${t.type || 'Trasporto'} ${t.provider ? `con ${t.provider}` : ''}`).join(', ')}`;
    }

    // Aggiungi dettagli sull'itinerario se disponibile
    if (tripContext.itinerary && tripContext.itinerary.length > 0) {
      // Conta le attività totali
      let totalActivities = 0;
      tripContext.itinerary.forEach(day => {
        if (day.activities && Array.isArray(day.activities)) {
          totalActivities += day.activities.length;
        }
      });

      promptText += `
- Itinerario: ${tripContext.itinerary.length} giorni pianificati con ${totalActivities} attività`;
    }

    promptText += `

Anche se l'utente chiede informazioni generiche, fai sempre riferimento a questo specifico viaggio.
Se l'utente chiede informazioni sulle date, rispondi sempre con le date sopra indicate.
Se l'utente chiede informazioni sulla destinazione, rispondi sempre con le destinazioni sopra indicate.
Se l'utente chiede informazioni sul budget, rispondi sempre con il budget sopra indicato.
Se l'utente chiede informazioni sui partecipanti, rispondi sempre con i partecipanti sopra indicati.
Non dire mai che non conosci questi dettagli, perché li conosci.

MOLTO IMPORTANTE: NON iniziare le tue risposte con "Ciao! Per il tuo viaggio a..." o simili frasi che ripetono i dettagli del viaggio. Rispondi direttamente alla domanda dell'utente in modo naturale e conversazionale, senza ripetere i dettagli del viaggio all'inizio di ogni risposta.

FORMATTAZIONE DELLE RISPOSTE:
- Usa il markdown per strutturare le tue risposte in modo chiaro e leggibile
- Utilizza **grassetto** per evidenziare informazioni importanti
- Usa elenchi puntati (•) o numerati per organizzare le informazioni
- Separa le sezioni diverse con linee vuote per migliorare la leggibilità
- Per informazioni su alloggi, trasporti, attività, usa questo formato:
  **🏨 Alloggi:** [informazioni]
  **🚗 Trasporti:** [informazioni]
  **📅 Itinerario:** [informazioni]
- Usa emoji appropriate per rendere le risposte più visive e accattivanti
- Quando elenchi più elementi, usa sempre elenchi puntati o numerati
- Mantieni paragrafi brevi e ben separati per facilitare la lettura
`;

    console.log('Preparazione prompt con contesto:', {
      tripName: tripContext.trip?.name,
      destination: tripContext.trip?.destination,
      hasParticipants: tripContext.participants?.length > 0,
      hasAccommodations: tripContext.accommodations?.length > 0,
      hasTransportation: tripContext.transportation?.length > 0,
      hasItinerary: tripContext.itinerary?.length > 0
    });

    // Aggiungi dettagli del viaggio
    if (tripContext.trip) {
      promptText += `
Date del viaggio: dal ${tripContext.trip.startDate || 'non specificate'} al ${tripContext.trip.endDate || 'non specificate'}.
Descrizione: ${tripContext.trip.description || 'Nessuna descrizione disponibile'}.
`;
    }

    // Aggiungi partecipanti
    if (tripContext.participants && tripContext.participants.length > 0) {
      promptText += `
Partecipanti: ${tripContext.participants.map(p => p.name).join(', ')}.
`;
    }

    // Aggiungi alloggi
    if (tripContext.accommodations && tripContext.accommodations.length > 0) {
      promptText += `
Alloggi prenotati:
${tripContext.accommodations.map(a => `- ${a.name} (${a.type}): check-in ${a.checkIn}, check-out ${a.checkOut}, indirizzo: ${a.address}`).join('\n')}
`;
    }

    // Aggiungi trasporti
    if (tripContext.transportation && tripContext.transportation.length > 0) {
      promptText += `
Trasporti prenotati:
${tripContext.transportation.map(t => {
  const departureTime = formatTimeLocal(t.departureTime);
  const arrivalTime = formatTimeLocal(t.arrivalTime);
  return `- ${t.type} con ${t.provider}: da ${t.departureLocation} (${departureTime}) a ${t.arrivalLocation} (${arrivalTime})`;
}).join('\n')}
`;
    }

    // Aggiungi itinerario
    if (tripContext.itinerary && tripContext.itinerary.length > 0) {
      // Log itinerary data for debugging
      console.log('Itinerary data in prompt:', {
        daysCount: tripContext.itinerary.length,
        sampleDay: tripContext.itinerary.length > 0 ? JSON.stringify(tripContext.itinerary[0]).substring(0, 200) : null
      });

      // Stampa l'itinerario completo per debug
      console.log('Itinerario completo:', JSON.stringify(tripContext.itinerary));

      try {
        // Conta le attività totali
        let totalActivities = 0;
        tripContext.itinerary.forEach(day => {
          if (day.activities && Array.isArray(day.activities)) {
            totalActivities += day.activities.length;
          }
        });

        // Log dettagliato dell'itinerario per debug
        console.log('Dettaglio itinerario per prompt:');
        tripContext.itinerary.forEach((day, idx) => {
          console.log(`Giorno ${idx + 1} (${day.day_date}): ${day.activities?.length || 0} attività`);
          if (day.activities && day.activities.length > 0) {
            day.activities.forEach((act, actIdx) => {
              console.log(`  - Attività ${actIdx + 1}: ${act.name} a ${act.location || 'N/A'}`);
            });
          }
        });

        if (totalActivities > 0) {
          promptText += `
ITINERARIO DEL VIAGGIO (MOLTO IMPORTANTE):
Questo viaggio ha ${tripContext.itinerary.length} giorni pianificati con un totale di ${totalActivities} attività.

`;

          // Aggiungi ogni giorno con le sue attività
          tripContext.itinerary.forEach((day, index) => {
            try {
              const dayDate = day.day_date || day.date;
              promptText += `GIORNO ${index + 1} (${dayDate}):\n`;

              // Verifica se ci sono attività e come sono strutturate
              const activities = day.activities || [];
              if (activities.length > 0) {
                activities.forEach((activity, actIndex) => {
                  try {
                    const name = activity.name || 'Attività';
                    const location = activity.location || '';
                    let startTime = '';
                    let endTime = '';

                    // Gestisci diversi formati di orario usando la formattazione locale corretta
                    if (activity.start_time) {
                      startTime = formatTimeLocal(activity.start_time);
                    } else if (activity.startTime) {
                      startTime = formatTimeLocal(activity.startTime);
                    }

                    if (activity.end_time) {
                      endTime = formatTimeLocal(activity.end_time);
                    } else if (activity.endTime) {
                      endTime = formatTimeLocal(activity.endTime);
                    }

                    let timeInfo = '';
                    if (startTime && endTime) {
                      timeInfo = ` dalle ${startTime} alle ${endTime}`;
                    } else if (startTime) {
                      timeInfo = ` alle ${startTime}`;
                    }

                    let locationInfo = location ? ` a ${location}` : '';
                    let notesInfo = activity.notes ? ` - Note: ${activity.notes}` : '';

                    promptText += `  - Attività ${actIndex + 1}: ${name}${locationInfo}${timeInfo}${notesInfo}\n`;
                  } catch (activityError) {
                    console.error('Errore nella formattazione dell\'attività:', activityError);
                    promptText += `  - Attività ${actIndex + 1}: Dettagli non disponibili\n`;
                  }
                });
              } else {
                promptText += `  Nessuna attività pianificata per questo giorno\n`;
              }

              // Aggiungi note del giorno se disponibili
              if (day.notes) {
                promptText += `  Note del giorno: ${day.notes}\n`;
              }

              promptText += `\n`;
            } catch (dayError) {
              console.error('Errore nella formattazione del giorno:', dayError);
              promptText += `GIORNO ${index + 1}: Dettagli non disponibili\n\n`;
            }
          });
        } else {
          promptText += `
ITINERARIO DEL VIAGGIO:
Ci sono ${tripContext.itinerary.length} giorni pianificati ma nessuna attività specifica programmata.
`;
        }
      } catch (itineraryError) {
        console.error('Errore nella formattazione dell\'itinerario:', itineraryError);
        promptText += `
ITINERARIO DEL VIAGGIO:
Informazioni disponibili ma non formattabili correttamente.
`;
      }
    } else {
      promptText += `
ITINERARIO DEL VIAGGIO:
Nessun giorno pianificato per questo viaggio.
`;
    }

    // Aggiungi spese
    if (tripContext.expenses) {
      promptText += `
Budget totale: ${tripContext.trip?.budgetTotal || 'non specificato'}.
Spese totali finora: ${tripContext.expenses.total} ${tripContext.expenses.currency}.
`;
    }

    // Aggiungi istruzioni per l'assistente
    if (isInitialMessage === true) {
      promptText += `
Rispondi in modo MOLTO conciso, amichevole e utile. Sii estremamente breve e diretto.
Usa un tono conversazionale ma professionale.

Questo è il primo messaggio della conversazione. Presentati BREVEMENTE come assistente di viaggio.
Menziona SOLO il nome del viaggio, le date e i partecipanti in una frase molto breve.
NON menzionare altri dettagli come alloggi, trasporti o budget a meno che non vengano richiesti specificamente.
Il tuo messaggio iniziale deve essere di massimo 2-3 frasi in totale.

MOLTO IMPORTANTE:
1. NON iniziare il messaggio con "Ciao!" o altri saluti generici.
2. Vai diretto al punto, presentandoti come assistente di viaggio.
3. Mantieni il messaggio estremamente conciso.

Formatta il messaggio iniziale in questo modo:
**Benvenuto al tuo assistente di viaggio per "[nome viaggio]"!**

Sono qui per aiutarti con il tuo viaggio dal [data inizio] al [data fine] con [partecipanti].

Domanda dell'utente: ${message}`;
    } else {
      promptText += `
Rispondi in modo conciso, amichevole e utile. Fornisci suggerimenti pratici e pertinenti basati sulle informazioni del viaggio.
Usa un tono conversazionale ma professionale.
NON ripetere i dettagli del viaggio all'inizio di ogni risposta. Rispondi direttamente alla domanda dell'utente.
NON iniziare MAI le tue risposte con "Ciao!" o altri saluti generici.

ISTRUZIONI SPECIALI PER LA VISUALIZZAZIONE INTELLIGENTE:
I marcatori visuali vengono aggiunti automaticamente dal sistema quando rileva che l'utente sta chiedendo specificamente informazioni su trasporti, alloggi, itinerario o spese.

NON includere manualmente i marcatori [AI_DATA:...] nelle tue risposte - il sistema li aggiungerà automaticamente quando appropriato.

Concentrati solo su fornire risposte utili e informative. Il sistema di post-processing si occuperà di aggiungere i componenti visuali quando necessario.

LINEE GUIDA PER LA FORMATTAZIONE DELLE RISPOSTE:
- Quando devi elencare più elementi (alloggi, trasporti, attività), usa SEMPRE un elenco puntato con ogni elemento su una nuova riga.
- NON elencare mai più elementi in un'unica frase o paragrafo.
- Usa il formato markdown per migliorare la leggibilità: **testo in grassetto** per i titoli o informazioni importanti.
- Separa le diverse sezioni della tua risposta con righe vuote.
- Quando fornisci dettagli su date, orari o luoghi, assicurati che siano ben evidenziati e non nascosti all'interno di un testo lungo.
- Usa sempre una linea vuota tra elementi di un elenco quando contengono più di una riga di informazioni.
- Usa separatori come "---" o "***" tra sezioni principali della risposta per migliorare la leggibilità.
- Quando mostri più elementi dello stesso tipo (come alloggi o trasporti), assicurati di formattarli in modo coerente e con una chiara separazione tra di essi.

Per risposte a domande generiche sul viaggio, usa questo formato:

**[Titolo della risposta]**

[Contenuto principale della risposta]

Se la risposta contiene più punti o suggerimenti:
- **Punto 1**: [dettagli]
- **Punto 2**: [dettagli]
- **Punto 3**: [dettagli]

IMPORTANTE PER DOMANDE SUGLI ALLOGGI:
Se l'utente chiede informazioni sugli alloggi, utilizza SEMPRE le informazioni dettagliate fornite nella sezione "Alloggi prenotati" sopra.
Assicurati di menzionare tutti gli alloggi disponibili con i loro dettagli (nome, tipo, date di check-in/check-out, indirizzo).
Formatta SEMPRE la risposta sugli alloggi in questo modo:

**Alloggi prenotati per il viaggio:**

- **Nome alloggio 1** (tipo)
  Check-in: **[data]**, Check-out: **[data]**
  Indirizzo: [indirizzo completo]

- **Nome alloggio 2** (tipo)
  Check-in: **[data]**, Check-out: **[data]**
  Indirizzo: [indirizzo completo]

Usa SEMPRE una linea vuota tra un alloggio e l'altro per migliorare la leggibilità.
Se ci sono informazioni aggiuntive rilevanti, aggiungile sotto ciascun alloggio.

IMPORTANTE PER DOMANDE SUI TRASPORTI:
Se l'utente chiede informazioni sui trasporti, utilizza SEMPRE le informazioni dettagliate fornite nella sezione "Trasporti prenotati" sopra.
Assicurati di menzionare tutti i trasporti disponibili con i loro dettagli (tipo, provider, orari, luoghi di partenza/arrivo).
Formatta SEMPRE la risposta sui trasporti in questo modo:

**Trasporti prenotati per il viaggio:**

- **[Tipo di trasporto 1]** con [provider]
  **Partenza:** [luogo di partenza] - **Data/ora:** [data e ora]
  **Arrivo:** [luogo di arrivo] - **Data/ora:** [data e ora]

- **[Tipo di trasporto 2]** con [provider]
  **Partenza:** [luogo di partenza] - **Data/ora:** [data e ora]
  **Arrivo:** [luogo di arrivo] - **Data/ora:** [data e ora]

Usa SEMPRE una linea vuota tra un trasporto e l'altro per migliorare la leggibilità.
Se ci sono informazioni aggiuntive rilevanti, aggiungile sotto ciascun trasporto.

IMPORTANTE PER DOMANDE SULL'ITINERARIO:
Se l'utente chiede informazioni sull'itinerario o sulle attività pianificate, utilizza SEMPRE le informazioni dettagliate fornite nella sezione "ITINERARIO DEL VIAGGIO" sopra.
Assicurati di menzionare tutte le attività pianificate con i loro dettagli (nome, luogo, orario).
Quando l'utente chiede dell'itinerario, NON dire mai che non ci sono attività pianificate a meno che non sia esplicitamente indicato che non ci sono attività.
Se ci sono attività nell'itinerario, elencale SEMPRE in modo dettagliato.
RICORDA: L'itinerario è organizzato per giorni, e ogni giorno può avere più attività. Quando rispondi a domande sull'itinerario, specifica sempre il giorno e poi elenca le attività di quel giorno.
Se l'utente chiede "cosa c'è in programma" o "quali sono le attività pianificate", elenca TUTTE le attività di TUTTI i giorni in modo organizzato.

Formatta SEMPRE la risposta sull'itinerario in questo modo:

**Itinerario del viaggio:**

***

### **GIORNO 1 ([data])**

- **[Nome attività 1]**
  **Luogo:** [luogo]
  **Orario:** [ora inizio] - [ora fine]
  [Note aggiuntive se presenti]

- **[Nome attività 2]**
  **Luogo:** [luogo]
  **Orario:** [ora inizio] - [ora fine]
  [Note aggiuntive se presenti]

***

### **GIORNO 2 ([data])**

- **[Nome attività 1]**
  **Luogo:** [luogo]
  **Orario:** [ora inizio] - [ora fine]
  [Note aggiuntive se presenti]

- **[Nome attività 2]**
  **Luogo:** [luogo]
  **Orario:** [ora inizio] - [ora fine]
  [Note aggiuntive se presenti]

Usa SEMPRE i separatori "***" tra i giorni e una linea vuota tra un'attività e l'altra per migliorare la leggibilità.

Se l'utente chiede informazioni su un giorno specifico, mostra solo le attività di quel giorno ma mantieni lo stesso formato.

Domanda dell'utente: ${message}`;
    }

    // Genera una cache key per questa richiesta
    const cacheKey = `ai-chat:${tripId}:${Buffer.from(message).toString('base64').substring(0, 20)}`;

    // Log queue stats before request
    const queueStats = getQueueStats();
    logger.debug('AI request queue status', {
      tripId,
      promptLength: promptText.length,
      cacheKey,
      queueStats
    });

    // Usa il sistema di queue per gestire la richiesta
    const responseText = await queueAIRequest(promptText, {
      timeout: 30000, // 30 secondi
      cacheKey,
      cacheTtl: 300000, // 5 minuti di cache
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableStatuses: [429, 503, 502, 504, 408]
      }
    });

    // Applica l'enhancement automatico per aggiungere componenti visuali
    const enhancedResponse = enhanceResponseWithVisualComponents(responseText, message, tripContext);

    // Log performance and analytics
    const duration = performance.now() - startTime;

    // Log to analytics service
    aiAnalytics.logRequest({
      tripId,
      messageLength: message.length,
      responseLength: enhancedResponse.length,
      duration,
      success: true,
      cacheHit: cacheKey ? true : false // This would be better determined by the AI service
    });

    logger.performance('AI Chat API', duration, {
      tripId,
      messageLength: message.length,
      responseLength: enhancedResponse.length,
      originalResponseLength: responseText.length,
      visualComponentsAdded: enhancedResponse !== responseText
    });

    return NextResponse.json({
      success: true,
      message: enhancedResponse,
    });
  } catch (error: any) {
    const duration = performance.now() - startTime;

    // Determine error type for analytics
    let errorType = 'unknown';
    if (error.message?.includes('429')) errorType = 'rate_limit';
    else if (error.message?.includes('503')) errorType = 'service_unavailable';
    else if (error.message?.includes('timeout')) errorType = 'timeout';
    else if (error.message?.includes('network')) errorType = 'network';
    else if (error.message?.includes('API key')) errorType = 'auth';

    // Log to analytics service
    aiAnalytics.logRequest({
      tripId: tripId || 'unknown',
      messageLength: message?.length || 0,
      duration,
      success: false,
      error: error.message,
      errorType,
      cacheHit: false
    });

    logger.error('Error in AI chat API', {
      error: error.message,
      stack: error.stack,
      tripId,
      messageLength: message?.length,
      duration,
      errorType
    });

    // Log API request with error status
    logger.apiRequest('POST', '/api/ai/chat', 500, duration, {
      error: error.message,
      tripId
    });

    // Provide more specific and helpful error messages
    let userMessage = 'Mi dispiace, ho avuto un problema nel rispondere. Riprova più tardi.';
    let statusCode = 500;

    if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
      userMessage = 'Troppe richieste in corso. Attendi qualche secondo e riprova.';
      statusCode = 429;
    } else if (error.message?.includes('sovraccarico') || error.message?.includes('overloaded') || error.message?.includes('503')) {
      userMessage = 'Il servizio AI è temporaneamente sovraccarico. Riprova tra qualche minuto.';
      statusCode = 503;
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      userMessage = 'La richiesta ha impiegato troppo tempo. Riprova con un messaggio più breve.';
      statusCode = 408;
    } else if (error.message?.includes('network') || error.message?.includes('ECONNRESET')) {
      userMessage = 'Problema di connessione. Verifica la tua connessione internet e riprova.';
      statusCode = 502;
    } else if (error.message?.includes('API key')) {
      userMessage = 'Problema di configurazione del servizio. Contatta l\'assistenza.';
      statusCode = 503;
    }

    // Add helpful suggestions based on error type
    const suggestions = [];
    if (statusCode === 429) {
      suggestions.push('Attendi 30-60 secondi prima di inviare un altro messaggio');
    } else if (statusCode === 408) {
      suggestions.push('Prova a dividere la tua richiesta in messaggi più brevi');
    } else if (statusCode === 503) {
      suggestions.push('Il servizio dovrebbe tornare disponibile a breve');
    }

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        message: userMessage,
        suggestions,
        retryAfter: statusCode === 429 ? 60 : statusCode === 503 ? 300 : 30 // seconds
      },
      { status: statusCode }
    );
  }
}
