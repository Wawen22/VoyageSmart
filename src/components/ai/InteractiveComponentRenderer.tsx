"use client";

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Calendar,
  ExternalLink,
  MapPin,
  Send,
  ChevronRight,
  Info as InfoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type InteractiveComponent,
  type InteractionDirective,
  type MapComponent,
  type DatePickerComponent,
  type QuickRepliesComponent,
  type InfoCardComponent,
  type MapPoint,
} from '@/lib/ai/interactiveDsl';

interface InteractiveComponentRendererProps {
  components: InteractiveComponent[];
  onSendMessage: (value: string) => Promise<void> | void;
}

const markdownComponents = {
  p: ({ children, ...props }: any) => (
    <p className="text-sm text-slate-200 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-white" {...props}>
      {children}
    </strong>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside space-y-1 text-sm text-slate-200" {...props}>
      {children}
    </ul>
  ),
};

function resolveDirectiveValue(
  directive: InteractionDirective,
  context: Record<string, string | number | undefined>
): string {
  let resolved = directive.value || '';
  Object.entries(context).forEach(([key, value]) => {
    if (value === undefined) return;
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    resolved = resolved.replace(placeholder, String(value));
  });
  return resolved;
}

function handleDirective(
  directive: InteractionDirective | null,
  context: Record<string, string | number | undefined>,
  onSendMessage: (value: string) => Promise<void> | void
) {
  if (!directive) return;

  const resolvedValue = resolveDirectiveValue(directive, context);

  if (directive.type === 'send_message') {
    onSendMessage(resolvedValue);
    return;
  }

  if (directive.type === 'open_url') {
    if (typeof window !== 'undefined') {
      window.open(resolvedValue, '_blank', 'noopener');
    }
  }
}

