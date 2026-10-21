import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { traditionalDishes } from '../../src/data/traditionalDishes';

describe('published traditional dishes', () => {
  it('has eight distinct countries, sourced stories, and locally licensed photographs', () => {
    const dishes = traditionalDishes.all();
    expect(dishes).toHaveLength(8);
    expect(new Set(dishes.map(dish => dish.countryId)).size).toBe(8);
    for (const dish of dishes) {
      expect(dish.status).toBe('published');
      expect(dish.historyRu.length).toBeGreaterThan(80);
      expect(dish.ingredientsRu.length).toBeGreaterThan(60);
      expect(dish.traditionsRu.length).toBeGreaterThan(60);
      expect(traditionalDishes.sources(dish).length).toBeGreaterThan(0);
      const photo = traditionalDishes.media(dish);
      expect(photo.sourcePageUrl).toContain('commons.wikimedia.org/wiki/File:');
      expect(photo.rightsUrl).toContain('creativecommons.org/licenses/');
      expect(photo.attributionText).toContain(photo.author?.split(' ')[0]);
      expect(existsSync(join(process.cwd(), 'public', photo.localPath.slice(1))), dish.id).toBe(true);
    }
  });
});
