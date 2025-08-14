import { useState, useEffect } from 'react';
import { AIProvider } from '@/lib/services/aiProviderService';

interface UseAIProviderReturn {
  currentProvider: AIProvider;
  availableProviders: AIProvider[];
  setProvider: (provider: AIProvider) => void;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing AI provider selection
 * Provides current provider, available providers, and methods to change provider
 */
export function useAIProvider(): UseAIProviderReturn {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini');
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get available providers from API
      const response = await fetch('/api/ai/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      const data = await response.json();
      if (data.success) {
        setAvailableProviders(data.providers);
        setCurrentProvider(data.defaultProvider);
      } else {
        throw new Error(data.error || 'Failed to load providers');
      }
    } catch (err: any) {
      console.error('Error loading AI providers:', err);
      setError(err.message);
      
      // Fallback to default values
      setAvailableProviders(['gemini', 'openai', 'deepseek', 'gemini-openrouter']);
      setCurrentProvider(process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER as AIProvider || 'gemini');
    } finally {
      setLoading(false);
    }
  };

  const setProvider = (provider: AIProvider) => {
    if (availableProviders.includes(provider)) {
      setCurrentProvider(provider);
      
      // Store in localStorage for session persistence
      try {
        localStorage.setItem('voyagesmart_ai_provider', provider);
      } catch (err) {
        console.warn('Failed to store provider preference:', err);
      }
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('voyagesmart_ai_provider') as AIProvider;
      if (stored && availableProviders.includes(stored)) {
        setCurrentProvider(stored);
      }
    } catch (err) {
      console.warn('Failed to load provider preference:', err);
    }
  }, [availableProviders]);

  return {
    currentProvider,
    availableProviders,
    setProvider,
    loading,
    error
  };
}
