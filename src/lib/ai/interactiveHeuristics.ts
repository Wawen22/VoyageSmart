import { InteractiveComponent, QuickRepliesComponent } from './interactiveDsl';

export type ChatIntentType =
  | 'dining'
  | 'transportation'
  | 'itinerary'
  | 'accommodations'
  | 'expenses'
  | 'overview';

export interface ChatIntent {
  type: ChatIntentType;
  confidence: number;
  keywords: string[];
}

interface BuildComponentsArgs {
  intents: ChatIntent[];
  tripContext: any;
  message: string;
}

interface HeuristicResult {
  components: InteractiveComponent[];
  topics: string[];
}

const INTENT_KEYWORDS: Record<ChatIntentType, string[]> = {
  dining: [
    'ristorante',
    'ristoranti',
    'cena',
    'pranzo',
    'mangiare',
    'cucina',
    'food',
    'dining',
    'mangi',
  ],
  transportation: [
    'trasporto',
    'trasporti',
    'volo',
    'voli',
    'aereo',
    'treno',
    'bus',
    'taxi',
    'transfer',
    'noleggio',
    'spostamento',
    'mezzo',
    'come arrivo',
    'come arrivate',
    'shuttle',
  ],
  itinerary: [
    'itinerario',
    'attività',
    'programma',
    'schedule',
    'cosa fare',
    'cosa facciamo',
    'giorno',
    'giornata',
    'domani',
    'oggi',
    'agenda',
  ],
  accommodations: [
    'hotel',
    'alloggio',
    'camera',
    'dormire',
    'check-in',
    'check out',
    'pernottamento',
    'soggiorno',
    'struttura',
  ],
  expenses: [
    'spesa',
    'spese',
    'budget',
    'costo',
    'costi',
    'pagare',
    'pagamenti',
    'quanto',
    'quanto costa',
    'soldi',
    'divisione',
    'saldo',
    'debito',
    'credito',
  ],
  overview: ['aiuto', 'consigli', 'suggerimenti', 'informazioni', 'generale'],
};

const TOPIC_LABELS: Record<ChatIntentType, string> = {
  dining: 'Ristorazione',
  transportation: 'Trasporti',
  itinerary: 'Itinerario',
  accommodations: 'Alloggi',
  expenses: 'Spese',
  overview: 'Panoramica',
};

