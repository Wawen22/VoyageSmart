/**
 * AI Conversation Service
 * Gestisce la logica conversazionale per la raccolta guidata di dati
 */

import {
  ConversationContext,
  AccommodationData,
  AccommodationField,
  getConversationContext,
  updateConversationContext,
  startAccommodationCollection,
  resetConversation,
  getNextField,
  processFieldResponse,
  areRequiredFieldsComplete,
  generateDataSummary,
  ACCOMMODATION_FIELDS_CONFIG
} from './conversationStateService';
import { intelligentParse } from './intelligentParsingService';

export interface ConversationResponse {
  message: string;
  shouldContinue: boolean;
  context?: ConversationContext;
  action?: 'save_accommodation' | 'cancel' | 'retry';
  data?: AccommodationData;
  uiComponent?: 'date_selector' | 'type_selector' | 'currency_selector' | 'confirmation_buttons' | 'data_summary';
  uiProps?: any;
}

/**
 * Analizza il messaggio dell'utente per determinare se vuole aggiungere un accommodation
 */
export function detectAccommodationRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Solo trigger molto specifici per AGGIUNGERE alloggi, non per visualizzarli
  const accommodationTriggers = [
    'aggiungi accommodation', 'aggiungi alloggio', 'aggiungi hotel',
    'nuovo accommodation', 'nuovo alloggio', 'nuovo hotel',
    'crea accommodation', 'crea alloggio', 'crea hotel',
    'inserisci accommodation', 'inserisci alloggio', 'inserisci hotel',
    'prenota hotel', 'prenota alloggio', 'prenotazione hotel',
    'vorrei aggiungere', 'voglio aggiungere', 'devo aggiungere',
    'ho bisogno di aggiungere', 'posso aggiungere'
  ];

  // Controlla se il messaggio contiene trigger di aggiunta E parole relative agli alloggi
  const hasAddTrigger = ['aggiungi', 'nuovo', 'crea', 'inserisci', 'prenota', 'vorrei', 'voglio', 'devo', 'posso'].some(trigger =>
    lowerMessage.includes(trigger)
  );

  const hasAccommodationWord = ['accommodation', 'alloggio', 'hotel', 'sistemazione', 'dormire', 'alloggiare'].some(word =>
    lowerMessage.includes(word)
  );

  const result = hasAddTrigger && hasAccommodationWord;

  // Log solo se il risultato è true per evitare spam
  if (result) {
    console.log('=== detectAccommodationRequest - TRIGGERED ===');
    console.log('Message:', message);
    console.log('Has add trigger:', hasAddTrigger);
    console.log('Has accommodation word:', hasAccommodationWord);
    console.log('Result:', result);
  }

  return result;
}

/**
 * Gestisce la conversazione per la raccolta dati accommodation
 */
