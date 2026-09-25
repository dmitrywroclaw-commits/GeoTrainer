import { expect, test } from '@playwright/test';

test('Learn categories form one responsive grid', async ({ page }) => {
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/learn');

    const grid = page.locator('.category-grid');
    await expect(grid).toHaveCount(1);
    const cards = grid.locator(':scope > .category-card');
    await expect(cards).toHaveCount(6);
    const boxes = await Promise.all(Array.from({ length: 6 }, (_, index) => cards.nth(index).boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    const positions = boxes.map(box => box!);

    if (width < 768) {
      for (let index = 1; index < positions.length; index++) {
        expect(Math.abs(positions[index].x - positions[0].x)).toBeLessThan(2);
        expect(positions[index].y).toBeGreaterThan(positions[index - 1].y);
      }
    } else {
      for (let index = 0; index < 3; index++) {
        expect(Math.abs(positions[index].y - positions[0].y)).toBeLessThan(2);
        expect(Math.abs(positions[index + 3].x - positions[index].x)).toBeLessThan(2);
        expect(Math.abs(positions[index + 3].y - positions[3].y)).toBeLessThan(2);
      }
      expect(positions[3].y).toBeGreaterThan(positions[0].y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
