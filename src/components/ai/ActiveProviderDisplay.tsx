'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const { currentProvider, availableProviders, loading } = useAIProvider();



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
    <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl shadow-cyan-500/10">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Settings className="h-5 w-5" />
          Provider AI Attivo
        </CardTitle>
        <CardDescription className="text-gray-300">
          Provider AI attualmente configurato nel file .env.local
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">

        {/* Active Provider Display */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 p-6 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg">
              {currentProviderInfo.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-xl text-white mb-1">
                {currentProviderInfo.name}
              </div>
              <div className="text-sm text-cyan-300 font-medium">
                📋 Modello: {currentProviderInfo.model}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                🔧 Configurato in NEXT_PUBLIC_AI_DEFAULT_PROVIDER
              </div>
            </div>
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Attivo
            </Badge>
          </div>

          <p className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
            💡 {currentProviderInfo.description}
          </p>
        </div>

        {/* Provider Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Provider Disponibili
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {availableProviders.map((provider) => {
              const info = PROVIDER_INFO[provider];
              const isActive = provider === currentProvider;

              return (
                <div
                  key={provider}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                      : 'border-gray-600/50 bg-gray-700/30 hover:border-gray-500/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-500' : 'bg-gray-600'} text-white`}>
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium text-sm ${isActive ? 'text-cyan-300' : 'text-gray-200'}`}>
                        {info.name}
                      </span>
                      {isActive && (
                        <Badge variant="default" className="ml-2 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          Attivo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs ${isActive ? 'text-cyan-200' : 'text-gray-400'}`}>
                    {info.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-400" />
            <div className="text-sm text-gray-300">
              <strong className="text-yellow-400">Come cambiare provider:</strong>
              <br />
              Per modificare il provider AI attivo, aggiorna la variabile{' '}
              <code className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300 font-mono">
                NEXT_PUBLIC_AI_DEFAULT_PROVIDER
              </code>{' '}
              nel file <code className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300 font-mono">.env.local</code>
              <br />
              <span className="text-yellow-300">Valori possibili:</span>{' '}
              <code className="bg-gray-800 px-1 rounded text-xs text-green-300">"gemini"</code>,{' '}
              <code className="bg-gray-800 px-1 rounded text-xs text-green-300">"openai"</code>,{' '}
              <code className="bg-gray-800 px-1 rounded text-xs text-green-300">"deepseek"</code>,{' '}
              <code className="bg-gray-800 px-1 rounded text-xs text-green-300">"gemini-openrouter"</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
