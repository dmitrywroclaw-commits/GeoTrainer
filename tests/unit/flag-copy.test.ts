import { describe, expect, it } from 'vitest';
import library from '../../content/library.json';
import { librarySchema } from '../../src/data/schema';
import { flagMeaningHistory } from '../../src/features/learn/flagCopy';

const flags = librarySchema.parse(library).entries.filter(entry => entry.kind === 'flag');
const byId = (id: string) => {
  const entry = flags.find(item => item.id === id);
  if (!entry) throw new Error(`Missing flag ${id}`);
  return entry;
};

describe('flag detail copy', () => {
  it('keeps sourced meaning and adoption context separate from the visual description', () => {
    const text = flagMeaningHistory(byId('mexico-national-flag'));
    expect(text).toContain('Теночтитлана');
    expect(text).toContain('1968');
    expect(text).not.toContain('зелёно-бело-красного полотнища');
  });

  it('explains a formerly plain flag without repeating its description', () => {
    const text = flagMeaningHistory(byId('colombia-national-flag'));
    expect(text).toContain('Великой Колумбии');
    expect(text).toContain('разные толкования');
    expect(text).not.toContain('Жёлтая полоса');
  });

  it('shows researched meaning and adoption for a formerly plain card', () => {
    const text = flagMeaningHistory(byId('armenia-national-flag'));
    expect(text).toContain('24 августа 1990 года');
    expect(text).toContain('15 июня 2006 года');
    expect(text).toContain('символизирует');
  });

  it('provides distinct description and meaning for every published flag', () => {
    expect(flags).toHaveLength(195);
    for (const flag of flags) {
      const meaning = flagMeaningHistory(flag);
      expect(flag.summaryRu.trim(), flag.id).not.toBe('');
      expect(meaning.length, flag.id).toBeGreaterThan(50);
      expect(meaning, flag.id).not.toBe(flag.summaryRu);
      expect(meaning, flag.id).not.toContain('пока не внесен');
    }
  });
});
