import { describe, expect, it } from 'vitest';
import { contentRepository } from '../../src/data/repository';
import { buildQuestion, createSession } from '../../src/features/quiz/engine';

describe('quiz engine', () => {
  it('builds four unique choices from content records', () => {
    const entries = contentRepository.all();
    for (const entry of entries) {
      const question = buildQuestion(entry, entries, () => 0.4);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.correctOption);
    }
  });

  it('creates a mixed session of requested length', () => {
    const questions = createSession(contentRepository.all(), 'mixed', 20, [], () => 0.31);
    expect(questions).toHaveLength(20);
    expect(new Set(questions.map(question => question.entry.kind)).size).toBe(3);
    for (const kind of ['flag', 'emblem', 'landmark']) {
      expect(questions.filter(question => question.entry.kind === kind).length).toBeGreaterThanOrEqual(6);
    }
  });
});
