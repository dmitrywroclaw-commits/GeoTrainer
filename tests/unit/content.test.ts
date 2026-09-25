import { describe, expect, it } from 'vitest';
import library from '../../content/library.json';
import media from '../../content/media.json';
import { librarySchema, mediaSchema, validateReferences } from '../../src/data/schema';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('content validation', () => {
  it('accepts all published entries and their references', () => {
    const parsed = librarySchema.parse(library);
    const assets = mediaSchema.parse(media);
    expect(() => validateReferences(parsed, assets)).not.toThrow();
    expect(parsed.entries.every(entry => entry.status === 'published')).toBe(true);
    for (const asset of assets) expect(existsSync(join(process.cwd(), 'public', asset.localPath.slice(1))), asset.id).toBe(true);
  });

  it('rejects a missing media reference', () => {
    const parsed = librarySchema.parse(library);
    const assets = mediaSchema.parse(media);
    const broken = { ...parsed, entries: parsed.entries.map((entry, index) => index === 0 ? { ...entry, mediaId: 'missing-media' } : entry) };
    expect(() => validateReferences(broken, assets)).toThrow(/изображение/);
  });

  it('gives every published landmark an explicit location', () => {
    const landmarks = librarySchema.parse(library).entries.filter(entry => entry.kind === 'landmark');
    expect(landmarks).toHaveLength(79);
    for (const entry of landmarks) expect(entry.regionRu?.trim(), entry.id).toBeTruthy();
  });

  it('rejects published CC BY media without attribution text', () => {
    const parsed = librarySchema.parse(library);
    const assets = mediaSchema.parse(media).map(asset => asset.id === 'emblem-south-africa'
      ? { ...asset, attributionText: '' }
      : asset);
    expect(() => validateReferences(parsed, assets)).toThrow(/атрибуция/);
  });

  it('accepts a plain national flag and rejects a second flag for the same country', () => {
    const parsed = librarySchema.parse(library);
    const assets = mediaSchema.parse(media);
    const plain = parsed.entries.find(entry => entry.id === 'botswana-national-flag');
    expect(plain?.kind).toBe('flag');
    if (plain?.kind !== 'flag') return;
    expect(plain.symbols).toEqual([]);
    const duplicate = { ...plain, id: 'botswana-second-flag' };
    expect(() => validateReferences({ ...parsed, entries: [...parsed.entries, duplicate] }, assets)).toThrow(/Повторный флаг/);
  });

  it('indexes visibly described flag motifs for catalog filters', () => {
    const motifs = [
      { pattern: /ор[её]л|орл|птиц|попугай|журавл|фрегат|кетцал/i, categories: ['bird'] },
      { pattern: /зме[яёй]|дракон|(?<![а-яё])(?:лев|льва|львом|конь)(?![а-яё])|лошад|викун|кабан/i, categories: ['animal'] },
      { pattern: /лист|дерев|кедр|ветв|венок|орех|пальм|лавр|нопаль|кактус/i, categories: ['plant', 'leaf', 'flower', 'tree'] },
      { pattern: /зв[её]зд/i, categories: ['star', 'constellation'] },
      { pattern: /солнц/i, categories: ['sun'] },
      { pattern: /полумесяц|лун[аы]/i, categories: ['moon'] },
      { pattern: /надпис|девиз|шахад/i, categories: ['inscription'] },
    ];
    for (const entry of librarySchema.parse(library).entries) {
      if (entry.kind !== 'flag') continue;
      for (const motif of motifs) {
        if (motif.pattern.test(entry.summaryRu)) {
          expect(entry.symbols.some(symbol => motif.categories.includes(symbol.category)), `${entry.id}: ${motif.pattern}`).toBe(true);
        }
      }
    }
  });

  it('indexes symbolic discs and the Vatican arms by their documented meaning', () => {
    const flags = librarySchema.parse(library).entries.filter(entry => entry.kind === 'flag');
    for (const [id, category] of [
      ['bangladesh-national-flag', 'sun'],
      ['niger-national-flag', 'sun'],
      ['palau-national-flag', 'moon'],
      ['holy-see-state-flag', 'coat_of_arms'],
    ]) {
      expect(flags.find(entry => entry.id === id)?.symbols.some(symbol => symbol.category === category), id).toBe(true);
    }
  });
});
