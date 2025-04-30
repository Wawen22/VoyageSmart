'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `${getRandomGreeting()} per "${tripName || 'questo viaggio'}". Sto caricando le informazioni del tuo viaggio...`
    }
  ]);

  // Carica il contesto del viaggio all'avvio
  useEffect(() => {
    const loadContext = async () => {
      try {
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
  }, [tripId, tripName, tripData]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call API
      console.log('Sending message to API:', {
        message: input,
        tripId,
        tripName,
        hasTripData: !!tripData
      });

      // Prepara i dati da inviare all'API
      const apiData: any = {
        message: input,
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

      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Mi dispiace, non sono riuscito a elaborare una risposta.'
      }]);
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
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isExpanded) setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isMinimized) setIsMinimized(false);
  };

  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-50 flex items-center gap-2"
      >
        <Sparkles size={20} />
        <span>{contextLoaded ? 'Assistente AI' : 'Assistente AI (Caricamento...)'}</span>
      </button>
    );
  }

  return (
    <div
      className={`
        fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-80 h-[450px]'}
        bg-background border border-border rounded-lg shadow-lg z-50
        flex flex-col transition-all duration-300 ease-in-out
      `}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" size={18} />
          <h3 className="font-medium">
            {contextLoaded
              ? `Assistente Viaggio: ${tripName}`
              : <span className="flex items-center gap-1">Caricamento contesto <Loader2 size={14} className="animate-spin" /></span>
            }</h3>
          {/* Pulsante di test rimosso */}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <button onClick={toggleExpand} className="p-1 hover:bg-muted rounded">
              <Minimize2 size={16} />
            </button>
          ) : (
            <button onClick={toggleExpand} className="p-1 hover:bg-muted rounded">
              <Maximize2 size={16} />
            </button>
          )}
          <button onClick={toggleMinimize} className="p-1 hover:bg-muted rounded">
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
                max-w-[80%] p-3 rounded-lg
                ${message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-4'
                  : 'bg-muted mr-4'
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
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-[80%] mr-4">
              <div className="flex items-center gap-2 mb-1">
                <Bot size={16} className="text-primary" />
                <span className="text-xs font-medium">Assistente</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <p className="text-sm">Sto pensando...</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chiedi qualcosa sul tuo viaggio..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-white p-2 rounded-md disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
