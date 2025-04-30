'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';

type Message = {
  role: 'user' | 'model';
  parts: string;
  timestamp: Date;
};

type TripAssistantProps = {
  tripId: string;
  tripData: any;
};

export default function TripAssistant({ tripId, tripData }: TripAssistantProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: `Ciao! Sono il tuo assistente di viaggio per "${tripData?.name || 'questo viaggio'}". Come posso aiutarti oggi?`,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
      parts: input,
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
          history: messages.map(({ role, parts }) => ({ role, parts })),
          tripContext: tripData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'model',
        parts: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error in chat:', error);

      console.error('Error in chat:', error.message || 'Si è verificato un errore nella comunicazione con l\'assistente');

      const errorMessage: Message = {
        role: 'model',
        parts: 'Mi dispiace, ho avuto un problema nel rispondere. Puoi riprovare?',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
    if (expanded && !minimized) {
      setExpanded(false);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    if (minimized && !expanded) {
      setMinimized(false);
    }
  };

  if (minimized) {
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full p-3 shadow-lg z-50 flex items-center gap-2"
        onClick={toggleMinimize}
      >
        <Sparkles className="h-5 w-5" />
        <span>Assistente Viaggio</span>
      </Button>
    );
  }

  // Versione semplificata per debug
  console.log('Rendering TripAssistant with data:', tripData);

  return (
    <div className="fixed bottom-16 right-4 bg-blue-500 text-white p-4 rounded-lg z-50">
      Assistente AI Semplificato
      <Button
        className="ml-2 bg-white text-blue-500"
        onClick={() => alert('Assistente AI cliccato!')}
      >
        Test
      </Button>
    </div>
  );
}
