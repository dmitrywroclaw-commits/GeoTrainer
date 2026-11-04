import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import raw from '../../content/geography.json';
import library from '../../content/library.json';
import { geographyRepository, geographySchema, validateGeography } from '../../src/data/geography';
import { buildGeographyQuestion, createSession } from '../../src/features/quiz/engine';
import { contentRepository } from '../../src/data/repository';

describe('geography catalog', () => {
  it('covers every base-registry country once, with sourced cards and licensed local illustrations', () => {
    const outlines = geographyRepository.byKind('outline');
    expect(outlines).toHaveLength(195);
    expect(new Set(outlines.map(card => card.kind === 'outline' ? card.countryId : '')).size).toBe(195);
    expect(outlines.map(card => card.kind === 'outline' ? card.countryId : '').sort()).toEqual(library.countries.map(country => country.id).sort());
    expect(geographyRepository.byKind('waterway')).toHaveLength(22);
    for (const card of geographyRepository.all()) {
      expect(geographyRepository.sources(card.sourceIds)).toHaveLength(card.sourceIds.length);
      for (const revealed of [false, true]) {
        const media = geographyRepository.media(card, revealed);
        const path = join(process.cwd(), 'public', media.localPath);
        expect(existsSync(path), path).toBe(true);
        expect(media.rightsUrl).toMatch(/^https:/);
        expect(media.author).toBeTruthy();
        if (card.kind === 'outline' && !revealed) expect(readFileSync(path, 'utf8')).not.toContain(card.nameRu);
      }
    }
  });

  it('rejects duplicate identities, broken sources and invalid geography', () => {
    const invalid = () => structuredClone(geographySchema.parse(raw));
    const duplicate = invalid(); duplicate.outlines.push(duplicate.outlines[0]);
    expect(() => validateGeography(duplicate)).toThrow(/Повторяющиеся/);
    const missingSource = invalid(); missingSource.waterways[0].sourceIds = ['missing'];
    expect(() => validateGeography(missingSource)).toThrow(/источника/);
    const wrongBounds = invalid(); wrongBounds.outlines[0].map.box = [20, 50, 10, 55];
    expect(() => validateGeography(wrongBounds)).toThrow(/область/);
    const wrongLabel = invalid(); wrongLabel.outlines[0].map.labels[0].panelIndex = 99;
    expect(() => validateGeography(wrongLabel)).toThrow(/врезка/);
    const wrongConnection = invalid(); wrongConnection.waterways[0].connectsRu = ['Море', 'Море'];
    expect(() => validateGeography(wrongConnection)).toThrow(/связи/);
  });

  it('derives unique, unambiguous answers and reveals explanations without leaking map labels', () => {
    expect(geographyRepository.questions('outline')).toHaveLength(390);
    expect(geographyRepository.questions()).toHaveLength(476);
    for (const spec of geographyRepository.questions()) {
      for (const random of [() => 0, () => 0.4, () => 0.999]) {
        const question = buildGeographyQuestion(spec, random);
        const card = geographyRepository.byId(spec.cardId)!;
        expect(new Set(question.options).size, spec.id).toBe(4);
        expect(question.options).toContain(question.correctOption);
        expect(question.entry.explanationRu).toBe(card.explanationRu);
        expect(question.explanationMedia.localPath).not.toContain('-question');
        if (card.kind === 'waterway') {
          expect(question.showMedia).toBe(false);
          if (spec.type === 'connects') expect(question.correctOption).toBe(card.connectsRu.join(' и '));
          if (spec.type === 'route') expect(question.correctOption).toBe(card.routeRu.join(' → '));
        } else if (spec.type === 'select-outline') {
          expect(question.showMedia).toBe(false);
          expect(Object.keys(question.optionMedia ?? {})).toHaveLength(4);
          for (const option of question.options) {
            expect(question.optionMedia?.[option].localPath).toContain('-question.svg');
            expect(question.optionLabels[option]).toMatch(/^Контур [АБВГ]$/);
          }
        } else expect(question.questionMedia?.localPath).toContain('-question.svg');
      }
    }
  });

  it('handles datelines, detached parts, and explicit mainland-only scope', () => {
    const card = (country: string) => {
      const entry = geographyRepository.byId(`outline-${country}`)!;
      if (entry.kind !== 'outline') throw new Error('Expected outline');
      return entry;
    };
    expect(card('russia').map.centralMeridian).toBe(100);
    expect(card('fiji').map.centralMeridian).toBe(180);
    expect(card('united-states').map.panels?.map(panel => panel.labelRu)).toEqual(['Основная часть','Аляска','Гавайи']);
    expect(card('france').scopeRu).toContain('Заморские территории не показаны');
    expect(card('kiribati').map.panels).toHaveLength(4);
    expect(card('cyprus').map.featureCodes).toContain('CYN');
    expect(card('somalia').map.featureCodes).toContain('SOL');
    const invalid = geographySchema.parse(raw);
    invalid.outlines[0].map.panels = [{labelRu:'A',box:[10,30,5,40]},{labelRu:'B',box:[0,0,1,1]}];
    expect(() => validateGeography(invalid)).toThrow(/область/);
  });

  it('includes both topics in mixed/review sessions and exhausts each cycle before repeating', () => {
    const mixed = createSession(contentRepository.all(), 'mixed', 20, [], () => 0.31);
    for (const kind of ['outline', 'waterway'] as const) {
      expect(mixed.filter(question => question.entry.kind === kind).length).toBeGreaterThanOrEqual(2);
      const specs = geographyRepository.questions(kind);
      const session = createSession([], kind, specs.length, [], () => 0.31);
      expect(new Set(session.map(question => question.entry.id)).size).toBe(specs.length);
      const review = createSession([], 'mistakes', 3, [specs[0].id], () => 0.31);
      expect(review.every(question => question.entry.id === specs[0].id)).toBe(true);
    }
  });
});
