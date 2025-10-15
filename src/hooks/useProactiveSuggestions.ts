import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type {
  ProactiveSuggestion,
  ProactiveSuggestionStatus
} from '@/lib/services/proactiveSuggestionService';
import { createClientSupabase } from '@/lib/supabase-client';

type TriggerEvent = 'app_open' | 'location_ping';

interface TriggerOptions {
  trigger?: TriggerEvent;
  context?: Record<string, any>;
}

interface RefreshOptions {
  statuses?: ProactiveSuggestionStatus[];
  silent?: boolean;
}

interface UseProactiveSuggestionsResult {
  activeSuggestions: ProactiveSuggestion[];
  snoozedSuggestions: ProactiveSuggestion[];
  recentCompletedSuggestions: ProactiveSuggestion[];
  loading: boolean;
  error: string | null;
  retentionDays: number;
  trigger: (options?: TriggerOptions) => Promise<void>;
  refresh: (options?: RefreshOptions) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  snooze: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
}

const COMPLETED_RETENTION_DAYS = 3;

export function useProactiveSuggestions(): UseProactiveSuggestionsResult {
  const [allSuggestions, setAllSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const supabase = useMemo(() => createClientSupabase(), []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSuggestionsSafely = useCallback((next: ProactiveSuggestion[]) => {
    if (!isMountedRef.current) return;
    setAllSuggestions(next);
  }, []);

  const refresh = useCallback(
    async (options: RefreshOptions = {}) => {
      if (!options.silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        const url = new URL('/api/ai/proactive-suggestions', window.location.origin);
        if (options.statuses && options.statuses.length > 0) {
          url.searchParams.set('status', options.statuses.join(','));
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: session?.access_token
            ? {
                Authorization: `Bearer ${session.access_token}`
              }
            : undefined,
          credentials: 'include'
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load suggestions');
        }

        setSuggestionsSafely(payload.suggestions ?? []);
      } catch (fetchError) {
        console.error('Failed to refresh proactive suggestions', fetchError);
        if (isMountedRef.current) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unexpected error');
        }
      } finally {
        if (!options.silent && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [setSuggestionsSafely, supabase]
  );

  const mutateStatus = useCallback(
    async (id: string, status: ProactiveSuggestionStatus) => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        const response = await fetch(`/api/ai/proactive-suggestions/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({ status })
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to update suggestion');
        }

        if (isMountedRef.current) {
          setAllSuggestions((prev) =>
            prev.map((suggestion) => (suggestion.id === id ? payload.suggestion : suggestion))
          );
        }
      } catch (updateError) {
        console.error('Failed to update proactive suggestion', updateError);
        if (isMountedRef.current) {
          setError(updateError instanceof Error ? updateError.message : 'Unexpected error');
        }
      }
    },
    [supabase]
  );

  const trigger = useCallback(
    async (options?: TriggerOptions) => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        const response = await fetch('/api/ai/proactive-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({
            trigger: options?.trigger ?? 'app_open',
            context: options?.context
          })
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to trigger suggestions');
        }

        await refresh({ silent: true });
      } catch (fetchError) {
        console.error('Failed to trigger proactive suggestions', fetchError);
        if (isMountedRef.current) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unexpected error');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [refresh, supabase]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      await mutateStatus(id, 'read');
    },
    [mutateStatus]
  );

  const snooze = useCallback(
    async (id: string) => {
      await mutateStatus(id, 'dismissed');
    },
    [mutateStatus]
  );

  const restore = useCallback(
    async (id: string) => {
      await mutateStatus(id, 'delivered');
    },
    [mutateStatus]
  );

  const activeSuggestions = useMemo(
    () => allSuggestions.filter((suggestion) => suggestion.status === 'pending' || suggestion.status === 'delivered'),
    [allSuggestions]
  );

  const snoozedSuggestions = useMemo(
    () => allSuggestions.filter((suggestion) => suggestion.status === 'dismissed'),
    [allSuggestions]
  );

  const recentCompletedSuggestions = useMemo(() => {
    const now = new Date();
    return allSuggestions.filter((suggestion) => {
      if (suggestion.status !== 'read' || !suggestion.readAt) return false;
      const completedAt = typeof suggestion.readAt === 'string' ? parseISO(suggestion.readAt) : new Date(suggestion.readAt);
      return differenceInCalendarDays(now, completedAt) <= COMPLETED_RETENTION_DAYS;
    });
  }, [allSuggestions]);

  return {
    activeSuggestions,
    snoozedSuggestions,
    recentCompletedSuggestions,
    loading,
    error,
    retentionDays: COMPLETED_RETENTION_DAYS,
    trigger,
    refresh,
    markAsRead,
    snooze,
    restore
  };
}
