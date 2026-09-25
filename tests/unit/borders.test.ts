import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { borderRepository } from '../../src/data/borders';
import { buildBorderQuestion, createSession } from '../../src/features/quiz/engine';
import { contentRepository } from '../../src/data/repository';

describe('border topic', () => {
  it('derives every published answer from its sourced border fact', () => {
    expect(borderRepository.allQuestions()).toHaveLength(19);
    for (const spec of borderRepository.allQuestions()) {
      const fact = borderRepository.fact(spec.countryId)!;
      expect(borderRepository.sources(fact.sourceIds)).toHaveLength(fact.sourceIds.length);
      const question = buildBorderQuestion(spec, () => 0.4);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.correctOption);
      if (spec.type === 'count') expect(question.correctOption).toBe(String(fact.neighborIds.length));
      if (spec.type === 'not-neighbor') expect(fact.neighborIds).not.toContain(spec.optionCountryIds!.find(id => borderRepository.countryName(id) === question.correctOption));
    }
  });

  it('ships both states of every map locally', () => {
    for (const fact of borderRepository.allFacts()) {
      for (const revealed of [false, true]) {
        const map = borderRepository.map(fact.mapId, revealed);
        expect(existsSync(join(process.cwd(), 'public', map.localPath.slice(1))), map.localPath).toBe(true);
        expect(map.license).toBe('Public domain');
        expect(map.sourcePageUrl).toMatch(/^https:/);
      }
    }
  });

  it('keeps the reviewed answers for the new border questions', () => {
    const expected = {
      'border-006': 'Саудовская Аравия',
      'border-008': 'Индонезия',
      'border-009': 'Доминиканская Республика',
      'border-010': 'Гаити',
      'border-017': 'Франция и Испания',
      'border-018': 'Россия и Китай',
      'border-051': 'Парагвай',
      'border-052': 'Боливия',
      'border-062': 'Швеция',
    };
    for (const [id, answer] of Object.entries(expected)) {
      expect(buildBorderQuestion(borderRepository.question(id)!, () => 0.4).correctOption).toBe(answer);
    }
  });

  it('includes border questions in mixed and mistake sessions', () => {
    const mixed = createSession(contentRepository.all(), 'mixed', 20, [], () => 0.31);
    expect(mixed.filter(question => question.entry.kind === 'border').length).toBeGreaterThanOrEqual(4);
    const mistakes = createSession(contentRepository.all(), 'mistakes', 5, ['border-064'], () => 0.31);
    expect(mistakes.every(question => question.entry.id === 'border-064')).toBe(true);
  });
});
