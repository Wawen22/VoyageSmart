'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Loader2, ArrowRight, Calendar, Check, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';
import ActivityPreviewCard from './ActivityPreviewCard';
import ActivityTimeline from './ActivityTimeline';
import TravelThemeButtons from './TravelThemeButtons';
import DaySelectionButtons from './DaySelectionButtons';
import ActivityEditModal from './ActivityEditModal';

// Tipi di messaggi nel wizard
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
};

// Tipo per le attività generate
type GeneratedActivity = {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  booking_reference?: string;
  priority: number;
  cost?: number;
  currency?: string;
  notes?: string;
  status: string;
  day_id: string;
  day_date: string; // Per visualizzazione
};

// Tipo per i giorni dell'itinerario
type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes?: string | null;
};

// Stato del wizard
type WizardState = {
  step: 'intro' | 'preferences' | 'days' | 'activities' | 'summary' | 'saving' | 'complete';
  preferences: {
    tripType?: string;
    interests?: string[];
    budget?: string;
    pace?: string;
    preferredTimes?: string[];
  };
  selectedDays: string[]; // IDs dei giorni selezionati
  generatedActivities: GeneratedActivity[];
};

// Props del componente
interface ItineraryWizardProps {
  tripId: string;
  tripData: any;
  itineraryDays: ItineraryDay[];
  onClose: () => void;
  onActivitiesGenerated: (activities: any[]) => void;
}