export function detectIntents(message: string): ChatIntent[] {
  if (!message) return [];

  const lower = message.toLowerCase();
  const intents: ChatIntent[] = [];

  (Object.keys(INTENT_KEYWORDS) as ChatIntentType[]).forEach((type) => {
    const keywords = INTENT_KEYWORDS[type];
    let matches = 0;
    keywords.forEach((keyword) => {
      if (lower.includes(keyword)) {
        matches += 1;
      }
    });

    if (matches > 0) {
      const confidence = Math.min(1, matches / Math.max(2, keywords.length / 4));
      intents.push({ type, confidence, keywords });
    }
  });

  if (intents.length === 0) {
    intents.push({
      type: 'overview',
      confidence: 0.4,
      keywords: INTENT_KEYWORDS.overview,
    });
  }

  return intents
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

export function buildHeuristicComponents({
  intents,
  tripContext,
  message,
  locationHint,
  cuisinePreferences,
}: BuildComponentsArgs): HeuristicResult {
  const components: InteractiveComponent[] = [];
  const topics: string[] = [];
  const detectedLocation = locationHint ?? extractLocationHint(message, tripContext);
  const detectedCuisines = cuisinePreferences ?? extractCuisinePreferences(message);

  const unique = <T,>(items: T[], keyFn: (item: T) => string) => {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      const key = keyFn(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  };

  const effectiveIntents = intents.length > 0 ? intents : detectIntents(message);

  effectiveIntents.forEach((intent) => {
    topics.push(TOPIC_LABELS[intent.type]);
    switch (intent.type) {
      case 'dining': {
        components.push(...buildDiningComponents(tripContext, detectedLocation, detectedCuisines));
        break;
      }
      case 'transportation': {
        components.push(...buildTransportationComponents(tripContext));
        break;
      }
      case 'itinerary': {
        components.push(...buildItineraryComponents(tripContext));
        break;
      }
      case 'accommodations': {
        components.push(...buildAccommodationComponents(tripContext));
        break;
      }
      case 'expenses': {
        components.push(...buildExpenseComponents(tripContext));
        break;
      }
      default:
        break;
    }
  });

  return {
    components: unique(components, (component) => `${component.type}:${component.id ?? component.title ?? ''}`),
    topics: unique(topics, (topic) => topic),
  };
}

export function mergeInteractiveComponents(
  base: InteractiveComponent[],
  additions: InteractiveComponent[]
): InteractiveComponent[] {
  if (additions.length === 0) {
    return base;
  }

  const baseKey = (component: InteractiveComponent) =>
    `${component.type}:${component.id ?? component.title ?? ''}`.toLowerCase();

  const seen = new Set(base.map(baseKey));
  const merged = [...base];

  additions.forEach((component) => {
    const key = baseKey(component);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(component);
    }
  });

  return merged;
}

export function inferTopicsFromComponents(components: InteractiveComponent[]): string[] {
  const topics: string[] = [];

  components.forEach((component) => {
    switch (component.type) {
      case 'map':
        topics.push('Ristorazione');
        break;
      case 'quick_replies':
        if (component.title?.toLowerCase().includes('trasporto')) {
          topics.push('Trasporti');
        } else if (component.title?.toLowerCase().includes('alloggio')) {
          topics.push('Alloggi');
        } else if (component.title?.toLowerCase().includes('spese')) {
          topics.push('Spese');
        } else if (component.title?.toLowerCase().includes('attivit')) {
          topics.push('Itinerario');
        } else if (component.title?.toLowerCase().includes('ristor')) {
          topics.push('Ristorazione');
        }
        break;
      case 'info_card':
        if (component.id?.includes('transport')) {
          topics.push('Trasporti');
        } else if (component.id?.includes('accommodation')) {
          topics.push('Alloggi');
        } else if (component.id?.includes('expenses')) {
          topics.push('Spese');
        } else if (component.id?.includes('itinerary')) {
          topics.push('Itinerario');
        } else if (component.id?.includes('dining')) {
          topics.push('Ristorazione');
        }
        break;
      default:
        break;
    }
  });

  return Array.from(new Set(topics));
}

function buildDiningComponents(
  tripContext: any,
  locationHint?: LocationHint | null,
  cuisinePreferences?: string[],
): InteractiveComponent[] {
  const destination: string =
    tripContext?.trip?.destination || tripContext?.trip?.destinations?.[0] || 'la tua destinazione';
  const hotelName = tripContext?.accommodations?.[0]?.name;
  const hotelAddress = tripContext?.accommodations?.[0]?.address;

  const targetLocation = locationHint?.location || hotelName || destination;
  const primaryCuisine = cuisinePreferences && cuisinePreferences.length > 0 ? cuisinePreferences[0] : null;
  const scope =
    locationHint?.type === 'airport'
      ? 'zona aeroportuale'
      : locationHint?.type === 'city'
        ? `zona di ${locationHint.location}`
        : 'zona';
  const googleQuery = `${targetLocation} ${primaryCuisine ?? 'ristoranti'}`;

  const points =
    locationHint?.type === 'airport'
      ? getAirportDiningSuggestions(locationHint.location)
      : getDiningSuggestions(locationHint?.location || destination, hotelName, cuisinePreferences);

  if (points.length === 0) {
    points.push({
      id: 'dining-generic-search',
      label: `Cerca su Maps (${targetLocation})`,
      description: primaryCuisine
        ? `Apri Google Maps con ristoranti ${primaryCuisine} in ${targetLocation}.`
        : `Apri Google Maps per esplorare ristoranti a ${targetLocation}.`,
      action: {
        type: 'open_url',
        value: `https://www.google.com/maps/search/${encodeURIComponent(googleQuery)}`,
        label: 'Apri in Maps',
      },
    });
  }

  if (!locationHint && hotelName) {
    points.unshift({
      id: 'hotel-location',
      label: hotelName,
      address: hotelAddress || destination,
      description: 'Punto di partenza: il tuo alloggio.',
      action: {
        type: 'open_url',
        value: `https://www.google.com/maps/search/ristoranti+vicino+${encodeURIComponent(`${hotelName} ${destination}`)}`,
        label: 'Apri mappa',
      },
    });
  }

  const mapComponent: InteractiveComponent = {
    type: 'map',
    id: 'dining-map',
    title: primaryCuisine
      ? `Ristoranti ${primaryCuisine} a ${targetLocation}`
      : `Ristoranti vicino a ${targetLocation}`,
    subtitle: primaryCuisine
      ? `Opzioni selezionate per cucina ${primaryCuisine}`
      : `Suggerimenti curati per la ${scope}`,
    points,
    footnote:
      primaryCuisine
        ? `Tocca un suggerimento per aprire la posizione o chiedimi di restringere la ricerca a un quartiere specifico.`
        : 'Tocca un suggerimento per aprire la posizione o chiedimi di filtrare per budget, tipo di cucina o distanza.',
  };

  const quickReplies: QuickRepliesComponent = {
    type: 'quick_replies',
    id: 'dining-quick-replies',
    title: 'Affina i risultati',
    options: [
      {
        id: 'dining-local',
        label:
          locationHint?.type === 'airport'
            ? 'Opzioni in aeroporto'
            : primaryCuisine
              ? `Più ${primaryCuisine}`
              : 'Cucina locale',
        value:
          locationHint?.type === 'airport'
            ? `Suggerisci ristoranti all'interno o vicino a ${targetLocation}`
            : primaryCuisine
              ? `Mostrami altre opzioni di cucina ${primaryCuisine} vicino a ${targetLocation}`
              : `Mostrami ristoranti di cucina locale vicino a ${targetLocation}`,
      },
      {
        id: 'dining-budget',
        label: 'Opzioni economiche',
        value: `Suggerisci ristoranti economici nella zona di ${targetLocation}`,
      },
      {
        id: 'dining-special',
        label: locationHint?.type === 'airport'
          ? 'Cena pre-volo'
          : primaryCuisine
            ? 'Esperienza speciale'
            : 'Cena speciale',
        value:
          locationHint?.type === 'airport'
            ? `Consigliami un posto tranquillo dove cenare prima del volo a ${targetLocation}`
            : primaryCuisine
              ? `Suggeriscimi ristoranti ${primaryCuisine} eleganti a ${targetLocation}`
              : `Consigliami un ristorante per una serata speciale a ${destination}`,
      },
    ],
  };

  const infoCard: InteractiveComponent = {
    type: 'info_card',
    id: 'dining-insights',
    content:
      locationHint?.type === 'airport'
        ? `**Mangiare bene a ${targetLocation}:**\n\n- Verifica le food court nei diversi terminal: spesso offrono specialità locali e opzioni internazionali.\n- Se hai tempo, considera i quartieri a breve distanza (tram o treno) per un pasto più autentico.\n- Posso suggerirti locali con servizio veloce o spazi tranquilli per lavorare prima del volo.`
        : primaryCuisine
          ? `**Suggerimenti per cucina ${primaryCuisine} a ${targetLocation}:**\n\n- Prenota con anticipo i ristoranti più richiesti, soprattutto nei weekend.\n- Posso filtrare per fascia di prezzo, atmosfera o quartiere.\n- Se desideri un'opzione informale, chiedimi enoteche, trattorie o take-away.`
          : `**Suggerimenti rapidi per mangiare a ${destination}:**\n\n- Prenota con anticipo i locali più popolari, soprattutto nei weekend.\n- Chiedimi di filtrare per tipo di cucina, dietetica o budget.\n- Vuoi street food o opzioni take-away? Posso suggerirti zone e mercati famosi.`,
  };

  return [mapComponent, quickReplies, infoCard];
}

function buildTransportationComponents(tripContext: any): InteractiveComponent[] {
  const transports: any[] = Array.isArray(tripContext?.transportation)
    ? tripContext.transportation
    : [];
  const upcoming = transports[0];

  const quickReplies: QuickRepliesComponent = {
    type: 'quick_replies',
    id: 'transport-quick-replies',
    title: 'Gestisci i tuoi spostamenti',
    options: [
      { id: 'transport-next', label: 'Prossimo spostamento', value: 'Qual è il prossimo trasporto in programma?' },
      { id: 'transport-add', label: 'Aggiungi trasporto', value: 'Aiutami ad aggiungere un nuovo trasporto.' },
      { id: 'transport-tips', label: 'Consigli di viaggio', value: 'Dammi consigli pratici sui trasporti del viaggio.' },
    ],
  };

  const infoCardContent = upcoming
    ? `**Prossimo spostamento confermato:**\n\n- **${(upcoming.type || 'Trasporto').toUpperCase()}** con ${upcoming.provider || 'provider non specificato'}\n- Partenza: ${upcoming.departureLocation || 'località da confermare'} ${formatDateTime(upcoming.departureTime)}\n- Arrivo: ${upcoming.arrivalLocation || 'località da confermare'} ${formatDateTime(upcoming.arrivalTime)}\n\nChiedimi di salvare note, documenti o promemoria per questo viaggio.`
    : `Non ho spostamenti futuri registrati. Vuoi che ti aiuti ad aggiungerne uno o a cercare opzioni di viaggio?`;

  const infoCard: InteractiveComponent = {
    type: 'info_card',
    id: 'transport-insights',
    content: infoCardContent,
  };

  return [quickReplies, infoCard];
}

function buildItineraryComponents(tripContext: any): InteractiveComponent[] {
  const itinerary: any[] = Array.isArray(tripContext?.itinerary)
    ? tripContext.itinerary
    : [];
  const today = itinerary.find((day: any) => isToday(day.date || day.day_date));

  const options: QuickRepliesComponent = {
    type: 'quick_replies',
    id: 'itinerary-quick-replies',
    title: 'Vuoi approfondire?',
    options: [
      { id: 'itinerary-today', label: 'Oggi', value: 'Mostrami le attività in programma per oggi.' },
      { id: 'itinerary-tomorrow', label: 'Domani', value: 'Quali attività abbiamo in programma per domani?' },
      { id: 'itinerary-add', label: 'Aggiungi attività', value: 'Aiutami ad aggiungere una nuova attività al viaggio.' },
    ],
  };

  const infoCardContent = today
    ? buildItineraryCard(today)
    : itinerary.length > 0
      ? `Hai ${itinerary.length} giorni pianificati. Chiedimi dettagli per un giorno specifico o aiutami a riordinare il programma.`
      : `Non trovo attività pianificate. Vuoi ispirazione per cosa fare o preferisci aggiungere un'attività adesso?`;

  const infoCard: InteractiveComponent = {
    type: 'info_card',
    id: 'itinerary-overview',
    content: infoCardContent,
  };

  return [options, infoCard];
}

function buildAccommodationComponents(tripContext: any): InteractiveComponent[] {
  const accommodations: any[] = Array.isArray(tripContext?.accommodations)
    ? tripContext.accommodations
    : [];

  const quickReplies: QuickRepliesComponent = {
    type: 'quick_replies',
    id: 'accommodation-quick-replies',
    title: 'Gestisci l’alloggio',
    options: [
      { id: 'accommodation-details', label: 'Dettagli alloggio', value: 'Mostrami i dettagli dell’alloggio prenotato.' },
      { id: 'accommodation-checkin', label: 'Check-in e Check-out', value: 'Ricordami orari di check-in e check-out.' },
      { id: 'accommodation-services', label: 'Servizi utili', value: 'Che servizi offre l’hotel? Hai consigli su cosa chiedere?' },
    ],
  };

  const infoCardContent =
    accommodations.length > 0
      ? `**Alloggio principale:**\n\n- ${accommodations[0].name || 'Alloggio'} (${accommodations[0].type || 'tipo non specificato'})\n- Check-in: ${accommodations[0].checkIn || 'da confermare'}\n- Indirizzo: ${accommodations[0].address || 'Indirizzo non disponibile'}\n\nPosso aiutarti con richieste speciali, late check-out o alternative nelle vicinanze.`
      : `Non trovo alloggi salvati. Vuoi che ti aiuti a cercarne uno o a registrare una prenotazione?`;

  const infoCard: InteractiveComponent = {
    type: 'info_card',
    id: 'accommodation-overview',
    content: infoCardContent,
  };

  return [quickReplies, infoCard];
}

function buildExpenseComponents(tripContext: any): InteractiveComponent[] {
  const expenses: any[] = Array.isArray(tripContext?.expenses) ? tripContext.expenses : [];
  const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const currency = tripContext?.trip?.currency || 'EUR';

  const quickReplies: QuickRepliesComponent = {
    type: 'quick_replies',
    id: 'expenses-quick-replies',
    title: 'Cosa vuoi monitorare?',
    options: [
      { id: 'expenses-summary', label: 'Riepilogo spese', value: 'Fammi un riepilogo delle spese sostenute finora.' },
      { id: 'expenses-budget', label: 'Budget residuo', value: 'Quanto budget ci resta disponibilie?' },
      { id: 'expenses-balance', label: 'Saldi tra partecipanti', value: 'Chi deve pagare cosa? Mostrami i saldi aggiornati.' },
    ],
  };

  const infoCard: InteractiveComponent = {
    type: 'info_card',
    id: 'expenses-overview',
    content: expenses.length
      ? `Hai registrato ${expenses.length} spese per un totale di **${total.toFixed(2)} ${currency}**.\n\nPosso aiutarti a classificare le spese, trovare aree in cui risparmiare o inviare promemoria ai partecipanti.`
      : `Non risultano spese salvate. Vuoi che ti aiuti a registrare le spese principali o a impostare un budget?`,
  };

  return [quickReplies, infoCard];
}

function getDiningSuggestions(destination: string, hotelName?: string, cuisinePreferences?: string[]) {
  const normalized = destination.toLowerCase();
  const primaryCuisine = cuisinePreferences && cuisinePreferences.length > 0 ? cuisinePreferences[0] : null;
  const baseSuggestions: Array<{
    id: string;
    label: string;
    description: string;
    action?: { type: 'open_url' | 'send_message'; value: string; label?: string };
  }> = [];

  if (primaryCuisine === 'italiana') {
    return [
      {
        id: 'italian-trattoria',
        label: 'Trattorie autentiche',
        description: 'Chiedimi locali con pasta fresca, wine list e atmosfera conviviale.',
        action: {
          type: 'send_message',
          value: `Consigliami trattorie italiane autentiche a ${destination}`,
          label: 'Trattorie',
        },
      },
      {
        id: 'italian-gourmet',
        label: 'Italiano gourmet',
        description: 'Ristoranti italiani di fascia alta, perfetti per occasioni speciali.',
        action: {
          type: 'send_message',
          value: `Trova ristoranti italiani gourmet nella zona di ${destination}`,
          label: 'Gourmet',
        },
      },
      {
        id: 'italian-pizza',
        label: 'Pizza e street food',
        description: 'Opzioni veloci per pizza, focacce o cucina italiana da asporto.',
        action: {
          type: 'send_message',
          value: `Suggerisci pizzerie o street food italiani vicino a ${destination}`,
          label: 'Pizza e street food',
        },
      },
    ];
  }

  if (normalized.includes('osaka')) {
    baseSuggestions.push(
      {
        id: 'dining-dotonbori',
        label: 'Dotonbori Street',
        description: 'Zona famosissima per street food, takoyaki e okonomiyaki.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Dotonbori+Street+Osaka',
          label: 'Apri in Maps',
        },
      },
      {
        id: 'dining-kuromon',
        label: 'Kuromon Ichiba Market',
        description: 'Mercato coperto con prodotti freschi, sushi e specialità locali.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Kuromon+Ichiba+Market',
          label: 'Apri in Maps',
        },
      },
      {
        id: 'dining-umeda-sky',
        label: 'Ristoranti Umeda Sky Building',
        description: 'Per una cena panoramica con vista su Osaka.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Umeda+Sky+Building+Restaurants',
          label: 'Apri in Maps',
        },
      }
    );
  } else {
    baseSuggestions.push(
      {
        id: 'dining-local-classic',
        label: 'Cucina locale',
        description: 'Chiedimi piatti tipici o quartieri consigliati per vivere come un local.',
        action: {
          type: 'send_message',
          value: `Suggeriscimi piatti tipici da provare vicino a ${hotelName || destination}`,
          label: 'Chiedi piatti tipici',
        },
      },
      {
        id: 'dining-cozy',
        label: 'Ristoranti intimi',
        description: 'Ideali per una cena rilassata, dimmi preferenze e budget.',
        action: {
          type: 'send_message',
          value: `Vorrei un ristorante accogliente e tranquillo a ${destination}`,
          label: 'Chiedi suggerimento',
        },
      },
      {
        id: 'dining-family',
        label: 'Opzioni per famiglie',
        description: 'Spazi più ampi e menu per bambini o gruppi numerosi.',
        action: {
          type: 'send_message',
          value: `Trova ristoranti adatti a famiglie vicino a ${hotelName || destination}`,
          label: 'Ricerca per famiglie',
        },
      }
    );
  }

  return baseSuggestions;
}

