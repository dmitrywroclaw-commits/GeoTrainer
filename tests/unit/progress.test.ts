import { describe, expect, it } from 'vitest';
import { aggregateProgress, selectMistakes, type ProgressRecord } from '../../src/storage/progress';

const records: ProgressRecord[] = [
  { contentId: 'a', contentType: 'flag', shownCount: 3, correctCount: 1, wrongCount: 2, currentStreak: 0, lastResult: 'wrong', lastAttemptAt: '2026-09-22T10:00:00Z' },
  { contentId: 'b', contentType: 'landmark', shownCount: 2, correctCount: 2, wrongCount: 0, currentStreak: 2, lastResult: 'correct', lastAttemptAt: '2026-09-22T11:00:00Z' },
];

describe('progress calculations', () => {
  it('aggregates totals and percentage', () => {
    expect(aggregateProgress(records)).toEqual({ total: 5, correct: 3, percentage: 60, studied: 2, needsReview: 1 });
  });
  it('selects only entries with mistakes', () => {
    expect(selectMistakes(records).map(x => x.contentId)).toEqual(['a']);
  });
});
