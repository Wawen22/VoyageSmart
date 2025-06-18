'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Loader2, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import FormattedAIResponse from './FormattedAIResponse';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

// Suggested questions that will appear after AI responses
interface SuggestedQuestion {
  text: string;
  action: () => void;
}

interface TripData {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  destinations?: string[]; // Array di destinazioni
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  participants?: any[]; // Array di partecipanti
  isPrivate?: boolean;
  createdAt?: string;
  owner?: string;
  accommodations?: any[]; // Array di alloggi
  transportation?: any[]; // Array di trasporti
  activities?: any[]; // Array di attività
  itinerary?: any[]; // Array di giorni dell'itinerario con attività
}

// Funzione per generare un saluto casuale
const getRandomGreeting = () => {
  const greetings = [
    "Benvenuto! Sono il tuo assistente di viaggio",
    "Salve! Sono qui per aiutarti con il tuo viaggio",
    "Buongiorno! Sono il tuo assistente personale",
    "Bentornato! Sono pronto ad assisterti",
    "A tua disposizione! Sono l'assistente di viaggio",
    "Felice di aiutarti! Sono il tuo assistente"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

export default function ChatBot({
  tripId,
  tripName,
  tripData
}: {
  tripId: string;
  tripName: string;
  tripData?: TripData
}) {
  // Stato per tracciare se il contesto è stato caricato
  const [contextLoaded, setContextLoaded] = useState(false);

  // Debug info
  console.log('ChatBot inizializzato con Trip ID:', tripId, 'Trip Name:', tripName);
  console.log('Trip Data passati direttamente:', tripData);

  // Carica i messaggi dal localStorage o inizializza con un messaggio di default
  const [messages, setMessages] = useState<Message[]>(() => {
    // Controlla se ci sono messaggi salvati per questo viaggio
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(`chat_messages_${tripId}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          console.log('Messaggi caricati dal localStorage:', parsedMessages.length);
          return parsedMessages;
        } catch (error) {
          console.error('Errore nel parsing dei messaggi salvati:', error);
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

  // Carica il contesto del viaggio all'avvio
  useEffect(() => {
    const loadContext = async () => {
      try {
        // Controlla se abbiamo già dei messaggi salvati (più di uno significa che c'è stata interazione)
        if (messages.length > 1) {
          console.log('Conversazione esistente trovata, non ricarico il contesto');
          setContextLoaded(true);
          return;
        }

        // Se abbiamo i dati del viaggio passati direttamente, li utilizziamo
        if (tripData) {
          console.log('Utilizzo i dati del viaggio passati direttamente');

          // Invia un messaggio di sistema per caricare il contesto con i dati passati direttamente
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Carica il contesto del viaggio e presentati',
              tripId,
              tripName,
              tripData, // Passa i dati del viaggio direttamente
              isInitialMessage: true // Indica che è il messaggio iniziale
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
          } else {
            console.error('Errore nel caricamento del contesto:', response.status);
            // Aggiorna il messaggio iniziale senza contesto
            setMessages([{
              role: 'assistant',
              content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
            }]);
          }
        } else {
          // Fallback al metodo originale se non abbiamo i dati del viaggio
          console.log('Nessun dato di viaggio passato direttamente, utilizzo il metodo originale');

          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Carica il contesto del viaggio e presentati',
              tripId,
              tripName,
              isInitialMessage: true // Indica che è il messaggio iniziale
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
          } else {
            console.error('Errore nel caricamento del contesto:', response.status);
            // Aggiorna il messaggio iniziale senza contesto
            setMessages([{
              role: 'assistant',
              content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
            }]);
          }
        }
      } catch (error) {
        console.error('Errore nel caricamento del contesto:', error);
        // Aggiorna il messaggio iniziale senza contesto
        setMessages([{
          role: 'assistant',
          content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
        }]);
      } finally {
        // In ogni caso, consideriamo il contesto come caricato
        setContextLoaded(true);
      }
    };

    loadContext();
  }, [tripId, tripName, tripData, messages.length]);
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
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Genera domande suggerite quando il contesto è caricato
  useEffect(() => {
    if (contextLoaded && tripData) {
      generateSuggestedQuestions();
    }
  }, [contextLoaded, tripData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Salva i messaggi nel localStorage quando cambiano
    if (messages.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(`chat_messages_${tripId}`, JSON.stringify(messages));
    }
  }, [messages, tripId]);

  const handleSendMessage = async (messageText?: string) => {
    // Use provided message or input field value
    const messageToSend = messageText || input;
    if (!messageToSend.trim()) return;

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

    setIsLoading(true);
    setIsTyping(true);

    try {
      // Call API
      console.log('Sending message to API:', {
        message: messageToSend,
        tripId,
        tripName,
        hasTripData: !!tripData
      });

      // Prepara i dati da inviare all'API
      const apiData: any = {
        message: messageToSend,
        tripId,
        tripName,
        isInitialMessage: false // Indica che non è il messaggio iniziale
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

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);

        if (response.status === 401) {
          throw new Error('Autenticazione richiesta. Prova ad aggiornare la pagina e accedere nuovamente.');
        } else {
          throw new Error(`Errore ${response.status}: ${errorData.error || 'Risposta non valida'}`);
        }
      }

      const data = await response.json();

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

        // Genera nuove domande suggerite dopo ogni risposta
        generateSuggestedQuestions();

        setIsTyping(false);
      }, 500); // Ritardo di 500ms per simulare la digitazione
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Messaggio di errore personalizzato
      let errorMessage = 'Mi dispiace, si è verificato un errore. Riprova più tardi.';

      if (error.message && error.message.includes('Autenticazione richiesta')) {
        errorMessage = 'Sembra che la tua sessione sia scaduta. Prova ad aggiornare la pagina e accedere nuovamente.';
      } else if (error.message && error.message.includes('Errore')) {
        errorMessage = error.message;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
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
    if (isExpanded) setIsExpanded(false);

    // Salva lo stato nel localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chat_minimized_${tripId}`, newState.toString());
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isMinimized) setIsMinimized(false);
  };

  // Funzione per cancellare la conversazione
  // Genera domande suggerite in base al contesto del viaggio
  const generateSuggestedQuestions = () => {
    const questions: SuggestedQuestion[] = [];

    // Domande base sempre disponibili
    questions.push({
      text: "Cosa posso fare a " + (tripData?.destination || "destinazione"),
      action: () => {
        const question = "Cosa posso fare a " + (tripData?.destination || "destinazione") + "?";
        setInput(question);
        handleSendMessage(question);
      }
    });

    questions.push({
      text: "Mostrami il mio itinerario",
      action: () => {
        const question = "Mostrami il mio itinerario completo";
        setInput(question);
        handleSendMessage(question);
      }
    });

    // Se ci sono alloggi, aggiungi una domanda sugli alloggi
    if (tripData?.accommodations && tripData.accommodations.length > 0) {
      questions.push({
        text: "Dettagli sui miei alloggi",
        action: () => {
          const question = "Mostrami i dettagli dei miei alloggi";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Se ci sono trasporti, aggiungi una domanda sui trasporti
    if (tripData?.transportation && tripData.transportation.length > 0) {
      questions.push({
        text: "Info sui miei trasporti",
        action: () => {
          const question = "Mostrami le informazioni sui miei trasporti";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Limita a massimo 4 domande
    setSuggestedQuestions(questions.slice(0, 4));
  };

  const clearConversation = () => {
    if (window.confirm('Sei sicuro di voler cancellare questa conversazione?')) {
      // Rimuovi i messaggi dal localStorage
      localStorage.removeItem(`chat_messages_${tripId}`);

      // Reimposta i messaggi con solo il messaggio iniziale
      setMessages([{
        role: 'assistant',
        content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Come posso aiutarti oggi?`
      }]);

      // Ricarica il contesto
      setContextLoaded(false);

      // Rigenera le domande suggerite
      generateSuggestedQuestions();
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed sm:bottom-4 bottom-[180px] right-4 bg-primary text-white p-3 rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-primary/90 transition-all duration-300 animate-float"
        aria-label="Apri assistente AI"
      >
        <Sparkles size={20} className="animate-pulse" />
        <span className="sm:inline hidden">{contextLoaded ? 'Assistente AI' : 'Assistente AI (Caricamento...)'}</span>
      </button>
    );
  }

  return (
    <div
      className={`
        fixed ${isExpanded ? 'inset-4' : 'sm:bottom-4 bottom-[180px] right-4 w-80 sm:h-[450px] h-[400px]'}
        bg-background border border-border rounded-lg shadow-xl z-50
        flex flex-col transition-all duration-300 ease-in-out
        glass-effect animate-fade-in
      `}
      aria-label="Assistente AI di viaggio"
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <Sparkles className="text-primary" size={18} />
          </div>
          <h3 className="font-medium text-sm">
            {contextLoaded
              ? `Assistente Viaggio: ${tripName}`
              : <span className="flex items-center gap-1">Caricamento contesto <Loader2 size={14} className="animate-spin" /></span>
            }
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearConversation}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Cancella conversazione"
            aria-label="Cancella conversazione"
          >
            <Trash2 size={16} />
          </button>
          {isExpanded ? (
            <button
              onClick={toggleExpand}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Riduci"
              aria-label="Riduci finestra"
            >
              <Minimize2 size={16} />
            </button>
          ) : (
            <button
              onClick={toggleExpand}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Espandi"
              aria-label="Espandi finestra"
            >
              <Maximize2 size={16} />
            </button>
          )}
          <button
            onClick={toggleMinimize}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Minimizza"
            aria-label="Minimizza finestra"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] p-3 rounded-lg shadow-sm
                ${message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-4 animate-slide-in-left'
                  : 'bg-muted mr-4 animate-slide-in-right'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'assistant' ? (
                  <Bot size={16} className="text-primary" />
                ) : (
                  <User size={16} />
                )}
                <span className="text-xs font-medium">
                  {message.role === 'assistant' ? 'Assistente' : 'Tu'}
                </span>
                {message.timestamp && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Formatted rendering for assistant messages */}
              {message.role === 'assistant' ? (
                <FormattedAIResponse
                  content={message.content}
                  className="text-sm"
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-[80%] mr-4 animate-pulse">
              <div className="flex items-center gap-2 mb-1">
                <Bot size={16} className="text-primary" />
                <span className="text-xs font-medium">Assistente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-[80%] mr-4">
              <div className="flex items-center gap-2 mb-1">
                <Bot size={16} className="text-primary" />
                <span className="text-xs font-medium">Assistente</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <p className="text-sm">Sto elaborando la risposta...</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {suggestedQuestions.length > 0 && !isLoading && !isTyping && (
          <div className="flex flex-wrap gap-2 mt-2 mb-1">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={question.action}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <HelpCircle size={12} />
                {question.text}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-muted/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chiedi qualcosa sul tuo viaggio..."
            className="text-xs flex-1 px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-background shadow-sm"
            disabled={isLoading}
            aria-label="Messaggio per l'assistente AI"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-white p-2.5 rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-sm"
            aria-label="Invia messaggio"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
        <div className="text-xs text-center mt-2 text-muted-foreground">
          <MessageSquare size={12} className="inline mr-1" />
          Assistente AI di VoyageSmart - Powered by Gemini
        </div>
      </div>
    </div>
  );
}
