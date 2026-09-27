import { describe, expect, it } from 'vitest';
import { urbanPlaces, urbanPlaceTitle } from '../../src/data/urbanPlaces';

describe('urban place draft cards', () => {
  it('imports all 199 source entries with stable IDs and complete copy', () => {
    const cards = urbanPlaces.all();
    expect(cards).toHaveLength(199);
    expect(new Set(cards.map(card => card.id)).size).toBe(199);
    expect(cards.map(card => card.rank)).toEqual(Array.from({ length: 199 }, (_, index) => index + 1));
    for (const card of cards) {
      expect(card.name).toBeTruthy();
      expect(card.nameRu).toMatch(/[А-Яа-яЁё]/);
      expect(urbanPlaceTitle(card)).toBe(`${card.nameRu} (${card.name})`);
      expect(card.city).toBeTruthy();
      expect(card.placeTypeRu).toBeTruthy();
      expect(card.whyFamousRu).toBeTruthy();
      expect(card.visualClueRu).toBeTruthy();
      expect(card.status).toBe('draft');
      const photo = urbanPlaces.media(card.id);
      expect(photo?.kind).toBe('photo');
      expect(photo?.localPath).toBe(`/media/urban/${card.id}.webp`);
      expect(photo?.author).toBeTruthy();
      expect(photo?.license).toBeTruthy();
      expect(photo?.rightsUrl).toMatch(/^https:\/\//);
      expect(photo?.sourcePageUrl).toMatch(/^https:\/\//);
    }
  });

  it('preserves the source wording for Jerusalem without assigning a country', () => {
    const cards = urbanPlaces.all().filter(card => card.city === 'Jerusalem');
    expect(cards).toHaveLength(3);
    expect(cards.every(card => card.country === null)).toBe(true);
  });
});
