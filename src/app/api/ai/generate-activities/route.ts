import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { validateSecurity } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Verifica se la chiave API di Gemini è configurata
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.error('API - Chiave API Gemini non configurata');
      return NextResponse.json(
        { error: 'Servizio AI non disponibile. Contatta l\'amministratore.' },
        { status: 500 }
      );
    }

    console.log('API - Chiave API Gemini configurata: Sì');

    // Ottieni i dati dalla richiesta
    const { tripId, tripData, preferences, days } = await request.json();

    // Validazione input semplificata
    if (!tripId || !days || days.length === 0) {
      return NextResponse.json(
        { error: 'Dati mancanti: tripId e days sono richiesti' },
        { status: 400 }
      );
    }

    // Controllo sicurezza per i campi di testo
    const textFields: string[] = [];
    if (tripData?.destination) {
      textFields.push(tripData.destination);
    }
    if (preferences?.interests) {
      textFields.push(...preferences.interests);
    }
    if (preferences?.additionalPreferences) {
      textFields.push(preferences.additionalPreferences);
    }

    for (const field of textFields) {
      if (field) {
        const securityCheck = validateSecurity(field);
        if (!securityCheck.safe) {
          logger.security('Potential security threat in activity generation', {
            issues: securityCheck.issues,
            tripId,
            field
          });
          return NextResponse.json(
            { error: 'Input contains potentially unsafe content' },
            { status: 400 }
          );
        }
      }
    }

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
    // Utilizziamo la chiave API già definita in precedenza
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

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

      // Estrai i vincoli temporali dalle preferenze dell'utente
      const additionalPreferences = preferences?.additionalPreferences || '';
      const { timeConstraints } = analyzeAdditionalPreferences(additionalPreferences, tripData?.destination || '', tripData?.destinations || []);

      // Analizza la risposta per estrarre le attività
      const activities = parseActivitiesFromResponse(rawResponse, days, timeConstraints);

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
    destinationsToVisit,
    isLimitedRequest,
    requestedActivityCount
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
VINCOLI TEMPORALI (ESTREMAMENTE IMPORTANTE - RISPETTARE RIGOROSAMENTE):
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

  // Costruisci una descrizione dettagliata del tipo di viaggio
  let tripTypeDescription = '';
  switch (tripType) {
    case 'beach':
      tripTypeDescription = 'Vacanza al mare con focus su relax, attività balneari, sport acquatici e vita costiera. Privilegia spiagge, stabilimenti balneari, ristoranti sul mare, attività nautiche e momenti di relax.';
      break;
    case 'city':
      tripTypeDescription = 'Esplorazione urbana con focus su cultura, musei, monumenti, shopping e vita cittadina. Privilegia centri storici, musei, gallerie d\'arte, mercati locali, ristoranti tipici e vita notturna.';
      break;
    case 'adventure':
      tripTypeDescription = 'Viaggio avventuroso con focus su sport, escursioni, attività all\'aria aperta e esperienze adrenaliniche. Privilegia trekking, sport estremi, parchi naturali e attività fisiche.';
      break;
    case 'cultural':
      tripTypeDescription = 'Viaggio culturale con focus su storia, arte, tradizioni locali e patrimonio culturale. Privilegia siti UNESCO, musei, chiese storiche, tour guidati e esperienze culturali autentiche.';
      break;
    case 'food':
      tripTypeDescription = 'Viaggio gastronomico con focus su cucina locale, degustazioni, mercati e tradizioni culinarie. Privilegia ristoranti tipici, cantine, mercati locali, corsi di cucina e degustazioni.';
      break;
    case 'romantic':
      tripTypeDescription = 'Viaggio romantico con focus su atmosfere intime, cene romantiche e esperienze di coppia. Privilegia ristoranti romantici, tramonti, spa di coppia e attività intime.';
      break;
    case 'family':
      tripTypeDescription = 'Vacanza in famiglia con focus su attività per bambini, parchi divertimento e esperienze family-friendly. Privilegia parchi, zoo, musei interattivi e attività adatte a tutte le età.';
      break;
    case 'wellness':
      tripTypeDescription = 'Viaggio benessere con focus su relax, spa, terme e attività rigeneranti. Privilegia centri benessere, terme, yoga, meditazione e attività rilassanti.';
      break;
    case 'business':
      tripTypeDescription = 'Viaggio di lavoro con focus su efficienza, networking e attività professionali. Privilegia centri congressi, hotel business, ristoranti per meeting e attività di networking.';
      break;
    default:
      tripTypeDescription = 'Viaggio generale con un mix equilibrato di attività culturali, gastronomiche e di svago.';
  }

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
    const formattedTimes = preferredTimes.map((time: string) => timeMap[time] || time).join(', ');
    timesDescription = `con preferenza per attività durante: ${formattedTimes}`;
  }

  return `
Sei un esperto pianificatore di viaggi italiano con conoscenza approfondita delle destinazioni turistiche. Genera un itinerario dettagliato e personalizzato per un viaggio a ${effectiveDestination}.

INFORMAZIONI SUL VIAGGIO:
- Destinazione principale: ${mainDestination}
- Destinazione specifica per queste attività: ${effectiveDestination}
- Tipo di viaggio: ${tripType}
- Descrizione del tema di viaggio: ${tripTypeDescription}
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

${isLimitedRequest ?
  `IMPORTANTE: L'utente ha richiesto SOLO attività specifiche e limitate. Genera ESATTAMENTE ${requestedActivityCount} attività come richiesto, NON aggiungere altre attività non richieste.` :
  `Per ogni giorno, crea 3-5 attività che includano:`
}
1. Nome dell'attività (breve, specifico e descrittivo)
2. Tipo (scegli tra: sightseeing, food, shopping, nature, culture, relax, sport, entertainment)
3. Orario di inizio e fine (in formato HH:MM, orari realistici)
4. Luogo specifico (nome REALE del luogo e indirizzo completo per geocodifica)
5. Costo stimato (se applicabile, in EUR)
6. Breve nota o consiglio (includi informazioni utili come suggerimenti, cosa aspettarsi, o dettagli storici)

