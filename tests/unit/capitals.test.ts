import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { capitalRepository } from '../../src/data/capitals';
import { contentRepository } from '../../src/data/repository';
import { buildCapitalQuestion, createSession } from '../../src/features/quiz/engine';

describe('capital cards', () => {
  it('covers all 195 source countries with sourced text cards', () => {
    const cards = capitalRepository.all();
    expect(cards).toHaveLength(203);
    expect(new Set(cards.map(card => card.countryId)).size).toBe(195);
    expect(cards.filter(card => card.mediaId)).toHaveLength(203);
    expect(new Set(cards.map(card => card.explanationRu)).size).toBe(cards.length);
    for (const card of cards) {
      expect(capitalRepository.countryName(card.countryId)).not.toBe('');
      expect(capitalRepository.sources(card.sourceIds)).toHaveLength(card.sourceIds.length);
      expect(card.explanationRu.length).toBeGreaterThan(50);
      expect(card.explanationRu).not.toContain('Связка для запоминания');
      expect(card.sourceIds.some(sourceId => sourceId.startsWith('capital-source-getty-') || sourceId.startsWith('capital-source-description-'))).toBe(true);
      expect(capitalRepository.allQuestions().some(spec => spec.cardId === card.id)).toBe(true);
      if (card.mediaId) {
        const photo = capitalRepository.media(card.mediaId)!;
        expect(existsSync(join(process.cwd(), 'public', photo.localPath.slice(1))), photo.localPath).toBe(true);
        expect(photo.rightsUrl).toMatch(/^https:/);
        expect(photo.author).toBeTruthy();
        expect(photo.sourcePageUrl).toMatch(/^https:/);
        expect(photo.attributionText).toContain(photo.author);
      }
    }
  });

  it('derives all answers from cards without image recognition', () => {
    expect(capitalRepository.allQuestions()).toHaveLength(404);
    for (const spec of capitalRepository.allQuestions()) {
      const card = capitalRepository.byId(spec.cardId)!;
      const question = buildCapitalQuestion(spec, () => 0.4);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.correctOption);
      expect(question.correctOption).toBe(spec.type === 'city-to-country' ? capitalRepository.countryName(card.countryId) : card.cityNameRu);
      expect(question.showMedia).toBe(false);
    }
  });

  it('states split roles and disputed claims explicitly', () => {
    const id = (suffix: string) => capitalRepository.question(`capital-${suffix}-country`)!;
    expect(buildCapitalQuestion(id('south-africa-pretoria')).prompt).toContain('административной столицей');
    expect(buildCapitalQuestion(id('naoero-yaren')).prompt).toContain('парламент');
    expect(buildCapitalQuestion(id('palestine-east-jerusalem')).prompt).toContain('будущей столицей');
    expect(capitalRepository.question('capital-palestine-east-jerusalem-city')).toBeUndefined();
    expect(buildCapitalQuestion(id('japan-tokyo')).options).not.toContain('Восточный Иерусалим');
  });

  it('includes capitals in mixed and mistake sessions', () => {
    const mixed = createSession(contentRepository.all(), 'mixed', 20, [], () => 0.31);
    expect(mixed.filter(question => question.entry.kind === 'capital')).toHaveLength(4);
    const id = 'capital-japan-tokyo-country';
    const mistakes = createSession(contentRepository.all(), 'mistakes', 5, [id], () => 0.31);
    expect(mistakes.every(question => question.entry.id === id)).toBe(true);
  });
});