function MapComponentView({
  component,
  onSendMessage,
}: {
  component: MapComponent;
  onSendMessage: (value: string) => Promise<void> | void;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-600/40 rounded-xl p-4 space-y-4">
      <header className="flex items-start gap-2">
        <div className="mt-1 rounded-full bg-indigo-500/20 p-2 text-indigo-300">
          <MapPin size={16} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            {component.title || 'Luoghi suggeriti'}
          </h4>
          {component.subtitle && (
            <p className="text-xs text-slate-400 mt-1">{component.subtitle}</p>
          )}
          {component.description && (
            <p className="text-xs text-slate-400 mt-1">{component.description}</p>
          )}
        </div>
      </header>

      <div className="space-y-3">
        {component.points.map((point) => (
          <div
            key={point.id || point.label}
            className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{point.label}</p>
                {point.address && <p className="text-xs text-slate-400 mt-1">{point.address}</p>}
                {point.description && (
                  <p className="text-xs text-slate-400 mt-1">{point.description}</p>
                )}
              </div>
              {point.action && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-200 hover:bg-slate-700/60"
                  onClick={() =>
                    handleDirective(
                      point.action,
                      buildPointContext(point),
                      onSendMessage
                    )
                  }
                >
                  {point.action.type === 'send_message' ? (
                    <>
                      <Send size={14} className="mr-2" />
                      Rispondi
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} className="mr-2" />
                      Apri mappa
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {component.cta && (
        <Button
          variant="secondary"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={() =>
            handleDirective(
              component.cta,
              {
                title: component.title,
              },
              onSendMessage
            )
          }
        >
          <ChevronRight size={14} className="mr-2" />
          {component.cta.label || 'Apri in mappa'}
        </Button>
      )}
    </div>
  );
}

function buildPointContext(point: MapPoint): Record<string, string | number | undefined> {
  return {
    label: point.label,
    address: point.address,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

function DatePickerComponentView({
  component,
  onSendMessage,
}: {
  component: DatePickerComponent;
  onSendMessage: (value: string) => Promise<void> | void;
}) {
  const [selectedDate, setSelectedDate] = useState(component.initialDate || '');

  const placeholder = component.placeholder || 'Scegli una data (YYYY-MM-DD)';
  const confirmLabel = component.confirmLabel || 'Conferma';

  const confirmDisabled = !selectedDate;

  return (
    <div className="bg-slate-800/60 border border-slate-600/40 rounded-xl p-4 space-y-3">
      <header className="flex items-start gap-2">
        <div className="mt-1 rounded-full bg-purple-500/20 p-2 text-purple-300">
          <Calendar size={16} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            {component.title || 'Seleziona una data'}
          </h4>
          {component.subtitle && (
            <p className="text-xs text-slate-400 mt-1">{component.subtitle}</p>
          )}
          {component.description && (
            <p className="text-xs text-slate-400 mt-1">{component.description}</p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="date"
          value={selectedDate}
          min={component.minDate}
          max={component.maxDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={placeholder}
        />
        <Button
          type="button"
          size="sm"
          disabled={confirmDisabled}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          onClick={() =>
            handleDirective(
              component.action ?? {
                type: 'send_message',
                value: selectedDate,
              },
              {
                selected_date: selectedDate,
              },
              onSendMessage
            )
          }
        >
          <Send size={14} className="mr-2" />
          {confirmLabel}
        </Button>
      </div>

      {component.footnote && (
        <p className="text-xs text-slate-500 leading-relaxed">{component.footnote}</p>
      )}
    </div>
  );
}

function QuickRepliesComponentView({
  component,
  onSendMessage,
}: {
  component: QuickRepliesComponent;
  onSendMessage: (value: string) => Promise<void> | void;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-600/40 rounded-xl p-4 space-y-3">
      {component.title && (
        <h4 className="text-sm font-semibold text-white">{component.title}</h4>
      )}
      <div className="flex flex-wrap gap-2">
        {component.options.map((option) => (
          <Button
            key={option.id || option.value}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-700/60"
            onClick={() => onSendMessage(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function InfoCardComponentView({
  component,
  onSendMessage,
}: {
  component: InfoCardComponent;
  onSendMessage: (value: string) => Promise<void> | void;
}) {
  const actions = useMemo(
    () =>
      Array.isArray(component.actions) ? component.actions.filter(Boolean) : [],
    [component.actions]
  );

  return (
    <div className="bg-slate-800/60 border border-slate-600/40 rounded-xl p-4 space-y-3">
      <header className="flex items-start gap-2">
        <div className="mt-1 rounded-full bg-emerald-500/20 p-2 text-emerald-300">
          <InfoIcon size={16} />
        </div>
        <div className="flex-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {component.content}
          </ReactMarkdown>
        </div>
      </header>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <Button
              key={action.label || action.value || index}
              size="sm"
              variant={action.type === 'send_message' ? 'default' : 'outline'}
              className={
                action.type === 'send_message'
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'border-slate-600 text-slate-200 hover:bg-slate-700/60'
              }
              onClick={() =>
                handleDirective(action, {}, onSendMessage)
              }
            >
              {action.type === 'send_message' ? (
                <Send size={14} className="mr-2" />
              ) : (
                <ExternalLink size={14} className="mr-2" />
              )}
              {action.label || (action.type === 'send_message' ? 'Invia' : 'Apri')}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function InteractiveComponentRenderer({
  components,
  onSendMessage,
}: InteractiveComponentRendererProps) {
  if (!components || components.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {components.map((component) => {
        switch (component.type) {
          case 'map':
            return (
              <MapComponentView
                key={component.id || `${component.type}-${component.title}`}
                component={component}
                onSendMessage={onSendMessage}
              />
            );
          case 'date_picker':
            return (
              <DatePickerComponentView
                key={component.id || `${component.type}-${component.title}`}
                component={component}
                onSendMessage={onSendMessage}
              />
            );
          case 'quick_replies':
            return (
              <QuickRepliesComponentView
                key={component.id || `${component.type}-${component.title}`}
                component={component}
                onSendMessage={onSendMessage}
              />
            );
          case 'info_card':
            return (
              <InfoCardComponentView
                key={component.id || `${component.type}-${component.title}`}
                component={component}
                onSendMessage={onSendMessage}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default InteractiveComponentRenderer;