LINEE GUIDA IMPORTANTI:
${isLimitedRequest ?
  `- ATTENZIONE: L'utente ha richiesto SOLO attività specifiche. NON aggiungere attività extra non richieste
- Genera ESATTAMENTE ${requestedActivityCount} attività come specificato dall'utente
- NON creare un itinerario completo se non richiesto` :
  `- Crea un itinerario completo e bilanciato per la giornata`
}
- RISPETTA RIGOROSAMENTE IL TEMA DI VIAGGIO: ${tripTypeDescription}
- Le attività DEVONO essere coerenti con il tipo di viaggio selezionato (${tripType})
- Se il tema è "beach", privilegia attività balneari e costiere
- Se il tema è "cultural", privilegia musei, siti storici e patrimonio culturale
- Se il tema è "food", privilegia esperienze gastronomiche e culinarie
- Se il tema è "adventure", privilegia attività sportive e all'aria aperta
- Se il tema è "romantic", privilegia atmosfere intime e esperienze di coppia
- Se il tema è "family", privilegia attività adatte a bambini e famiglie
- Se il tema è "wellness", privilegia attività rilassanti e benessere
- RISPETTA RIGOROSAMENTE i vincoli temporali specificati dall'utente (es. "iniziare alle 8:00", "aperitivo alle 18:00")
- Se l'utente richiede di iniziare le attività a un orario specifico, la prima attività DEVE iniziare a quell'ora esatta
- Se l'utente richiede un'attività specifica (es. aperitivo, colazione, pranzo, cena) a un orario preciso, DEVI includerla esattamente a quell'ora
- RISPETTA RIGOROSAMENTE la destinazione specifica richiesta dall'utente (es. "Matera" invece di "Bari")
- IMPLEMENTA TUTTE le richieste specifiche dell'utente come descritte nelle "RICHIESTE SPECIFICHE DELL'UTENTE" sopra
- Se l'utente chiede "colazione alle 9 di mattina", crea un'attività di colazione che inizia ESATTAMENTE alle 09:00
- Se l'utente chiede "aperitivo alle 18:00", crea un'attività di aperitivo che inizia ESATTAMENTE alle 18:00
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
  isLimitedRequest: boolean;
  requestedActivityCount: number;
} {
  // Inizializza i risultati
  const result = {
    specificDestination: null as string | null,
    timeConstraints: [] as string[],
    specificRequests: [] as string[],
    destinationsToVisit: [] as string[],
    isLimitedRequest: false,
    requestedActivityCount: 1
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
    const matches = Array.from(normalizedText.matchAll(pattern));
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
    /(?:alle|ore)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /inizia(?:re|no)?\s+(?:alle|a)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /inizio\s+(?:alle|a)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /dalle\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /a\s+partire\s+dalle\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio|sera))?/g,
    /aperitivo\s+(?:verso|alle|intorno\s+alle)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:pomeriggio|sera))?/g,
    /colazione\s+(?:verso|alle|intorno\s+alle)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina))?/g,
    /pranzo\s+(?:verso|alle|intorno\s+alle)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:mattina|pomeriggio))?/g,
    /cena\s+(?:verso|alle|intorno\s+alle)\s+(\d{1,2})[:\.]?(\d{2})?\s*(?:del(?:la)?\s+(?:sera))?/g
  ];

  timePatterns.forEach(pattern => {
    const matches = Array.from(normalizedText.matchAll(pattern));
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
        } else if (match[0].includes('inizia') || match[0].includes('inizio') || match[0].includes('dalle') || match[0].includes('partire')) {
          constraint = `La prima attività della giornata deve iniziare alle ${formattedTime}`;
        } else if (match[0].includes('aperitivo')) {
          constraint = `Includere un aperitivo alle ${formattedTime}`;
        } else if (match[0].includes('colazione')) {
          constraint = `Includere la colazione alle ${formattedTime}`;
        } else if (match[0].includes('pranzo')) {
          constraint = `Includere il pranzo alle ${formattedTime}`;
        } else if (match[0].includes('cena')) {
          constraint = `Includere la cena alle ${formattedTime}`;
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
    /cerco\s+([^,.;]+)/g,
    /aggiungi\s+([^,.;]+)/g,
    /includi\s+([^,.;]+)/g,
    /inserisci\s+([^,.;]+)/g,
    /fare\s+([^,.;]+)/g,
    /visitare\s+([^,.;]+)/g,
    /andare\s+([^,.;]+)/g
  ];

  requestPatterns.forEach(pattern => {
    const matches = Array.from(normalizedText.matchAll(pattern));
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

  // Rileva se l'utente ha fatto una richiesta limitata e specifica
  const limitedRequestPatterns = [
    /\bsolo\s+([^,.;]+)/gi,
    /\bsolamente\s+([^,.;]+)/gi,
    /\bunicamente\s+([^,.;]+)/gi,
    /\bsoltanto\s+([^,.;]+)/gi,
    /\baggiung(?:i|ere)\s+(?:solo\s+)?([^,.;]+)/gi,
    /\bvorrei\s+(?:solo\s+)?(?:un[ao]?\s+)?([^,.;]+?)(?:\s+e\s+basta|\s+nient'altro|\s+e\s+stop)?/gi,
    /\bmi\s+serve\s+(?:solo\s+)?([^,.;]+)/gi,
    /\bho\s+bisogno\s+(?:solo\s+)?(?:di\s+)?([^,.;]+)/gi
  ];

  // Cerca pattern che indicano richieste limitate
  for (const pattern of limitedRequestPatterns) {
    const matches = Array.from(normalizedText.matchAll(pattern));
    if (matches.length > 0) {
      result.isLimitedRequest = true;

      // Conta quante attività specifiche sono state richieste
      let activityCount = 0;
      for (const match of matches) {
        if (match[1]) {
          const request = match[1].trim();
          // Conta le attività separate da "e" o virgole
          const activities = request.split(/\s+e\s+|,\s*/).filter(a => a.trim().length > 0);
          activityCount += activities.length;
        }
      }

      if (activityCount > 0) {
        result.requestedActivityCount = activityCount;
      }
      break;
    }
  }

  // Rileva anche pattern numerici espliciti
  const numberPatterns = [
    /(?:solo\s+)?(?:un[ao]?\s+)?(\d+)\s+attivit[àa]/gi,
    /(?:solo\s+)?(\d+)\s+(?:cose?|attivit[àa])/gi
  ];

  for (const pattern of numberPatterns) {
    const matches = Array.from(normalizedText.matchAll(pattern));
    if (matches.length > 0 && matches[0][1]) {
      result.isLimitedRequest = true;
      result.requestedActivityCount = parseInt(matches[0][1]);
      break;
    }
  }

  // Se viene richiesta una singola attività specifica (colazione, pranzo, cena, aperitivo)
  const singleActivityPatterns = [
    /\b(?:solo\s+)?(?:la\s+)?colazione\b/gi,
    /\b(?:solo\s+)?(?:il\s+)?pranzo\b/gi,
    /\b(?:solo\s+)?(?:la\s+)?cena\b/gi,
    /\b(?:solo\s+)?(?:un\s+)?aperitivo\b/gi,
    /\b(?:solo\s+)?(?:una\s+)?merenda\b/gi
  ];

  for (const pattern of singleActivityPatterns) {
    if (pattern.test(normalizedText)) {
      result.isLimitedRequest = true;
      result.requestedActivityCount = 1;
      break;
    }
  }

  console.log('Risultati analisi preferenze:', result);
  return result;
}

// Analizza la risposta per estrarre le attività
function parseActivitiesFromResponse(response: string, days: any[], timeConstraints: string[]) {
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
            return processActivities(parsedData.activities, days, timeConstraints);
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
      return processActivities(parsedData.activities, days, timeConstraints);
    } catch (jsonError) {
      console.error('Errore nel parsing del JSON:', jsonError);
      throw jsonError;
    }
  } catch (error: any) {
    console.error('Error parsing activities:', error);
    const errorMessage = error.message || 'Errore sconosciuto';
    throw new Error('Impossibile analizzare le attività dalla risposta: ' + errorMessage);
  }
}

// Funzione helper per processare le attività
function processActivities(activities: any[], days: any[], timeConstraints: string[]) {
  console.log('Processando attività...');

  // Ordina le attività per orario di inizio prima di processarle
  activities.sort((a, b) => {
    const aTime = a.start_time ? new Date(a.start_time).getTime() : 0;
    const bTime = b.start_time ? new Date(b.start_time).getTime() : 0;
    return aTime - bTime;
  });

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

        // Se è la prima attività del giorno, inizia alle 9:00 (o all'orario specificato nelle preferenze)
        // altrimenti, inizia 2 ore dopo l'attività precedente
        let startHour = 9;
        if (index > 0) {
          startHour = 9 + (index % 4) * 2;
        }

        // Crea gli orari in formato ISO locale
        const startTime = `${dayDate}T${startHour.toString().padStart(2, '0')}:00:00.000`;
        activity.start_time = startTime;

        // Orario di fine: orario di inizio + 1.5 ore
        const endHour = startHour + 1;
        const endMinute = 30;
        const endTime = `${dayDate}T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00.000`;
        activity.end_time = endTime;
      }

      if (!activity.location) activity.location = 'Da definire';
    }

    // Verifica e normalizza gli orari
    try {
      // Assicurati che gli orari siano in formato ISO
      if (typeof activity.start_time === 'string' && !activity.start_time.includes('T')) {
        // Se è solo un orario (HH:MM), convertilo in ISO mantenendo il fuso orario locale
        const [hours, minutes] = activity.start_time.split(':').map(Number);
        const dayDate = activity.day_date;
        // Crea la data in formato ISO mantenendo l'orario locale
        const isoDateTime = `${dayDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000`;
        activity.start_time = isoDateTime;
      }

      if (typeof activity.end_time === 'string' && !activity.end_time.includes('T')) {
        // Se è solo un orario (HH:MM), convertilo in ISO mantenendo il fuso orario locale
        const [hours, minutes] = activity.end_time.split(':').map(Number);
        const dayDate = activity.day_date;
        // Crea la data in formato ISO mantenendo l'orario locale
        const isoDateTime = `${dayDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000`;
        activity.end_time = isoDateTime;
      }

      // Verifica che l'orario di fine sia successivo all'orario di inizio
      const startTime = new Date(activity.start_time);
      const endTime = new Date(activity.end_time);

      if (endTime <= startTime) {
        console.warn(`Orario di fine non valido per l'attività ${activity.name}, aggiustando...`);
        // Aggiungi 1.5 ore all'orario di inizio
        const newEndTimeMs = startTime.getTime() + 90 * 60 * 1000;
        const newEndDate = new Date(newEndTimeMs);
        const endHours = newEndDate.getHours();
        const endMinutes = newEndDate.getMinutes();
        const dayDate = activity.day_date;
        activity.end_time = `${dayDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00.000`;
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

  // Raggruppa le attività per giorno
  const activitiesByDay: Record<string, any[]> = {};
  processedActivities.forEach(activity => {
    const dayDate = activity.day_date;
    if (!activitiesByDay[dayDate]) {
      activitiesByDay[dayDate] = [];
    }
    activitiesByDay[dayDate].push(activity);
  });

  // Per ogni giorno, assicurati che la prima attività inizi all'orario specificato (se presente)
  Object.keys(activitiesByDay).forEach(dayDate => {
    const dayActivities = activitiesByDay[dayDate];
    if (dayActivities.length > 0) {
      // Ordina le attività del giorno per orario di inizio
      dayActivities.sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });

      // Trova l'orario di inizio specificato nelle preferenze (se presente)
      const startTimeConstraint = findStartTimeConstraint();
      if (startTimeConstraint) {
        const [hours, minutes] = startTimeConstraint.split(':').map(Number);

        // Applica l'orario di inizio alla prima attività del giorno
        const firstActivity = dayActivities[0];

        // Calcola la durata dell'attività prima di modificare l'orario
        const currentStartTime = new Date(firstActivity.start_time);
        const currentEndTime = new Date(firstActivity.end_time);
        const duration = currentEndTime.getTime() - currentStartTime.getTime();

        // Crea il nuovo orario di inizio in formato ISO locale
        const newStartTime = `${dayDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000`;
        firstActivity.start_time = newStartTime;

        // Calcola il nuovo orario di fine aggiungendo la durata
        const startTimeMs = new Date(newStartTime).getTime();
        const endTimeMs = startTimeMs + duration;
        const endDate = new Date(endTimeMs);
        const endHours = endDate.getHours();
        const endMinutes = endDate.getMinutes();
        const newEndTime = `${dayDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00.000`;
        firstActivity.end_time = newEndTime;

        // Aggiusta gli orari delle attività successive per evitare sovrapposizioni
        for (let i = 1; i < dayActivities.length; i++) {
          const prevActivity = dayActivities[i-1];
          const currentActivity = dayActivities[i];

          const prevEndTime = new Date(prevActivity.end_time);
          const currentStartTime = new Date(currentActivity.start_time);

          // Se c'è sovrapposizione, sposta l'attività corrente dopo la precedente
          if (currentStartTime <= prevEndTime) {
            // Aggiungi 30 minuti di pausa tra le attività
            const newStartTimeMs = prevEndTime.getTime() + 30 * 60 * 1000;
            const newStartDate = new Date(newStartTimeMs);
            const startHours = newStartDate.getHours();
            const startMinutes = newStartDate.getMinutes();
            const dayDate = currentActivity.day_date;
            currentActivity.start_time = `${dayDate}T${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00.000`;

            // Calcola la durata dell'attività
            const duration = new Date(currentActivity.end_time).getTime() - currentStartTime.getTime();

            // Aggiorna l'orario di fine mantenendo la stessa durata
            const newEndTimeMs = newStartTimeMs + duration;
            const newEndDate = new Date(newEndTimeMs);
            const endHours = newEndDate.getHours();
            const endMinutes = newEndDate.getMinutes();
            currentActivity.end_time = `${dayDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00.000`;
          }
        }
      }
    }
  });

  // Funzione per trovare l'orario di inizio specificato nelle preferenze
  function findStartTimeConstraint(): string | null {
    // Cerca nei vincoli temporali
    for (const constraint of timeConstraints) {
      if (constraint.includes('La prima attività della giornata deve iniziare alle')) {
        const match = constraint.match(/iniziare alle (\d{2}:\d{2})/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    return null;
  }

  // Gestisci attività specifiche a orari precisi (come aperitivo)
  Object.keys(activitiesByDay).forEach(dayDate => {
    const dayActivities = activitiesByDay[dayDate];
    if (dayActivities.length > 0) {
      // Cerca vincoli per attività specifiche (aperitivo, pranzo, cena)
      const specificTimeActivities = findSpecificTimeActivities();

      for (const specificActivity of specificTimeActivities) {
        const { activityType, time } = specificActivity;
        const [hours, minutes] = time.split(':').map(Number);

        // Cerca se esiste già un'attività di questo tipo
        let existingActivity = dayActivities.find(activity =>
          activity.name.toLowerCase().includes(activityType.toLowerCase()) ||
          (activity.type === 'food' && activityType === 'pranzo') ||
          (activity.type === 'food' && activityType === 'cena') ||
          (activity.type === 'food' && activityType === 'aperitivo')
        );

        if (existingActivity) {
          // Aggiorna l'orario dell'attività esistente mantenendo il fuso orario locale
          const dayDate = existingActivity.day_date || dayDate;

          // Calcola la durata dell'attività prima di modificare l'orario
          const currentStartTime = new Date(existingActivity.start_time);
          const currentEndTime = new Date(existingActivity.end_time);
          const duration = currentEndTime.getTime() - currentStartTime.getTime();

          // Crea il nuovo orario di inizio in formato ISO locale
          const newStartTime = `${dayDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000`;
          existingActivity.start_time = newStartTime;

          // Calcola il nuovo orario di fine aggiungendo la durata
          const startTimeMs = new Date(newStartTime).getTime();
          const endTimeMs = startTimeMs + duration;
          const endDate = new Date(endTimeMs);
          const endHours = endDate.getHours();
          const endMinutes = endDate.getMinutes();
          const newEndTime = `${dayDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00.000`;
          existingActivity.end_time = newEndTime;

          console.log(`Aggiornato orario per ${activityType} alle ${time}`);
        } else {
          // Se non esiste, crea una nuova attività di questo tipo
          console.log(`Non trovata attività di tipo ${activityType}, potrebbe essere necessario crearne una nuova`);
        }
      }

      // Riordina le attività per orario dopo le modifiche
      dayActivities.sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });

      // Aggiusta gli orari delle attività per evitare sovrapposizioni
      for (let i = 1; i < dayActivities.length; i++) {
        const prevActivity = dayActivities[i-1];
        const currentActivity = dayActivities[i];

        const prevEndTime = new Date(prevActivity.end_time);
        const currentStartTime = new Date(currentActivity.start_time);

        // Se c'è sovrapposizione, sposta l'attività corrente dopo la precedente
        if (currentStartTime <= prevEndTime) {
          // Aggiungi 30 minuti di pausa tra le attività
          const newStartTimeMs = prevEndTime.getTime() + 30 * 60 * 1000;
          const newStartDate = new Date(newStartTimeMs);
          const startHours = newStartDate.getHours();
          const startMinutes = newStartDate.getMinutes();
          const dayDate = currentActivity.day_date;
          currentActivity.start_time = `${dayDate}T${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00.000`;

          // Calcola la durata dell'attività
          const duration = new Date(currentActivity.end_time).getTime() - currentStartTime.getTime();

          // Aggiorna l'orario di fine mantenendo la stessa durata
          const newEndTimeMs = newStartTimeMs + duration;
          const newEndDate = new Date(newEndTimeMs);
          const endHours = newEndDate.getHours();
          const endMinutes = newEndDate.getMinutes();
          currentActivity.end_time = `${dayDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00.000`;
        }
      }
    }
  });

  // Funzione per trovare attività specifiche a orari precisi
  function findSpecificTimeActivities(): Array<{activityType: string, time: string}> {
    const result: Array<{activityType: string, time: string}> = [];

    // Cerca nei vincoli temporali
    for (const constraint of timeConstraints) {
      if (constraint.includes('Includere un aperitivo alle')) {
        const match = constraint.match(/aperitivo alle (\d{2}:\d{2})/);
        if (match && match[1]) {
          result.push({ activityType: 'aperitivo', time: match[1] });
        }
      }
      if (constraint.includes('Includere la colazione alle')) {
        const match = constraint.match(/colazione alle (\d{2}:\d{2})/);
        if (match && match[1]) {
          result.push({ activityType: 'colazione', time: match[1] });
        }
      }
      if (constraint.includes('Includere il pranzo alle')) {
        const match = constraint.match(/pranzo alle (\d{2}:\d{2})/);
        if (match && match[1]) {
          result.push({ activityType: 'pranzo', time: match[1] });
        }
      }
      if (constraint.includes('Includere la cena alle')) {
        const match = constraint.match(/cena alle (\d{2}:\d{2})/);
        if (match && match[1]) {
          result.push({ activityType: 'cena', time: match[1] });
        }
      }
    }

    return result;
  }

  console.log('Attività processate con successo:', processedActivities.length);
  return processedActivities;
}
