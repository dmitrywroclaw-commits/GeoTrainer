import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cards from '../../content/travel-cards.json';
import media from '../../content/travel-media.json';
import { existsSync } from 'node:fs';

const documentRows = (file: string) => readFileSync(join(process.cwd(), 'GeoTrainer Documents', file), 'utf8')
  .split('\n').filter(line => /^\|\s*\d+\s*\|/.test(line))
  .map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));

describe('travel card import', () => {
  it('includes each dish and preserves the requested reason verbatim', () => {
    const rows = documentRows('top_51_exotic_dishes_for_travelers.md');
    const food = cards.filter(card => card.kind === 'food');
    expect(food).toHaveLength(51);
    for (const [index, card] of food.entries()) {
      const originalName = rows[index][1];
      expect(card.nameRu, card.id).toMatch(/^[А-ЯЁ«]/);
      expect(card.nameRu === originalName || card.nameRu.endsWith(` (${originalName})`), card.id).toBe(true);
    }
    expect(food.map(card => card.whyInterestingRu)).toEqual(rows.map(row => row[4]));
  });

  it('includes each structure with a filled reason and a locally sourced image', () => {
    const rows = documentRows('top_83_world_tourist_structures.md');
    const architecture = cards.filter(card => card.kind === 'architecture');
    expect(architecture).toHaveLength(83);
    expect(architecture.map(card => card.nameRu)).toEqual(rows.map(row => row[1]));
    expect(architecture.every(card => card.whyInterestingRu.trim().length > 15)).toBe(true);
    expect(cards.every(card => card.status === 'draft')).toBe(true);
    expect(new Set(cards.map(card => card.id)).size).toBe(cards.length);
    expect(media).toHaveLength(cards.length);
    for (const card of cards) {
      const asset = media.find(item => item.cardId === card.id);
      expect(asset?.localPath).toBe(card.image);
      expect(asset?.sourcePageUrl).toMatch(/^https:\/\/(?:commons\.wikimedia\.org|www\.flickr\.com)\//);
      expect(asset?.rightsUrl).toMatch(/^https?:\/\//);
      expect(asset?.author.trim()).toBeTruthy();
      expect(asset?.attributionText.trim()).toBeTruthy();
      expect(existsSync(join(process.cwd(), 'public', card.image.slice(1))), card.id).toBe(true);
    }
  });
});