interface LocationHint {
  location: string;
  type: 'airport' | 'city' | 'generic';
}

export function extractLocationHint(message: string, tripContext?: any): LocationHint | null {
  const lower = message.toLowerCase();
  const airportRegex = /aeroporto(?:\s+di)?\s+([a-zà-ù\s']+)/i;
  const airportMatch = airportRegex.exec(message);
  if (airportMatch && airportMatch[1]) {
    return {
      location: airportMatch[1].trim(),
      type: 'airport',
    };
  }

  const airportEnglishRegex = /airport(?:\s+of|\s+in)?\s+([a-zà-ù\s']+)/i;
  const airportEnglishMatch = airportEnglishRegex.exec(message);
  if (airportEnglishMatch && airportEnglishMatch[1]) {
    return {
      location: airportEnglishMatch[1].trim(),
      type: 'airport',
    };
  }

  if (lower.includes('aeroporto') || lower.includes('airport')) {
    return {
      location: "l'aeroporto",
      type: 'airport',
    };
  }

  const cityRegex = /\b(?:a|in|verso|per)\s+([A-ZÀ-Ú][A-Za-zÀ-ú'’\s]+)\b/;
  const cityMatch = cityRegex.exec(message);
  if (cityMatch && cityMatch[1]) {
    return {
      location: cityMatch[1].trim(),
      type: 'city',
    };
  }

  const uppercaseWords = message
    .split(/[\s,;.!?]+/)
    .filter((word) => word.length > 2 && /^[A-ZÀ-Ú]+$/.test(word));
  if (uppercaseWords.length > 0) {
    return {
      location: uppercaseWords[0],
      type: 'city',
    };
  }

  const destinations: string[] = Array.isArray(tripContext?.trip?.destinations)
    ? tripContext.trip.destinations
    : [];
  for (const dest of destinations) {
    if (lower.includes(dest.toLowerCase())) {
      return {
        location: dest,
        type: 'city',
      };
    }
  }

  return null;
}

export function extractCuisinePreferences(message: string): string[] {
  const lower = message.toLowerCase();
  const cuisines: { keyword: string; label: string }[] = [
    { keyword: 'italian', label: 'italiana' },
    { keyword: 'italiano', label: 'italiana' },
    { keyword: 'italiani', label: 'italiana' },
    { keyword: 'italiana', label: 'italiana' },
    { keyword: 'pizza', label: 'italiana' },
    { keyword: 'sushi', label: 'sushi' },
    { keyword: 'vegan', label: 'vegana' },
    { keyword: 'vegano', label: 'vegana' },
    { keyword: 'vegetarian', label: 'vegetariana' },
    { keyword: 'vegetariano', label: 'vegetariana' },
    { keyword: 'thai', label: 'thai' },
    { keyword: 'messican', label: 'messicana' },
    { keyword: 'mexican', label: 'messicana' },
    { keyword: 'cinese', label: 'cinese' },
    { keyword: 'korean', label: 'coreana' },
    { keyword: 'corean', label: 'coreana' },
    { keyword: 'bbq', label: 'barbecue' },
    { keyword: 'steak', label: 'steakhouse' },
    { keyword: 'fusion', label: 'fusion' },
  ];

  const matches = cuisines
    .filter(({ keyword }) => lower.includes(keyword))
    .map(({ label }) => label);

  return Array.from(new Set(matches));
}

function getAirportDiningSuggestions(location: string) {
  const normalized = location.toLowerCase();
  if (normalized.includes('tokyo') || normalized.includes('haneda')) {
    return [
      {
        id: 'haneda-food',
        label: 'Haneda Edo Market (Terminal 1)',
        description: 'Area con ramen, sushi e dolci tradizionali prima dei controlli di sicurezza.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Haneda+Airport+Edo+Market',
          label: 'Apri in Maps',
        },
      },
      {
        id: 'haneda-observation',
        label: 'Observation Deck Restaurants',
        description: 'Ristoranti con vista sulla pista, perfetti per una pausa rilassante prima del volo.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Haneda+Airport+Observation+Deck+Restaurants',
          label: 'Apri in Maps',
        },
      },
      {
        id: 'haneda-sushi',
        label: 'Sushi Kyotatsu',
        description: 'Sushi bar famoso al Terminal 2, ottimo per provare nigiri freschissimo.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Sushi+Kyotatsu+Haneda',
          label: 'Apri in Maps',
        },
      },
    ];
  }

  if (normalized.includes('narita')) {
    return [
      {
        id: 'narita-terminal1',
        label: 'Narita Dining Terrace',
        description: 'Food court con ramen, curry giapponese e dessert, al Terminal 1.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Narita+Airport+Dining+Terrace',
          label: 'Apri in Maps',
        },
      },
      {
        id: 'narita-sushi',
        label: 'Sushiden',
        description: 'Sushi di qualità all’interno dell’aeroporto, perfetto per un pasto veloce prima del volo.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Sushiden+Narita+Airport',
          label: 'Apri in Maps',
        },
      },
      {
        id: 'narita-sozai',
        label: 'Sozai Delica',
        description: 'Bento freschi e piatti pronti da portare in volo.',
        action: {
          type: 'open_url',
          value: 'https://maps.google.com/?q=Sozai+Delica+Narita',
          label: 'Apri in Maps',
        },
      },
    ];
  }

  return [
    {
      id: 'airport-food-court',
      label: `Food court dell'aeroporto`,
      description: 'Controlla le opzioni nei vari terminal: spesso includono specialità locali e catene internazionali.',
      action: {
        type: 'send_message',
        value: `Mostrami le food court disponibili all'interno di ${location}`,
        label: 'Food court',
      },
    },
    {
      id: 'airport-lounge',
      label: 'Lounge con ristorazione',
      description: 'Se hai accesso a una lounge, puoi trovare buffet e spazi tranquilli per mangiare o lavorare.',
      action: {
        type: 'send_message',
        value: `Suggerisci lounge con buona ristorazione disponibili a ${location}`,
        label: 'Scopri lounge',
      },
    },
    {
      id: 'airport-nearby',
      label: 'Quartieri vicini',
      description: 'Considera un trasferimento rapido verso quartieri vicini per scelta più ampia di ristoranti.',
      action: {
        type: 'send_message',
        value: `Consigliami quartieri vicini a ${location} dove andare a mangiare prima del volo`,
        label: 'Quartieri vicini',
      },
    },
  ];
}


function formatDateTime(dateLike?: string) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function isToday(dateLike?: string) {
  if (!dateLike) return false;
  const date = new Date(dateLike);
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function buildItineraryCard(day: any) {
  const date = day.date || day.day_date || '';
  let formattedDate = 'Giornata pianificata';

  if (date) {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      formattedDate = new Intl.DateTimeFormat('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      }).format(parsed);
    }
  }

  if (Array.isArray(day.activities) && day.activities.length > 0) {
    const lines = day.activities
      .map((activity: any) => {
        const name = activity.name || 'Attività';
        const start = activity.start_time || activity.startTime;
        const location = activity.location ? ` @ ${activity.location}` : '';
        const time = start ? `(${start})` : '';
        return `- ${name} ${time}${location}`;
      })
      .join('\n');

    return `**${formattedDate.toUpperCase()}**\n\n${lines}\n\nPosso aiutarti a modificare gli orari o aggiungere note utili.`;
  }

  return `**${formattedDate.toUpperCase()}**\n\nNon hai attività specifiche per questa giornata. Vuoi che ti proponga un itinerario personalizzato?`;
}
