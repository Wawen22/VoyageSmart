'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Loader2, ArrowRight, Calendar, Check, Edit, Trash, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormattedAIResponse from './FormattedAIResponse';
import { supabase } from '@/lib/supabase';
import ActivityPreviewCard from './ActivityPreviewCard';
import ActivityTimeline from './ActivityTimeline';
import ActivityMapView from './ActivityMapView';
import TravelThemeButtons from './TravelThemeButtons';
import DaySelectionButtons from './DaySelectionButtons';
import ActivityEditModal from './ActivityEditModal';
import WizardActionButtons from './WizardActionButtons';

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
  coordinates?: { x: number; y: number } | null; // Coordinate per la mappa
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
  step: 'intro' | 'preferences' | 'days' | 'activities' | 'summary' | 'editing' | 'saving' | 'complete';
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
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyAipZkwXFf2avc1rHh5ViKbWZ60uIzjLKk';
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
      content: `🎯 **Benvenuto nel Wizard Itinerario AI!**\n\nSono qui per aiutarti a creare un itinerario personalizzato per il tuo viaggio a **${tripData?.destination || 'destinazione'}**.\n\n**Come funziona:**\n1. 🎨 Sceglierai il tema del tuo viaggio\n2. 📅 Selezionerai i giorni per cui generare attività\n3. ✨ Potrai aggiungere richieste specifiche\n4. 🚀 L'AI creerà un itinerario su misura per te\n\n**Pronto per iniziare?**`,
      timestamp: new Date()
    },
    {
      role: 'assistant',
      content: '<start-button />',
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

  // Funzione per gestire le azioni dei pulsanti del wizard
  const handleWizardAction = async (action: string) => {
    switch (action) {
      case 'start':
        // Inizia il wizard passando allo step delle preferenze
        await processUserInput('Iniziamo!');
        break;
      case 'generate':
        // Genera le attività
        await processUserInput('GENERA ATTIVITÀ');
        break;
      case 'edit':
        // Passa allo step di editing
        await processUserInput('Modifica');
        break;
      case 'save':
        // Salva le attività
        await processUserInput('Salva');
        break;
      case 'restart':
        // Ricomincia il wizard
        setWizardState({
          step: 'intro',
          preferences: {},
          selectedDays: [],
          generatedActivities: []
        });
        setMessages([
          {
            role: 'assistant',
            content: `🎯 **Benvenuto nel Wizard Itinerario AI!**\n\nSono qui per aiutarti a creare un itinerario personalizzato per il tuo viaggio a **${tripData?.destination || 'destinazione'}**.\n\n**Come funziona:**\n1. 🎨 Sceglierai il tema del tuo viaggio\n2. 📅 Selezionerai i giorni per cui generare attività\n3. ✨ Potrai aggiungere richieste specifiche\n4. 🚀 L'AI creerà un itinerario su misura per te\n\n**Pronto per iniziare?**`,
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: '<start-button />',
            timestamp: new Date()
          }
        ]);
        break;
    }
  };

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
        // Controlla se l'utente ha scritto "GENERA ATTIVITÀ" per procedere
        const normalizedMessage = message.toUpperCase().replace(/[àáâãäå]/g, 'A').replace(/[èéêë]/g, 'E').replace(/[ìíîï]/g, 'I').replace(/[òóôõö]/g, 'O').replace(/[ùúûü]/g, 'U');
        if (normalizedMessage.includes('GENERA ATTIVITA') || normalizedMessage.includes('GENERA') || normalizedMessage.includes('PROCEDI') || normalizedMessage.includes('CREA ITINERARIO')) {
          // Passa alla generazione delle attività
          setWizardState(prev => ({ ...prev, step: 'summary' }));

          // Mostra messaggio di generazione
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Perfetto! Sto generando le attività in base a tutte le tue richieste specifiche... Questo potrebbe richiedere qualche istante.`,
            timestamp: new Date()
          }]);

          // Genera le attività
          await generateActivities();
        } else {
          // Accumula le preferenze aggiuntive dell'utente
          const currentPreferences = wizardState.preferences.additionalPreferences || '';
          const newPreferences = currentPreferences ? `${currentPreferences}\n${message}` : message;

          setWizardState(prev => ({
            ...prev,
            preferences: {
              ...prev.preferences,
              additionalPreferences: newPreferences
            }
          }));

          // Conferma che hai ricevuto le richieste e chiedi se ce ne sono altre
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ **Richiesta aggiunta con successo!**\n\n**📝 Richieste raccolte finora:**\n${newPreferences.split('\n').map(req => `• ${req}`).join('\n')}\n\n**Vuoi aggiungere altre richieste specifiche?**\n\nPuoi continuare a scrivere altre richieste (orari, luoghi, attività specifiche) oppure cliccare il pulsante qui sotto quando sei pronto per creare l'itinerario.`,
            timestamp: new Date()
          }]);

          // Aggiungi il pulsante "GENERA ATTIVITÀ"
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '<generate-button />',
              timestamp: new Date()
            }]);
          }, 500);
        }
        break;

      case 'summary':
        // Processa la risposta dell'utente riguardo alla modifica o al salvataggio
        const lowerMessage = message.toLowerCase().trim();

        // Verifica se l'utente vuole salvare direttamente
        if (lowerMessage.includes('salva') ||
            lowerMessage.includes('sì') ||
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
        // Verifica se l'utente vuole continuare a modificare
        else if (lowerMessage.includes('modifica') ||
                lowerMessage.includes('edit') ||
                lowerMessage.includes('cambia') ||
                lowerMessage.includes('sistema')) {

          // Passa allo step di editing
          setWizardState(prev => ({
            ...prev,
            step: 'editing'
          }));

          // Mostra messaggio di editing
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Puoi modificare le attività cliccando su di esse nella timeline. Quando hai finito, rispondi "Fatto" o "Salva" per procedere con il salvataggio.`,
            timestamp: new Date()
          }]);
        }
        // Verifica se l'utente ha rifiutato completamente
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
            content: `Non ho capito cosa vuoi fare. Per favore, rispondi con:\n- "Modifica" per continuare a modificare le attività\n- "Salva" per salvare le attività nel tuo itinerario\n- "No" per annullare e tornare alle preferenze`,
            timestamp: new Date()
          }]);
        }
        break;

      case 'editing':
        // Processa la risposta dell'utente dopo la fase di editing
        const editingResponse = message.toLowerCase().trim();

        // Verifica se l'utente ha finito di modificare
        if (editingResponse.includes('fatto') ||
            editingResponse.includes('salva') ||
            editingResponse.includes('ok') ||
            editingResponse.includes('procedi') ||
            editingResponse.includes('conferma')) {

          // Passa allo step di salvataggio
          setWizardState(prev => ({
            ...prev,
            step: 'saving'
          }));

          // Mostra messaggio di salvataggio
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Sto salvando le attività modificate nel tuo itinerario...`,
            timestamp: new Date()
          }]);

          // Salva le attività
          await saveActivities();
        }
        // Verifica se l'utente vuole annullare
        else if (editingResponse.includes('annulla') ||
                editingResponse.includes('no') ||
                editingResponse.includes('non salvare')) {

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
        // L'utente ha dato una risposta non chiara o sta ancora modificando
        else {
          // Ricorda all'utente come procedere
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Continua pure a modificare le attività. Quando hai finito, rispondi "Fatto" o "Salva" per procedere con il salvataggio.`,
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

        // Aggiungiamo un messaggio che offre la possibilità di modificare le attività
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '**Cosa vuoi fare con queste attività?**\n\n- **Modifica**: Puoi modificare un\'attività cliccando su di essa\n- **Salva**: Salva le attività nel tuo itinerario\n- **Ricomincia**: Genera un nuovo set di attività con preferenze diverse',
            timestamp: new Date()
          }]);

          // Aggiungi i pulsanti di azione finali
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '<final-buttons />',
              timestamp: new Date()
            }]);
          }, 500);
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

  // Funzione per aggiornare le coordinate di un'attività
  const handleUpdateCoordinates = (activity: GeneratedActivity, coordinates: { x: number; y: number }) => {
    console.log(`Aggiornamento coordinate per "${activity.name}":`, coordinates);

    // Aggiorna le coordinate dell'attività
    setWizardState(prev => ({
      ...prev,
      generatedActivities: prev.generatedActivities.map(a => {
        if (a.day_id === activity.day_id && a.name === activity.name && a.start_time === activity.start_time) {
          return { ...a, coordinates };
        }
        return a;
      })
    }));
  };

  // Salva le attività nel database
  const saveActivities = async () => {
    try {
      // Prepara i dati per la richiesta
      const activitiesToSave = wizardState.generatedActivities.map(activity => {
        // Prepara l'oggetto base
        const activityData: any = {
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
        };

        // Aggiungi le coordinate se disponibili
        if (activity.coordinates) {
          // Converti le coordinate nel formato point di PostgreSQL
          activityData.coordinates = `(${activity.coordinates.x},${activity.coordinates.y})`;
        }

        return activityData;
      });

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

  // Funzione per cancellare la conversazione e ripartire da zero
  const clearConversation = () => {
    if (window.confirm('Sei sicuro di voler cancellare questa conversazione e ripartire da zero?')) {
      // Reimposta lo stato del wizard
      setWizardState({
        step: 'intro',
        preferences: {},
        selectedDays: [],
        generatedActivities: []
      });

      // Reimposta i messaggi con solo il messaggio iniziale
      setMessages([{
        role: 'assistant',
        content: `**Benvenuto nel Wizard di Generazione Attività!**\n\nTi guiderò nella creazione di un itinerario personalizzato per il tuo viaggio a ${tripData?.destination || 'destinazione'}.\n\nPossiamo iniziare?`,
        timestamp: new Date()
      }]);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed sm:bottom-4 sm:right-[180px] bottom-[100px] right-4 bg-[#8B5CF6] text-white p-3 rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-[#7C3AED] transition-all duration-300 animate-float"
        style={{ marginRight: '4%' }}
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
          fixed ${isExpanded ? 'inset-4' : 'sm:bottom-4 sm:right-[180px] bottom-[70px] right-4 w-[400px] sm:h-[550px] h-[500px]'}
          bg-background border border-border rounded-lg shadow-xl z-[99]
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
          <button
            onClick={clearConversation}
            className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-destructive"
            title="Cancella conversazione"
            aria-label="Cancella conversazione"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
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
                ${message.content.includes('<activity-timeline-component />')
                  ? 'max-w-[95%] w-full' // Messaggi con mappa/timeline più larghi
                  : 'max-w-[80%]'}
                p-3 rounded-lg shadow-sm
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
                  {message.content === '<start-button />' ? (
                    <WizardActionButtons
                      type="start"
                      onAction={handleWizardAction}
                      isLoading={isLoading}
                    />
                  ) : message.content === '<generate-button />' ? (
                    <WizardActionButtons
                      type="generate"
                      onAction={handleWizardAction}
                      isLoading={isLoading}
                    />
                  ) : message.content === '<final-buttons />' ? (
                    <WizardActionButtons
                      type="final"
                      onAction={handleWizardAction}
                      isLoading={isLoading}
                      compact={!isExpanded} // Usa layout compatto quando non è espanso
                    />
                  ) : message.content === '<travel-theme-buttons />' ? (
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

                        // Chiedi dettagli sulle attività con esempi più specifici
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: `Grazie! Hai selezionato ${selectedDayIds.length} ${selectedDayIds.length === 1 ? 'giorno' : 'giorni'}.\n\n**Ora dimmi le tue richieste specifiche per le attività:**\n\nPuoi essere molto dettagliato! Ad esempio:\n- "Voglio fare colazione alle 9 di mattina in un posto tipico"\n- "Aggiungi un aperitivo alle 18:00 con vista panoramica"\n- "Visita al museo prima delle 16:00"\n- "Cena romantica dopo le 20:00"\n- "Attività rilassanti al mattino, più intense nel pomeriggio"\n\n**Scrivi tutte le tue richieste specifiche, orari preferiti, e qualsiasi dettaglio importante per le attività che vorresti fare.**\n\nQuando hai finito di scrivere tutte le tue richieste, scrivi "GENERA ATTIVITÀ" per procedere.`,
                          timestamp: new Date()
                        }]);
                      }}
                    />
                  ) : message.content.includes('<activity-timeline-component />') ? (
                    <>
                      <div className="-mx-3 -my-2"> {/* Espandi oltre i margini del messaggio */}
                        <Tabs defaultValue="timeline" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-2">
                            <TabsTrigger value="timeline" className="text-xs">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              Timeline
                            </TabsTrigger>
                            <TabsTrigger value="map" className="text-xs">
                              <Map className="h-3.5 w-3.5 mr-1.5" />
                              Mappa
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="timeline" className="mt-0 px-3">
                            <ActivityTimeline
                              activities={wizardState.generatedActivities}
                              onEditActivity={handleEditActivity}
                              onRemoveActivity={handleRemoveActivity}
                            />
                          </TabsContent>
                          <TabsContent value="map" className="mt-0">
                            <ActivityMapView
                              activities={wizardState.generatedActivities}
                              onMarkerClick={handleEditActivity}
                              onCoordinatesUpdate={handleUpdateCoordinates}
                            />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </>
                  ) : (
                    <FormattedAIResponse
                      content={message.content}
                      className="text-sm"
                    />
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
