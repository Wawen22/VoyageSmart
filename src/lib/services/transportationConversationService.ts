/**
 * Transportation Conversation Service
 * Gestisce la conversazione guidata per l'aggiunta di trasporti
 */

import {
  ConversationContext,
  TransportationData,
  TransportationField,
  getConversationContext,
  createConversationContext,
  updateConversationContext,
  resetConversation
} from './conversationStateService';
import { parseTransportationMultiField, intelligentParse } from './intelligentParsingService';
import { logger } from '../logger';

export interface ConversationResponse {
  message: string;
  shouldContinue: boolean;
  context?: ConversationContext;
  uiComponent?: string;
  uiProps?: any;
  action?: string;
  data?: any;
}

/**
 * Rileva se il messaggio richiede l'aggiunta di un trasporto
 */
export function detectTransportationRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Trigger specifici per AGGIUNGERE trasporti
  const addTriggers = ['aggiungi', 'nuovo', 'crea', 'inserisci', 'prenota', 'vorrei', 'voglio', 'devo', 'posso', 'ho bisogno'];
  const hasAddTrigger = addTriggers.some(trigger => lowerMessage.includes(trigger));

  // Parole relative ai trasporti (incluso "mezzo")
  const transportationWords = [
    'trasporto', 'volo', 'treno', 'autobus', 'bus', 'macchina', 'auto', 'viaggio',
    'mezzo', 'aereo', 'automobile', 'veicolo', 'spostamento', 'movimento'
  ];
  const hasTransportationWord = transportationWords.some(word => lowerMessage.includes(word));

  // Frasi specifiche che dovrebbero sempre essere rilevate
  const specificPhrases = [
    'mezzo di trasporto',
    'aggiungere un trasporto',
    'nuovo trasporto',
    'inserire trasporto'
  ];
  const hasSpecificPhrase = specificPhrases.some(phrase => lowerMessage.includes(phrase));

  const result = (hasAddTrigger && hasTransportationWord) || hasSpecificPhrase;

  logger.debug('detectTransportationRequest', {
    message,
    lowerMessage,
    hasAddTrigger,
    hasTransportationWord,
    hasSpecificPhrase,
    result,
    matchedTriggers: addTriggers.filter(t => lowerMessage.includes(t)),
    matchedWords: transportationWords.filter(w => lowerMessage.includes(w)),
    matchedPhrases: specificPhrases.filter(p => lowerMessage.includes(p))
  });

  return result;
}

/**
 * Avvia la raccolta dati per un nuovo trasporto
 */
export function startTransportationCollection(tripId: string, userId: string): ConversationContext {
  const context: ConversationContext = {
    state: 'collecting_transportation',
    currentField: 'type' as TransportationField,
    data: {} as TransportationData,
    tripId,
    completedFields: [] as TransportationField[],
    retryCount: 0
  };

  // Crea il nuovo contesto
  return createConversationContext(tripId, userId, context);
}

/**
 * Gestisce la conversazione per la raccolta dati trasporti
 */
