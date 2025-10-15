import { extractInteractiveComponents } from '../interactiveDsl';

const SAMPLE_BLOCK = `[[AI_COMPONENTS {
  "version": "1.0",
  "components": [
    {
      "type": "map",
      "title": "Ristoranti consigliati",
      "points": [
        {
          "label": "Trattoria Bella",
          "address": "Via Roma 42",
          "latitude": 45.068,
          "longitude": 7.671,
          "action": { "type": "open_url", "value": "https://maps.google.com/?q=45.068,7.671" }
        },
        {
          "type": "invalid",
          "address": "No label"
        }
      ],
      "cta": { "type": "send_message", "value": "Mostra tutti i ristoranti" }
    }
  ]
}]]`;

describe('interactiveDsl.extractInteractiveComponents', () => {
  it('should extract map components from the response block', () => {
    const rawText = `Ecco alcuni suggerimenti per te.\n${SAMPLE_BLOCK}\nGrazie!`;

    const result = extractInteractiveComponents(rawText);

    expect(result.text).toContain('Ecco alcuni suggerimenti per te.');
    expect(result.text).toContain('Grazie!');
    expect(result.text).not.toContain('[[AI_COMPONENTS');

    expect(result.components).toHaveLength(1);
    const mapComponent = result.components[0];
    expect(mapComponent.type).toBe('map');
    if (mapComponent.type === 'map') {
      expect(mapComponent.points).toHaveLength(1);
      expect(mapComponent.points[0].label).toBe('Trattoria Bella');
      expect(mapComponent.points[0].action?.type).toBe('open_url');
    }
  });

  it('should return empty components when JSON payload is invalid', () => {
    const malformed = '[[AI_COMPONENTS {"version": "1.0", "components": INVALID}]]';
    const raw = `Test message.\n${malformed}`;

    const result = extractInteractiveComponents(raw);

    expect(result.components).toHaveLength(0);
    expect(result.text).toContain(malformed);
  });

  it('should ignore unsupported component types', () => {
    const unsupported = `[[AI_COMPONENTS {"version": "1.0", "components": [{"type":"unknown","foo":"bar"}]}]]`;
    const raw = `Some details.\n${unsupported}`;

    const result = extractInteractiveComponents(raw);

    expect(result.components).toHaveLength(0);
    expect(result.text).not.toContain('[[AI_COMPONENTS');
  });
});

