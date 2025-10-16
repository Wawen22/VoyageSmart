import { INTERACTIVE_COMPONENTS_PROMPT } from './interactiveDsl';
import { RealTimeContextSnapshot } from './realTimeContext';
import { ChatIntent, ChatIntentType, detectIntents } from './interactiveHeuristics';

interface TripContext {
  trip?: any;
  participants?: any[];
  accommodations?: any[];
  transportation?: any[];
  itinerary?: any[];
  expenses?: any[];
}

interface BuildPromptArgs {
  message: string;
  tripContext: TripContext;
  tripName?: string;
  currentSection?: string;
  isInitialMessage?: boolean;
  intents?: ChatIntent[];
  contextFocus?: {
    location?: string;
    locationType?: string;
    cuisinePreferences?: string[];
    serviceKeywords?: string[];
  };
  realTimeContext?: RealTimeContextSnapshot;
}

export function buildChatPrompt({
  message,
  tripContext,
  tripName,
  currentSection,
  isInitialMessage = false,
  intents,
  contextFocus,
  realTimeContext,
}: BuildPromptArgs): string {
  const effectiveIntents = intents && intents.length > 0 ? intents : detectIntents(message);
  const intentNames =
    effectiveIntents.length > 0
      ? effectiveIntents.map((intent) => intentLabel(intent.type)).join(', ')
      : 'assistenza generale';

  const overview = buildTripOverview(tripContext, tripName);
  const sectionContext = getSectionDescription(currentSection);
  const structuredInsights = buildStructuredInsights(tripContext);
  const realtimeSnippet = realTimeContext ? buildRealTimeSnippet(realTimeContext) : '';
  const focusSnippet = buildFocusSnippet(contextFocus);

  const responseGuidelines = isInitialMessage
    ? buildInitialResponseGuidelines(tripContext, currentSection)
    : buildStandardResponseGuidelines(intentNames, effectiveIntents);

  const structuredDataGuidelines = `STRUCTURED DATA REFERENCE:
- Trasporti registrati: ${tripContext.transportation?.length || 0}
- Giorni di itinerario: ${tripContext.itinerary?.length || 0}
- Alloggi salvati: ${tripContext.accommodations?.length || 0}
- Spese tracciate: ${tripContext.expenses?.length || 0}

Quando condividi liste di trasporti, alloggi, attività o spese, utilizza gli elenchi puntati o numerati.
Evita paragrafi lunghi; separa sempre le sezioni con righe vuote.`;

const interactiveGuidelines = `INTERACTIVE COMPONENTS:
- Non dire mai che un'azione non è possibile. Suggerisci alternative pratiche o i pulsanti che appariranno sotto la tua risposta.
- Se stai guidando l'utente verso mappe, prenotazioni o filtri, menziona che può usare i pulsanti interattivi qui sotto per agire subito.
- Non includere manualmente il blocco [[AI_COMPONENTS ...]]; il sistema lo gestisce automaticamente.
- Evita frasi come "non ho accesso"; fornisci suggerimenti o procedure alternative.`;

const toneGuidelines = `TONO E STILE:
- Tono professionale ma amichevole; vai dritto al punto.
- Rispondi in italiano naturale; evita frasi ripetute come "non ho integrato".
- Trasforma le mancanze in suggerimenti pratici (es. "Posso consigliarti...", "Puoi usare il pulsante qui sotto...").
- Mantieni le risposte concentrate sugli intenti richiesti senza divagazioni.`;

  const finalInstruction = `Domanda dell'utente: ${message}`;

  return [
    'Sei un assistente di viaggio premium per VoyageSmart.',
    overview,
    sectionContext && `CONTESTO SEZIONE CORRENTE:\n${sectionContext}`,
    focusSnippet,
    structuredInsights,
    realtimeSnippet,
    responseGuidelines,
    structuredDataGuidelines,
    interactiveGuidelines,
    toneGuidelines,
    INTERACTIVE_COMPONENTS_PROMPT,
    finalInstruction,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function intentLabel(type: ChatIntentType): string {
  switch (type) {
    case 'dining':
      return 'ristorazione';
    case 'transportation':
      return 'trasporti';
    case 'itinerary':
      return 'itinerario';
    case 'accommodations':
      return 'alloggi';
    case 'expenses':
      return 'spese';
    default:
      return 'panoramica';
  }
}

function buildTripOverview(tripContext: TripContext, tripName?: string) {
  const trip = tripContext.trip || {};
  const name = trip.name || tripName || 'Viaggio senza titolo';
  const destination =
    Array.isArray(trip.destinations) && trip.destinations.length > 0
      ? trip.destinations.join(', ')
      : trip.destination || 'destinazione da definire';
  const dates =
    trip.startDate && trip.endDate
      ? `dal ${formatDate(trip.startDate)} al ${formatDate(trip.endDate)}`
      : 'date da definire';

  const participants =
    Array.isArray(tripContext.participants) && tripContext.participants.length > 0
      ? tripContext.participants
          .slice(0, 5)
          .map((p: any) => p.name || p.full_name || p.email || 'Partecipante')
          .join(', ')
      : 'partecipanti non specificati';

  return `PANORAMICA VIAGGIO:
- Nome: ${name}
- Destinazione: ${destination}
- Date: ${dates}
- Partecipanti: ${participants}`;
}

function buildStructuredInsights(tripContext: TripContext) {
  const accommodationSnippet = Array.isArray(tripContext.accommodations) && tripContext.accommodations.length > 0
    ? `Alloggio principale: ${tripContext.accommodations[0].name || 'Alloggio'} (${tripContext.accommodations[0].type || 'tipo non specificato'})`
    : 'Nessun alloggio registrato.';

  const transportSnippet = Array.isArray(tripContext.transportation) && tripContext.transportation.length > 0
    ? `Prossimo trasporto: ${tripContext.transportation[0].type || 'Trasporto'} da ${tripContext.transportation[0].departureLocation || 'luogo da confermare'} a ${tripContext.transportation[0].arrivalLocation || 'destinazione da confermare'}`
    : 'Nessun trasporto salvato.';

  const itinerarySnippet = Array.isArray(tripContext.itinerary) && tripContext.itinerary.length > 0
    ? `Giorni con attività pianificate: ${tripContext.itinerary.length}`
    : 'Nessuna attività programmata.';

  const expenseSnippet = Array.isArray(tripContext.expenses) && tripContext.expenses.length > 0
    ? `Spese registrate: ${tripContext.expenses.length}`
    : 'Nessuna spesa registrata.';

  return `DATI RILEVANTI:
- ${accommodationSnippet}
- ${transportSnippet}
- ${itinerarySnippet}
- ${expenseSnippet}`;
}

function buildRealTimeSnippet(context: RealTimeContextSnapshot) {
  const lines: string[] = [];
  const updatedTime = formatTime(context.nowIso);

  if (context.currentSection) {
    lines.push(`Sezione attuale: ${context.currentSection.toUpperCase()}`);
  }

  if (context.nextActivity) {
    const activityTime = formatTime(context.nextActivity.startTimeIso);
    const activityDate = context.nextActivity.dayDate ? formatDate(context.nextActivity.dayDate) : '';
    const whenParts = [activityDate, activityTime ? `alle ${activityTime}` : ''].filter(Boolean).join(' ');
    const location = context.nextActivity.location ? ` @ ${context.nextActivity.location}` : '';
    const notes = context.nextActivity.notes ? ` · ${context.nextActivity.notes}` : '';
    lines.push(
      `Prossima attività: ${context.nextActivity.name}${location}${whenParts ? ` (${whenParts.trim()})` : ''}${notes}`
    );
  } else if (context.todaysActivities) {
    lines.push(
      `Attività di oggi: ${context.todaysActivities.count} (${formatDate(context.todaysActivities.dayDate)})`
    );
  }

  if (context.nextTransport) {
    const departureTime = formatTime(context.nextTransport.departureTimeIso);
    const parts = [
      context.nextTransport.type || 'Trasporto',
      context.nextTransport.provider ? `con ${context.nextTransport.provider}` : '',
      context.nextTransport.departureLocation ? `da ${context.nextTransport.departureLocation}` : '',
      context.nextTransport.arrivalLocation ? `→ ${context.nextTransport.arrivalLocation}` : '',
      departureTime ? `alle ${departureTime}` : ''
    ]
      .filter(Boolean)
      .join(' ');
    lines.push(`Prossimo spostamento: ${parts}`);
  }

  if (
    typeof context.outstandingExpenseCount === 'number' &&
    context.outstandingExpenseCount > 0 &&
    typeof context.outstandingExpenseTotal === 'number'
  ) {
    lines.push(
      `Spese da saldare: ${context.outstandingExpenseCount} (${context.outstandingExpenseTotal.toFixed(2)} in valuta viaggio)`
    );
  }

  const preferenceTokens: string[] = [];
  if (context.preferredTravelStyle) {
    preferenceTokens.push(`stile ${context.preferredTravelStyle}`);
  }
  if (context.preferredClimate && context.preferredClimate !== 'any') {
    preferenceTokens.push(`clima ${context.preferredClimate}`);
  }
  if (context.aiTone && context.aiTone !== 'balanced') {
    preferenceTokens.push(`tono AI ${context.aiTone}`);
  }
  if (Array.isArray(context.interestTags) && context.interestTags.length > 0) {
    preferenceTokens.push(`interessi: ${context.interestTags.slice(0, 5).join(', ')}`);
  }

  if (preferenceTokens.length > 0) {
    lines.push(`Preferenze utente: ${preferenceTokens.join(' · ')}`);
  }

  if (lines.length === 0) {
    return '';
  }

  return `CONTESTO IN TEMPO REALE (aggiornato alle ${updatedTime}):
- ${lines.join('\n- ')}`;
}

function buildFocusSnippet(focus?: {
  location?: string;
  locationType?: string;
  cuisinePreferences?: string[];
  serviceKeywords?: string[];
}) {
  if (!focus) return '';

  const parts: string[] = [];

  if (focus.location) {
    const descriptor = focus.locationType === 'airport' ? 'zona aeroporto' : 'località';
    parts.push(`Focus richiesta: ${descriptor} ${focus.location}.`);
  }

  if (focus.cuisinePreferences && focus.cuisinePreferences.length > 0) {
    parts.push(`Preferenza culinaria: ${focus.cuisinePreferences.join(', ')}.`);
  }

  if (focus.serviceKeywords && focus.serviceKeywords.length > 0) {
    parts.push(`Servizio richiesto: ${focus.serviceKeywords.join(', ')}.`);
  }

  if (parts.length === 0) return '';

  return `CONTESTO SPECIFICO DELL'UTENTE:\n${parts.join(' ')}`;
}

function buildInitialResponseGuidelines(tripContext: TripContext, currentSection?: string) {
  const sectionMessage = currentSection
    ? `Concentrati sulla sezione ${currentSection.toUpperCase()} perché l'utente si trova lì.`
    : 'Fornisci un rapido orientamento e invita l’utente a chiedere dettagli.';

  return `MESSAGGIO INIZIALE:
- Presentati in massimo due frasi.
- Evidenzia nome viaggio, date e focus principale.
- Evita saluti generici come "Ciao!".
- ${sectionMessage}
- Chiudi con una domanda proattiva o un invito all'azione.`;
}

function buildStandardResponseGuidelines(intentNames: string, intents: ChatIntent[]) {
  const orderedIntents = intents
    .sort((a, b) => b.confidence - a.confidence)
    .map((intent) => `- ${intentLabel(intent.type)}`);

  return `LINEE GUIDA RISPOSTA:
- Affronta gli intenti richiesti nell'ordine di priorità:\n${orderedIntents.join('\n')}
- Offri suggerimenti concreti e immediatamente utili.
- Se non hai dati diretti (es. ristoranti specifici), proponi alternative personalizzate e collega l'utente ai pulsanti interattivi.
- Non ripetere informazioni già note salvo sia utile al contesto.
- Concludi con un invito all'azione rilevante.`;
}

function getSectionDescription(section?: string) {
  switch (section) {
    case 'expenses':
      return 'L’utente sta gestendo le spese. Dai priorità a budget, riepiloghi e saldi tra partecipanti.';
    case 'itinerary':
      return 'Concentrati sulle attività pianificate, orari e suggerimenti di ottimizzazione.';
    case 'accommodations':
      return 'Metti in evidenza dettagli dell’alloggio, servizi utili e note di check-in/out.';
    case 'transportation':
      return 'Rispondi con dettagli su voli, treni, transfer e suggerimenti logistici.';
    default:
      return '';
  }
}

function formatDate(dateLike?: string) {
  if (!dateLike) return 'data da definire';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return dateLike;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(dateLike?: string | null) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
