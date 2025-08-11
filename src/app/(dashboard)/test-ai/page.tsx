'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Bot,
  Settings,
  TestTube,
  Activity,
  Info,
  Sparkles,
  Brain,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Network,
  Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AIProviderTest from '@/components/ai/AIProviderTest';
import AzureOpenAIDebug from '@/components/ai/AzureOpenAIDebug';
import ActiveProviderDisplay from '@/components/ai/ActiveProviderDisplay';

export default function TestAIPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Statistiche mock per la dashboard
  const stats = [
    {
      title: 'Provider Attivi',
      value: '4',
      description: 'Gemini, OpenAI, DeepSeek, Gemini OR',
      icon: <Cpu className="h-5 w-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Stato Sistema',
      value: 'Operativo',
      description: 'Tutti i servizi funzionanti',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Latenza Media',
      value: '~2.3s',
      description: 'Tempo di risposta medio',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    },
    {
      title: 'Sicurezza',
      value: 'Protetto',
      description: 'Chiavi API configurate',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header moderno */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-cyan-500/25">
              <TestTube className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              AI Testing Center
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Centro di controllo per testare, configurare e monitorare tutti i provider AI di VoyageSmart
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className={`${stat.borderColor} ${stat.bgColor} border-2 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-200 hover:scale-105 bg-gray-800/50 backdrop-blur-sm`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                    <div className={`${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm text-gray-300 data-[state=active]:text-white">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Panoramica</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm text-gray-300 data-[state=active]:text-white">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Test Provider</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm text-gray-300 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurazione</span>
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm text-gray-300 data-[state=active]:text-white">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Debug</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <TestingTab />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <ConfigTab />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <DebugTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente Overview Tab
function OverviewTab() {
  const providers = [
    {
      name: 'Google Gemini 2.0 Flash Exp',
      description: 'Modello nativo Google AI con capacità avanzate di ragionamento',
      icon: <Sparkles className="h-6 w-6" />,
      status: 'active',
      model: 'gemini-2.0-flash-exp',
      features: ['Multimodale', 'Veloce', 'Creativo'],
      color: 'from-yellow-400 to-orange-400'
    },
    {
      name: 'OpenAI GPT-5-nano',
      description: 'Modello veloce ed efficiente tramite Azure OpenAI',
      icon: <Bot className="h-6 w-6" />,
      status: 'active',
      model: 'gpt-5-nano',
      features: ['Veloce', 'Efficiente', 'Preciso'],
      color: 'from-green-400 to-emerald-400'
    },
    {
      name: 'DeepSeek R1',
      description: 'Modello di ragionamento avanzato via OpenRouter',
      icon: <Brain className="h-6 w-6" />,
      status: 'active',
      model: 'deepseek/deepseek-r1:free',
      features: ['Ragionamento', 'Logica', 'Analisi'],
      color: 'from-purple-400 to-pink-400'
    },
    {
      name: 'Gemini OpenRouter',
      description: 'Gemini 2.0 Flash Exp tramite OpenRouter',
      icon: <Zap className="h-6 w-6" />,
      status: 'active',
      model: 'google/gemini-2.0-flash-exp:free',
      features: ['Alternativo', 'Affidabile', 'Gratuito'],
      color: 'from-cyan-400 to-blue-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-105 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
            <CardContent className="p-0">
              <div className={`h-2 bg-gradient-to-r ${provider.color}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${provider.color} text-white shadow-lg`}>
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{provider.name}</h3>
                      <p className="text-sm text-gray-400">{provider.model}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Attivo
                  </Badge>
                </div>

                <p className="text-gray-300 mb-4">{provider.description}</p>

                <div className="flex flex-wrap gap-2">
                  {provider.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600/50">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Info className="h-5 w-5" />
            Informazioni Rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-cyan-400">🎯 Scopo:</strong> Testare e confrontare le prestazioni dei diversi provider AI
            </div>
            <div>
              <strong className="text-cyan-400">⚡ Velocità:</strong> Monitorare i tempi di risposta per ottimizzare l'esperienza utente
            </div>
            <div>
              <strong className="text-cyan-400">🔧 Configurazione:</strong> Gestire le impostazioni e le chiavi API in modo sicuro
            </div>
            <div>
              <strong className="text-cyan-400">📊 Qualità:</strong> Valutare la qualità delle risposte per ogni provider
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Testing Tab
function TestingTab() {
  return (
    <div className="space-y-6">
      {/* Header della sezione test */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <TestTube className="h-5 w-5" />
            Test dei Provider AI
          </CardTitle>
          <CardDescription className="text-gray-300">
            Esegui test completi per verificare il funzionamento di tutti i provider AI configurati
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Componente di test principale */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
        <AIProviderTest />
      </div>

      {/* Guida ai test */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
              <h4 className="font-semibold text-blue-400">Personalizza il Messaggio</h4>
            </div>
            <p className="text-sm text-gray-300">
              Modifica il messaggio di test per verificare come ogni provider risponde a diversi tipi di richieste
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
              <h4 className="font-semibold text-purple-400">Esegui i Test</h4>
            </div>
            <p className="text-sm text-gray-300">
              Testa singolarmente ogni provider o esegui un test completo di tutti i provider contemporaneamente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
              <h4 className="font-semibold text-orange-400">Confronta i Risultati</h4>
            </div>
            <p className="text-sm text-gray-300">
              Analizza le risposte, i tempi di risposta e la qualità per scegliere il provider migliore
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente Config Tab
function ConfigTab() {
  return (
    <div className="space-y-6">
      {/* Header della sezione configurazione */}
      <Card className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-indigo-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-400">
            <Settings className="h-5 w-5" />
            Configurazione Provider AI
          </CardTitle>
          <CardDescription className="text-gray-300">
            Gestisci le impostazioni e seleziona il provider AI predefinito per l'applicazione
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Componente di configurazione principale */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
        <ActiveProviderDisplay />
      </div>

      {/* Informazioni di configurazione */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Configurazione Chiavi API
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <div className="text-sm">
              <strong className="text-yellow-400">File di configurazione:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-xs text-yellow-300">.env.local</code>
            </div>
            <div className="text-sm space-y-2">
              <div><strong className="text-yellow-400">Gemini:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300">NEXT_PUBLIC_GEMINI_API_KEY</code></div>
              <div><strong className="text-yellow-400">OpenAI:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300">NEXT_PUBLIC_OPENAI_API_KEY</code></div>
              <div><strong className="text-yellow-400">DeepSeek:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300">NEXT_PUBLIC_OPENROUTER_API_KEY</code></div>
              <div><strong className="text-yellow-400">Gemini OR:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300">NEXT_PUBLIC_OPENROUTER_GEMINI_API_KEY</code></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <div className="text-sm space-y-2">
              <div>• <strong className="text-green-400">Sicurezza:</strong> Non condividere mai le chiavi API</div>
              <div>• <strong className="text-green-400">Backup:</strong> Mantieni copie sicure delle configurazioni</div>
              <div>• <strong className="text-green-400">Rotazione:</strong> Rinnova periodicamente le chiavi API</div>
              <div>• <strong className="text-green-400">Monitoraggio:</strong> Controlla regolarmente l'utilizzo delle API</div>
              <div>• <strong className="text-green-400">Testing:</strong> Testa sempre dopo modifiche alle configurazioni</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variabili d'ambiente */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-200">
            <Cpu className="h-5 w-5" />
            Variabili d'Ambiente Richieste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/50 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-gray-700/50">
            <div className="space-y-1">
              <div># Provider predefinito</div>
              <div>NEXT_PUBLIC_AI_DEFAULT_PROVIDER=gemini-openrouter</div>
              <div></div>
              <div># Google AI (Gemini nativo)</div>
              <div>NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key</div>
              <div></div>
              <div># Azure OpenAI</div>
              <div>NEXT_PUBLIC_OPENAI_API_KEY=your-azure-openai-key</div>
              <div>NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=your-endpoint</div>
              <div></div>
              <div># OpenRouter (DeepSeek)</div>
              <div>NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-key</div>
              <div></div>
              <div># OpenRouter (Gemini)</div>
              <div>NEXT_PUBLIC_OPENROUTER_GEMINI_API_KEY=your-gemini-or-key</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Debug Tab
function DebugTab() {
  return (
    <div className="space-y-6">
      {/* Header della sezione debug */}
      <Card className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Network className="h-5 w-5" />
            Debug e Diagnostica
          </CardTitle>
          <CardDescription className="text-gray-300">
            Strumenti avanzati per diagnosticare problemi di connessione e configurazione
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Componente di debug principale */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
        <AzureOpenAIDebug />
      </div>

      {/* Informazioni di debug */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Problemi Comuni
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <div className="text-sm space-y-2">
              <div><strong className="text-orange-400">🔑 Chiavi API non valide:</strong> Verifica che le chiavi siano corrette e attive</div>
              <div><strong className="text-orange-400">🌐 Problemi di rete:</strong> Controlla la connessione internet e i firewall</div>
              <div><strong className="text-orange-400">⏱️ Timeout:</strong> Alcuni provider potrebbero essere temporaneamente lenti</div>
              <div><strong className="text-orange-400">💰 Quota esaurita:</strong> Verifica i limiti di utilizzo delle API</div>
              <div><strong className="text-orange-400">🔧 Configurazione:</strong> Assicurati che tutte le variabili d'ambiente siano impostate</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Info className="h-5 w-5" />
              Suggerimenti per il Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <div className="text-sm space-y-2">
              <div><strong className="text-blue-400">📊 Console del browser:</strong> Controlla i log per errori dettagliati</div>
              <div><strong className="text-blue-400">🔍 Network tab:</strong> Verifica le richieste HTTP e le risposte</div>
              <div><strong className="text-blue-400">⚡ Test singoli:</strong> Testa un provider alla volta per isolare i problemi</div>
              <div><strong className="text-blue-400">🔄 Riavvio:</strong> Riavvia il server di sviluppo dopo modifiche alle env</div>
              <div><strong className="text-blue-400">📝 Log dettagliati:</strong> Abilita il debug mode per log più verbosi</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status dei servizi */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-200">
            <Activity className="h-5 w-5" />
            Status dei Servizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Google AI', status: 'operational', url: 'https://ai.google.dev' },
              { name: 'Azure OpenAI', status: 'operational', url: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service' },
              { name: 'OpenRouter', status: 'operational', url: 'https://openrouter.ai' },
              { name: 'VoyageSmart API', status: 'operational', url: '/api/health' }
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                <div>
                  <div className="font-medium text-sm text-white">{service.name}</div>
                  <div className="text-xs text-gray-400">{service.url}</div>
                </div>
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                  Operativo
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