export function handleAccommodationConversation(
  message: string,
  tripId: string,
  userId: string
): ConversationResponse {

  console.log('=== handleAccommodationConversation called ===');
  console.log('Message:', message);

  // PRIORITÀ MASSIMA: Gestisci CONFIRM_SAVE_ACCOMMODATION prima di tutto
  if (message === 'CONFIRM_SAVE_ACCOMMODATION') {
    console.log('🚨 CONFIRM_SAVE_ACCOMMODATION detected - processing immediately');
    const context = getConversationContext(tripId, userId);
    if (context) {
      return {
        message: 'Perfetto! Sto salvando l\'alloggio... 💾',
        shouldContinue: false,
        action: 'save_accommodation',
        data: context.data
      };
    }
  }

  // Ottieni il contesto conversazionale corrente
  let context = getConversationContext(tripId, userId);
  console.log('=== Current conversation context ===', context);
  
  // Se non c'è contesto e il messaggio richiede un accommodation, inizia la raccolta
  if (!context && detectAccommodationRequest(message)) {
    console.log('=== Starting new accommodation collection ===');
    context = startAccommodationCollection(tripId, userId);

    // Ottieni il prompt con UI appropriata per il primo campo
    const firstFieldPrompt = getFieldPromptWithUI('name');

    return {
      message: `Perfetto! Ti aiuto ad aggiungere un alloggio al tuo viaggio. 🏨\n\n${firstFieldPrompt.message}`,
      shouldContinue: true,
      context,
      uiComponent: firstFieldPrompt.uiComponent,
      uiProps: firstFieldPrompt.uiProps
    };
  }
  
  // Se non c'è contesto attivo, non gestire (restituisci risposta vuota per permettere API normale)
  if (!context || context.state === 'idle') {
    console.log('=== No active context, not handling - returning empty response ===');
    console.log('Context:', context);
    return {
      message: '',
      shouldContinue: false,
      action: undefined,
      uiComponent: undefined
    };
  }

  console.log('=== Active context found, processing message ===');
  console.log('Context state:', context.state);
  console.log('Current field:', context.currentField);
  console.log('Message to process:', message);
  
  // Gestisci i comandi speciali
  if (message.toLowerCase().trim() === 'annulla' || message.toLowerCase().trim() === 'cancel') {
    resetConversation(tripId, userId);
    return {
      message: 'Operazione annullata. Posso aiutarti con qualcos\'altro?',
      shouldContinue: false,
      action: 'cancel'
    };
  }
  
  // Gestisci lo stato di raccolta dati
  if (context.state === 'collecting_accommodation') {
    return handleDataCollection(message, tripId, userId, context);
  }
  
  // Gestisci lo stato di conferma
  if (context.state === 'confirming_accommodation') {
    return handleConfirmation(message, tripId, userId, context);
  }

  // Gestisci messaggi speciali per il salvataggio (PRIMA di tutto)
  if (message === 'CONFIRM_SAVE_ACCOMMODATION') {
    console.log('=== CONFIRM_SAVE_ACCOMMODATION received ===');
    console.log('Context:', context);

    if (context) {
      console.log('=== Proceeding with direct save ===');
      // Salva direttamente senza ulteriori conferme, indipendentemente dallo stato
      const updatedContext = updateConversationContext(tripId, userId, {
        state: 'saving_accommodation'
      });

      return {
        message: 'Perfetto! Sto salvando l\'alloggio... 💾',
        shouldContinue: false,
        context: updatedContext,
        action: 'save_accommodation',
        data: context.data
      };
    } else {
      console.log('=== No context found for CONFIRM_SAVE_ACCOMMODATION ===');
    }
  }

  if (message === 'CANCEL_ACCOMMODATION') {
    console.log('=== CANCEL_ACCOMMODATION received (should not happen with immediate cancellation) ===');
    // Questo non dovrebbe più essere raggiunto con l'annullamento immediato
    // Ma lo lasciamo come fallback di sicurezza
    resetConversation(tripId, userId);
    return {
      message: 'Operazione annullata. L\'alloggio non è stato salvato. Posso aiutarti con qualcos\'altro?',
      shouldContinue: false,
      action: 'cancel'
    };
  }
  
  return {
    message: 'Stato conversazionale non riconosciuto.',
    shouldContinue: false
  };
}

/**
 * Gestisce la raccolta dei dati campo per campo
 */
