import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { traditionalDishes } from '../../src/data/traditionalDishes';

describe('published traditional dishes', () => {
  it('has 200 sourced stories and rights metadata for every published photograph', () => {
    const dishes = traditionalDishes.all();
    expect(dishes).toHaveLength(200);
    expect(new Set(dishes.map(dish => dish.id)).size).toBe(200);
    expect(new Set(dishes.map(dish => dish.countryId)).size).toBeGreaterThan(20);
    let photoCount = 0;
    for (const dish of dishes) {
      expect(dish.status).toBe('published');
      expect(dish.historyRu.length).toBeGreaterThan(20);
      expect(dish.ingredientsRu.length).toBeGreaterThan(20);
      expect(dish.traditionsRu.length).toBeGreaterThan(10);
      expect(traditionalDishes.sources(dish).length).toBeGreaterThan(0);
      const photo = traditionalDishes.media(dish);
      if (!photo) continue;
      photoCount++;
      expect(photo.sourcePageUrl).toContain('commons.wikimedia.org/wiki/File:');
      expect(photo.rightsUrl).toContain('creativecommons.org/licenses/');
      expect(photo.attributionText).toContain(photo.author?.split(' ')[0]);
      expect(existsSync(join(process.cwd(), 'public', photo.localPath.slice(1))), dish.id).toBe(true);
    }
    expect(photoCount).toBe(8);
  });
});
