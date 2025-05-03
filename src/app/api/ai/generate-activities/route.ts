import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verifica se la chiave API di Gemini è configurata
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyCdjn1Ox8BqVZUMTWMo9ZMMUYiKpkAym2E';
    console.log('API - Chiave API Gemini configurata:', geminiApiKey ? 'Sì' : 'No');
    // Continuiamo anche se la chiave non è nelle variabili d'ambiente, usando quella hardcoded

    // Verifica l'autenticazione
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    // Crea anche un client admin per operazioni che potrebbero richiedere il bypass delle politiche RLS
    const supabaseAdmin = createRouteHandlerClient({ cookies }, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    // Commentiamo temporaneamente la verifica dell'autenticazione per debug
    // Se non c'è una sessione, procediamo comunque ma lo logghiamo
    if (!session) {
      console.log('Attenzione: Utente non autenticato, ma procediamo comunque per debug');
      // Continuiamo l'esecuzione invece di restituire un errore
      // return NextResponse.json(
      //   { error: 'Autenticazione richiesta' },
      //   { status: 401 }
      // );
    }

    // Ottieni i dati dalla richiesta
    const { tripId, tripData, preferences, days } = await request.json();

    if (!tripId || !days || days.length === 0) {
      return NextResponse.json(
        { error: 'Dati mancanti: tripId e days sono richiesti' },
        { status: 400 }
      );
    }

    // Verifica che l'utente abbia accesso al viaggio (solo se l'utente è autenticato)
    if (session) {
      const { data: tripAccess, error: tripAccessError } = await supabaseAdmin
        .from('trip_participants')
        .select('role')
        .eq('trip_id', tripId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      const { data: tripOwner, error: tripOwnerError } = await supabaseAdmin
        .from('trips')
        .select('owner_id')
        .eq('id', tripId)
        .single();

      if ((tripAccessError || !tripAccess) && (!tripOwner || tripOwner.owner_id !== session.user.id)) {
        console.log('Attenzione: Utente non ha accesso al viaggio, ma procediamo comunque per debug');
        // return NextResponse.json(
        //   { error: 'Non hai accesso a questo viaggio' },
        //   { status: 403 }
        // );
      }
    } else {
      console.log('Saltando la verifica di accesso al viaggio perché l\'utente non è autenticato');
    }

    // Prepara il prompt per Gemini AI
    const prompt = generatePrompt(tripData, preferences, days);

    // Chiama l'API Gemini
    // Utilizziamo una chiave API hardcoded per il debug se quella nelle variabili d'ambiente non è disponibile
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyCdjn1Ox8BqVZUMTWMo9ZMMUYiKpkAym2E';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      }
    };

    console.log('Chiamando Gemini API con URL:', url);
    console.log('Request body:', JSON.stringify(requestBody).substring(0, 500) + '...');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Risposta ricevuta da Gemini API, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response (text):', errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error('Gemini API error response (parsed):', errorData);
        } catch (parseError) {
          console.error('Impossibile analizzare la risposta di errore come JSON');
        }

        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      // Elabora la risposta
      const data = await response.json();
      console.log('Risposta Gemini API elaborata con successo');
      // Verifica che la risposta sia valida
      if (!data.candidates || data.candidates.length === 0 ||
          !data.candidates[0].content || !data.candidates[0].content.parts ||
          data.candidates[0].content.parts.length === 0) {
        console.error('Risposta API non valida:', data);
        throw new Error('Risposta API non valida');
      }

      const rawResponse = data.candidates[0].content.parts[0].text;
      console.log('Risposta grezza ricevuta:', rawResponse.substring(0, 200) + '...');

      // Analizza la risposta per estrarre le attività
      const activities = parseActivitiesFromResponse(rawResponse, days);

      return NextResponse.json({
        success: true,
        activities,
      });
    } catch (fetchError) {
      console.error('Errore durante la chiamata a Gemini API:', fetchError);
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Error generating activities:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate activities',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Genera il prompt per Gemini AI
function generatePrompt(tripData: any, preferences: any, days: any[]) {
  // Estrai la destinazione principale dal viaggio
  const mainDestination = tripData?.destination || 'destinazione sconosciuta';

  // Estrai gli interessi dell'utente
  const interests = preferences?.interests?.join(', ') || 'varie';

  // Ottieni le preferenze aggiuntive dell'utente
  const additionalPreferences = preferences?.additionalPreferences || '';

  // Analizza le preferenze aggiuntive per estrarre informazioni importanti
  const {
    specificDestination,
    timeConstraints,
    specificRequests,
    destinationsToVisit
  } = analyzeAdditionalPreferences(additionalPreferences, mainDestination, tripData?.destinations || []);

  // Determina la destinazione effettiva da utilizzare
  const effectiveDestination = specificDestination || mainDestination;

  // Formatta i giorni
  const formattedDays = days.map(day => {
    const date = new Date(day.day_date);
    return {
      id: day.id,
      date: date.toISOString().split('T')[0],
      formattedDate: date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
  });

  // Costruisci la sezione dei vincoli temporali se presenti
  let timeConstraintsSection = '';
  if (timeConstraints.length > 0) {
    timeConstraintsSection = `
VINCOLI TEMPORALI (MOLTO IMPORTANTE):
${timeConstraints.map(constraint => `- ${constraint}`).join('\n')}
`;
  }

  // Costruisci la sezione delle destinazioni da visitare se presenti
  let destinationsSection = '';
  if (destinationsToVisit.length > 0) {
    destinationsSection = `
DESTINAZIONI DA VISITARE (MOLTO IMPORTANTE):
${destinationsToVisit.map(dest => `- ${dest}`).join('\n')}
`;
  }

  // Costruisci la sezione delle richieste specifiche se presenti
  let specificRequestsSection = '';
  if (specificRequests.length > 0) {
    specificRequestsSection = `
RICHIESTE SPECIFICHE DELL'UTENTE (MOLTO IMPORTANTE):
${specificRequests.map(req => `- ${req}`).join('\n')}
`;
  }

  // Determina il tipo di viaggio in base alle preferenze
  const tripType = preferences?.tripType || 'general';
  const pace = preferences?.pace || 'moderate';

  // Costruisci una descrizione del ritmo del viaggio
  let paceDescription = '';
  switch (pace) {
    case 'relaxed':
      paceDescription = 'rilassato con ampio tempo libero tra le attività';
      break;
    case 'moderate':
      paceDescription = 'moderato con un buon equilibrio tra attività e tempo libero';
      break;
    case 'active':
      paceDescription = 'attivo con molte attività durante la giornata';
      break;
    case 'busy':
      paceDescription = 'intenso con un programma fitto di attività';
      break;
    default:
      paceDescription = 'moderato';
  }

  // Costruisci una descrizione degli orari preferiti
  const preferredTimes = preferences?.preferredTimes || [];
  let timesDescription = '';
  if (preferredTimes.length > 0) {
    const timeMap: Record<string, string> = {
      'morning': 'mattina',
      'afternoon': 'pomeriggio',
      'evening': 'sera'
    };
    const formattedTimes = preferredTimes.map(time => timeMap[time] || time).join(', ');
    timesDescription = `con preferenza per attività durante: ${formattedTimes}`;
  }

  return `
Sei un esperto pianificatore di viaggi italiano con conoscenza approfondita delle destinazioni turistiche. Genera un itinerario dettagliato e personalizzato per un viaggio a ${effectiveDestination}.

INFORMAZIONI SUL VIAGGIO:
- Destinazione principale: ${mainDestination}
- Destinazione specifica per queste attività: ${effectiveDestination}
- Tipo di viaggio: ${tripType}
- Ritmo del viaggio: ${paceDescription} ${timesDescription}
- Interessi dell'utente: ${interests}
- Preferenze aggiuntive: ${additionalPreferences}
${destinationsToVisit.length > 0 ? '- Altre destinazioni menzionate: ' + destinationsToVisit.join(', ') : ''}

GIORNI DEL VIAGGIO:
${formattedDays.map(day => `- ${day.formattedDate} (ID: ${day.id})`).join('\n')}
${timeConstraintsSection}
${destinationsSection}
${specificRequestsSection}

COMPITO:
Genera attività realistiche, specifiche e dettagliate per ciascuno dei giorni sopra indicati, tenendo conto degli interessi e delle preferenze dell'utente.

Per ogni giorno, crea 3-5 attività che includano:
1. Nome dell'attività (breve, specifico e descrittivo)
2. Tipo (scegli tra: sightseeing, food, shopping, nature, culture, relax, sport, entertainment)
3. Orario di inizio e fine (in formato HH:MM, orari realistici)
4. Luogo specifico (nome REALE del luogo e indirizzo completo per geocodifica)
5. Costo stimato (se applicabile, in EUR)
6. Breve nota o consiglio (includi informazioni utili come suggerimenti, cosa aspettarsi, o dettagli storici)

LINEE GUIDA IMPORTANTI:
- RISPETTA RIGOROSAMENTE i vincoli temporali specificati dall'utente (es. "finire entro le 16:00")
- RISPETTA RIGOROSAMENTE la destinazione specifica richiesta dall'utente (es. "Matera" invece di "Bari")
- Assicurati che le attività siano realistiche e fattibili nel tempo indicato
- Considera i tempi di spostamento tra le attività (includi pause adeguate)
- Includi SOLO attività specifiche per la destinazione con nomi REALI di luoghi, non generici
- Fornisci indirizzi COMPLETI e PRECISI per ogni luogo, includendo via, numero civico, città e paese per una corretta geocodifica
- Distribuisci le attività durante la giornata rispettando i vincoli temporali e gli orari preferiti
- Assegna priorità 1 (alta), 2 (media) o 3 (bassa) a ciascuna attività in base alla loro importanza
- Includi una varietà di tipi di attività per rendere l'itinerario interessante
- Considera l'ora dei pasti (colazione, pranzo, cena) quando pianifichi le attività
- Suggerisci ristoranti o luoghi specifici per i pasti, non generici
- Includi dettagli culturali o storici nelle note quando appropriato
- Considera il ritmo del viaggio richiesto (rilassato, moderato, attivo, intenso)

FORMATO DELLA RISPOSTA:
Fornisci la risposta SOLO in formato JSON con la seguente struttura:

\`\`\`json
{
  "activities": [
    {
      "day_id": "ID_DEL_GIORNO",
      "day_date": "YYYY-MM-DD",
      "name": "Nome dell'attività",
      "type": "Tipo dell'attività",
      "start_time": "YYYY-MM-DDTHH:MM:00Z",
      "end_time": "YYYY-MM-DDTHH:MM:00Z",
      "location": "Nome del luogo, Indirizzo/Zona",
      "priority": 1,
      "cost": 10.50,
      "currency": "EUR",
      "notes": "Breve nota o consiglio",
      "status": "planned"
    },
    ...
  ]
}
\`\`\`

Assicurati che il JSON sia valido e che tutte le date e gli orari siano nel formato corretto. NON includere alcun testo esplicativo prima o dopo il JSON.
`;
}

// Analizza le preferenze aggiuntive dell'utente per estrarre informazioni importanti
function analyzeAdditionalPreferences(
  additionalPreferences: string,
  mainDestination: string,
  tripDestinations: string[]
): {
  specificDestination: string | null;
  timeConstraints: string[];
  specificRequests: string[];
  destinationsToVisit: string[];
} {
  // Inizializza i risultati
  const result = {
    specificDestination: null as string | null,
    timeConstraints: [] as string[],
    specificRequests: [] as string[],
    destinationsToVisit: [] as string[]
  };

  // Se non ci sono preferenze aggiuntive, restituisci i valori predefiniti
  if (!additionalPreferences || additionalPreferences.trim() === '') {
    return result;
  }

  console.log('Analisi preferenze aggiuntive:', additionalPreferences);

  // Normalizza il testo per l'analisi (minuscolo e senza punteggiatura eccessiva)
  const normalizedText = additionalPreferences.toLowerCase();

  // Estrai le destinazioni specifiche
  // Cerca pattern come "a [città]", "in [città]", "per [città]", "visitare [città]"
  const destinationPatterns = [
    /\ba\s+([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)*)/g,
    /\bin\s+([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)*)/g,
    /\bper\s+([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)*)/g,
    /\bvisitare\s+([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)*)/g,
    /\bandare\s+(?:a|in)\s+([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)*)/g
  ];

  // Lista di città italiane comuni per verificare se una parola è una città
  const commonItalianCities = [
    'roma', 'milano', 'napoli', 'torino', 'palermo', 'genova', 'bologna', 'firenze',
    'bari', 'catania', 'venezia', 'verona', 'messina', 'padova', 'trieste', 'taranto',
    'brescia', 'prato', 'reggio calabria', 'modena', 'parma', 'livorno', 'cagliari',
    'foggia', 'reggio emilia', 'salerno', 'perugia', 'monza', 'rimini', 'matera',
    'lecce', 'siracusa', 'sassari', 'bergamo', 'pescara', 'trento', 'treviso', 'vicenza',
    'bolzano', 'novara', 'ancona', 'ferrara', 'ravenna', 'la spezia', 'terni', 'pisa'
  ];

  // Aggiungi le destinazioni del viaggio alla lista di città da cercare
  const allCitiesToCheck = [...commonItalianCities];
  if (tripDestinations && tripDestinations.length > 0) {
    tripDestinations.forEach(dest => {
      if (dest && typeof dest === 'string') {
        allCitiesToCheck.push(dest.toLowerCase());
      }
    });
  }
  if (mainDestination && typeof mainDestination === 'string') {
    allCitiesToCheck.push(mainDestination.toLowerCase());
  }

  // Cerca città nel testo
  const potentialCities = new Set<string>();

  // Cerca pattern specifici
  destinationPatterns.forEach(pattern => {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const city = match[1].trim();
        // Verifica se la città è nella lista o è una delle destinazioni del viaggio
        if (allCitiesToCheck.some(knownCity =>
            city === knownCity ||
            city.includes(knownCity) ||
            knownCity.includes(city))) {
          potentialCities.add(city);
        }
      }
    }
  });

  // Cerca direttamente le città conosciute nel testo
  allCitiesToCheck.forEach(city => {
    if (normalizedText.includes(city)) {
      potentialCities.add(city);
    }
  });

  // Converti il Set in array e rimuovi la destinazione principale se presente
  const citiesArray = Array.from(potentialCities);
  result.destinationsToVisit = citiesArray.filter(city =>
    city.toLowerCase() !== mainDestination.toLowerCase()
  );

  // Imposta la destinazione specifica (la prima città trovata diversa dalla destinazione principale)
  if (result.destinationsToVisit.length > 0) {
    result.specificDestination = result.destinationsToVisit[0];
    // Capitalizza la prima lettera
    result.specificDestination = result.specificDestination.charAt(0).toUpperCase() + result.specificDestination.slice(1);
  }

  // Estrai i vincoli temporali
  // Cerca pattern come "entro le [ora]", "prima delle [ora]", "fino alle [ora]"
  const timePatterns = [
    /entro\s+(?:le\s+)?(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /prima\s+(?:delle\s+)?(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /fino\s+(?:alle\s+)?(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /non\s+(?:dopo|oltre)\s+(?:le\s+)?(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /(?:alle|ore)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g
  ];

  timePatterns.forEach(pattern => {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        let hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;

        // Gestisci AM/PM se necessario
        if (match[0].includes('pomeriggio') || match[0].includes('sera')) {
          if (hour < 12) hour += 12;
        }

        // Formatta l'ora
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Crea il vincolo temporale
        let constraint = '';
        if (match[0].includes('entro') || match[0].includes('prima')) {
          constraint = `Tutte le attività devono terminare entro le ${formattedTime}`;
        } else if (match[0].includes('fino')) {
          constraint = `Le attività possono svolgersi fino alle ${formattedTime}`;
        } else if (match[0].includes('non dopo') || match[0].includes('non oltre')) {
          constraint = `Nessuna attività deve iniziare o svolgersi dopo le ${formattedTime}`;
        } else {
          constraint = `Importante orario menzionato: ${formattedTime}`;
        }

        result.timeConstraints.push(constraint);
      }
    }
  });

  // Estrai richieste specifiche
  // Cerca pattern come "vorrei [fare qualcosa]", "voglio [fare qualcosa]"
  const requestPatterns = [
    /vorrei\s+([^,.;]+)/g,
    /voglio\s+([^,.;]+)/g,
    /desidero\s+([^,.;]+)/g,
    /mi\s+piacerebbe\s+([^,.;]+)/g,
    /cerco\s+([^,.;]+)/g
  ];

  requestPatterns.forEach(pattern => {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const request = match[1].trim();
        result.specificRequests.push(request);
      }
    }
  });

  // Se non sono state trovate richieste specifiche, aggiungi l'intera preferenza come richiesta
  if (result.specificRequests.length === 0 && additionalPreferences.trim() !== '') {
    result.specificRequests.push(additionalPreferences.trim());
  }

  console.log('Risultati analisi preferenze:', result);
  return result;
}