function handleDataCollection(
  message: string,
  tripId: string,
  userId: string,
  context: ConversationContext
): ConversationResponse {
  
  if (!context.currentField) {
    // Errore: non dovremmo essere qui senza un campo corrente
    resetConversation(tripId, userId);
    return {
      message: 'Si è verificato un errore. Riprova ad aggiungere l\'alloggio.',
      shouldContinue: false
    };
  }
  
  // Usa il parsing intelligente per interpretare la risposta
  const fieldType = getFieldType(context.currentField);
  console.log('=== Data Collection Debug ===');
  console.log('Current field:', context.currentField);
  console.log('Field type:', fieldType);
  console.log('User message:', message);

  const parseResult = intelligentParse(message, fieldType);
  console.log('Parse result:', parseResult);
  console.log('Parse success:', parseResult.success);
  console.log('Parse value:', parseResult.value);

  if (!parseResult.success) {
    console.log('=== Intelligent parsing failed, trying traditional method ===');
    // Se il parsing intelligente fallisce, prova il metodo tradizionale
    const traditionalResult = processFieldResponse(context.currentField, message);
    console.log('Traditional result:', traditionalResult);

    if (!traditionalResult.isValid) {
      console.log('=== Traditional parsing also failed ===');
      // Incrementa il contatore di retry
      const newRetryCount = context.retryCount + 1;

      if (newRetryCount >= 3) {
        // Troppi tentativi, annulla
        resetConversation(tripId, userId);
        return {
          message: 'Troppi tentativi non validi. Operazione annullata. Riprova quando vuoi!',
          shouldContinue: false,
          action: 'cancel'
        };
      }

      // Aggiorna il contesto con il retry count e offri opzioni UI
      updateConversationContext(tripId, userId, { retryCount: newRetryCount });

      return getFieldPromptWithUI(context.currentField, traditionalResult.error);
    }

    console.log('=== Traditional parsing succeeded, using traditional result ===');
    // Usa il risultato tradizionale se il parsing intelligente fallisce ma quello tradizionale funziona
    parseResult.value = traditionalResult.value;
    parseResult.success = true;
  } else {
    console.log('=== Intelligent parsing succeeded ===');
  }
  
  // Salva il valore nel contesto
  const updatedData = { ...context.data };
  if (parseResult.value !== null) {
    updatedData[context.currentField] = parseResult.value;
  }

  // Se ci sono dati aggiuntivi (es. valuta rilevata insieme al costo), aggiungili
  if (parseResult.additionalData) {
    Object.assign(updatedData, parseResult.additionalData);
  }
  
  const updatedCompletedFields = [...context.completedFields, context.currentField];
  
  // Ottieni il prossimo campo
  const nextField = getNextField(updatedCompletedFields);
  
  if (nextField) {
    // Continua con il prossimo campo
    const nextConfig = ACCOMMODATION_FIELDS_CONFIG[nextField];
    const updatedContext = updateConversationContext(tripId, userId, {
      data: updatedData,
      currentField: nextField,
      completedFields: updatedCompletedFields,
      lastQuestion: nextConfig.question,
      retryCount: 0 // Reset retry count per il nuovo campo
    });

    // Mostra messaggio di conferma con suggerimento se disponibile
    let confirmationMessage = 'Perfetto! ✅';
    if (parseResult.suggestion) {
      confirmationMessage += `\n${parseResult.suggestion}`;
    }

    // Ottieni il prompt con UI appropriata per il prossimo campo
    const nextPrompt = getFieldPromptWithUI(nextField);

    return {
      message: `${confirmationMessage}\n\n${nextPrompt.message}`,
      shouldContinue: true,
      context: updatedContext,
      uiComponent: nextPrompt.uiComponent,
      uiProps: nextPrompt.uiProps
    };
  } else {
    // Tutti i campi completati, passa alla conferma
    const updatedContext = updateConversationContext(tripId, userId, {
      data: updatedData,
      currentField: undefined,
      completedFields: updatedCompletedFields,
      state: 'confirming_accommodation',
      retryCount: 0
    });

    const confirmationMessage = `Ottimo! Ho raccolto tutte le informazioni. Ecco il riepilogo:`;

    return {
      message: confirmationMessage,
      shouldContinue: true,
      context: updatedContext,
      uiComponent: 'data_summary',
      uiProps: { data: updatedData }
    };
  }
}

/**
 * Gestisce la conferma finale prima del salvataggio
 */
