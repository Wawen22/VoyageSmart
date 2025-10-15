import {
  detectIntents,
  buildHeuristicComponents,
  mergeInteractiveComponents,
  inferTopicsFromComponents,
} from '../interactiveHeuristics';

describe('interactiveHeuristics', () => {
  it('detects dining and transportation intents in a combined message', () => {
    const intents = detectIntents('Mostrami ristoranti vicino all’hotel e aggiorna i miei trasporti');

    const types = intents.map((intent) => intent.type);
    expect(types).toContain('dining');
    expect(types).toContain('transportation');
  });

  it('returns heuristic dining components with quick replies and map', () => {
    const { components, topics } = buildHeuristicComponents({
      intents: detectIntents('Suggerisci ristoranti economici a Osaka'),
      tripContext: {
        trip: { destination: 'Osaka' },
        accommodations: [{ name: 'THE LEBEN OSAKA', address: '1-1-1 Osaka' }],
      },
      message: 'Suggerisci ristoranti economici a Osaka',
    });

    const types = components.map((component) => component.type);
    expect(types).toContain('map');
    expect(types).toContain('quick_replies');
    expect(topics).toContain('Ristorazione');
  });

  it('merges interactive components without duplicates', () => {
    const base = [
      { type: 'map', id: 'dining-map', points: [], title: 'Map' },
    ] as any;
    const additions = [
      { type: 'map', id: 'dining-map', points: [], title: 'Map' },
      { type: 'info_card', id: 'dining-info', content: 'Info' },
    ] as any;

    const merged = mergeInteractiveComponents(base, additions);
    expect(merged).toHaveLength(2);
  });

  it('infers topics from interactive components', () => {
    const topics = inferTopicsFromComponents([
      {
        type: 'info_card',
        id: 'transport-insights',
        content: '...',
      },
      {
        type: 'quick_replies',
        title: 'Gestisci l’alloggio',
        options: [],
      } as any,
    ]);

    expect(topics).toContain('Trasporti');
    expect(topics).toContain('Alloggi');
  });
});