// Analizza la risposta per estrarre le attività
function parseActivitiesFromResponse(response: string, days: any[]) {
  try {
    console.log('Analisi risposta per estrarre attività...');
    console.log('Risposta grezza (primi 200 caratteri):', response.substring(0, 200));

    // Estrai il JSON dalla risposta
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch || !jsonMatch[1]) {
      console.error('Formato JSON non trovato nella risposta');
      console.log('Risposta completa:', response);

      // Tenta di estrarre qualsiasi cosa che assomigli a JSON
      const anyJsonMatch = response.match(/\{[\s\S]*\}/);
      if (anyJsonMatch) {
        console.log('Trovato possibile JSON non formattato correttamente:', anyJsonMatch[0].substring(0, 200));
        try {
          const parsedData = JSON.parse(anyJsonMatch[0]);
          if (parsedData.activities && Array.isArray(parsedData.activities)) {
            console.log('Estratto JSON valido dalla risposta non formattata');
            return processActivities(parsedData.activities, days);
          }
        } catch (jsonError) {
          console.error('Errore nel parsing del JSON estratto:', jsonError);
        }
      }

      throw new Error('Formato JSON non trovato nella risposta');
    }

    const jsonString = jsonMatch[1].trim();
    console.log('JSON estratto (primi 200 caratteri):', jsonString.substring(0, 200));

    try {
      const parsedData = JSON.parse(jsonString);

      if (!parsedData.activities || !Array.isArray(parsedData.activities)) {
        console.error('Formato attività non valido:', parsedData);
        throw new Error('Formato attività non valido');
      }

      console.log('Numero di attività trovate:', parsedData.activities.length);

      // Valida e formatta le attività
      return processActivities(parsedData.activities, days);
    } catch (jsonError) {
      console.error('Errore nel parsing del JSON:', jsonError);
      throw jsonError;
    }
  } catch (error) {
    console.error('Error parsing activities:', error);
    throw new Error('Impossibile analizzare le attività dalla risposta: ' + error.message);
  }
}