export default function ItineraryWizard({
  tripId,
  tripData,
  itineraryDays,
  onClose,
  onActivitiesGenerated
}: ItineraryWizardProps) {
  // Verifica se la chiave API di Gemini è configurata
  useEffect(() => {
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyCdjn1Ox8BqVZUMTWMo9ZMMUYiKpkAym2E';
    console.log('Chiave API Gemini configurata:', geminiApiKey ? 'Sì' : 'No');
    // Continuiamo anche se la chiave non è nelle variabili d'ambiente, usando quella hardcoded
  }, []);

  // Stato del wizard
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 'intro',
    preferences: {},
    selectedDays: [],
    generatedActivities: []
  });

  // Verifica che i dati del viaggio siano disponibili
  useEffect(() => {
    console.log('Dati viaggio disponibili:', tripData ? 'Sì' : 'No');
    console.log('Giorni itinerario disponibili:', itineraryDays?.length || 0);
    if (tripData) {
      console.log('Destinazione:', tripData.destination);
    }
  }, [tripData, itineraryDays]);

  // Stato dei messaggi
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `**Benvenuto nel Wizard di Generazione Attività!**\n\nTi guiderò nella creazione di un itinerario personalizzato per il tuo viaggio a ${tripData?.destination || 'destinazione'}.\n\nPossiamo iniziare?`,
      timestamp: new Date()
    }
  ]);

  // Stato dell'input utente
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingActivity, setEditingActivity] = useState<GeneratedActivity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Funzione per inviare un messaggio
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

    try {
      // Gestisci la risposta in base allo stato attuale del wizard
      await processUserInput(messageToSend);
    } catch (error: any) {
      console.error('Error processing message:', error);

      // Messaggio di errore
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Processa l'input dell'utente in base allo stato del wizard
  const processUserInput = async (message: string) => {
    // Logica diversa in base allo step attuale
    switch (wizardState.step) {
      case 'intro':
        // Passa allo step delle preferenze
        setWizardState(prev => ({ ...prev, step: 'preferences' }));

        // Aggiungi messaggio dell'assistente per chiedere le preferenze
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Ottimo! Per creare un itinerario personalizzato, ho bisogno di conoscere le tue preferenze.\n\n**Che tipo di attività ti interessano maggiormente?**\n\nPuoi scegliere tra:\n- Culturali (musei, monumenti, siti storici)\n- Naturalistiche (parchi, escursioni, spiagge)\n- Gastronomiche (ristoranti, degustazioni, corsi di cucina)\n- Shopping\n- Relax (spa, terme)\n- Avventura (sport, attività all'aperto)\n\nPuoi indicare più opzioni o selezionare uno dei temi predefiniti qui sotto!`,
          timestamp: new Date()
        }]);

        // Aggiungi un messaggio con i pulsanti dei temi
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `<travel-theme-buttons />`, // Questo verrà sostituito con i pulsanti dei temi
            timestamp: new Date()
          }]);
        }, 500);
        break;

      case 'preferences':
        // Salva le preferenze dell'utente
        const interests = extractInterests(message);
        setWizardState(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            interests
          },
          step: 'days'
        }));

        // Mostra i giorni disponibili con pulsanti di selezione
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Per quali giorni vorresti generare le attività?**\n\nSeleziona uno o più giorni per cui desideri generare attività:`,
          timestamp: new Date()
        }]);

        // Aggiungi un messaggio con i pulsanti di selezione dei giorni
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `<day-selection-buttons />`, // Questo verrà sostituito con i pulsanti di selezione
            timestamp: new Date()
          }]);
        }, 500);
        break;

      case 'days':
        // La selezione dei giorni ora avviene tramite i pulsanti interattivi
        // Questo caso viene mantenuto per retrocompatibilità, ma non dovrebbe essere più utilizzato
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Per favore, utilizza i pulsanti qui sopra per selezionare i giorni.`,
          timestamp: new Date()
        }]);
        break;

      case 'activities':
        // Salva le preferenze aggiuntive
        setWizardState(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            additionalPreferences: message
          },
          step: 'summary'
        }));

        // Mostra messaggio di generazione
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sto generando le attività in base alle tue preferenze... Questo potrebbe richiedere qualche istante.`,
          timestamp: new Date()
        }]);

        // Genera le attività
        await generateActivities();
        break;

      case 'summary':
        // Processa la conferma dell'utente
        const lowerMessage = message.toLowerCase().trim();

        // Verifica se l'utente ha confermato
        if (lowerMessage.includes('sì') ||
            lowerMessage.includes('si') ||
            lowerMessage === 'ok' ||
            lowerMessage.includes('procedi') ||
            lowerMessage.includes('conferma') ||
            lowerMessage === 's') {

          // Passa allo step di salvataggio
          setWizardState(prev => ({
            ...prev,
            step: 'saving'
          }));

          // Mostra messaggio di salvataggio
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Sto salvando le attività nel tuo itinerario...`,
            timestamp: new Date()
          }]);

          // Salva le attività
          await saveActivities();
        }
        // Verifica se l'utente ha rifiutato
        else if (lowerMessage.includes('no') ||
                lowerMessage === 'n' ||
                lowerMessage.includes('annulla') ||
                lowerMessage.includes('non salvare') ||
                lowerMessage.includes('non procedere')) {

          // Torna allo step delle preferenze
          setWizardState(prev => ({
            ...prev,
            step: 'preferences'
          }));

          // Mostra messaggio di annullamento
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Ho annullato il salvataggio delle attività. Vuoi generare nuove attività con preferenze diverse?`,
            timestamp: new Date()
          }]);
        }
        // L'utente ha dato una risposta non chiara
        else {
          // Chiedi di nuovo con opzioni più chiare
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Non ho capito se vuoi procedere con il salvataggio delle attività. Per favore, rispondi con "Sì" per salvare o "No" per annullare.`,
            timestamp: new Date()
          }]);
        }
        break;

      default:
        // Per gli altri stati, non fare nulla
        break;
    }
  };

  // Estrai gli interessi dal messaggio dell'utente
  const extractInterests = (message: string): string[] => {
    const interests: string[] = [];

    // Controlla per ogni categoria
    if (message.toLowerCase().includes('cultural') ||
        message.toLowerCase().includes('museo') ||
        message.toLowerCase().includes('monument') ||
        message.toLowerCase().includes('storic')) {
      interests.push('Culturali');
    }

    if (message.toLowerCase().includes('natural') ||
        message.toLowerCase().includes('parc') ||
        message.toLowerCase().includes('escursion') ||
        message.toLowerCase().includes('spiaggi')) {
      interests.push('Naturalistiche');
    }

    if (message.toLowerCase().includes('gastronom') ||
        message.toLowerCase().includes('ristoran') ||
        message.toLowerCase().includes('cib') ||
        message.toLowerCase().includes('cucin') ||
        message.toLowerCase().includes('mangiar')) {
      interests.push('Gastronomiche');
    }

    if (message.toLowerCase().includes('shopping') ||
        message.toLowerCase().includes('negozi') ||
        message.toLowerCase().includes('acquist')) {
      interests.push('Shopping');
    }

    if (message.toLowerCase().includes('relax') ||
        message.toLowerCase().includes('spa') ||
        message.toLowerCase().includes('term')) {
      interests.push('Relax');
    }

    if (message.toLowerCase().includes('avventur') ||
        message.toLowerCase().includes('sport') ||
        message.toLowerCase().includes('attiv') ||
        message.toLowerCase().includes('apert')) {
      interests.push('Avventura');
    }

    // Se non è stato rilevato nulla, aggiungi un interesse generico
    if (interests.length === 0) {
      interests.push('Generiche');
    }

    return interests;
  };

  // Funzioni di supporto per la selezione dei giorni sono state sostituite
  // dai componenti interattivi DaySelectionButtons

  // Genera le attività in base alle preferenze
  const generateActivities = async () => {
    try {
      // Prepara i dati per la richiesta
      const selectedDaysData = itineraryDays.filter(day =>
        wizardState.selectedDays.includes(day.id)
      );

      console.log('Generazione attività per giorni:', selectedDaysData.length);
      console.log('Preferenze:', wizardState.preferences);

      const requestData = {
        tripId,
        tripData,
        preferences: wizardState.preferences,
        days: selectedDaysData,
      };

      console.log('Dati richiesta API:', JSON.stringify(requestData).substring(0, 200) + '...');

      // Chiama l'API per generare le attività
      const response = await fetch('/api/ai/generate-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Risposta API ricevuta, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore API (text):', errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error('Errore API (parsed):', errorData);
        } catch (e) {
          console.error('Impossibile analizzare la risposta di errore come JSON');
        }

        throw new Error(`Failed to generate activities: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dati risposta API:', data);

      // Salva le attività generate
      setWizardState(prev => ({
        ...prev,
        generatedActivities: data.activities,
      }));

      // Mostra il riepilogo delle attività generate
      // Prima aggiungiamo un messaggio di introduzione
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '**Ecco le attività generate in base alle tue preferenze:**',
        timestamp: new Date()
      }]);

      // Poi aggiungiamo un messaggio speciale che mostrerà il componente ActivityTimeline
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '<activity-timeline-component />',
          timestamp: new Date()
        }]);

        // Infine aggiungiamo la domanda di conferma
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '**Vuoi salvare queste attività nel tuo itinerario?** (Sì/No)',
            timestamp: new Date()
          }]);
        }, 300);
      }, 300);
    } catch (error) {
      console.error('Error generating activities:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Mi dispiace, si è verificato un errore durante la generazione delle attività. Riprova più tardi.`,
        timestamp: new Date()
      }]);

      // Torna allo step delle preferenze
      setWizardState(prev => ({
        ...prev,
        step: 'preferences'
      }));
    }
  };

  // La funzione generateActivitiesSummary è stata rimossa
  // e sostituita con un approccio più diretto che aggiunge
  // messaggi separati per il titolo, il componente e la domanda di conferma

  // Funzione per modificare un'attività generata
  const handleEditActivity = (activity: GeneratedActivity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  // Funzione per salvare un'attività modificata
  const handleSaveEditedActivity = (updatedActivity: GeneratedActivity) => {
    // Aggiorna l'attività nell'elenco
    setWizardState(prev => ({
      ...prev,
      generatedActivities: prev.generatedActivities.map(activity => {
        // Identifica l'attività da aggiornare (usando una combinazione di proprietà come chiave)
        if (
          activity.day_id === updatedActivity.day_id &&
          activity.name === editingActivity?.name &&
          activity.start_time === editingActivity?.start_time
        ) {
          return updatedActivity;
        }
        return activity;
      })
    }));

    // Chiudi il modale
    setIsEditModalOpen(false);
    setEditingActivity(null);
  };

  // Funzione per rimuovere un'attività generata
  const handleRemoveActivity = (activity: GeneratedActivity) => {
    // Rimuovi l'attività dall'elenco
    setWizardState(prev => ({
      ...prev,
      generatedActivities: prev.generatedActivities.filter(a =>
        !(a.day_id === activity.day_id && a.name === activity.name && a.start_time === activity.start_time)
      )
    }));
  };

  // Salva le attività nel database
  const saveActivities = async () => {
    try {
      // Prepara i dati per la richiesta
      const activitiesToSave = wizardState.generatedActivities.map(activity => ({
        trip_id: tripId,
        day_id: activity.day_id,
        name: activity.name,
        type: activity.type,
        start_time: activity.start_time,
        end_time: activity.end_time,
        location: activity.location,
        booking_reference: activity.booking_reference || null,
        priority: activity.priority,
        cost: activity.cost || null,
        currency: activity.currency || 'EUR',
        notes: activity.notes || null,
        status: activity.status || 'planned',
      }));

      console.log('Salvando attività:', activitiesToSave.length);

      // Salva le attività una per una direttamente con Supabase
      const savedActivities = [];
      const errors = [];

      for (const activity of activitiesToSave) {
        console.log('Salvando attività:', activity.name);

        try {
          // Usa lo stesso approccio di handleSaveActivity
          const { data, error } = await supabase
            .from('activities')
            .insert([activity])
            .select();

          if (error) {
            console.error('Errore nel salvare attività:', activity.name, error);
            errors.push({ activity: activity.name, error: error.message });
          } else if (data && data.length > 0) {
            console.log('Attività salvata con successo:', data[0].name);
            savedActivities.push(data[0]);
          }
        } catch (activityError) {
          console.error('Eccezione nel salvare attività:', activity.name, activityError);
          errors.push({ activity: activity.name, error: activityError.message });
        }
      }

      console.log('Attività salvate:', savedActivities.length);
      console.log('Errori:', errors.length);

      // Prepara i dati di risposta in un formato simile a quello dell'API
      const data = {
        success: savedActivities.length > 0,
        activities: savedActivities,
        errors: errors.length > 0 ? errors : undefined,
      };

      // Verifica se ci sono stati errori parziali
      if (data.errors && data.errors.length > 0) {
        console.warn('Alcune attività non sono state salvate:', data.errors);

        // Aggiorna lo stato del wizard
        setWizardState(prev => ({
          ...prev,
          step: 'complete'
        }));

        // Mostra il messaggio di completamento con avviso
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Attività salvate parzialmente!**\n\nHo aggiunto ${data.activities.length} attività al tuo itinerario, ma ${data.errors.length} attività non sono state salvate a causa di errori.\n\nPuoi visualizzare e modificare le attività salvate nella sezione Itinerario del tuo viaggio.\n\nVuoi generare altre attività o hai finito?`,
          timestamp: new Date()
        }]);

        // Notifica il componente padre
        onActivitiesGenerated(data.activities);
      } else {
        // Aggiorna lo stato del wizard
        setWizardState(prev => ({
          ...prev,
          step: 'complete'
        }));

        // Mostra il messaggio di completamento
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Attività salvate con successo!**\n\nHo aggiunto ${data.activities.length} attività al tuo itinerario. Puoi visualizzarle e modificarle nella sezione Itinerario del tuo viaggio.\n\nVuoi generare altre attività o hai finito?`,
          timestamp: new Date()
        }]);

        // Notifica il componente padre
        onActivitiesGenerated(data.activities);
      }
    } catch (error) {
      console.error('Error saving activities:', error);

      // Estrai il messaggio di errore se disponibile
      let errorMessage = 'Mi dispiace, si è verificato un errore durante il salvataggio delle attività.';

      if (error instanceof Error) {
        errorMessage += ` Dettaglio: ${error.message}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${errorMessage}\n\nPotrebbe essere un problema temporaneo. Riprova più tardi o contatta l'assistenza se il problema persiste.`,
        timestamp: new Date()
      }]);

      // Torna allo step del riepilogo
      setWizardState(prev => ({
        ...prev,
        step: 'summary'
      }));
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
        className="fixed sm:bottom-4 bottom-20 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-primary/90 transition-all duration-300 animate-float"
        aria-label="Apri wizard itinerario"
      >
        <Calendar size={20} className="animate-pulse" />
        <span className="sm:inline hidden">Wizard Itinerario</span>
      </button>
    );
  }

  return (
    <>
      <div
        className={`
          fixed ${isExpanded ? 'inset-4' : 'sm:bottom-4 bottom-20 right-4 w-96 sm:h-[550px] h-[500px]'}
          bg-background border border-border rounded-lg shadow-xl z-50
          flex flex-col transition-all duration-300 ease-in-out
          glass-effect animate-fade-in
        `}
        aria-label="Wizard Generazione Attività"
      >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <Sparkles className="text-primary" size={18} />
          </div>
          <h3 className="font-medium text-sm">
            Wizard Generazione Attività
          </h3>
        </div>
        <div className="flex items-center gap-1">
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
                  {message.role === 'assistant' ? 'Wizard' : 'Tu'}
                </span>
                {message.timestamp && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Markdown rendering for assistant messages */}
              {message.role === 'assistant' ? (
                <div className="text-sm prose prose-sm dark:prose-invert max-w-full">
                  {message.content === '<travel-theme-buttons />' ? (
                    <TravelThemeButtons
                      onSelectTheme={(preferences) => {
                        // Imposta le preferenze selezionate
                        setWizardState(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            ...preferences
                          },
                          step: 'days'
                        }));

                        // Aggiungi un messaggio che mostra le preferenze selezionate
                        setMessages(prev => [...prev, {
                          role: 'user',
                          content: `Ho selezionato il tema: ${preferences.tripType}`,
                          timestamp: new Date()
                        }]);

                        // Mostra i giorni disponibili con pulsanti di selezione
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `**Per quali giorni vorresti generare le attività?**\n\nSeleziona uno o più giorni per cui desideri generare attività:`,
                          timestamp: new Date()
                        }]);

                        // Aggiungi un messaggio con i pulsanti di selezione dei giorni
                        setTimeout(() => {
                          setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `<day-selection-buttons />`,
                            timestamp: new Date()
                          }]);
                        }, 500);
                      }}
                    />
                  ) : message.content === '<day-selection-buttons />' ? (
                    <DaySelectionButtons
                      days={itineraryDays}
                      onSelectDays={(selectedDayIds) => {
                        // Imposta i giorni selezionati
                        setWizardState(prev => ({
                          ...prev,
                          selectedDays: selectedDayIds,
                          step: 'activities'
                        }));

                        // Aggiungi un messaggio che mostra i giorni selezionati
                        setMessages(prev => [...prev, {
                          role: 'user',
                          content: `Ho selezionato ${selectedDayIds.length} ${selectedDayIds.length === 1 ? 'giorno' : 'giorni'}`,
                          timestamp: new Date()
                        }]);

                        // Chiedi dettagli sulle attività
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `Grazie! Hai selezionato ${selectedDayIds.length} ${selectedDayIds.length === 1 ? 'giorno' : 'giorni'}.\n\n**Ora dimmi qualcosa in più sulle attività che vorresti fare:**\n\n- Hai preferenze per attività mattutine o serali?\n- C'è un budget specifico che vorresti rispettare per le attività?\n- Preferisci un ritmo rilassato o intenso per la giornata?\n\nPuoi rispondere liberamente con tutte le informazioni che ritieni utili.`,
                          timestamp: new Date()
                        }]);
                      }}
                    />
                  ) : message.content.includes('<activity-timeline-component />') ? (
                    <>
                      <ActivityTimeline
                        activities={wizardState.generatedActivities}
                        onEditActivity={handleEditActivity}
                        onRemoveActivity={handleRemoveActivity}
                      />
                    </>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-[80%] mr-4">
              <div className="flex items-center gap-2 mb-1">
                <Bot size={16} className="text-primary" />
                <span className="text-xs font-medium">Wizard</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <p className="text-sm">Sto elaborando la risposta...</p>
              </div>
            </div>
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
            placeholder="Scrivi la tua risposta..."
            className="text-xs flex-1 px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-background shadow-sm"
            disabled={isLoading || wizardState.step === 'saving'}
            aria-label="Messaggio per il wizard"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || wizardState.step === 'saving'}
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
          <Calendar size={12} className="inline mr-1" />
          Wizard Generazione Attività - Powered by Gemini
        </div>
      </div>

      {/* Modale di modifica attività */}
      <ActivityEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        activity={editingActivity}
        onSave={handleSaveEditedActivity}
      />
    </div>
    </>
  );
}
