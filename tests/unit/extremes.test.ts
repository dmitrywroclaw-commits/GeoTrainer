import { describe, expect, it } from 'vitest';
import { extremesRepository, extremesSchema, validateEditorialReferences } from '../../src/data/extremes';
import { geographyNamesRepository, geographyNamesSchema } from '../../src/data/geographyNames';
import { geographyRepository } from '../../src/data/geography';
import { buildRecordQuestion, buildGeographyQuestion, createSession } from '../../src/features/quiz/engine';
import raw from '../../content/extremes.json';
import namesRaw from '../../content/geography-names.json';
import namesResearch from '../../content/research/geography-name-candidates.json';

describe('records and experimental names', () => {
  it('publishes exactly 20 per physical category with sourced criteria and measurement caveats', () => {
    expect(geographyRepository.byKind('waterway').filter(card => card.kind === 'waterway' && card.waterwayType === 'strait')).toHaveLength(20);
    for (const kind of ['river', 'mountain', 'lake'] as const) {
      expect(extremesRepository.byKind(kind)).toHaveLength(20);
      for (const card of extremesRepository.byKind(kind)) {
        expect(extremesRepository.sources(card.sourceIds)).toHaveLength(card.sourceIds.length);
        expect(card.distinctionRu.length).toBeGreaterThan(10);
        expect(card.caveatRu.length).toBeGreaterThan(25);
      }
    }
  });
  it('rejects duplicate IDs, dangling sources and an unqualified record', () => {
    const data = extremesSchema.parse(raw);
    data.cards.push(data.cards[0]);
    expect(() => validateEditorialReferences(data)).toThrow(/Повторяющиеся/);
    data.cards.pop(); data.cards[0].sourceIds = ['missing'];
    expect(() => validateEditorialReferences(data)).toThrow(/источники/);
    expect(() => extremesSchema.parse({ ...raw, cards: [{ ...raw.cards[0], caveatRu: '' }] })).toThrow();
    const names = geographyNamesSchema.parse(namesRaw); names.cards[0].sourceIds = ['missing'];
    expect(() => validateEditorialReferences(names)).toThrow(/источники/);
  });
  it('derives quiz answers and explanations, exhausts catalogs and restores review questions', () => {
    for (const card of extremesRepository.all()) {
      const question = buildRecordQuestion(card, () => .4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.correctOption).toBe(card.nameRu);
      expect(question.entry.explanationRu).toContain(card.caveatRu);
      const review = createSession([], 'mistakes', 1, [`record-${card.id}`]);
      expect(review[0].correctOption).toBe(card.nameRu);
    }
    for (const kind of ['river', 'mountain', 'lake'] as const) {
      expect(new Set(createSession([], kind, 20).map(question => question.entry.id)).size).toBe(20);
    }
  });
  it('trains all 60 record cards once before repeating, across all three kinds', () => {
    const session = createSession([], 'records', 61, [], () => .4);
    const firstCycle = session.slice(0, 60);
    expect(new Set(firstCycle.map(question => question.entry.id)).size).toBe(60);
    for (const kind of ['lake', 'river', 'mountain']) {
      expect(firstCycle.filter(question => question.entry.kind === kind)).toHaveLength(20);
    }
    expect(firstCycle.some(question => question.entry.id === session[60].entry.id)).toBe(true);
  });
  it('distinguishes types of names and covers colors, numbers, sound, smell and imaginary lines', () => {
    const cards = geographyNamesRepository.all();
    expect(cards).toHaveLength(101);
    expect(new Set(cards.map(card => card.nameType)).size).toBe(6);
    for (const tag of ['color', 'number', 'sound', 'smell', 'line']) expect(cards.some(card => (card.tags as string[]).includes(tag))).toBe(true);
    for (const card of cards) expect(geographyNamesRepository.sources(card.sourceIds)).toHaveLength(card.sourceIds.length);
    expect(geographyNamesRepository.byId('blue-river-name')?.nameType).toBe('historical');
    expect(geographyNamesRepository.byId('big-apple')?.nameType).toBe('epithet');
  });
  it('publishes the complete selected core, preserves two existing reserve cards and imports no rejected names', () => {
    const cards = geographyNamesRepository.all();
    const core = namesResearch.candidates.filter(candidate => candidate.decision === 'core');
    expect(core).toHaveLength(99);
    expect(core.every(candidate => candidate.publishedCardId !== null)).toBe(true);
    for (const candidate of core) {
      const card = geographyNamesRepository.byId(candidate.publishedCardId!);
      expect(card, candidate.id).toBeDefined();
      expect(card!.explanationRu.length).toBeGreaterThan(40);
      expect(card!.cautionRu.length).toBeGreaterThan(40);
    }
    const coreIds = new Set(core.map(candidate => candidate.publishedCardId));
    expect(cards.filter(card => !coreIds.has(card.id)).map(card => card.id).sort()).toEqual(['sulphur-mountain', 'white-mountain']);
    expect(namesResearch.summary.currentPublished).toBe(cards.length);
    expect(namesResearch.summary.currentInCore).toBe(core.length);
    for (const candidate of namesResearch.candidates.filter(candidate => candidate.decision === 'excluded')) {
      expect(candidate.publishedCardId).toBeNull();
      expect(geographyNamesRepository.byId(candidate.id)).toBeUndefined();
    }
    expect(geographyNamesRepository.byId('dead-sea-name')?.sourceIds).toContain('r-dead-life');
    expect(geographyNamesRepository.byId('seven-sisters-falls')?.targetRu).toContain('Норвегия');
    expect(geographyNamesRepository.byId('seven-sisters')?.targetRu).toContain('меловые утёсы');
  });
  it('does not offer Magellan as a wrong answer for Drake or vice versa', () => {
    for (const [id, excluded] of [['drake','Магелланов пролив'],['magellan','Пролив Дрейка']]) {
      for (const random of [() => 0, () => .5, () => .999]) {
        const question = buildGeographyQuestion(geographyRepository.question(`${id}-identify`)!, random);
        expect(question.options).not.toContain(excluded);
      }
    }
  });
});
