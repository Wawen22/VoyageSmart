'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AzureOpenAIDebug() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load configuration on mount
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/ai/config');
        const data = await response.json();
        if (data.success) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('Failed to load AI config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const testAzureConfig = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test the configuration
      const response = await fetch('/api/ai/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai' })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        provider: 'openai'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Caricamento configurazione...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Errore nel caricamento della configurazione
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Azure OpenAI Configuration Debug
          </CardTitle>
          <CardDescription>
            Verifica la configurazione di Azure OpenAI per GPT-5-nano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className="space-y-3">
            <h4 className="font-medium">Stato Configurazione:</h4>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Key:</span>
                {config.hasApiKey ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurata
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Mancante
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Azure Endpoint:</span>
                {config.hasEndpoint ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurato
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Mancante
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">API Version:</span>
                {config.hasApiVersion ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurata
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Deployment Name:</span>
                {config.hasDeploymentName ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurato
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Configurazione Azure:</span>
                {config.isAzureConfig ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Attiva
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Incompleta
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Details */}
          <div className="space-y-2">
            <h4 className="font-medium">Dettagli Configurazione:</h4>
            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
              <div>
                <strong>Endpoint:</strong> {config.endpoint || 'Non configurato'}
              </div>
              <div>
                <strong>API Version:</strong> {config.apiVersion}
              </div>
              <div>
                <strong>Deployment Name:</strong> {config.deploymentName}
              </div>
              <div>
                <strong>Model:</strong> {config.model}
              </div>
              <div>
                <strong>Full URL:</strong> {config.fullUrl || 'Non configurato'}
              </div>
              <div>
                <strong>API Key:</strong> {config.hasApiKey ? '***...***' : 'Non configurata'}
              </div>
            </div>
          </div>

          {/* Test Button */}
          <Button
            onClick={testAzureConfig}
            disabled={testing || !config.isAzureConfig}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test in corso...
              </>
            ) : (
              'Testa Configurazione Azure OpenAI'
            )}
          </Button>

          {/* Test Results */}
          {result && (
            <div className="space-y-2">
              <h4 className="font-medium">Risultato Test:</h4>
              <div className={`p-3 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Test Riuscito' : 'Test Fallito'}
                  </span>
                </div>
                <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message || result.error}
                </div>
              </div>
            </div>
          )}

          {/* Help */}
          {!config.isAzureConfig && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Configurazione Incompleta</span>
              </div>
              <div className="text-sm text-yellow-700">
                Per utilizzare Azure OpenAI, assicurati di aver configurato:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>NEXT_PUBLIC_OPENAI_API_KEY (la tua chiave API Azure)</li>
                  <li>NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT (l'endpoint del tuo servizio Azure)</li>
                  <li>NEXT_PUBLIC_AZURE_OPENAI_API_VERSION (opzionale, default: 2025-04-01-preview)</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
