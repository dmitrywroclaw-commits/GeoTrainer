import { describe, expect, it } from 'vitest';
import { nextCardId, randomCardId } from '../../src/features/learn/cardNavigation';

describe('card navigation', () => {
  const ids = ['first', 'second', 'third'];

  it('moves through the catalog and wraps after the last card', () => {
    expect(nextCardId(ids, 'first')).toBe('second');
    expect(nextCardId(ids, 'third')).toBe('first');
    expect(nextCardId(['only'], 'only')).toBeUndefined();
  });

  it('chooses another card without leaving the current catalog', () => {
    expect(randomCardId(ids, 'first', () => 0)).toBe('second');
    expect(randomCardId(ids, 'second', () => 0)).toBe('first');
    expect(randomCardId(ids, 'second', () => 0.99)).toBe('third');
    expect(randomCardId(['only'], 'only', () => 0)).toBeUndefined();
  });
});
