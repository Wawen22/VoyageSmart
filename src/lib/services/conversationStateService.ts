/**
 * Conversation State Management Service
 * Gestisce gli stati conversazionali per la raccolta guidata di dati
 */

export type ConversationState = 
  | 'idle'
  | 'collecting_accommodation'
  | 'confirming_accommodation'
  | 'saving_accommodation';

export type AccommodationField = 
  | 'name'
  | 'type'
  | 'check_in_date'
  | 'check_out_date'
  | 'address'
  | 'booking_reference'
  | 'contact_info'
  | 'cost'
  | 'currency'
  | 'notes';

export interface AccommodationData {
  name?: string;
  type?: string;
  check_in_date?: string;
  check_out_date?: string;
  address?: string;
  booking_reference?: string;
  contact_info?: string;
  cost?: number;
  currency?: string;
  notes?: string;
}

export interface ConversationContext {
  state: ConversationState;
  currentField?: AccommodationField;
  data: AccommodationData;
  tripId: string;
  completedFields: AccommodationField[];
  lastQuestion?: string;
  retryCount: number;
}

// In-memory storage per gli stati conversazionali (in produzione si potrebbe usare Redis)
const conversationStates = new Map<string, ConversationContext>();

/**
 * Inizializza un nuovo contesto conversazionale
 */
export function initializeConversation(tripId: string, userId: string): ConversationContext {
  const contextKey = `${tripId}-${userId}`;
  
  const context: ConversationContext = {
    state: 'idle',
    data: {},
    tripId,
    completedFields: [],
    retryCount: 0
  };
  
  conversationStates.set(contextKey, context);
  return context;
}

/**
 * Ottiene il contesto conversazionale corrente
 */
export function getConversationContext(tripId: string, userId: string): ConversationContext | null {
  const contextKey = `${tripId}-${userId}`;
  return conversationStates.get(contextKey) || null;
}

/**
 * Aggiorna il contesto conversazionale
 */
export function updateConversationContext(
  tripId: string, 
  userId: string, 
  updates: Partial<ConversationContext>
): ConversationContext {
  const contextKey = `${tripId}-${userId}`;
  const currentContext = conversationStates.get(contextKey);
  
  if (!currentContext) {
    throw new Error('Conversation context not found');
  }
  
  const updatedContext = { ...currentContext, ...updates };
  conversationStates.set(contextKey, updatedContext);
  
  return updatedContext;
}

/**
 * Resetta il contesto conversazionale
 */
export function resetConversation(tripId: string, userId: string): void {
  const contextKey = `${tripId}-${userId}`;
  conversationStates.delete(contextKey);
}

/**
 * Avvia la raccolta dati per un accommodation
 */
export function startAccommodationCollection(tripId: string, userId: string): ConversationContext {
  const context = initializeConversation(tripId, userId);
  
  return updateConversationContext(tripId, userId, {
    state: 'collecting_accommodation',
    currentField: 'name',
    lastQuestion: 'Come si chiama l\'alloggio che vuoi aggiungere?'
  });
}

/**
 * Definisce l'ordine e le proprietà dei campi da raccogliere
 */
export const ACCOMMODATION_FIELDS_CONFIG: Record<AccommodationField, {
  required: boolean;
  question: string;
  validation?: (value: string) => boolean;
  parser?: (value: string) => any;
}> = {
  name: {
    required: true,
    question: 'Come si chiama l\'alloggio?',
    validation: (value) => value.trim().length > 0
  },
  type: {
    required: true,
    question: 'Che tipo di alloggio è? (hotel, apartment, hostel, house, villa, resort, camping, other)',
    validation: (value) => {
      const validTypes = ['hotel', 'apartment', 'hostel', 'house', 'villa', 'resort', 'camping', 'other'];
      const isValid = validTypes.includes(value.toLowerCase());
      console.log('=== Type validation ===');
      console.log('Value:', value);
      console.log('Lowercase:', value.toLowerCase());
      console.log('Valid types:', validTypes);
      console.log('Is valid:', isValid);
      return isValid;
    },
    parser: (value) => {
      const parsed = value.toLowerCase();
      console.log('=== Type parser ===');
      console.log('Input:', value);
      console.log('Parsed:', parsed);
      return parsed;
    }
  },
  check_in_date: {
    required: false,
    question: 'Qual è la data di check-in? (formato: YYYY-MM-DD o lascia vuoto per saltare)',
    validation: (value) => {
      if (!value.trim()) return true; // Optional field
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value) && !isNaN(Date.parse(value));
    }
  },
  check_out_date: {
    required: false,
    question: 'Qual è la data di check-out? (formato: YYYY-MM-DD o lascia vuoto per saltare)',
    validation: (value) => {
      if (!value.trim()) return true; // Optional field
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value) && !isNaN(Date.parse(value));
    }
  },
  address: {
    required: false,
    question: 'Qual è l\'indirizzo dell\'alloggio? (o lascia vuoto per saltare)',
    validation: (value) => true // Always valid, optional field
  },
  booking_reference: {
    required: false,
    question: 'Hai un numero di prenotazione o riferimento? (o lascia vuoto per saltare)',
    validation: (value) => true // Always valid, optional field
  },
  contact_info: {
    required: false,
    question: 'Hai informazioni di contatto (telefono, email)? (o lascia vuoto per saltare)',
    validation: (value) => true // Always valid, optional field
  },
  cost: {
    required: false,
    question: 'Qual è il costo totale? (solo il numero, o lascia vuoto per saltare)',
    validation: (value) => {
      if (!value.trim()) return true; // Optional field
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    },
    parser: (value) => value.trim() ? parseFloat(value) : undefined
  },
  currency: {
    required: false,
    question: 'In che valuta? (EUR, USD, GBP, etc. - default: EUR)',
    validation: (value) => {
      console.log('=== Currency validation ===');
      console.log('Value:', value);
      console.log('Always returning true (currency is optional)');
      return true; // Always valid, will default to EUR
    },
    parser: (value) => {
      const parsed = value.trim().toUpperCase() || 'EUR';
      console.log('=== Currency parser ===');
      console.log('Input:', value);
      console.log('Parsed:', parsed);
      return parsed;
    }
  },
  notes: {
    required: false,
    question: 'Hai note aggiuntive da aggiungere? (o lascia vuoto per finire)',
    validation: (value) => true // Always valid, optional field
  }
};

