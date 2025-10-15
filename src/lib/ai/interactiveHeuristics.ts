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
}: BuildComponentsArgs): HeuristicResult {
  const components: InteractiveComponent[] = [];
  const topics: string[] = [];

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
        components.push(...buildDiningComponents(tripContext));
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

function buildDiningComponents(tripContext: any): InteractiveComponent[] {
  const destination: string =
    tripContext?.trip?.destination || tripContext?.trip?.destinations?.[0] || 'la tua destinazione';
  const hotelName = tripContext?.accommodations?.[0]?.name;
  const hotelAddress = tripContext?.accommodations?.[0]?.address;
  const googleQuery = hotelName
    ? `${hotelName} ${destination}`
    : `${destination} ristoranti`;

  const points = getDiningSuggestions(destination, hotelName);
  if (hotelName) {
    points.unshift({
      id: 'hotel-location',
      label: hotelName,
      address: hotelAddress || destination,
      description: 'Punto di partenza: il tuo alloggio.',
      action: {
        type: 'open_url',
        value: `https://www.google.com/maps/search/ristoranti+vicino+${encodeURIComponent(googleQuery)}`,
        label: 'Apri mappa',
      },
    });
  }

  const mapComponent: InteractiveComponent = {
    type: 'map',
    id: 'dining-map',
    title: `Ristoranti vicino a ${hotelName || destination}`,
    subtitle: 'Suggerimenti curati per iniziare la tua ricerca',
    points,
    footnote:
      'Tocca un suggerimento per aprire la posizione o chiedimi di filtrare per budget, tipo di cucina o distanza.',
  };

  const quickReplies: QuickRepliesComponent = {
    type: 'quick_replies',
    id: 'dining-quick-replies',
    title: 'Affina i risultati',
    options: [
      {
        id: 'dining-local',
        label: 'Cucina locale',
        value: `Mostrami ristoranti di cucina locale vicino a ${hotelName || destination}`,
      },
      {
        id: 'dining-budget',
        label: 'Opzioni economiche',
        value: `Suggerisci ristoranti economici nella zona di ${hotelName || destination}`,
      },
      {
        id: 'dining-special',
        label: 'Cena speciale',
        value: `Consigliami un ristorante per una serata speciale a ${destination}`,
      },
    ],
  };

  const infoCard: InteractiveComponent = {
    type: 'info_card',
    id: 'dining-insights',
    content: `**Suggerimenti rapidi per mangiare a ${destination}:**\n\n- Prenota con anticipo i locali più popolari, soprattutto nei weekend.\n- Chiedimi di filtrare per tipo di cucina, dietetica o budget.\n- Vuoi street food o opzioni take-away? Posso suggerirti zone e mercati famosi.`,
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

function getDiningSuggestions(destination: string, hotelName?: string) {
  const normalized = destination.toLowerCase();
  const baseSuggestions: Array<{
    id: string;
    label: string;
    description: string;
    action?: { type: 'open_url' | 'send_message'; value: string; label?: string };
  }> = [];

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