export function handleTransportationConversation(
  message: string,
  tripId: string,
  userId: string
): ConversationResponse {
  
  logger.debug('handleTransportationConversation called', { message, tripId, userId });
  
  // PRIORITÀ MASSIMA: Gestisci CONFIRM_SAVE_TRANSPORTATION prima di tutto
  if (message === 'CONFIRM_SAVE_TRANSPORTATION') {
    logger.info('CONFIRM_SAVE_TRANSPORTATION detected - processing immediately', { tripId, userId });
    const context = getConversationContext(tripId, userId);
    if (context) {
      return {
        message: 'Perfetto! Sto salvando il trasporto... 🚗',
        shouldContinue: false,
        action: 'save_transportation',
        data: context.data
      };
    }
  }
  
  // Ottieni il contesto conversazionale corrente
  let context = getConversationContext(tripId, userId);
  console.log('=== Current conversation context ===', context);
  
  // Se non c'è contesto e il messaggio richiede un trasporto, inizia la raccolta
  if (!context && detectTransportationRequest(message)) {
    console.log('=== Starting new transportation collection ===');
    console.log('No existing context found, creating new one');
    
    // Prova il parsing multi-campo PRIMA di iniziare la raccolta guidata
    const multiFieldData = parseTransportationMultiField(message);
    console.log('=== Multi-field parsing result ===', multiFieldData);
    
    context = startTransportationCollection(tripId, userId);
    
    // Se abbiamo interpretato dei dati, aggiornali nel contesto
    if (Object.keys(multiFieldData).length > 0) {
      context.data = { ...context.data, ...multiFieldData };
      updateConversationContext(tripId, userId, context);
      
      // Mostra una card riassuntiva con i dati interpretati
      return {
        message: `Perfetto! Ho interpretato questi dettagli dal tuo messaggio. Conferma se sono corretti e procediamo con gli eventuali campi mancanti:`,
        shouldContinue: true,
        context,
        uiComponent: 'transportation_summary_with_continue',
        uiProps: { 
          data: multiFieldData,
          isPartial: true // Indica che potrebbero mancare dei campi
        }
      };
    } else {
      // Nessun dato interpretato, inizia la raccolta guidata normale
      const firstFieldPrompt = getTransportationFieldPromptWithUI('type');
      return {
        message: `Perfetto! Ti aiuto ad aggiungere un trasporto al tuo viaggio. 🚗\n\n${firstFieldPrompt.message}`,
        shouldContinue: true,
        context,
        uiComponent: firstFieldPrompt.uiComponent,
        uiProps: firstFieldPrompt.uiProps
      };
    }
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
  
  // Gestisci messaggi speciali per il salvataggio (PRIMA di controllare lo stato)
  if (message === 'CONFIRM_SAVE_TRANSPORTATION') {
    console.log('=== CONFIRM_SAVE_TRANSPORTATION received ===');
    console.log('Context:', context);
    
    if (context) {
      console.log('=== Proceeding with direct save ===');
      const updatedContext = updateConversationContext(tripId, userId, {
        state: 'saving_transportation'
      });
      
      return {
        message: 'Perfetto! Sto salvando il trasporto... 🚗',
        shouldContinue: false,
        context: updatedContext,
        action: 'save_transportation',
        data: context.data
      };
    } else {
      console.log('=== No context found for CONFIRM_SAVE_TRANSPORTATION ===');
    }
  }
  
  if (message === 'CANCEL_TRANSPORTATION') {
    console.log('=== CANCEL_TRANSPORTATION received (should not happen with immediate cancellation) ===');
    resetConversation(tripId, userId);
    return {
      message: 'Operazione annullata. Il trasporto non è stato salvato. Posso aiutarti con qualcos\'altro?',
      shouldContinue: false,
      action: 'cancel'
    };
  }
  
  // Se siamo in modalità conferma dei dati parziali
  if (message === 'CONTINUE_WITH_PARTIAL_DATA') {
    console.log('=== User confirmed partial data, continuing with missing fields ===');
    
    // Trova il prossimo campo mancante
    const nextField = findNextMissingField(context.data);
    if (nextField) {
      const updatedContext = updateConversationContext(tripId, userId, {
        currentField: nextField
      });
      
      const nextPrompt = getTransportationFieldPromptWithUI(nextField);
      return {
        message: nextPrompt.message,
        shouldContinue: true,
        context: updatedContext,
        uiComponent: nextPrompt.uiComponent,
        uiProps: nextPrompt.uiProps
      };
    } else {
      // Tutti i campi sono completi, vai al riepilogo finale
      return showFinalSummary(context, tripId, userId);
    }
  }
  
  // Continua con la logica normale di raccolta dati
  if (context.state === 'collecting_transportation') {
    console.log('=== Processing field data ===');
    console.log('Current field:', context.currentField);
    console.log('User message:', message);

    // Usa il parsing intelligente per interpretare la risposta
    const fieldType = getTransportationFieldType(context.currentField!);
    console.log('=== Transportation Data Collection Debug ===');
    console.log('Current field:', context.currentField);
    console.log('Field type:', fieldType);
    console.log('User message:', message);

    const parseResult = intelligentParse(message, fieldType);
    console.log('Parse result:', parseResult);
    console.log('Parse success:', parseResult.success);
    console.log('Parse value:', parseResult.value);

    if (parseResult.success && parseResult.value) {
      // Salva il valore nel contesto
      const updatedData = {
        ...context.data,
        [context.currentField!]: parseResult.value
      };
      console.log('=== Updated data ===', updatedData);
      console.log('=== Current field was ===', context.currentField);
      console.log('=== Parse result value ===', parseResult.value);

      // Trova il prossimo campo
      const nextField = findNextMissingField(updatedData);
      console.log('=== Next field ===', nextField);

      if (nextField) {
        // Continua con il prossimo campo
        const updatedContext = updateConversationContext(tripId, userId, {
          data: updatedData,
          currentField: nextField,
          completedFields: [...context.completedFields, context.currentField!],
          retryCount: 0
        });

        let confirmationMessage = `✅ ${parseResult.value}`;
        if (parseResult.suggestion) {
          confirmationMessage += `\n${parseResult.suggestion}`;
        }

        const nextPrompt = getTransportationFieldPromptWithUI(nextField);
        return {
          message: `${confirmationMessage}\n\n${nextPrompt.message}`,
          shouldContinue: true,
          context: updatedContext,
          uiComponent: nextPrompt.uiComponent,
          uiProps: nextPrompt.uiProps
        };
      } else {
        // Tutti i campi completati, mostra riepilogo finale
        const updatedContext = updateConversationContext(tripId, userId, {
          data: updatedData,
          completedFields: [...context.completedFields, context.currentField!]
        });

        return showFinalSummary(updatedContext, tripId, userId);
      }
    } else {
      // Parsing fallito, riprova
      const newRetryCount = context.retryCount + 1;

      if (newRetryCount >= 3) {
        // Troppi tentativi, annulla
        resetConversation(tripId, userId);
        return {
          message: 'Mi dispiace, non riesco a capire la tua risposta. Operazione annullata. Puoi riprovare quando vuoi.',
          shouldContinue: false
        };
      }

      updateConversationContext(tripId, userId, { retryCount: newRetryCount });
      return getTransportationFieldPromptWithUI(context.currentField!, parseResult.error);
    }
  }

  // Stato non gestito
  return {
    message: 'Stato conversazione non riconosciuto.',
    shouldContinue: false
  };
}

/**
 * Trova il prossimo campo mancante nei dati
 */
function findNextMissingField(data: TransportationData): TransportationField | null {
  const requiredFields: TransportationField[] = [
    'type',
    'departure_location',
    'arrival_location',
    'departure_time'  // Ora richiediamo solo la partenza come minimo
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      return field;
    }
  }

  return null;
}

