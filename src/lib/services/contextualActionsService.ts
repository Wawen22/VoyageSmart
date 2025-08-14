// Server-side version - no client component imports
export interface ContextualAction {
  id: string;
  type: 'link' | 'action';
  label: string;
  description: string;
  icon: string; // Icon name as string instead of component
  href?: string;
  onClick?: string; // Action name as string instead of function
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface ContextAnalysis {
  categories: string[];
  confidence: number;
  suggestedActions: ContextualAction[];
  reasoning: string;
}

// Server-side action creators (return data only, no React components)
function createExpensesActionsServer(tripId: string): ContextualAction[] {
  return [
    {
      id: 'view-expenses',
      type: 'link',
      label: 'Vedi Spese',
      description: 'Visualizza tutte le spese del viaggio',
      icon: 'Receipt',
      href: `/trips/${tripId}/expenses`,
      variant: 'primary'
    },
    {
      id: 'add-expense',
      type: 'link',
      label: 'Aggiungi Spesa',
      description: 'Registra una nuova spesa',
      icon: 'Plus',
      href: `/trips/${tripId}/expenses?action=add`,
      variant: 'secondary'
    }
  ];
}

function createBalancesActionsServer(tripId: string): ContextualAction[] {
  return [
    {
      id: 'view-balances',
      type: 'link',
      label: 'Vedi Saldi',
      description: 'Controlla chi deve pagare e chi deve ricevere',
      icon: 'BarChart3',
      href: `/trips/${tripId}/expenses?tab=balances`,
      variant: 'primary'
    },
    {
      id: 'settle-expenses',
      type: 'action',
      label: 'Salda Spese',
      description: 'Segna i pagamenti come completati',
      icon: 'CheckCircle',
      onClick: 'settle-expenses',
      variant: 'secondary'
    }
  ];
}

function createItineraryActionsServer(tripId: string): ContextualAction[] {
  return [
    {
      id: 'view-itinerary',
      type: 'link',
      label: 'Vedi Itinerario',
      description: 'Visualizza il programma del viaggio',
      icon: 'Calendar',
      href: `/trips/${tripId}/itinerary`,
      variant: 'primary'
    },
    {
      id: 'add-activity',
      type: 'link',
      label: 'Aggiungi Attività',
      description: 'Pianifica una nuova attività',
      icon: 'Plus',
      href: `/trips/${tripId}/itinerary?action=add`,
      variant: 'secondary'
    }
  ];
}

function createAccommodationsActionsServer(tripId: string): ContextualAction[] {
  return [
    {
      id: 'view-accommodations',
      type: 'link',
      label: 'Vedi Alloggi',
      description: 'Visualizza gli alloggi prenotati',
      icon: 'Building2',
      href: `/trips/${tripId}/accommodations`,
      variant: 'primary'
    },
    {
      id: 'add-accommodation',
      type: 'link',
      label: 'Aggiungi Alloggio',
      description: 'Registra un nuovo alloggio',
      icon: 'Plus',
      href: `/trips/${tripId}/accommodations?action=add`,
      variant: 'secondary'
    }
  ];
}

function createTransportationActionsServer(tripId: string): ContextualAction[] {
  return [
    {
      id: 'view-transportation',
      type: 'link',
      label: 'Vedi Trasporti',
      description: 'Visualizza i trasporti prenotati',
      icon: 'Car',
      href: `/trips/${tripId}/transportation`,
      variant: 'primary'
    },
    {
      id: 'add-transportation',
      type: 'link',
      label: 'Aggiungi Trasporto',
      description: 'Registra un nuovo trasporto',
      icon: 'Plus',
      href: `/trips/${tripId}/transportation?action=add`,
      variant: 'secondary'
    }
  ];
}

function createTripOverviewActionsServer(tripId: string): ContextualAction[] {
  return [
    {
      id: 'trip-overview',
      type: 'link',
      label: 'Panoramica Viaggio',
      description: 'Torna alla panoramica del viaggio',
      icon: 'MapPin',
      href: `/trips/${tripId}`,
      variant: 'primary'
    }
  ];
}

// Keywords for different categories
const EXPENSE_KEYWORDS = [
  'spese', 'spesa', 'costo', 'costi', 'budget', 'soldi', 'euro', 'dollari',
  'pagato', 'quanto ho speso', 'quanto abbiamo speso', 'chi ha pagato',
  'bilancio', 'economia', 'economico', 'costoso', 'prezzo', 'prezzi',
  'fattura', 'ricevuta', 'ricevute', 'conto', 'conti'
];

const BALANCE_KEYWORDS = [
  'saldo', 'saldi', 'debito', 'debiti', 'rimborso', 'rimborsi',
  'chi deve pagare', 'spese da saldare', 'spese non saldate', 'spese in sospeso',
  'non saldato', 'da pagare', 'deve pagare', 'deve ricevere', 'bilanci',
  'pareggio', 'divisione', 'pagamenti', 'settlement'
];

const ITINERARY_KEYWORDS = [
  'itinerario', 'programma', 'attività', 'cosa facciamo', 'cosa fare',
  'pianificazione', 'piano', 'schedule', 'agenda', 'giorno', 'giorni',
  'mattina', 'pomeriggio', 'sera', 'orario', 'orari', 'tempo',
  'visita', 'visite', 'tour', 'escursione', 'escursioni',
  'attrazioni', 'attrazione', 'museo', 'musei', 'monumento', 'monumenti',
  'cosa c\'è in programma', 'programma del giorno', 'attività pianificate'
];

const ACCOMMODATION_KEYWORDS = [
  'alloggio', 'alloggi', 'hotel', 'albergo', 'dove dormiamo', 'dove dormire',
  'camera', 'camere', 'stanza', 'stanze', 'prenotazione', 'prenotazioni',
  'check-in', 'check-out', 'checkin', 'checkout', 'arrivo', 'partenza',
  'bed and breakfast', 'b&b', 'ostello', 'appartamento', 'casa',
  'resort', 'pensione', 'villa', 'agriturismo'
];

const TRANSPORTATION_KEYWORDS = [
  'trasporto', 'trasporti', 'viaggio', 'viaggi', 'volo', 'voli', 'aereo',
  'treno', 'treni', 'bus', 'autobus', 'auto', 'macchina', 'taxi',
  'metro', 'metropolitana', 'nave', 'traghetto', 'aeroporto',
  'stazione', 'partenza', 'arrivo', 'orario', 'orari', 'biglietto', 'biglietti',
  'come arriviamo', 'come andiamo', 'mezzi di trasporto'
];

const OVERVIEW_KEYWORDS = [
  'panoramica', 'riassunto', 'generale', 'tutto', 'completo', 'totale',
  'informazioni', 'dettagli', 'descrizione', 'presentazione',
  'cosa include', 'cosa comprende', 'overview', 'summary'
];

/**
 * Analyzes a message to determine contextual actions
 */
export function analyzeMessageContext(message: string, tripId: string, currentSection?: string, tripData?: any): ContextAnalysis {
  try {
    console.log('=== analyzeMessageContext called ===');
    console.log('Message:', message);
    console.log('TripId:', tripId);
    console.log('CurrentSection:', currentSection);

    // Validate inputs
    if (!message || typeof message !== 'string') {
      console.log('Invalid message input');
      return {
        categories: [],
        confidence: 0,
        suggestedActions: [],
        reasoning: 'Invalid message input'
      };
    }

    if (!tripId || typeof tripId !== 'string') {
      console.log('Invalid tripId input');
      return {
        categories: [],
        confidence: 0,
        suggestedActions: [],
        reasoning: 'Invalid tripId input'
      };
    }

    const lowerMessage = message.toLowerCase();
    const categories: string[] = [];
    const suggestedActions: ContextualAction[] = [];
    let totalConfidence = 0;

  // Check for balance-related content first (more specific)
  const balanceMatches = BALANCE_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  console.log('Balance matches:', balanceMatches);
  if (balanceMatches.length > 0) {
    categories.push('balances');
    console.log('Creating balance actions for tripId:', tripId);
    try {
      // Create balance actions using server-side function
      const balanceActions = createBalancesActionsServer(tripId);
      console.log('Created balance actions:', balanceActions);
      if (Array.isArray(balanceActions)) {
        suggestedActions.push(...balanceActions);
      } else {
        console.log('createBalancesActionsServer did not return an array');
      }
    } catch (actionError) {
      console.error('Error creating balance actions:', actionError);
    }
    totalConfidence += Math.min(balanceMatches.length * 0.3, 1.0); // Higher confidence for balance-specific queries
  }

  // Check for general expense-related content
  const expenseMatches = EXPENSE_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  console.log('Expense matches:', expenseMatches);
  if (expenseMatches.length > 0 && balanceMatches.length === 0) { // Only if no balance matches
    categories.push('expenses');
    console.log('Creating expense actions for tripId:', tripId);
    try {
      // Use server-side expense actions
      const expenseActions = createExpensesActionsServer(tripId);
      console.log('Created expense actions:', expenseActions);
      if (Array.isArray(expenseActions)) {
        suggestedActions.push(...expenseActions);
      } else {
        console.log('createExpensesActionsServer did not return an array');
      }
    } catch (actionError) {
      console.error('Error creating expense actions:', actionError);
    }
    totalConfidence += Math.min(expenseMatches.length * 0.2, 1.0);
  }

  // Check for itinerary-related content
  const itineraryMatches = ITINERARY_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  if (itineraryMatches.length > 0) {
    categories.push('itinerary');
    try {
      const itineraryActions = createItineraryActionsServer(tripId);
      if (Array.isArray(itineraryActions)) {
        suggestedActions.push(...itineraryActions);
      }
    } catch (actionError) {
      console.error('Error creating itinerary actions:', actionError);
    }
    totalConfidence += Math.min(itineraryMatches.length * 0.2, 1.0);
  }

  // Check for accommodation-related content
  const accommodationMatches = ACCOMMODATION_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  if (accommodationMatches.length > 0) {
    categories.push('accommodations');
    try {
      const accommodationActions = createAccommodationsActionsServer(tripId);
      if (Array.isArray(accommodationActions)) {
        suggestedActions.push(...accommodationActions);
      }
    } catch (actionError) {
      console.error('Error creating accommodation actions:', actionError);
    }
    totalConfidence += Math.min(accommodationMatches.length * 0.2, 1.0);
  }

  // Check for transportation-related content
  const transportationMatches = TRANSPORTATION_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  if (transportationMatches.length > 0) {
    categories.push('transportation');
    try {
      const transportationActions = createTransportationActionsServer(tripId);
      if (Array.isArray(transportationActions)) {
        suggestedActions.push(...transportationActions);
      }
    } catch (actionError) {
      console.error('Error creating transportation actions:', actionError);
    }
    totalConfidence += Math.min(transportationMatches.length * 0.2, 1.0);
  }

  // Check for overview-related content
  const overviewMatches = OVERVIEW_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  if (overviewMatches.length > 0 || categories.length === 0) {
    categories.push('overview');
    try {
      const overviewActions = createTripOverviewActionsServer(tripId);
      if (Array.isArray(overviewActions)) {
        suggestedActions.push(...overviewActions);
      }
    } catch (actionError) {
      console.error('Error creating overview actions:', actionError);
    }
    totalConfidence += Math.min(overviewMatches.length * 0.15, 0.5);
  }

  // Boost confidence if user is already in a relevant section
  if (currentSection && categories.includes(currentSection)) {
    totalConfidence += 0.3;
  }

  // Remove duplicates and prioritize actions
  const uniqueActions = removeDuplicateActions(suggestedActions);
  const prioritizedActions = prioritizeActions(uniqueActions, categories, currentSection);

  // Generate reasoning
  const reasoning = generateReasoning(categories, balanceMatches, expenseMatches, itineraryMatches, accommodationMatches, transportationMatches, overviewMatches);

  const result = {
    categories,
    confidence: Math.min(totalConfidence, 1.0),
    suggestedActions: prioritizedActions.slice(0, 4), // Limit to 4 actions
    reasoning
  };

  console.log('=== analyzeMessageContext result ===');
  console.log('Result:', result);

  return result;
  } catch (error) {
    console.error('Error in analyzeMessageContext:', error);
    // Return a safe default object
    return {
      categories: [],
      confidence: 0,
      suggestedActions: [],
      reasoning: 'Error occurred during analysis'
    };
  }
}

/**
 * Removes duplicate actions based on ID
 */
function removeDuplicateActions(actions: ContextualAction[]): ContextualAction[] {
  const seen = new Set<string>();
  return actions.filter(action => {
    if (seen.has(action.id)) {
      return false;
    }
    seen.add(action.id);
    return true;
  });
}

/**
 * Prioritizes actions based on context and current section
 */
function prioritizeActions(actions: ContextualAction[], categories: string[], currentSection?: string): ContextualAction[] {
  return actions.sort((a, b) => {
    // Primary actions first
    if (a.variant === 'primary' && b.variant !== 'primary') return -1;
    if (b.variant === 'primary' && a.variant !== 'primary') return 1;

    // Actions related to current section get priority
    if (currentSection) {
      const aRelevant = isActionRelevantToSection(a, currentSection);
      const bRelevant = isActionRelevantToSection(b, currentSection);
      if (aRelevant && !bRelevant) return -1;
      if (bRelevant && !aRelevant) return 1;
    }

    // Actions related to detected categories get priority
    const aCategory = getActionCategory(a);
    const bCategory = getActionCategory(b);
    const aCategoryRelevant = aCategory && categories.includes(aCategory);
    const bCategoryRelevant = bCategory && categories.includes(bCategory);
    
    if (aCategoryRelevant && !bCategoryRelevant) return -1;
    if (bCategoryRelevant && !aCategoryRelevant) return 1;

    return 0;
  });
}

/**
 * Checks if an action is relevant to the current section
 */
function isActionRelevantToSection(action: ContextualAction, section: string): boolean {
  const actionCategory = getActionCategory(action);
  return actionCategory === section;
}

/**
 * Gets the category of an action based on its ID
 */
function getActionCategory(action: ContextualAction): string | null {
  if (action.id.includes('balance')) return 'balances';
  if (action.id.includes('expense')) return 'expenses';
  if (action.id.includes('itinerary') || action.id.includes('calendar')) return 'itinerary';
  if (action.id.includes('accommodation')) return 'accommodations';
  if (action.id.includes('transportation')) return 'transportation';
  if (action.id.includes('overview') || action.id.includes('trip')) return 'overview';
  return null;
}

/**
 * Generates reasoning for the context analysis
 */
function generateReasoning(
  categories: string[],
  balanceMatches: string[],
  expenseMatches: string[],
  itineraryMatches: string[],
  accommodationMatches: string[],
  transportationMatches: string[],
  overviewMatches: string[]
): string {
  const reasons: string[] = [];

  if (balanceMatches.length > 0) {
    reasons.push(`Rilevate ${balanceMatches.length} parole chiave relative ai saldi e pagamenti`);
  }
  if (expenseMatches.length > 0) {
    reasons.push(`Rilevate ${expenseMatches.length} parole chiave relative alle spese`);
  }
  if (itineraryMatches.length > 0) {
    reasons.push(`Rilevate ${itineraryMatches.length} parole chiave relative all'itinerario`);
  }
  if (accommodationMatches.length > 0) {
    reasons.push(`Rilevate ${accommodationMatches.length} parole chiave relative agli alloggi`);
  }
  if (transportationMatches.length > 0) {
    reasons.push(`Rilevate ${transportationMatches.length} parole chiave relative ai trasporti`);
  }
  if (overviewMatches.length > 0) {
    reasons.push(`Rilevate ${overviewMatches.length} parole chiave relative alla panoramica`);
  }

  if (reasons.length === 0) {
    return 'Nessuna categoria specifica rilevata, suggerisco azioni generali';
  }

  return reasons.join(', ');
}

/**
 * Creates contextual actions based on AI response content
 */
export function createActionsFromResponse(responseText: string, tripId: string): ContextualAction[] {
  const analysis = analyzeMessageContext(responseText, tripId);
  return analysis.suggestedActions;
}

/**
 * Formats contextual actions for inclusion in AI responses
 */
export function formatActionsForResponse(actions: ContextualAction[]): string {
  if (actions.length === 0) return '';

  const actionsList = actions.map(action => {
    const actionType = action.type === 'link' ? 'link' : 'action';
    return `${action.label}|${actionType}|${action.href || ''}|${action.description || ''}`;
  }).join(';;');

  return `[CONTEXTUAL_ACTIONS:${actionsList}]`;
}
