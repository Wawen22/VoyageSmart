import { NextRequest, NextResponse } from 'next/server';
import { getTripContext } from '@/lib/services/tripContextService';

export async function POST(request: NextRequest) {
  try {
    // Ottieni i dati dalla richiesta
    const { message, tripId, tripName, tripData, isInitialMessage } = await request.json();

    console.log('=== API Chat chiamata ===');
    console.log('Message:', message);
    console.log('Trip ID:', tripId);
    console.log('Trip Name:', tripName);
    console.log('Trip Data passati direttamente:', tripData);
    console.log('È il messaggio iniziale?', isInitialMessage);

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verifica che l'ID del viaggio sia valido
    if (!tripId) {
      console.error('Trip ID non valido:', tripId);
      return NextResponse.json(
        { error: 'Trip ID is required', message: 'Mi dispiace, non riesco a trovare informazioni su questo viaggio.' },
        { status: 400 }
      );
    }

    // Recupera il contesto del viaggio
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
${tripContext.transportation.map(t => `- ${t.type} con ${t.provider}: da ${t.departureLocation} (${t.departureTime}) a ${t.arrivalLocation} (${t.arrivalTime})`).join('\n')}
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

                    // Gestisci diversi formati di orario
                    if (activity.start_time) {
                      if (activity.start_time.includes('T')) {
                        startTime = activity.start_time.split('T')[1].substring(0, 5);
                      } else {
                        startTime = activity.start_time;
                      }
                    } else if (activity.startTime) {
                      if (activity.startTime.includes('T')) {
                        startTime = activity.startTime.split('T')[1].substring(0, 5);
                      } else {
                        startTime = activity.startTime;
                      }
                    }

                    if (activity.end_time) {
                      if (activity.end_time.includes('T')) {
                        endTime = activity.end_time.split('T')[1].substring(0, 5);
                      } else {
                        endTime = activity.end_time;
                      }
                    } else if (activity.endTime) {
                      if (activity.endTime.includes('T')) {
                        endTime = activity.endTime.split('T')[1].substring(0, 5);
                      } else {
                        endTime = activity.endTime;
                      }
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

Domanda dell'utente: ${message}`;
    } else {
      promptText += `
Rispondi in modo conciso, amichevole e utile. Fornisci suggerimenti pratici e pertinenti basati sulle informazioni del viaggio.
Usa un tono conversazionale ma professionale.
NON ripetere i dettagli del viaggio all'inizio di ogni risposta. Rispondi direttamente alla domanda dell'utente.

IMPORTANTE PER DOMANDE SUGLI ALLOGGI:
Se l'utente chiede informazioni sugli alloggi, utilizza SEMPRE le informazioni dettagliate fornite nella sezione "Alloggi prenotati" sopra.
Assicurati di menzionare tutti gli alloggi disponibili con i loro dettagli (nome, tipo, date di check-in/check-out, indirizzo).

IMPORTANTE PER DOMANDE SUI TRASPORTI:
Se l'utente chiede informazioni sui trasporti, utilizza SEMPRE le informazioni dettagliate fornite nella sezione "Trasporti prenotati" sopra.
Assicurati di menzionare tutti i trasporti disponibili con i loro dettagli (tipo, provider, orari, luoghi di partenza/arrivo).

IMPORTANTE PER DOMANDE SULL'ITINERARIO:
Se l'utente chiede informazioni sull'itinerario o sulle attività pianificate, utilizza SEMPRE le informazioni dettagliate fornite nella sezione "ITINERARIO DEL VIAGGIO" sopra.
Assicurati di menzionare tutte le attività pianificate con i loro dettagli (nome, luogo, orario).
Quando l'utente chiede dell'itinerario, NON dire mai che non ci sono attività pianificate a meno che non sia esplicitamente indicato che non ci sono attività.
Se ci sono attività nell'itinerario, elencale SEMPRE in modo dettagliato.
RICORDA: L'itinerario è organizzato per giorni, e ogni giorno può avere più attività. Quando rispondi a domande sull'itinerario, specifica sempre il giorno e poi elenca le attività di quel giorno.
Se l'utente chiede "cosa c'è in programma" o "quali sono le attività pianificate", elenca TUTTE le attività di TUTTI i giorni in modo organizzato.

Domanda dell'utente: ${message}`;
    }

    // Prepara la richiesta per l'API Gemini (basata sul test curl funzionante)
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ]
    };

    // Effettua la chiamata API
    console.log('Calling Gemini API with URL:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Verifica la risposta
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    // Elabora la risposta
    const data = await response.json();
    console.log('Gemini API response:', data);

    // Estrai il testo dalla risposta
    let responseText = 'Mi dispiace, non sono riuscito a generare una risposta.';

    if (data.candidates && data.candidates.length > 0 &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0) {
      responseText = data.candidates[0].content.parts[0].text;
    }

    return NextResponse.json({
      success: true,
      message: responseText,
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message,
        message: 'Mi dispiace, ho avuto un problema nel rispondere. Riprova più tardi.'
      },
      { status: 500 }
    );
  }
}