/**
 * Completa la conversazione dopo il salvataggio del trasporto
 */
export function completeTransportationConversation(
  tripId: string,
  userId: string,
  success: boolean,
  error?: string
): ConversationResponse {

  resetConversation(tripId, userId);

  if (success) {
    return {
      message: '🎉 Trasporto aggiunto con successo! È stato aggiunto al tuo viaggio.\n\nPosso aiutarti con altro? Ad esempio, puoi aggiungere un altro trasporto o chiedere informazioni sul tuo viaggio.',
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
 * Mostra il riepilogo finale per la conferma
 */
function showFinalSummary(context: ConversationContext, tripId: string, userId: string): ConversationResponse {
  const updatedContext = updateConversationContext(tripId, userId, {
    state: 'confirming_transportation'
  });
  
  return {
    message: 'Ecco il riepilogo del trasporto. Conferma per salvare:',
    shouldContinue: true,
    context: updatedContext,
    uiComponent: 'transportation_final_summary',
    uiProps: { 
      data: context.data,
      loading: false
    }
  };
}

/**
 * Ottiene il tipo di campo per il parsing intelligente
 */
function getTransportationFieldType(field: TransportationField): string {
  const fieldTypeMap: Record<TransportationField, string> = {
    'type': 'transportation_type',
    'provider': 'text',
    'booking_reference': 'text',
    'departure_location': 'location',
    'arrival_location': 'location',
    'departure_time': 'datetime',        // Data + ora insieme
    'arrival_time': 'datetime',          // Data + ora insieme
    'cost': 'cost',
    'currency': 'currency',
    'notes': 'text'
  };

  return fieldTypeMap[field] || 'text';
}

/**
 * Genera un prompt con componenti UI appropriati per il campo trasporto
 */
function getTransportationFieldPromptWithUI(field: TransportationField, error?: string): ConversationResponse {
  let message = error ? `${error}\n\n` : '';

  switch (field) {
    case 'type':
      message += 'Seleziona il tipo di trasporto:';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'transportation_type_selector',
          mainProps: {}
        }
      };

    case 'provider':
      message += 'Chi è il fornitore del trasporto? (es: "Ryanair", "Trenitalia", "Auto privata")';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Nome fornitore (opzionale)' }
        }
      };

    case 'booking_reference':
      message += 'Hai un codice di prenotazione? (es: "FR1234", "AB123456")';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Codice prenotazione (opzionale)' }
        }
      };

    case 'departure_location':
      message += 'Da dove parti?';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Città di partenza' }
        }
      };

    case 'arrival_location':
      message += 'Dove arrivi?';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Città di arrivo' }
        }
      };

    case 'departure_time':
      message += 'Quando e a che ora parti? (es: "domani alle 14:30", "15 gennaio ore 9:00")';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Data e ora di partenza' }
        }
      };

    case 'arrival_time':
      message += 'Quando e a che ora arrivi? (es: "stesso giorno alle 16:45", "16 gennaio ore 11:30")';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Data e ora di arrivo' }
        }
      };

    case 'cost':
      message += 'Quanto costa?';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Costo (es: 89.50)' }
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
      message += 'Inserisci il valore:';
      return {
        message,
        shouldContinue: true,
        uiComponent: 'field_with_cancel',
        uiProps: {
          mainComponent: 'text_input',
          mainProps: { placeholder: 'Inserisci valore' }
        }
      };
  }
}