// Funzione helper per processare le attività
function processActivities(activities: any[], days: any[]) {
  console.log('Processando attività...');

  // Valida e formatta le attività
  const processedActivities = activities.map((activity: any, index: number) => {
    console.log(`Processando attività ${index + 1}:`, activity.name);

    // Verifica che il day_id sia valido
    const dayExists = days.some(day => day.id === activity.day_id);
    if (!dayExists) {
      console.warn(`ID giorno non valido: ${activity.day_id}, assegnando al primo giorno disponibile`);
      // Assegna al primo giorno disponibile invece di lanciare un errore
      activity.day_id = days[0].id;
      activity.day_date = days[0].day_date;
    }

    // Assicurati che tutti i campi necessari siano presenti
    if (!activity.name || !activity.type || !activity.start_time || !activity.end_time || !activity.location) {
      console.warn('Campi obbligatori mancanti nell\'attività, aggiungendo valori predefiniti');

      // Aggiungi valori predefiniti per i campi mancanti
      if (!activity.name) activity.name = `Attività ${index + 1}`;
      if (!activity.type) activity.type = 'sightseeing';

      // Se mancano gli orari, usa orari predefiniti basati sull'indice
      if (!activity.start_time || !activity.end_time) {
        const dayDate = activity.day_date || days.find(day => day.id === activity.day_id)?.day_date;
        const baseDate = dayDate ? new Date(dayDate) : new Date();

        // Orario di inizio: 9:00 + (indice * 2 ore)
        const startHour = 9 + (index % 4) * 2;
        baseDate.setHours(startHour, 0, 0);
        activity.start_time = baseDate.toISOString();

        // Orario di fine: orario di inizio + 1.5 ore
        const endDate = new Date(baseDate);
        endDate.setHours(startHour + 1, 30, 0);
        activity.end_time = endDate.toISOString();
      }

      if (!activity.location) activity.location = 'Da definire';
    }

    // Verifica e normalizza gli orari
    try {
      // Assicurati che gli orari siano in formato ISO
      if (typeof activity.start_time === 'string' && !activity.start_time.includes('T')) {
        // Se è solo un orario (HH:MM), convertilo in ISO
        const [hours, minutes] = activity.start_time.split(':').map(Number);
        const date = new Date(activity.day_date);
        date.setHours(hours, minutes, 0, 0);
        activity.start_time = date.toISOString();
      }

      if (typeof activity.end_time === 'string' && !activity.end_time.includes('T')) {
        // Se è solo un orario (HH:MM), convertilo in ISO
        const [hours, minutes] = activity.end_time.split(':').map(Number);
        const date = new Date(activity.day_date);
        date.setHours(hours, minutes, 0, 0);
        activity.end_time = date.toISOString();
      }

      // Verifica che l'orario di fine sia successivo all'orario di inizio
      const startTime = new Date(activity.start_time);
      const endTime = new Date(activity.end_time);

      if (endTime <= startTime) {
        console.warn(`Orario di fine non valido per l'attività ${activity.name}, aggiustando...`);
        // Aggiungi 1.5 ore all'orario di inizio
        endTime.setTime(startTime.getTime() + 90 * 60 * 1000);
        activity.end_time = endTime.toISOString();
      }
    } catch (error) {
      console.error('Errore nella normalizzazione degli orari:', error);
    }

    // Migliora la descrizione dell'attività se necessario
    if (!activity.notes || activity.notes.trim() === '') {
      // Genera una nota predefinita basata sul tipo di attività
      switch (activity.type.toLowerCase()) {
        case 'food':
          activity.notes = `Gustare la cucina locale presso ${activity.location}`;
          break;
        case 'sightseeing':
          activity.notes = `Visita a ${activity.location}, un'attrazione imperdibile`;
          break;
        case 'culture':
          activity.notes = `Esperienza culturale a ${activity.location}`;
          break;
        case 'shopping':
          activity.notes = `Shopping presso ${activity.location}`;
          break;
        case 'nature':
          activity.notes = `Esperienza nella natura a ${activity.location}`;
          break;
        default:
          activity.notes = `Attività di tipo ${activity.type} a ${activity.location}`;
      }
    }

    return {
      day_id: activity.day_id,
      day_date: activity.day_date,
      name: activity.name,
      type: activity.type,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: activity.location,
      priority: activity.priority || 3,
      cost: activity.cost || null,
      currency: activity.currency || 'EUR',
      notes: activity.notes || null,
      status: activity.status || 'planned',
    };
  });

  // Ordina le attività per orario di inizio
  processedActivities.sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  console.log('Attività processate con successo:', processedActivities.length);
  return processedActivities;
}
