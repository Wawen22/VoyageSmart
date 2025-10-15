import { Fragment } from 'react';
import { CheckIcon, LightbulbIcon, XIcon } from 'lucide-react';
import type { ProactiveSuggestion } from '@/lib/services/proactiveSuggestionService';
import { cn } from '@/lib/utils';

interface ProactiveSuggestionsPanelProps {
  suggestions: ProactiveSuggestion[];
  onMarkRead: (id: string) => void;
  onSnooze: (id: string) => void;
  loading?: boolean;
}

const statusBadgeStyles: Record<ProactiveSuggestion['type'], string> = {
  upcoming_trip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  in_trip_activity: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
};

export function ProactiveSuggestionsPanel({
  suggestions,
  onMarkRead,
  onSnooze,
  loading
}: ProactiveSuggestionsPanelProps) {
  if (loading && suggestions.length === 0) {
    return (
      <div className="mb-6 animate-pulse rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-full bg-muted" />
            <div className="h-8 w-20 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!loading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-2 rounded-3xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <LightbulbIcon className="h-5 w-5 text-primary" />
            Suggerimenti proattivi
          </h2>
          <p className="text-sm text-muted-foreground">
            Segna come <strong className="font-semibold text-foreground">Fatto</strong> per archiviarli. I suggerimenti nascosti si spostano nella lampadina in alto a destra.
          </p>
        </div>
      </div>

      {suggestions.map((suggestion) => {
        const lines = suggestion.message.split('\n').filter(Boolean);
        const metadataTags = Array.isArray(suggestion.metadata?.tags)
          ? suggestion.metadata.tags.slice(0, 3)
          : [];

        return (
          <div
            key={suggestion.id}
            className="rounded-3xl border border-border bg-gradient-to-r from-card/80 via-card/70 to-card/80 p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LightbulbIcon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                        statusBadgeStyles[suggestion.type]
                      )}
                    >
                      {suggestion.type === 'upcoming_trip' ? 'In arrivo' : 'Durante il viaggio'}
                    </span>
                    {typeof suggestion.metadata?.countdownDays === 'number' && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Mancano {suggestion.metadata.countdownDays} giorni
                      </span>
                    )}
                    {metadataTags.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {metadataTags.map((tag, index) => (
                          <Fragment key={`${suggestion.id}-${tag}-${index}`}>
                            {index > 0 && <span className="opacity-50">•</span>}
                            <span>{String(tag)}</span>
                          </Fragment>
                        ))}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground">{suggestion.title}</h3>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {lines.map((line, index) => (
                      <p key={`${suggestion.id}-line-${index}`} className="whitespace-pre-line leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-none items-start gap-2">
                <button
                  onClick={() => onMarkRead(suggestion.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <CheckIcon className="h-4 w-4" />
                  Fatto
                </button>
                <button
                  onClick={() => onSnooze(suggestion.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  <XIcon className="h-4 w-4" />
                  Nascondi
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
