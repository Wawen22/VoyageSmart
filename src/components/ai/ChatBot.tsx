'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Bot, User, X, Minimize2, Maximize2, Loader2, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import FormattedAIResponse from './FormattedAIResponse';
import { useAIProvider } from '@/hooks/useAIProvider';
import { handleAccommodationConversation, completeAccommodationConversation } from '@/lib/services/aiConversationService';
import { handleTransportationConversation, completeTransportationConversation } from '@/lib/services/transportationConversationService';
import { resetConversation } from '@/lib/services/conversationStateService';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { addAccommodation } from '@/lib/features/accommodationSlice';
import { addTransportation } from '@/lib/features/transportationSlice';
import ConversationUIHandler from './ConversationUIHandler';
import { logger } from '@/lib/logger';
import MinimizedButton from './MinimizedButton';
import { Message, SuggestedQuestion, TripData, ChatBotProps } from './types';
import { getRandomGreeting, getCurrentSection } from './utils';
import { generateSuggestedQuestions } from './suggestedQuestions';
import '@/styles/ai-assistant.css';

export default function ChatBot({
  tripId,
  tripName,
  tripData
}: ChatBotProps) {
  // Rileva la pagina corrente
  const pathname = usePathname();

  // Hook per gestire il provider AI
  const { currentProvider } = useAIProvider();

  // Redux dispatch per le azioni
  const dispatch = useDispatch<AppDispatch>();

  const currentSection = getCurrentSection(pathname);

  // Stato per tracciare se il contesto è stato caricato
  const [contextLoaded, setContextLoaded] = useState(false);
  // Stato per tracciare se l'utente ha mai aperto la chat
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);

  // Debug info
  logger.debug('ChatBot initialized', { tripId, tripName, hasTripData: !!tripData });

  // Carica i messaggi dal localStorage o inizializza con un messaggio di default
  const [messages, setMessages] = useState<Message[]>(() => {
    // Controlla se ci sono messaggi salvati per questo viaggio
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(`chat_messages_${tripId}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          logger.debug('Messages loaded from localStorage', { count: parsedMessages.length, tripId });
          return parsedMessages;
        } catch (error) {
          logger.error('Error parsing saved messages', { error: error instanceof Error ? error.message : String(error), tripId });
        }
      }
    }

    // Se non ci sono messaggi salvati o c'è stato un errore, inizializza con il messaggio di default
    return [
      {
        role: 'assistant',
        content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Sto caricando le informazioni del tuo viaggio...`
      }
    ];
  });

  // Stato per prevenire chiamate multiple simultanee
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Stato per gestire i componenti UI conversazionali
  const [activeUIComponent, setActiveUIComponent] = useState<{
    component: string;
    props: any;
    messageIndex: number;
  } | null>(null);

  // Stato per gestire i retry con backoff esponenziale
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Circuit breaker: ferma le richieste dopo troppi errori 429 consecutivi
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const maxConsecutiveErrors = 3;
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);

  // Funzione per caricare il contesto del viaggio (chiamata solo quando necessario)
  const loadContext = async () => {
    try {
      // Controlla se il contesto è già stato caricato
      if (contextLoaded) {
        logger.debug('Context already loaded, skipping', { tripId });
        return;
      }

      // Controlla se è già in corso un caricamento
      if (isLoadingContext) {
        logger.debug('Context loading already in progress, skipping', { tripId });
        return;
      }

      // Controlla se abbiamo già dei messaggi salvati (più di uno significa che c'è stata interazione)
      if (messages.length > 1) {
        logger.debug('Existing conversation found, not reloading context', { tripId, messageCount: messages.length });
        setContextLoaded(true);
        return;
      }

      setIsLoadingContext(true);

        // Se abbiamo i dati del viaggio passati direttamente, li utilizziamo
        if (tripData) {
          logger.debug('Using trip data passed directly', { tripId });

          // Invia un messaggio di sistema per caricare il contesto con i dati passati direttamente
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Carica il contesto del viaggio e presentati',
              tripId,
              tripName,
              tripData, // Passa i dati del viaggio direttamente
              isInitialMessage: true, // Indica che è il messaggio iniziale
              currentSection: currentSection, // Indica la sezione corrente
              aiProvider: currentProvider // Usa il provider selezionato
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Aggiorna il messaggio iniziale con le informazioni del viaggio
            setMessages([{
              role: 'assistant',
              content: data.message || `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
            }]);
            setContextLoaded(true);
            setRetryCount(0); // Reset retry count on success
          } else {
            logger.error('Error loading context', { status: response.status, tripId });

            if (response.status === 429) {
              logger.warn('Rate limit reached during context loading', { tripId });

              if (retryCount < maxRetries) {
                // Calcola il delay con backoff esponenziale: 2^retry * 5 secondi
                const delay = Math.pow(2, retryCount) * 5000;
                const delaySeconds = Math.ceil(delay / 1000);

                setRateLimitError(true);
                setMessages([{
                  role: 'assistant',
                  content: `⚠️ Troppo traffico AI al momento. Riproverò a caricare il contesto tra ${delaySeconds} secondi (tentativo ${retryCount + 1}/${maxRetries}). Nel frattempo puoi comunque chattare!`
                }]);

                setTimeout(() => {
                  setRateLimitError(false);
                  setRetryCount(prev => prev + 1);
                  loadContext();
                }, delay);
              } else {
                // Troppi tentativi, rinuncia
                setMessages([{
                  role: 'assistant',
                  content: `⚠️ Non riesco a caricare il contesto del viaggio a causa del traffico elevato. Puoi comunque chattare normalmente!`
                }]);
                setRetryCount(0); // Reset per futuri tentativi
              }
              return;
            }

            try {
              const errorData = await response.json();
              logger.error('API error details', { errorData });
            } catch (e) {
              logger.error('Unable to read error details', { error: e });
            }
            // Aggiorna il messaggio iniziale senza contesto
            setMessages([{
              role: 'assistant',
              content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
            }]);
          }
        } else {
          // Fallback al metodo originale se non abbiamo i dati del viaggio
          logger.debug('No direct trip data, using original method');

          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Carica il contesto del viaggio e presentati',
              tripId,
              tripName,
              isInitialMessage: true, // Indica che è il messaggio iniziale
              currentSection: currentSection, // Indica la sezione corrente
              aiProvider: currentProvider // Usa il provider selezionato
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Aggiorna il messaggio iniziale con le informazioni del viaggio
            setMessages([{
              role: 'assistant',
              content: data.message || `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
            }]);
            setContextLoaded(true);
            setRetryCount(0); // Reset retry count on success
          } else {
            logger.error('Error loading context (fallback)', { status: response.status });
            try {
              const errorData = await response.json();
              logger.error('Fallback error details', { errorData });
            } catch (e) {
              logger.error('Unable to read fallback error details', { error: e });
            }
            // Aggiorna il messaggio iniziale senza contesto
            setMessages([{
              role: 'assistant',
              content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
            }]);
          }
        }
    } catch (error) {
      logger.error('Error loading context', { error });
      // Aggiorna il messaggio iniziale senza contesto
      setMessages([{
        role: 'assistant',
        content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
      }]);
    } finally {
      // In ogni caso, consideriamo il contesto come caricato
      setContextLoaded(true);
      setIsLoadingContext(false);
    }
  };
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Inizializza isMinimized a true per impostazione predefinita, o carica dal localStorage se disponibile
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`chat_minimized_${tripId}`);
      // Se non c'è uno stato salvato, o se lo stato salvato è "true", minimizza la chat
      return savedState === null ? true : savedState === 'true';
    }
    return true; // Minimizzato per impostazione predefinita
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Non blocchiamo più lo scroll del body dato che non occupiamo tutto lo schermo
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Client-side small response cache to avoid flicker and reduce calls for exact repeats
  const clientCacheRef = useRef<Map<string, { text: string; ts: number }>>(new Map());
  const lastSendRef = useRef<number>(0);

  // Carica la cache dal localStorage all'avvio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCache = localStorage.getItem(`ai_cache_${tripId}`);
        if (savedCache) {
          const cacheData = JSON.parse(savedCache);
          // Filtra le voci scadute (più di 1 ora)
          const now = Date.now();
          const validEntries = Object.entries(cacheData).filter(
            ([_, value]: [string, any]) => (now - value.ts) < 60 * 60 * 1000
          );

          if (validEntries.length > 0) {
            clientCacheRef.current = new Map(validEntries);
            logger.debug('AI cache loaded from localStorage', { entriesCount: validEntries.length });
          }
        }
      } catch (error) {
        logger.warn('Error loading AI cache', { error });
      }
    }
  }, [tripId]);

  // Reset del contesto conversazionale quando il componente si monta
  useEffect(() => {
    if (tripData?.currentUserId) {
      logger.debug('Component mounted, resetting conversation context');
      resetConversation(tripId, tripData.currentUserId);
    }
  }, [tripId, tripData?.currentUserId]);

  // Genera domande suggerite quando il contesto è caricato E la chat è aperta
  useEffect(() => {
    if (contextLoaded && tripData && !isMinimized) {
      generateSuggestedQuestions();
    }
  }, [contextLoaded, tripData, isMinimized]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Salva i messaggi nel localStorage quando cambiano
    if (messages.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(`chat_messages_${tripId}`, JSON.stringify(messages));
    }
  }, [messages, tripId]);

  // Gestisce le azioni dell'utente sui componenti UI conversazionali
  const handleUIAction = async (action: string, value?: any) => {
    // Gestione IMMEDIATA dell'annullamento
    if (action === 'cancelled') {

      // Reset immediato del contesto conversazionale
      if (tripData?.currentUserId) {
        logger.debug('Resetting conversation context immediately');
        resetConversation(tripId, tripData.currentUserId);
      }

      // Rimuovi immediatamente il componente UI
      setActiveUIComponent(null);

      // Aggiungi messaggio di conferma annullamento
      const cancelMessage: Message = {
        role: 'assistant',
        content: 'Operazione annullata. Posso aiutarti con qualcos\'altro?',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, cancelMessage]);

      // Rigenera i suggerimenti
      setTimeout(() => generateSuggestedQuestions(), 100);

      return;
    }

    // Per l'azione di conferma, usa il flusso normale
    if (action === 'confirmed') {
      // Determina il tipo di conferma basandosi sul componente UI attivo
      let messageToSend = 'CONFIRM_SAVE_ACCOMMODATION'; // Default

      if (activeUIComponent?.component === 'transportation_final_summary') {
        messageToSend = 'CONFIRM_SAVE_TRANSPORTATION';
      }

      logger.debug('Sending special message', { messageType: messageToSend });

      // Invia il messaggio speciale per il salvataggio
      await handleSendMessage(messageToSend);
      return;
    }

    // Per altre azioni, rimuovi il componente UI attivo
    setActiveUIComponent(null);

    // Simula l'invio di un messaggio basato sull'azione
    let messageToSend = '';

    switch (action) {
      case 'date_selected':
        messageToSend = value;
        break;
      case 'type_selected':
        logger.debug('Type selected from UI', { value });
        // Assicurati che il messaggio sia in lowercase per il parsing
        messageToSend = value.toLowerCase();
        break;
      case 'currency_selected':
        logger.debug('Currency selected from UI', { value });
        // Assicurati che il messaggio sia in uppercase per la valuta
        messageToSend = value.toUpperCase();
        break;
      case 'transportation_type_selected':
        logger.debug('Transportation type selected from UI', { value });
        messageToSend = value.toLowerCase();
        break;
      case 'continue_with_partial_data':
        logger.debug('User confirmed partial data');
        messageToSend = 'CONTINUE_WITH_PARTIAL_DATA';
        break;
      default:
        messageToSend = value || action;
    }

    logger.debug('Final message to send', { message: messageToSend });

    // Invia il messaggio simulato
    if (messageToSend) {
      await handleSendMessage(messageToSend);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    // Prevent while a request is in-flight
    if (isLoading) return;

    // Prevent new messages if rate limit is active
    if (rateLimitError) {
      logger.debug('Rate limit active, message blocked');
      return;
    }

    // Prevent new messages if circuit breaker is active
    if (circuitBreakerActive) {
      logger.debug('Circuit breaker active, message blocked');
      return;
    }

    // Debouncing: prevent messages sent too quickly (min 2 seconds between messages)
    const now = Date.now();
    const timeSinceLastSend = now - lastSendRef.current;
    if (timeSinceLastSend < 2000) {
      logger.debug('Message sent too quickly', {
        waitSeconds: Math.ceil((2000 - timeSinceLastSend) / 1000)
      });
      return;
    }

    // Use provided message or input field value
    const messageToSend = messageText || input;
    if (!messageToSend.trim()) return;

    // Update last send timestamp
    lastSendRef.current = now;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Clear input field only if we're using it (not for suggested questions)
    if (!messageText) {
      setInput('');
    }

    // Check for active conversation first (before making API call)
    if (tripData?.currentUserId) {
      try {
        logger.debug('Checking for active conversation', {
          tripId,
          userId: tripData.currentUserId,
          messageLength: messageToSend?.length || 0
        });

        // Prova prima con gli accommodations
        const accommodationResponse = handleAccommodationConversation(
          messageToSend,
          tripId,
          tripData.currentUserId
        );
        logger.debug('Accommodation conversation response', {
          hasResponse: !!accommodationResponse
        });

        let conversationResponse = accommodationResponse;

        // Se gli accommodations non hanno gestito il messaggio o hanno restituito un errore, prova con i trasporti
        const isAccommodationError = accommodationResponse.message?.includes('Stato conversazionale non riconosciuto') ||
                                    accommodationResponse.message?.includes('non riconosciuto') ||
                                    (!accommodationResponse.message && !accommodationResponse.shouldContinue && !accommodationResponse.action);

        if (isAccommodationError) {
          const transportationResponse = handleTransportationConversation(
            messageToSend,
            tripId,
            tripData.currentUserId
          );
          logger.debug('Transportation conversation response', {
            hasResponse: !!transportationResponse
          });

          // Se i trasporti hanno gestito il messaggio, usa la loro risposta
          if (transportationResponse.message || transportationResponse.shouldContinue || transportationResponse.action) {
            conversationResponse = transportationResponse;
          }
        }

        // Se una delle conversazioni ha gestito il messaggio
        if (conversationResponse.message || conversationResponse.shouldContinue || conversationResponse.action) {
          logger.debug('Conversation handled the message', {
            hasMessage: !!conversationResponse.message,
            shouldContinue: conversationResponse.shouldContinue,
            action: conversationResponse.action
          });

          // Handle conversation response (always add message if there is one)
          if (conversationResponse.message) {
            const assistantMessage: Message = {
              role: 'assistant',
              content: conversationResponse.message,
              timestamp: new Date()
            };

            setMessages(prev => {
              const newMessages = [...prev, assistantMessage];

              // Se c'è un componente UI da mostrare, salvalo con l'indice del messaggio
              if (conversationResponse.uiComponent) {
                setActiveUIComponent({
                  component: conversationResponse.uiComponent,
                  props: conversationResponse.uiProps || {},
                  messageIndex: newMessages.length - 1
                });
              } else if (conversationResponse.shouldContinue) {
                // Solo rimuovi il componente UI se la conversazione continua
                setActiveUIComponent(null);
              }

              return newMessages;
            });
          }

          setIsLoading(false);
          setIsTyping(false);

          // If we need to save accommodation, do it now
          if (conversationResponse.action === 'save_accommodation' && conversationResponse.data) {
            logger.info('Save accommodation action triggered', {
              accommodationName: conversationResponse.data.name
            });

            // Aggiorna il componente UI per mostrare lo stato di caricamento
            if (activeUIComponent && activeUIComponent.component === 'data_summary') {
              setActiveUIComponent({
                ...activeUIComponent,
                props: {
                  ...activeUIComponent.props,
                  loading: true
                }
              });
            }

            try {
              logger.debug('Dispatching addAccommodation action');

              await dispatch(addAccommodation({
                trip_id: tripId,
                name: conversationResponse.data.name || '',
                type: conversationResponse.data.type || 'hotel',
                check_in_date: conversationResponse.data.check_in_date || null,
                check_out_date: conversationResponse.data.check_out_date || null,
                address: conversationResponse.data.address || null,
                booking_reference: conversationResponse.data.booking_reference || null,
                contact_info: conversationResponse.data.contact_info || null,
                cost: conversationResponse.data.cost || null,
                currency: conversationResponse.data.currency || 'EUR',
                documents: [],
                notes: conversationResponse.data.notes || null,
                coordinates: null
              })).unwrap();

              logger.info('Accommodation saved successfully');

              // Show success message
              const successResponse = completeAccommodationConversation(
                tripId,
                tripData.currentUserId,
                true
              );

              const successMessage: Message = {
                role: 'assistant',
                content: successResponse.message,
                timestamp: new Date()
              };

              setMessages(prev => [...prev, successMessage]);

              // Rimuovi il componente UI solo dopo il successo
              setActiveUIComponent(null);

          // Rigenera i suggerimenti ora che non siamo più in modalità inserimento
          setTimeout(() => generateSuggestedQuestions(), 100);

            } catch (error: any) {
              logger.error('Error saving accommodation', { error: error.message });

              // Rimuovi lo stato di loading dal componente UI
              if (activeUIComponent && activeUIComponent.component === 'data_summary') {
                setActiveUIComponent({
                  ...activeUIComponent,
                  props: {
                    ...activeUIComponent.props,
                    loading: false
                  }
                });
              }

              // Show error message
              const errorResponse = completeAccommodationConversation(
                tripId,
                tripData.currentUserId,
                false,
                error.message
              );

              const errorMessage: Message = {
                role: 'assistant',
                content: errorResponse.message,
                timestamp: new Date()
              };

              setMessages(prev => [...prev, errorMessage]);
            }
          }

          // If we need to save transportation, do it now
          if (conversationResponse.action === 'save_transportation' && conversationResponse.data) {
            logger.info('Save transportation action triggered', {
              transportationType: conversationResponse.data.type
            });

            // Aggiorna il componente UI per mostrare lo stato di caricamento
            if (activeUIComponent && activeUIComponent.component === 'transportation_final_summary') {
              setActiveUIComponent({
                ...activeUIComponent,
                props: {
                  ...activeUIComponent.props,
                  loading: true
                }
              });
            }

            try {
              logger.debug('Dispatching addTransportation action');

              await dispatch(addTransportation({
                trip_id: tripId,
                type: conversationResponse.data.type || 'other',
                provider: conversationResponse.data.provider || null,
                booking_reference: conversationResponse.data.booking_reference || null,
                departure_location: conversationResponse.data.departure_location || '',
                arrival_location: conversationResponse.data.arrival_location || '',
                departure_time: conversationResponse.data.departure_time || null,
                arrival_time: conversationResponse.data.arrival_time || null,
                cost: conversationResponse.data.cost || null,
                currency: conversationResponse.data.currency || 'EUR',
                notes: conversationResponse.data.notes || null
              })).unwrap();

              logger.info('Transportation saved successfully');

              // Show success message using the complete function (which also resets context)
              const successResponse = completeTransportationConversation(
                tripId,
                tripData.currentUserId,
                true
              );

              const successMessage: Message = {
                role: 'assistant',
                content: successResponse.message,
                timestamp: new Date()
              };

              setMessages(prev => [...prev, successMessage]);

              // Rimuovi il componente UI
              setActiveUIComponent(null);

              // Rigenera i suggerimenti ora che non siamo più in modalità inserimento
              setTimeout(() => generateSuggestedQuestions(), 100);

            } catch (error: any) {
              logger.error('Error saving transportation', { error: error.message });

              // Reset loading state
              if (activeUIComponent && activeUIComponent.component === 'transportation_final_summary') {
                setActiveUIComponent({
                  ...activeUIComponent,
                  props: {
                    ...activeUIComponent.props,
                    loading: false
                  }
                });
              }

              // Show error message using the complete function (which also resets context)
              const errorResponse = completeTransportationConversation(
                tripId,
                tripData.currentUserId,
                false,
                error.message
              );

              const errorMessage: Message = {
                role: 'assistant',
                content: errorResponse.message,
                timestamp: new Date()
              };

              setMessages(prev => [...prev, errorMessage]);
            }
          }

        // Handle cancel action
        if (conversationResponse.action === 'cancel') {
          // Rimuovi il componente UI per l'azione di cancellazione
          setActiveUIComponent(null);

          // Rigenera i suggerimenti ora che non siamo più in modalità inserimento
          setTimeout(() => generateSuggestedQuestions(), 100);
        }

          return; // Exit early, don't make API call
        } else {
          logger.debug('Conversation did not handle message, proceeding with normal API call');
          // La conversazione non ha gestito il messaggio, continua con l'API normale
        }
      } catch (error) {
        logger.error('Error in conversation handling', { error });
        // Continue with normal API call if conversation handling fails
      }
    }

    setIsLoading(true);
    setIsTyping(true);

    // Check client cache first (10 min TTL)
    const cacheKey = `${tripId}:${messageToSend.trim().toLowerCase()}`;
    const cached = clientCacheRef.current.get(cacheKey);
    if (cached && (now - cached.ts) < 10 * 60 * 1000) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: cached.text, timestamp: new Date() }]);
        generateSuggestedQuestions();
        setIsTyping(false);
        setIsLoading(false);
      }, 200);
      return;
    }

    try {
      // Call API
      logger.debug('Sending message to API', {
        messageLength: messageToSend?.length || 0,
        tripId,
        tripName,
        hasTripData: !!tripData
      });

      // Prepara i dati da inviare all'API
      const apiData: any = {
        message: messageToSend,
        tripId,
        tripName,
        isInitialMessage: false, // Indica che non è il messaggio iniziale
        currentSection: currentSection, // Indica la sezione corrente
        aiProvider: currentProvider // Usa il provider selezionato
      };

      // Includi i dati del viaggio se disponibili
      if (tripData) {
        apiData.tripData = tripData;
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      logger.debug('API response received', { status: response.status });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('API error response', {
          status: response.status,
          errorText: errorText.substring(0, 200)
        });

        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          logger.error('Failed to parse error response as JSON', { error: e });
        }

        logger.error('API error response parsed', { errorData });

        if (response.status === 401) {
          throw new Error('Autenticazione richiesta. Prova ad aggiornare la pagina e accedere nuovamente.');
        } else if (response.status === 429) {
          setRateLimitError(true);

          // Incrementa il contatore di errori consecutivi
          const newConsecutiveErrors = consecutiveErrors + 1;
          setConsecutiveErrors(newConsecutiveErrors);

          // Attiva il circuit breaker se troppi errori consecutivi
          if (newConsecutiveErrors >= maxConsecutiveErrors) {
            setCircuitBreakerActive(true);
            logger.warn('Circuit breaker activated', {
              consecutiveErrors: newConsecutiveErrors,
              errorType: '429'
            });

            // Disattiva il circuit breaker dopo 5 minuti
            setTimeout(() => {
              setCircuitBreakerActive(false);
              setConsecutiveErrors(0);
              logger.info('Circuit breaker deactivated');
            }, 5 * 60 * 1000); // 5 minuti
          }

          // Prova a leggere il retryAfter dal server
          let serverRetryAfter = 30; // Default 30 secondi
          try {
            const retryAfterHeader = response.headers.get('Retry-After');
            if (retryAfterHeader) {
              serverRetryAfter = parseInt(retryAfterHeader);
            } else if (errorData && errorData.retryAfter) {
              serverRetryAfter = errorData.retryAfter;
            }
          } catch (e) {
            logger.warn('Unable to read retryAfter, using default');
          }

          // Usa il maggiore tra il nostro backoff e quello suggerito dal server
          const ourBackoff = Math.min(Math.pow(2, retryCount) * 5000, 60000); // Max 60 secondi
          const delay = Math.max(ourBackoff, serverRetryAfter * 1000);

          setTimeout(() => {
            setRateLimitError(false);
          }, delay);

          const errorMessage = circuitBreakerActive
            ? `🚫 Troppi errori consecutivi. Sistema temporaneamente disabilitato per 5 minuti.`
            : `⚠️ Troppo traffico AI al momento. Attendi ${Math.ceil(delay / 1000)} secondi prima di riprovare.`;

          throw new Error(errorMessage);
        } else {
          const errorMessage = (errorData as any)?.error || errorText || `Errore del server: ${response.status}`;
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();

      // Cache client-side
      const cacheEntry = { text: data.message, ts: Date.now() };
      clientCacheRef.current.set(cacheKey, cacheEntry);

      // Salva la cache nel localStorage
      if (typeof window !== 'undefined') {
        try {
          const cacheObject = Object.fromEntries(clientCacheRef.current);
          localStorage.setItem(`ai_cache_${tripId}`, JSON.stringify(cacheObject));
        } catch (error) {
          logger.warn('Error saving AI cache', { error });
        }
      }

      // Simula l'effetto di digitazione
      setIsTyping(true);

      // Aggiungi un piccolo ritardo per simulare la digitazione
      setTimeout(() => {
        // Add assistant message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || 'Mi dispiace, non sono riuscito a elaborare una risposta.',
          timestamp: new Date()
        }]);

        // Reset retry count and consecutive errors on successful message
        setRetryCount(0);
        setConsecutiveErrors(0);

        // Genera nuove domande suggerite dopo ogni risposta
        generateSuggestedQuestions();

        setIsTyping(false);
      }, 500); // Ritardo di 500ms per simulare la digitazione
    } catch (error: any) {
      logger.error('Error sending message', { error: error.message });

      // Parse error response if available
      let errorData: any = {};
      try {
        if (error.response) {
          errorData = await error.response.json();
        }
      } catch (parseError) {
        // Ignore parse errors
      }

      // Messaggio di errore personalizzato basato sulla risposta del server
      let errorMessage = errorData.message || 'Mi dispiace, si è verificato un errore. Riprova più tardi.';
      let suggestions = errorData.suggestions || [];

      // Fallback per errori specifici
      if (error.message && error.message.includes('Autenticazione richiesta')) {
        errorMessage = 'Sembra che la tua sessione sia scaduta. Prova ad aggiornare la pagina e accedere nuovamente.';
      } else if (error.message && error.message.includes('Errore')) {
        errorMessage = error.message;
      } else if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        errorMessage = 'Troppe richieste. Attendi qualche secondo e riprova.';
        suggestions = ['Attendi 30-60 secondi prima di inviare un altro messaggio'];
      } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        errorMessage = 'Il servizio AI è temporaneamente sovraccarico. Riprova tra qualche minuto.';
        suggestions = ['Il servizio dovrebbe tornare disponibile a breve'];
      }

      // Costruisci il messaggio di errore con suggerimenti
      let fullErrorMessage = errorMessage;
      if (suggestions.length > 0) {
        fullErrorMessage += '\n\n💡 Suggerimenti:\n' + suggestions.map((s: string) => `• ${s}`).join('\n');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullErrorMessage,
        timestamp: new Date()
      }]);

      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);

    // Se l'utente sta aprendo la chat, segna che è stata aperta almeno una volta
    if (!newState) {
      setHasEverOpened(true);

      // Se il contesto non è ancora caricato, caricalo
      if (!contextLoaded) {
        logger.debug('Chat opened for first time, loading context');
        loadContext();
      }
    }

    // Su mobile, quando si apre la chat, va direttamente in fullscreen
    if (!newState && isMobile) {
      setIsExpanded(true);
    } else if (isExpanded && !isMobile) {
      setIsExpanded(false);
    }

    // Salva lo stato nel localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chat_minimized_${tripId}`, newState.toString());
    }
  };

  const toggleExpand = () => {
    // Su mobile non permettiamo il toggle expand, è sempre fullscreen quando aperto
    if (isMobile) return;

    const wasMinimized = isMinimized;
    setIsExpanded(!isExpanded);
    if (isMinimized) setIsMinimized(false);

    // Se l'utente sta aprendo la chat, segna che è stata aperta almeno una volta
    if (wasMinimized) {
      setHasEverOpened(true);

      // Se il contesto non è ancora caricato, caricalo
      if (!contextLoaded) {
        logger.debug('Chat opened for first time (expand), loading context');
        loadContext();
      }
    }
  };

  // Funzione per cancellare la conversazione
  // Genera domande suggerite dinamicamente basate sulla sezione corrente
  const generateSuggestedQuestionsWrapper = () => {
    // Non mostrare suggerimenti durante l'inserimento di dati
    if (activeUIComponent) {
      setSuggestedQuestions([]);
      return;
    }

    generateSuggestedQuestions(currentSection, tripData, setInput, handleSendMessage, setSuggestedQuestions);
  };

  const clearConversation = () => {
    if (window.confirm('Sei sicuro di voler cancellare questa conversazione?')) {
      // Rimuovi i messaggi dal localStorage
      localStorage.removeItem(`chat_messages_${tripId}`);

      // IMPORTANTE: Reset del contesto conversazionale per gli alloggi
      if (tripData?.currentUserId) {
        logger.debug('Resetting conversation context');
        resetConversation(tripId, tripData.currentUserId);
      }

      // Reimposta i messaggi con solo il messaggio iniziale
      setMessages([{
        role: 'assistant',
        content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
      }]);

      // Ricarica il contesto
      setContextLoaded(false);
      setHasEverOpened(false);

      // Pulisci i componenti UI attivi
      setActiveUIComponent(null);

      // Rigenera le domande suggerite
      generateSuggestedQuestionsWrapper();
    }
  };

  if (isMinimized) {
    return (
      <MinimizedButton
        toggleMinimize={toggleMinimize}
        hasEverOpened={hasEverOpened}
        contextLoaded={contextLoaded}
      />
    );
  }

  return (
    <div
      className={`
        fixed ${
          isMobile
            ? 'bottom-[70px] left-0 right-0 h-[75vh] max-h-[650px]' // Su mobile altezza aumentata al 75% con massimo 650px
            : isExpanded
              ? 'inset-4'
              : 'bottom-4 right-4 w-80 h-[450px]'
        }
        bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl z-50
        flex flex-col transition-all duration-300 ease-in-out
        animate-fade-in ai-chat-container
        ${isMobile ? 'rounded-t-2xl' : 'rounded-2xl'}
      `}
      aria-label="Assistente AI di viaggio"
    >
      {/* Header */}
      <div className={`p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/80 ai-header ${isMobile ? 'rounded-t-2xl' : 'rounded-t-2xl'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-xl shadow-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            {/* Online indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800 online-indicator"></div>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-white text-sm">
              AI Travel Assistant
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online • Ready to help
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearConversation}
            className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            title="Cancella conversazione"
            aria-label="Cancella conversazione"
          >
            <Trash2 size={16} />
          </button>
          {/* Pulsanti di espansione solo su desktop */}
          {!isMobile && (
            <>
              {isExpanded ? (
                <button
                  onClick={toggleExpand}
                  className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Riduci"
                  aria-label="Riduci finestra"
                >
                  <Minimize2 size={16} />
                </button>
              ) : (
                <button
                  onClick={toggleExpand}
                  className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Espandi"
                  aria-label="Espandi finestra"
                >
                  <Maximize2 size={16} />
                </button>
              )}
            </>
          )}
          <button
            onClick={toggleMinimize}
            className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
            title={isMobile ? "Chiudi" : "Minimizza"}
            aria-label={isMobile ? "Chiudi finestra" : "Minimizza finestra"}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-900/80 ai-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'user' && (
              <div className="flex flex-col items-end space-y-1">
                <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-md max-w-[85%] user-message message-slide-in-left">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs text-slate-400 font-medium">You</span>
                  {message.timestamp && (
                    <span className="text-xs text-slate-500">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {message.role === 'assistant' && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-sm shadow-md max-w-[85%] ai-message message-slide-in-right">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-indigo-400">AI Assistant</span>
                  </div>
                  <FormattedAIResponse
                    content={message.content}
                    className="text-sm text-slate-200"
                    tripData={tripData}
                    tripId={tripId}
                  />

                  {/* Componente UI conversazionale se attivo per questo messaggio */}
                  {activeUIComponent && activeUIComponent.messageIndex === index && (
                    <div className="mt-3">
                      <ConversationUIHandler
                        uiComponent={activeUIComponent.component}
                        uiProps={activeUIComponent.props}
                        onUserAction={handleUIAction}
                      />
                    </div>
                  )}
                </div>
                {message.timestamp && (
                  <span className="text-xs text-slate-500 px-2">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-sm shadow-md max-w-[85%]">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-indigo-400">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">AI is thinking</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-sm shadow-md max-w-[85%]">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-indigo-400">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
                <p className="text-sm text-slate-300">Processing your request...</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {suggestedQuestions.length > 0 && !isLoading && !isTyping && (
          <div className="flex flex-wrap gap-2 mt-3 mb-1">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={question.action}
                className="text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1 border border-slate-600/30 hover:border-indigo-500/50 suggestion-button"
              >
                <HelpCircle size={12} className="text-indigo-400" />
                {question.text}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t border-slate-700/50 bg-slate-800/80 ai-footer rounded-b-2xl`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-3 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              circuitBreakerActive
                ? "Sistema temporaneamente disabilitato (troppi errori)"
                : rateLimitError
                  ? "Attendi per il rate limiting..."
                  : "Ask me anything about your trip..."
            }
            className="text-sm flex-1 px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-700/50 text-white placeholder-slate-400 shadow-sm ai-input-focus"
            disabled={isLoading || rateLimitError || circuitBreakerActive}
            aria-label="Messaggio per l'assistente AI"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || rateLimitError || circuitBreakerActive}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-xl disabled:opacity-50 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-lg disabled:cursor-not-allowed send-button"
            aria-label="Invia messaggio"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
        <div className="text-xs text-center mt-3 text-slate-400 flex items-center justify-center gap-1">
          <MessageSquare size={12} />
          VoyageSmart AI Assistant • Powered by Gemini
        </div>
      </div>
    </div>
  );
}
