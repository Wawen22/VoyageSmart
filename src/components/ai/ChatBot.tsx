'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Loader2, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import FormattedAIResponse from './FormattedAIResponse';
import '@/styles/ai-assistant.css';

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
  expenses?: any[]; // Array di spese
  currentUserId?: string; // ID dell'utente corrente
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
  // Rileva la pagina corrente
  const pathname = usePathname();

  // Determina la sezione corrente basata sull'URL
  const getCurrentSection = () => {
    if (pathname.includes('/expenses')) return 'expenses';
    if (pathname.includes('/itinerary')) return 'itinerary';
    if (pathname.includes('/accommodations')) return 'accommodations';
    if (pathname.includes('/transportation')) return 'transportation';
    if (pathname.includes('/documents')) return 'documents';
    if (pathname.includes('/media')) return 'media';
    return 'overview'; // Default per la pagina principale del viaggio
  };

  const currentSection = getCurrentSection();

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
              isInitialMessage: true, // Indica che è il messaggio iniziale
              currentSection: currentSection // Indica la sezione corrente
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
            try {
              const errorData = await response.json();
              console.error('Dettagli errore:', errorData);
            } catch (e) {
              console.error('Impossibile leggere i dettagli dell\'errore');
            }
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
              isInitialMessage: true, // Indica che è il messaggio iniziale
              currentSection: currentSection // Indica la sezione corrente
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
            console.error('Errore nel caricamento del contesto (fallback):', response.status);
            try {
              const errorData = await response.json();
              console.error('Dettagli errore (fallback):', errorData);
            } catch (e) {
              console.error('Impossibile leggere i dettagli dell\'errore (fallback)');
            }
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
        isInitialMessage: false, // Indica che non è il messaggio iniziale
        currentSection: currentSection // Indica la sezione corrente
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

    setIsExpanded(!isExpanded);
    if (isMinimized) setIsMinimized(false);
  };

  // Funzione per cancellare la conversazione
  // Genera domande suggerite dinamicamente basate sulla sezione corrente
  const generateSuggestedQuestions = () => {
    const questions: SuggestedQuestion[] = [];
    const crossSectionQuestions: SuggestedQuestion[] = [];

    // Suggerimenti specifici per sezione
    switch (currentSection) {
      case 'expenses':
        // Suggerimenti specifici per la sezione spese
        if (tripData?.expenses && tripData.expenses.length > 0) {
          // Analizza i dati delle spese per suggerimenti intelligenti
          const userExpenses = tripData.expenses.filter(expense =>
            expense.paid_by === tripData.currentUserId
          );

          const unpaidExpenses = tripData.expenses.filter(expense =>
            expense.status === 'pending' ||
            (expense.participants && expense.participants.some((p: any) => !p.is_paid))
          );

          const hasCategories = tripData.expenses.some(expense => expense.category);

          // Suggerimenti dinamici basati sui dati
          if (userExpenses.length > 0) {
            questions.push({
              text: `Le mie spese (${userExpenses.length})`,
              action: () => {
                const question = "Mostrami solo le spese che ho pagato io";
                setInput(question);
                handleSendMessage(question);
              }
            });
          }

          if (unpaidExpenses.length > 0) {
            questions.push({
              text: `Spese non saldate (${unpaidExpenses.length})`,
              action: () => {
                const question = "Quali spese non sono ancora state saldate?";
                setInput(question);
                handleSendMessage(question);
              }
            });
          }

          if (hasCategories) {
            questions.push({
              text: "Analisi per categoria",
              action: () => {
                const question = "Analizza le spese per categoria";
                setInput(question);
                handleSendMessage(question);
              }
            });
          }

          // Suggerimento budget sempre presente se ci sono spese
          questions.push({
            text: "Situazione budget",
            action: () => {
              const question = "Come va il nostro budget?";
              setInput(question);
              handleSendMessage(question);
            }
          });

          // Se ci sono molte spese, suggerisci consigli per risparmiare
          if (tripData.expenses.length > 5) {
            questions.push({
              text: "Consigli per risparmiare",
              action: () => {
                const question = "Hai consigli per risparmiare sui prossimi giorni?";
                setInput(question);
                handleSendMessage(question);
              }
            });
          }
        } else {
          // Nessuna spesa registrata
          questions.push({
            text: "Come tracciare le spese",
            action: () => {
              const question = "Come posso iniziare a tracciare le spese del viaggio?";
              setInput(question);
              handleSendMessage(question);
            }
          });

          questions.push({
            text: "Impostare un budget",
            action: () => {
              const question = "Come posso impostare un budget per il viaggio?";
              setInput(question);
              handleSendMessage(question);
            }
          });
        }
        break;

      case 'itinerary':
        // Suggerimenti specifici per l'itinerario
        if (tripData?.itinerary && tripData.itinerary.length > 0) {
          const totalActivities = tripData.itinerary.reduce((sum, day) =>
            sum + (day.activities ? day.activities.length : 0), 0
          );

          questions.push({
            text: `Itinerario completo (${tripData.itinerary.length} giorni)`,
            action: () => {
              const question = "Mostrami il mio itinerario completo";
              setInput(question);
              handleSendMessage(question);
            }
          });

          questions.push({
            text: "Attività di oggi",
            action: () => {
              const question = "Cosa abbiamo in programma oggi?";
              setInput(question);
              handleSendMessage(question);
            }
          });

          if (totalActivities > 0) {
            questions.push({
              text: `Tutte le attività (${totalActivities})`,
              action: () => {
                const question = "Mostrami tutte le attività pianificate";
                setInput(question);
                handleSendMessage(question);
              }
            });
          }

          questions.push({
            text: "Suggerimenti attività",
            action: () => {
              const question = "Hai suggerimenti per altre attività da fare?";
              setInput(question);
              handleSendMessage(question);
            }
          });
        } else {
          // Nessun itinerario pianificato
          questions.push({
            text: "Pianificare l'itinerario",
            action: () => {
              const question = "Come posso pianificare il mio itinerario?";
              setInput(question);
              handleSendMessage(question);
            }
          });

          questions.push({
            text: "Cosa fare a " + (tripData?.destination || "destinazione"),
            action: () => {
              const question = "Cosa posso fare a " + (tripData?.destination || "destinazione") + "?";
              setInput(question);
              handleSendMessage(question);
            }
          });
        }
        break;

      case 'accommodations':
        // Suggerimenti specifici per alloggi
        if (tripData?.accommodations && tripData.accommodations.length > 0) {
          questions.push({
            text: "Dettagli alloggi",
            action: () => {
              const question = "Mostrami i dettagli dei miei alloggi";
              setInput(question);
              handleSendMessage(question);
            }
          });

          questions.push({
            text: "Check-in/Check-out",
            action: () => {
              const question = "Quando sono i check-in e check-out?";
              setInput(question);
              handleSendMessage(question);
            }
          });
        }
        break;

      case 'transportation':
        // Suggerimenti specifici per trasporti
        if (tripData?.transportation && tripData.transportation.length > 0) {
          questions.push({
            text: "Info trasporti",
            action: () => {
              const question = "Mostrami le informazioni sui miei trasporti";
              setInput(question);
              handleSendMessage(question);
            }
          });

          questions.push({
            text: "Orari partenza",
            action: () => {
              const question = "Quali sono gli orari di partenza dei miei trasporti?";
              setInput(question);
              handleSendMessage(question);
            }
          });
        }
        break;

      default:
        // Suggerimenti generali per overview o altre sezioni
        questions.push({
          text: "Panoramica viaggio",
          action: () => {
            const question = "Dammi una panoramica completa del mio viaggio";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Cosa posso fare a " + (tripData?.destination || "destinazione"),
          action: () => {
            const question = "Cosa posso fare a " + (tripData?.destination || "destinazione") + "?";
            setInput(question);
            handleSendMessage(question);
          }
        });
    }

    // Aggiungi sempre suggerimenti cross-section utili (se non siamo già in quella sezione)

    // Itinerario (se non siamo nella sezione itinerary)
    if (currentSection !== 'itinerary' && tripData?.itinerary && tripData.itinerary.length > 0) {
      const totalActivities = tripData.itinerary.reduce((sum, day) =>
        sum + (day.activities ? day.activities.length : 0), 0
      );
      crossSectionQuestions.push({
        text: "Mostrami l'itinerario",
        action: () => {
          const question = "Mostrami il mio itinerario completo";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Alloggi (se non siamo nella sezione accommodations)
    if (currentSection !== 'accommodations' && tripData?.accommodations && tripData.accommodations.length > 0) {
      crossSectionQuestions.push({
        text: "Dettagli sui miei alloggi",
        action: () => {
          const question = "Mostrami i dettagli dei miei alloggi";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Trasporti (se non siamo nella sezione transportation)
    if (currentSection !== 'transportation' && tripData?.transportation && tripData.transportation.length > 0) {
      crossSectionQuestions.push({
        text: "Info sui miei trasporti",
        action: () => {
          const question = "Mostrami le informazioni sui miei trasporti";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Budget/Spese (se non siamo nella sezione expenses)
    if (currentSection !== 'expenses' && tripData?.expenses && tripData.expenses.length > 0) {
      crossSectionQuestions.push({
        text: "Situazione budget",
        action: () => {
          const question = "Come va il nostro budget?";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Suggerimenti per attività/destinazione sempre utili
    if (tripData?.destination) {
      crossSectionQuestions.push({
        text: "Cosa fare a " + tripData.destination,
        action: () => {
          const question = "Cosa posso fare a " + tripData.destination + "?";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Suggerimento generale sempre presente se non ci sono abbastanza suggerimenti specifici
    if (currentSection === 'overview' || questions.length < 2) {
      crossSectionQuestions.push({
        text: "Panoramica viaggio",
        action: () => {
          const question = "Dammi una panoramica completa del mio viaggio";
          setInput(question);
          handleSendMessage(question);
        }
      });
    }

    // Combina suggerimenti specifici (priorità alta) con cross-section (priorità bassa)
    // Mantieni sempre almeno 2 suggerimenti specifici se disponibili, poi aggiungi cross-section
    const maxSpecific = Math.min(questions.length, 4);
    const maxCrossSection = Math.max(0, 6 - maxSpecific);

    const finalQuestions = [
      ...questions.slice(0, maxSpecific),
      ...crossSectionQuestions.slice(0, maxCrossSection)
    ];

    setSuggestedQuestions(finalQuestions);
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
        className="fixed sm:bottom-4 bottom-[90px] right-4 bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 ai-float backdrop-blur-xl border border-purple-500/20 ai-button-hover"
        style={{ marginRight: '4%' }}
        aria-label="Apri assistente AI"
      >
        <div className="relative">
          <Sparkles size={22} className="animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600 animate-pulse"></div>
        </div>
        <span className="sm:inline hidden font-medium">
          {contextLoaded ? 'AI Assistant' : 'AI Assistant (Loading...)'}
        </span>
      </button>
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
                  />
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
            placeholder="Ask me anything about your trip..."
            className="text-sm flex-1 px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-700/50 text-white placeholder-slate-400 shadow-sm ai-input-focus"
            disabled={isLoading}
            aria-label="Messaggio per l'assistente AI"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
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