function handleConfirmation(
  message: string,
  tripId: string,
  userId: string,
  context: ConversationContext
): ConversationResponse {

  console.log('=== handleConfirmation ===');
  console.log('Message:', message);
  console.log('Context state:', context.state);

  const lowerMessage = message.toLowerCase().trim();
  console.log('Lower message:', lowerMessage);

  // Risposte positive
  const positiveResponses = ['sì', 'si', 'yes', 'ok', 'okay', 'conferma', 'salva', 'va bene', 'perfetto'];
  // Risposte negative
  const negativeResponses = ['no', 'annulla', 'cancel', 'non salvare'];

  console.log('Checking positive responses...');
  if (positiveResponses.some(response => lowerMessage.includes(response))) {
    console.log('=== Positive response detected ===');
    // Conferma positiva - procedi al salvataggio
    const updatedContext = updateConversationContext(tripId, userId, {
      state: 'saving_accommodation'
    });
    
    return {
      message: 'Perfetto! Sto salvando l\'alloggio... 💾',
      shouldContinue: false,
      context: updatedContext,
      action: 'save_accommodation',
      data: context.data
    };
  }
  
  if (negativeResponses.some(response => lowerMessage.includes(response))) {
    // Conferma negativa - annulla
    resetConversation(tripId, userId);
    return {
      message: 'Operazione annullata. L\'alloggio non è stato salvato. Posso aiutarti con qualcos\'altro?',
      shouldContinue: false,
      action: 'cancel'
    };
  }
  
  // Risposta non chiara - chiedi di nuovo
  return {
    message: 'Non ho capito la tua risposta. Scrivi "sì" per confermare e salvare l\'alloggio, oppure "annulla" per annullare l\'operazione.',
    shouldContinue: true,
    context
  };
}

/**
 * Completa la conversazione dopo il salvataggio
 */
export function completeAccommodationConversation(
  tripId: string,
  userId: string,
  success: boolean,
  error?: string
): ConversationResponse {
  
  resetConversation(tripId, userId);
  
  if (success) {
    return {
      message: '🎉 Alloggio aggiunto con successo! Puoi visualizzarlo nella sezione Accommodations del tuo viaggio.',
      shouldContinue: false
    };
  } else {
    return {
      message: `❌ Si è verificato un errore durante il salvataggio: ${error || 'Errore sconosciuto'}. Riprova più tardi.`,
      shouldContinue: false
    };
  }
}

/**
 * Ottiene lo stato corrente della conversazione per debug
 */
export function getConversationStatus(tripId: string, userId: string): {
  hasActiveConversation: boolean;
  state?: string;
  currentField?: string;
  completedFields?: string[];
} {
  const context = getConversationContext(tripId, userId);

  if (!context) {
    return { hasActiveConversation: false };
  }

  return {
    hasActiveConversation: true,
    state: context.state,
    currentField: context.currentField,
    completedFields: context.completedFields
  };
}

/**
 * Ottiene il tipo di campo per il parsing intelligente
 */
function getFieldType(field: AccommodationField): string {
  switch (field) {
    case 'check_in_date':
    case 'check_out_date':
      return 'date';
    case 'type':
      return 'accommodation_type';
    case 'currency':
      return 'currency';
    case 'cost':
      return 'number';
    case 'contact_info':
      return 'contact';
    default:
      return 'text';
  }
}

/**
 * Genera un prompt con componenti UI appropriati per il campo
 */
function getFieldPromptWithUI(field: AccommodationField, error?: string): ConversationResponse {
  const config = ACCOMMODATION_FIELDS_CONFIG[field];
  let message = error ? `${error}\n\n` : '';

  switch (field) {
    case 'check_in_date':
      message += 'Seleziona la data di check-in:';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'date_selector',
          mainProps: { label: 'Data Check-in' }
        }
      };

    case 'check_out_date':
      message += 'Seleziona la data di check-out:';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'date_selector',
          mainProps: { label: 'Data Check-out' }
        }
      };

    case 'type':
      message += 'Seleziona il tipo di alloggio:';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'type_selector',
          mainProps: {}
        }
      };

    case 'currency':
      message += 'Seleziona la valuta:';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'currency_selector',
          mainProps: {}
        }
      };

    default:
      message += config.question;
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: config.question }
        }
      };
  }
}
