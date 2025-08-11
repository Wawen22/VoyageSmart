'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Sparkles, Settings, Info, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AIProvider } from '@/lib/services/aiProviderService';
import { useAIProvider } from '@/hooks/useAIProvider';

interface ProviderInfo {
  name: string;
  model: string;
  icon: React.ReactNode;
  description: string;
}

const PROVIDER_INFO: Record<AIProvider, ProviderInfo> = {
  'gemini': {
    name: 'Google Gemini 2.0 Flash Exp',
    model: 'gemini-2.0-flash-exp',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Modello nativo Google AI con capacità avanzate'
  },
  'openai': {
    name: 'OpenAI GPT-5-nano',
    model: 'gpt-5-nano',
    icon: <Bot className="h-5 w-5" />,
    description: 'Modello veloce ed efficiente tramite Azure OpenAI'
  },
  'deepseek': {
    name: 'DeepSeek R1',
    model: 'deepseek/deepseek-r1:free',
    icon: <Brain className="h-5 w-5" />,
    description: 'Modello di ragionamento avanzato via OpenRouter'
  },
  'gemini-openrouter': {
    name: 'Gemini 2.0 Flash Exp (OpenRouter)',
    model: 'google/gemini-2.0-flash-exp:free',
    icon: <Zap className="h-5 w-5" />,
    description: 'Gemini 2.0 Flash Exp tramite OpenRouter'
  }
};

export default function ActiveProviderDisplay() {
  const { currentProvider, availableProviders, setProvider, loading } = useAIProvider();
  const [updating, setUpdating] = useState(false);

  const handleProviderChange = async (newProvider: AIProvider) => {
    setUpdating(true);
    try {
      setProvider(newProvider);
      toast.success(`Provider cambiato a ${PROVIDER_INFO[newProvider].name}`);
      toast.info('La modifica è attiva per questa sessione. Per renderla permanente, aggiorna NEXT_PUBLIC_AI_DEFAULT_PROVIDER nel file .env.local');
    } catch (error) {
      toast.error('Errore nel cambio provider');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Caricamento configurazione...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentProviderInfo = PROVIDER_INFO[currentProvider];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Provider AI Attivo
        </CardTitle>
        <CardDescription>
          Seleziona il provider AI da utilizzare per le funzionalità AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Seleziona Provider:</label>
          <Select
            value={currentProvider}
            onValueChange={handleProviderChange}
            disabled={updating}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona un provider AI" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  <div className="flex items-center gap-2">
                    {PROVIDER_INFO[provider].icon}
                    <span>{PROVIDER_INFO[provider].name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Provider Display */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-blue-600">
              {currentProviderInfo.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-blue-800">
                {currentProviderInfo.name}
              </div>
              <div className="text-sm text-blue-600">
                Modello: {currentProviderInfo.model}
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Attivo
            </Badge>
          </div>

          <p className="text-sm text-blue-700">
            {currentProviderInfo.description}
          </p>
        </div>

        {/* Provider Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {availableProviders.map((provider) => {
            const info = PROVIDER_INFO[provider];
            const isActive = provider === currentProvider;

            return (
              <div
                key={provider}
                className={`p-3 rounded-md border-2 transition-colors ${
                  isActive
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {info.icon}
                  <span className="font-medium text-sm">{info.name}</span>
                  {isActive && (
                    <Badge variant="default" className="text-xs">
                      Attivo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Nota:</strong> La selezione del provider è temporanea per questa sessione.
              Per rendere permanente la modifica, aggiorna la variabile{' '}
              <code className="bg-gray-200 px-1 rounded text-xs">NEXT_PUBLIC_AI_DEFAULT_PROVIDER</code>{' '}
              nel file .env.local con il valore: <code className="bg-gray-200 px-1 rounded text-xs">"{currentProvider}"</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
