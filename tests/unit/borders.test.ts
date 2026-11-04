import { describe, expect, it } from 'vitest';
import { borderRepository } from '../../src/data/borders';
import { createSession } from '../../src/features/quiz/engine';
import { contentRepository } from '../../src/data/repository';
import archived from '../../content/borders.json';

describe('unpublished border topic', () => {
  it('retains research while removing published facts and question lookup', () => {
    expect(archived.facts.length).toBeGreaterThan(0);
    expect(archived.questions.length).toBeGreaterThan(0);
    expect(borderRepository.allFacts()).toEqual([]);
    expect(borderRepository.allQuestions()).toEqual([]);
    expect(borderRepository.question('border-064')).toBeUndefined();
    expect(borderRepository.fact('switzerland')).toBeUndefined();
  });
  it('never generates border questions, including old review IDs and direct mode requests', () => {
    expect(createSession([], 'border', 5)).toEqual([]);
    expect(createSession([], 'mistakes', 5, ['border-064'])).toEqual([]);
    expect(createSession(contentRepository.all(), 'mixed', 100).every(question => question.entry.kind !== 'border')).toBe(true);
  });
});
