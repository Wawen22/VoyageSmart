# Implementazione Funzionalità AI per VoyageSmart

Questo documento descrive come implementare le funzionalità di intelligenza artificiale per VoyageSmart, come delineato nella Fase 3 della roadmap.

## Panoramica

VoyageSmart prevede diverse funzionalità AI per migliorare l'esperienza utente nella pianificazione dei viaggi:

1. **Generazione itinerari**: Suggerimenti automatici di itinerari basati su destinazione, durata e preferenze
2. **Ottimizzazione percorsi**: Organizzazione intelligente delle attività giornaliere per minimizzare gli spostamenti
3. **Analisi predittiva**: Previsioni su costi, affluenza e condizioni ottimali per le attività
4. **Assistente virtuale**: Chatbot per rispondere a domande e fornire suggerimenti

## Architettura Proposta

### 1. Integrazione API

Utilizzeremo principalmente l'API di OpenAI (GPT-4) o Google Gemini per le funzionalità di generazione testo e analisi. Ecco come strutturare l'integrazione:

```
Client <-> Next.js API Routes <-> OpenAI/Gemini API <-> Database Supabase
```

### 2. Componenti Principali

#### A. Servizio AI Core

Creare un servizio centralizzato per gestire le chiamate API:

```typescript
// src/lib/services/aiService.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function generateItinerary(destination: string, days: number, preferences: any) {
  try {
    const prompt = `Genera un itinerario dettagliato per un viaggio a ${destination} di ${days} giorni.
    Preferenze del viaggiatore: ${JSON.stringify(preferences)}.
    Fornisci un programma giornaliero con attività, orari suggeriti, luoghi da visitare e consigli pratici.
    Formatta la risposta in JSON con la seguente struttura:
    {
      "days": [
        {
          "day": 1,
          "activities": [
            {
              "name": "Nome attività",
              "startTime": "09:00",
              "endTime": "11:00",
              "location": "Luogo",
              "description": "Descrizione",
              "type": "cultural/food/nature/etc"
            }
          ]
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Sei un esperto di viaggi e pianificazione itinerari." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
}

export async function optimizeRoute(activities: any[], startLocation: string) {
  // Implementazione per ottimizzare l'ordine delle attività
  // Potrebbe utilizzare algoritmi come TSP (Traveling Salesman Problem)
  // o chiamate a servizi esterni come Google Directions API
}

export async function predictCrowds(location: string, date: string) {
  // Implementazione per prevedere l'affluenza in base a dati storici
  // e altri fattori come eventi, stagionalità, ecc.
}
```

#### B. API Endpoints

Creare endpoint API per esporre le funzionalità AI:

```typescript
// src/app/api/ai/generate-itinerary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/services/aiService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verifica abbonamento AI
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', session.user.id)
      .single();
      
    if (!subscription || subscription.tier !== 'ai') {
      return NextResponse.json(
        { error: 'AI features require AI subscription tier' },
        { status: 403 }
      );
    }
    
    // Processa la richiesta
    const { destination, days, preferences } = await request.json();
    
    if (!destination || !days) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const itinerary = await generateItinerary(destination, days, preferences);
    
    return NextResponse.json({ success: true, data: itinerary });
  } catch (error: any) {
    console.error('Error in generate-itinerary API:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary', details: error.message },
      { status: 500 }
    );
  }
}
```

#### C. Componenti UI

Creare componenti React per l'interazione con le funzionalità AI:

```typescript
// src/components/ai/ItineraryGenerator.tsx

'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

export default function ItineraryGenerator({ tripId, onItineraryGenerated }) {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateItinerary = async () => {
    if (!destination) {
      toast({
        title: 'Destination required',
        description: 'Please enter a destination for your trip',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          days,
          preferences: preferences.split(',').map(p => p.trim()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate itinerary');
      }

      const data = await response.json();
      
      // Passa l'itinerario generato al componente padre
      onItineraryGenerated(data.data);
      
      toast({
        title: 'Itinerary generated!',
        description: `We've created a ${days}-day itinerary for ${destination}`,
      });
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Itinerary Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Destination</label>
          <Input
            placeholder="e.g. Rome, Italy"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Number of Days: {days}</label>
          <Slider
            min={1}
            max={14}
            step={1}
            value={[days]}
            onValueChange={(value) => setDays(value[0])}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Preferences (comma separated)</label>
          <Textarea
            placeholder="e.g. museums, local food, outdoor activities"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
        </div>
        
        <Button 
          className="w-full" 
          onClick={generateItinerary}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate Itinerary</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 3. Assistente Virtuale (Chatbot)

Implementare un chatbot per assistere gli utenti:

```typescript
// src/components/ai/TravelAssistant.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function TravelAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente di viaggio. Come posso aiutarti oggi?',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Mi dispiace, ho avuto un problema nel rispondere. Puoi riprovare?',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Travel Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'flex-row-reverse'
                      : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <Bot className="h-4 w-4" />
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p>Thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Ask me anything about your trip..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
          />
          <Button size="icon" onClick={handleSend} disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Implementazione per Fasi

### Fase 1: Setup Iniziale

1. Configurare le chiavi API per OpenAI/Gemini
2. Creare il servizio AI core con funzioni di base
3. Implementare l'endpoint per la generazione di itinerari
4. Aggiornare il modello di abbonamento per includere il tier AI

### Fase 2: Integrazione UI

1. Creare il componente ItineraryGenerator
2. Integrarlo nella pagina di creazione/modifica viaggio
3. Implementare la visualizzazione e l'importazione degli itinerari generati
4. Aggiungere feedback visivo e gestione errori

### Fase 3: Funzionalità Avanzate

1. Implementare l'ottimizzazione dei percorsi
2. Aggiungere l'analisi predittiva per costi e affluenza
3. Sviluppare l'assistente virtuale con memoria contestuale
4. Integrare suggerimenti proattivi basati sui dati del viaggio

## Considerazioni Tecniche

### Gestione Token e Costi

Le API di AI hanno costi basati sull'utilizzo. È importante:

1. Implementare limiti di utilizzo per piano
2. Monitorare l'utilizzo dei token
3. Ottimizzare i prompt per ridurre i costi
4. Implementare caching per richieste comuni

### Privacy e Sicurezza

1. Non inviare dati personali sensibili alle API esterne
2. Implementare filtri per i contenuti generati
3. Ottenere consenso esplicito dagli utenti per l'utilizzo dei loro dati

### Prestazioni

1. Implementare caching lato server per risposte comuni
2. Utilizzare streaming per risposte lunghe
3. Mostrare feedback visivo durante l'elaborazione
4. Implementare fallback in caso di errori API

## Test e Valutazione

Prima del rilascio:

1. Testare la qualità delle risposte generate
2. Valutare l'accuratezza delle ottimizzazioni di percorso
3. Condurre test di usabilità con utenti reali
4. Monitorare i costi e l'utilizzo in ambiente di staging

## Roadmap Futura

Dopo l'implementazione iniziale:

1. Aggiungere personalizzazione basata sul comportamento dell'utente
2. Implementare analisi del sentiment per feedback
3. Sviluppare modelli specializzati per destinazioni specifiche
4. Integrare con più fonti di dati (meteo, eventi locali, recensioni)
