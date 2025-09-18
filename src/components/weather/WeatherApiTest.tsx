'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WeatherApiTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  
  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test con coordinate di Roma
      const lat = 41.9028;
      const lon = 12.4964;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      
      // Testing weather API
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        setError(`Error: ${response.status} ${response.statusText} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather API Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">API Key: {apiKey ? `${apiKey.substring(0, 8)}...` : 'Not found'}</p>
            <Button onClick={testApi} disabled={loading}>
              {loading ? 'Testing...' : 'Test API'}
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded">
              <p className="text-destructive">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-muted rounded">
              <pre className="text-xs overflow-auto max-h-60">{result}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
