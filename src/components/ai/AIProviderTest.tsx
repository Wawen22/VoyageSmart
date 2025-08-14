'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Bot, Sparkles, CheckCircle, XCircle, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AIProvider } from '@/lib/services/aiProviderService';

interface TestResult {
  provider: AIProvider;
  success: boolean;
  response?: string;
  error?: string;
  duration: number;
}

export default function AIProviderTest() {
  const [testMessage, setTestMessage] = useState('Ciao! Puoi aiutarmi a pianificare un viaggio a Roma?');
  const [testing, setTesting] = useState<AIProvider | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);

  // Generate a valid UUID for testing
  const generateTestUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const testProvider = async (provider: AIProvider) => {
    if (!testMessage.trim()) {
      toast.error('Inserisci un messaggio di test');
      return;
    }

    setTesting(provider);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          tripId: generateTestUUID(), // Use a valid UUID for testing
          tripName: 'Test Trip',
          aiProvider: provider,
          isInitialMessage: false,
          currentSection: 'overview'
        })
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        const result: TestResult = {
          provider,
          success: true,
          response: data.message,
          duration
        };
        setResults(prev => [result, ...prev.filter(r => r.provider !== provider)]);
        const providerName = provider === 'gemini' ? 'Gemini' :
                             provider === 'openai' ? 'OpenAI GPT-5-nano' :
                             provider === 'deepseek' ? 'DeepSeek R1' :
                             'Gemini OpenRouter';
        toast.success(`${providerName} test completato con successo`);
      } else {
        throw new Error(data.error || 'Test fallito');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        provider,
        success: false,
        error: error.message,
        duration
      };
      setResults(prev => [result, ...prev.filter(r => r.provider !== provider)]);
      const providerName = provider === 'gemini' ? 'Gemini' :
                           provider === 'openai' ? 'OpenAI GPT-5-nano' :
                           provider === 'deepseek' ? 'DeepSeek R1' :
                           'Gemini OpenRouter';
      toast.error(`${providerName} test fallito: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const testAllProviders = async () => {
    await testProvider('gemini');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    await testProvider('openai');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    await testProvider('deepseek');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    await testProvider('gemini-openrouter');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl shadow-cyan-500/10">
        <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Bot className="h-5 w-5" />
            Test Provider AI
          </CardTitle>
          <CardDescription className="text-gray-300">
            Testa tutti i provider AI per verificare il loro funzionamento e confrontare le prestazioni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Messaggio di test */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Messaggio di test personalizzato
            </label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Inserisci un messaggio per testare i provider AI... (es: 'Aiutami a pianificare un viaggio a Roma')"
              rows={3}
              className="resize-none border-2 border-gray-600 bg-gray-700/50 text-white placeholder:text-gray-400 focus:border-cyan-400 transition-colors"
            />
            <p className="text-xs text-gray-400">
              💡 Suggerimento: Prova diversi tipi di richieste per testare le capacità di ogni provider
            </p>
          </div>

          {/* Pulsanti di test individuali */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Test Individuali
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={() => testProvider('gemini')}
                disabled={testing !== null}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-200"
              >
                {testing === 'gemini' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-yellow-300 font-medium">Avvia test Gemini</span>
              </Button>

              <Button
                onClick={() => testProvider('openai')}
                disabled={testing !== null}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-200"
              >
                {testing === 'openai' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                ) : (
                  <Bot className="h-4 w-4 text-green-400" />
                )}
                <span className="text-green-300 font-medium">Avvia test GPT-5-nano</span>
              </Button>

              <Button
                onClick={() => testProvider('deepseek')}
                disabled={testing !== null}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
              >
                {testing === 'deepseek' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                ) : (
                  <Brain className="h-4 w-4 text-purple-400" />
                )}
                <span className="text-purple-300 font-medium">Avvia test DeepSeek R1</span>
              </Button>

              <Button
                onClick={() => testProvider('gemini-openrouter')}
                disabled={testing !== null}
                variant="outline"
                className="flex items-center gap-2 h-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-200"
              >
                {testing === 'gemini-openrouter' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                ) : (
                  <Zap className="h-4 w-4 text-cyan-400" />
                )}
                <span className="text-cyan-300 font-medium">Avvia test Gemini OR</span>
              </Button>
            </div>
          </div>

          {/* Test completo */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Test Completo
            </h3>
            <Button
              onClick={testAllProviders}
              disabled={testing !== null}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl shadow-cyan-500/25"
            >
              {testing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Test in corso...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Testa tutti i provider
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Esegue il test su tutti i provider in sequenza con pausa di 1 secondo tra i test
            </p>
          </div>

          {/* Pulsante per pulire risultati */}
          {results.length > 0 && (
            <div className="pt-4 border-t border-gray-600">
              <Button
                onClick={clearResults}
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              >
                🗑️ Pulisci Risultati
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              Risultati Test
            </h3>
            <Badge variant="secondary" className="text-sm bg-gray-700/50 text-gray-300 border-gray-600/50">
              {results.length} test{results.length > 1 ? 's' : ''} completat{results.length > 1 ? 'i' : 'o'}
            </Badge>
          </div>
          <div className="grid gap-4">
            {results.map((result, index) => {
              const providerConfig = {
                'gemini': {
                  name: 'Google Gemini 2.0 Flash Exp',
                  icon: <Sparkles className="h-5 w-5" />,
                  gradient: 'from-yellow-400 to-orange-400',
                  bgColor: 'from-yellow-500/10 to-orange-500/10',
                  borderColor: 'border-yellow-500/30'
                },
                'openai': {
                  name: 'OpenAI GPT-5-nano',
                  icon: <Bot className="h-5 w-5" />,
                  gradient: 'from-green-400 to-emerald-400',
                  bgColor: 'from-green-500/10 to-emerald-500/10',
                  borderColor: 'border-green-500/30'
                },
                'deepseek': {
                  name: 'DeepSeek R1',
                  icon: <Brain className="h-5 w-5" />,
                  gradient: 'from-purple-400 to-pink-400',
                  bgColor: 'from-purple-500/10 to-pink-500/10',
                  borderColor: 'border-purple-500/30'
                },
                'gemini-openrouter': {
                  name: 'Gemini 2.0 Flash Exp (OpenRouter)',
                  icon: <Zap className="h-5 w-5" />,
                  gradient: 'from-cyan-400 to-blue-400',
                  bgColor: 'from-cyan-500/10 to-blue-500/10',
                  borderColor: 'border-cyan-500/30'
                }
              };

              const config = providerConfig[result.provider];

              return (
                <Card key={`${result.provider}-${index}`} className={`overflow-hidden bg-gradient-to-r ${config.bgColor} ${config.borderColor} border-2 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-200 bg-gray-800/50 backdrop-blur-sm`}>
                  <CardContent className="p-0">
                    <div className={`h-1 bg-gradient-to-r ${config.gradient}`}></div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient} text-white shadow-lg`}>
                            {config.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-white">{config.name}</h4>
                            <p className="text-sm text-gray-400">
                              ⏱️ {result.duration}ms
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Successo
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              Errore
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Contenuto della risposta */}
                      {result.success ? (
                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-gray-300">📝 Risposta:</h5>
                          <div className="p-4 bg-gray-700/30 backdrop-blur-sm rounded-lg border border-gray-600/50 text-sm leading-relaxed text-gray-200">
                            {result.response}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-red-400">❌ Errore:</h5>
                          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
