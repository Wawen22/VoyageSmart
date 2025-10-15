/**
 * Interactive Component DSL utilities.
 *
 * This module defines the JSON-based DSL that large-language-model responses can use
 * to describe interactive UI components. The backend extracts the DSL block from the
 * raw model response and provides the parsed components alongside the formatted text
 * so that the frontend can render them safely.
 *
 * The DSL is intentionally small and typed to keep rendering predictable.
 *
 * Example block appended to the AI response:
 * [[AI_COMPONENTS {
 *   "version": "1.0",
 *   "components": [
 *     {
 *       "type": "map",
 *       "id": "restaurants-map",
 *       "title": "Opzioni vicino a te",
 *       "points": [
 *         {
 *           "label": "Trattoria Bella",
 *           "address": "Via Roma 42",
 *           "latitude": 45.068,
 *           "longitude": 7.671,
 *           "action": { "type": "open_url", "value": "https://maps.google.com/?q=45.068,7.671" }
 *         }
 *       ]
 *     }
 *   ]
 * }]]
 */

export type InteractiveComponentType = 'map' | 'date_picker' | 'quick_replies' | 'info_card';

export interface InteractionDirective {
  type: 'send_message' | 'open_url';
  /**
   * Value to send or URL to open depending on the directive type.
   * For `send_message`, the value will be dispatched back to the chat pipeline.
   */
  value: string;
  /** Optional human-readable label if needed on buttons. */
  label?: string;
}

export interface BaseInteractiveComponent {
  type: InteractiveComponentType;
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  /**
   * Optional note shown below the component – not rendered by default but
   * available for future extensions.
   */
  footnote?: string;
  metadata?: Record<string, unknown>;
}

export interface MapPoint {
  id?: string;
  label: string;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  action?: InteractionDirective;
}

export interface MapComponent extends BaseInteractiveComponent {
  type: 'map';
  points: MapPoint[];
  cta?: InteractionDirective;
}

export interface DatePickerComponent extends BaseInteractiveComponent {
  type: 'date_picker';
  /**
   * ISO date string bounds (YYYY-MM-DD).
   */
  minDate?: string;
  maxDate?: string;
  initialDate?: string;
  confirmLabel?: string;
  placeholder?: string;
  /**
   * Directive describing how to handle the selected date. Defaults to sending the ISO string.
   */
  action?: InteractionDirective;
}

export interface QuickReplyOption {
  id?: string;
  label: string;
  value: string;
  description?: string;
}

export interface QuickRepliesComponent extends BaseInteractiveComponent {
  type: 'quick_replies';
  options: QuickReplyOption[];
}

export interface InfoCardComponent extends BaseInteractiveComponent {
  type: 'info_card';
  icon?: string;
  content: string;
  actions?: InteractionDirective[];
}

export type InteractiveComponent =
  | MapComponent
  | DatePickerComponent
  | QuickRepliesComponent
  | InfoCardComponent;

export interface InteractiveComponentPayload {
  version: string;
  components: InteractiveComponent[];
}

export interface ExtractedInteractiveComponents {
  text: string;
  components: InteractiveComponent[];
}

const COMPONENT_BLOCK_REGEX = /\[\[AI_COMPONENTS\s+([\s\S]*?)\s*\]\]/gi;

const DEFAULT_VERSION = '1.0';

/**
 * Instructions appended to the system prompt so models know how to emit the DSL.
 */
export const INTERACTIVE_COMPONENTS_PROMPT = `
INTERACTIVE COMPONENT OUTPUT (IMPORTANT):
- When an interactive UI would help the traveller, append a block at the end of the response in this exact form:
  [[AI_COMPONENTS { "version": "1.0", "components": [ ... ] }]]
- The JSON must be valid, minified or pretty printed.
- Supported component types (property \`type\`):
    * "map" — provide a \`points\` array with name, optional address, and optional latitude/longitude. Include URLs via an \`action\`.
    * "date_picker" — include optional \`minDate\`, \`maxDate\`, and an \`action\` with type "send_message" to deliver the selected date (ISO format).
    * "quick_replies" — supply \`options\` with \`label\` and \`value\` that will be sent back to the assistant.
    * "info_card" — short informational card with \`content\` supporting markdown.
- NEVER place other text inside the block and do not surround it with markdown fences.
- Keep the textual answer meaningful even without the interactive block.
`;

/**
 * Extracts interactive components encoded in the LLM response and returns the clean text plus
 * the parsed components. Invalid or unknown component definitions are ignored.
 */
