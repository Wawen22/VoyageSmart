'use client';

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { CheckIcon, ClockIcon, LightbulbIcon, RefreshCcwIcon, XIcon } from 'lucide-react';
import type { ProactiveSuggestion } from '@/lib/services/proactiveSuggestionService';
import { cn } from '@/lib/utils';

interface ProactiveSuggestionsTrayProps {
  activeSuggestions: ProactiveSuggestion[];
  snoozedSuggestions: ProactiveSuggestion[];
  recentCompletedSuggestions: ProactiveSuggestion[];
  retentionDays: number;
  onMarkRead: (id: string) => void;
  onSnooze: (id: string) => void;
  onRestore: (id: string) => void;
  onUncomplete: (id: string) => void;
}

export function ProactiveSuggestionsTray({
  activeSuggestions,
  snoozedSuggestions,
  recentCompletedSuggestions,
  retentionDays,
  onMarkRead,
  onSnooze,
  onRestore,
  onUncomplete
}: ProactiveSuggestionsTrayProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const totalCount =
    activeSuggestions.length + snoozedSuggestions.length + recentCompletedSuggestions.length;
  const activeSorted = useMemo(
    () => [...activeSuggestions].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [activeSuggestions]
  );
  const snoozedSorted = useMemo(
    () =>
      [...snoozedSuggestions].sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      ),
    [snoozedSuggestions]
  );
  const recentSorted = useMemo(
    () =>
      [...recentCompletedSuggestions].sort((a, b) =>
        (b.readAt ?? '').localeCompare(a.readAt ?? '')
      ),
    [recentCompletedSuggestions]
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const updateAnchor = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setAnchorRect(rect);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateAnchor();
    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [open, updateAnchor]);

  if (totalCount === 0) {
    return null;
  }

  const renderRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="relative z-50 flex w-full justify-center sm:w-auto sm:justify-end"
      ref={containerRef}
    >
      {/* overlay handled in portal below */}
      <button
        type="button"
        ref={buttonRef}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (!prev) {
              // will open
              setTimeout(updateAnchor, 0);
            }
            return next;
          });
        }}
        className={cn(
          'group inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground',
          open && 'border-primary/60 text-foreground shadow-md'
        )}
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary/15">
          <LightbulbIcon className="h-4 w-4" />
          {totalCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground shadow-sm">
              {totalCount}
            </span>
          )}
        </div>
        <span>Suggerimenti salvati</span>
      </button>

      {open && anchorRect && createPortal(
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />
          <Panel
            anchorRect={anchorRect}
            onClose={() => setOpen(false)}
            retentionDays={retentionDays}
            renderRelativeTime={renderRelativeTime}
            activeSorted={activeSorted}
            snoozedSorted={snoozedSorted}
            recentSorted={recentSorted}
            onMarkRead={onMarkRead}
            onSnooze={onSnooze}
            onRestore={onRestore}
            onUncomplete={onUncomplete}
          />
        </>,
        document.body
      )}
    </div>
  );
}

interface PanelProps {
  anchorRect: DOMRect;
  onClose: () => void;
  retentionDays: number;
  renderRelativeTime: (isoString?: string | null) => string;
  activeSorted: ProactiveSuggestion[];
  snoozedSorted: ProactiveSuggestion[];
  recentSorted: ProactiveSuggestion[];
  onMarkRead: (id: string) => void;
  onSnooze: (id: string) => void;
  onRestore: (id: string) => void;
  onUncomplete: (id: string) => void;
}

function Panel({
  anchorRect,
  onClose,
  retentionDays,
  renderRelativeTime,
  activeSorted,
  snoozedSorted,
  recentSorted,
  onMarkRead,
  onSnooze,
  onRestore,
  onUncomplete
}: PanelProps) {
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const panelStyle = useMemo(() => {
    const width = Math.min(520, viewport.width ? viewport.width - 32 : 520);
    const topBase = anchorRect.bottom + 16;
    const top = Math.min(topBase, viewport.height - 120);

    let left = (viewport.width - width) / 2;

    if (viewport.width >= 768) {
      left = anchorRect.right - width;
      left = Math.max(16, Math.min(left, viewport.width - width - 16));
    }

    const style: CSSProperties = {
      top: Math.max(24, top),
      left,
      width
    };

    return style;
  }, [anchorRect, viewport.width, viewport.height]);

  return (
    <div
      className="fixed z-50 rounded-3xl border border-border/80 bg-card/95 p-5 shadow-xl backdrop-blur-lg"
      style={panelStyle}
    >
      <div className="space-y-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Centro suggerimenti</p>
            <p className="text-xs text-muted-foreground">
              Nascondi per concentrarti adesso, segna come fatto quando hai concluso.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-transparent p-1 text-red-500 transition hover:border-red-400 hover:text-red-600"
              aria-label="Chiudi centro suggerimenti"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activeSorted.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggerimenti attivi
            </h3>
            <ul className="space-y-2">
              {activeSorted.map((suggestion) => (
                <li
                  key={`${suggestion.id}-active`}
                  className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm shadow-sm"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{suggestion.title}</p>
                      <div className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {suggestion.message}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {typeof suggestion.metadata?.countdownDays === 'number' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Mancano {suggestion.metadata.countdownDays} giorni
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onMarkRead(suggestion.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Fatto
                      </button>
                      <button
                        type="button"
                        onClick={() => onSnooze(suggestion.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                        Nascondi
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border/60 pt-3" />
          </div>
        )}

        {snoozedSorted.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              In sospeso
            </h3>
            <ul className="space-y-2">
              {snoozedSorted.map((suggestion) => (
                <li
                  key={`${suggestion.id}-snoozed`}
                  className="rounded-2xl border border-border/70 bg-background/80 p-3 text-sm shadow-sm"
                >
                  <p className="font-semibold text-foreground">{suggestion.title}</p>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {suggestion.message}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onMarkRead(suggestion.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Segna come fatto
                    </button>
                    <button
                      type="button"
                      onClick={() => onRestore(suggestion.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <RefreshCcwIcon className="h-3.5 w-3.5" />
                      Mostra ora
                    </button>
                    {suggestion.createdAt && (
                      <span className="ml-auto inline-flex items-center rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        {renderRelativeTime(suggestion.createdAt)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border/60 pt-3" />
          </div>
        )}

        {recentSorted.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Completati di recente
            </h3>
            <ul className="space-y-2">
              {recentSorted.map((suggestion) => (
                <li
                  key={`${suggestion.id}-completed`}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-300/50 bg-emerald-50/70 p-3 text-sm shadow-sm dark:border-emerald-800/60 dark:bg-emerald-900/20"
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      {suggestion.title}
                    </p>
                    <div className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed whitespace-pre-line">
                      {suggestion.message}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-200/60">
                        Completato {renderRelativeTime(suggestion.readAt)}
                      </p>
                      <button
                        type="button"
                        onClick={() => onUncomplete(suggestion.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/20 hover:border-emerald-500"
                      >
                        <RefreshCcwIcon className="h-3.5 w-3.5" />
                        Ripristina
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              I suggerimenti completati restano qui per {retentionDays} giorni.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