/**
 * Ottiene il prossimo campo da raccogliere
 */
export function getNextField(completedFields: AccommodationField[]): AccommodationField | null {
  const allFields: AccommodationField[] = [
    'name', 'type', 'check_in_date', 'check_out_date', 'address', 
    'booking_reference', 'contact_info', 'cost', 'currency', 'notes'
  ];
  
  return allFields.find(field => !completedFields.includes(field)) || null;
}

/**
 * Valida e processa la risposta dell'utente per il campo corrente
 */
export function processFieldResponse(
  field: AccommodationField,
  response: string
): { isValid: boolean; value: any; error?: string } {
  const config = ACCOMMODATION_FIELDS_CONFIG[field];

  console.log('=== processFieldResponse ===');
  console.log('Field:', field);
  console.log('Response:', response);
  console.log('Config:', config);

  // Se il campo è opzionale e la risposta è vuota, è valido
  if (!config.required && !response.trim()) {
    console.log('Field is optional and response is empty, returning valid');
    return { isValid: true, value: null };
  }

  // Se il campo è obbligatorio e la risposta è vuota, non è valido
  if (config.required && !response.trim()) {
    console.log('Field is required but response is empty, returning invalid');
    return {
      isValid: false,
      value: null,
      error: 'Questo campo è obbligatorio.'
    };
  }

  // Valida la risposta
  if (config.validation && !config.validation(response)) {
    console.log('Validation failed for response:', response);
    return {
      isValid: false,
      value: null,
      error: 'Il formato della risposta non è valido.'
    };
  }

  // Processa il valore se c'è un parser
  const value = config.parser ? config.parser(response) : response.trim() || null;
  console.log('Processed value:', value);

  return { isValid: true, value };
}

/**
 * Verifica se tutti i campi obbligatori sono stati completati
 */
export function areRequiredFieldsComplete(data: AccommodationData): boolean {
  const requiredFields = Object.entries(ACCOMMODATION_FIELDS_CONFIG)
    .filter(([_, config]) => config.required)
    .map(([field, _]) => field as AccommodationField);
  
  return requiredFields.every(field => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Genera un riepilogo dei dati raccolti per la conferma
 */
export function generateDataSummary(data: AccommodationData): string {
  const lines: string[] = [];
  
  if (data.name) lines.push(`📍 **Nome**: ${data.name}`);
  if (data.type) lines.push(`🏠 **Tipo**: ${data.type}`);
  if (data.check_in_date) lines.push(`📅 **Check-in**: ${data.check_in_date}`);
  if (data.check_out_date) lines.push(`📅 **Check-out**: ${data.check_out_date}`);
  if (data.address) lines.push(`🗺️ **Indirizzo**: ${data.address}`);
  if (data.booking_reference) lines.push(`🎫 **Prenotazione**: ${data.booking_reference}`);
  if (data.contact_info) lines.push(`📞 **Contatti**: ${data.contact_info}`);
  if (data.cost) lines.push(`💰 **Costo**: ${data.cost} ${data.currency || 'EUR'}`);
  if (data.notes) lines.push(`📝 **Note**: ${data.notes}`);
  
  return lines.join('\n');
}