export function extractInteractiveComponents(rawText: string): ExtractedInteractiveComponents {
  if (!rawText || typeof rawText !== 'string') {
    return { text: rawText ?? '', components: [] };
  }

  const components: InteractiveComponent[] = [];
  let cleanText = rawText;

  for (const match of rawText.matchAll(COMPONENT_BLOCK_REGEX)) {
    const block = match[0];
    const jsonPayload = match[1];

    try {
      const parsed = JSON.parse(jsonPayload) as Partial<InteractiveComponentPayload>;

      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.components)) {
        continue;
      }

      const normalizedComponents = parsed.components
        .map(normalizeComponent)
        .filter((component): component is InteractiveComponent => component !== null);

      if (normalizedComponents.length > 0) {
        components.push(...normalizedComponents);
      }

      // Remove the block from the clean text once processed.
      cleanText = cleanText.replace(block, '').trim();
    } catch (error) {
      // If parsing fails we simply skip the block but keep the raw text.
      continue;
    }
  }

  return {
    text: cleanText.trim(),
    components,
  };
}

function normalizeComponent(component: any): InteractiveComponent | null {
  if (!component || typeof component !== 'object') {
    return null;
  }

  const base: BaseInteractiveComponent = {
    type: component.type,
    id: safeString(component.id),
    title: safeString(component.title),
    subtitle: safeString(component.subtitle),
    description: safeString(component.description),
    footnote: safeString(component.footnote),
    metadata: isPlainObject(component.metadata) ? component.metadata : undefined,
  };

  switch (component.type) {
    case 'map':
      if (!Array.isArray(component.points) || component.points.length === 0) {
        return null;
      }

      const points = component.points
        .map((point: any) => normalizeMapPoint(point))
        .filter((point: MapPoint | null): point is MapPoint => point !== null);

      if (points.length === 0) {
        return null;
      }

      return {
        ...base,
        type: 'map',
        points,
        cta: normalizeAction(component.cta),
      };

    case 'date_picker':
      return {
        ...base,
        type: 'date_picker',
        minDate: safeDate(component.minDate),
        maxDate: safeDate(component.maxDate),
        initialDate: safeDate(component.initialDate),
        confirmLabel: safeString(component.confirmLabel),
        placeholder: safeString(component.placeholder),
        action: normalizeAction(component.action) ?? {
          type: 'send_message',
          value: '{{selected_date}}',
        },
      };

    case 'quick_replies':
      if (!Array.isArray(component.options) || component.options.length === 0) {
        return null;
      }

      const options = component.options
        .map((option: any) => {
          const label = safeString(option.label);
          const value = safeString(option.value);
          if (!label || !value) return null;
          return {
            id: safeString(option.id),
            label,
            value,
            description: safeString(option.description),
          };
        })
        .filter((opt: QuickReplyOption | null): opt is QuickReplyOption => opt !== null);

      if (options.length === 0) {
        return null;
      }

      return {
        ...base,
        type: 'quick_replies',
        options,
      };

    case 'info_card':
      {
        const content = safeString(component.content);
        if (!content) {
          return null;
        }

        const actions = Array.isArray(component.actions)
          ? component.actions
              .map(normalizeAction)
              .filter((action): action is InteractionDirective => action !== null)
          : undefined;

        return {
          ...base,
          type: 'info_card',
          icon: safeString(component.icon),
          content,
          actions,
        };
      }

    default:
      return null;
  }
}

function safeString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim();
  }
  return undefined;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function safeDate(value: unknown): string | undefined {
  const str = safeString(value);
  if (!str) return undefined;
  // Basic YYYY-MM-DD validation
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : undefined;
}

function normalizeMapPoint(rawPoint: any): MapPoint | null {
  if (!rawPoint || typeof rawPoint !== 'object') {
    return null;
  }

  const label = safeString(rawPoint.label);
  if (!label) {
    return null;
  }

  return {
    id: safeString(rawPoint.id),
    label,
    address: safeString(rawPoint.address),
    description: safeString(rawPoint.description),
    latitude: safeNumber(rawPoint.latitude),
    longitude: safeNumber(rawPoint.longitude),
    action: normalizeAction(rawPoint.action),
  };
}

function normalizeAction(rawAction: any): InteractionDirective | null {
  if (!rawAction || typeof rawAction !== 'object') {
    return null;
  }

  const type = safeString(rawAction.type);
  const value = safeString(rawAction.value);

  if (!type || !value) {
    return null;
  }

  if (type !== 'send_message' && type !== 'open_url') {
    return null;
  }

  return {
    type,
    value,
    label: safeString(rawAction.label),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

export function buildComponentPromptExample(): string {
  return `[[AI_COMPONENTS {"version":"${DEFAULT_VERSION}","components":[{"type":"map","title":"Ristoranti consigliati","points":[{"label":"Trattoria Bella","address":"Via Roma 42","latitude":45.068,"longitude":7.671,"action":{"type":"open_url","value":"https://maps.google.com/?q=45.068,7.671"}}]},{"type":"date_picker","id":"booking-date","title":"Scegli la data della prenotazione","minDate":"${new Date().toISOString().slice(0,10)}","action":{"type":"send_message","value":"Ho scelto la data {{selected_date}}"}}]}]]`;
}

