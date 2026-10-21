import { expect, test } from '@playwright/test';

test('Learn categories form one responsive grid', async ({ page }) => {
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/learn');

    const grid = page.locator('.category-grid');
    await expect(grid).toHaveCount(1);
    const cards = grid.locator(':scope > .category-card');
    await expect(cards).toHaveCount(9);
    const boxes = await Promise.all(Array.from({ length: 9 }, (_, index) => cards.nth(index).boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    const positions = boxes.map(box => box!);

    if (width < 768) {
      for (let index = 1; index < positions.length; index++) {
        expect(Math.abs(positions[index].x - positions[0].x)).toBeLessThan(2);
        expect(positions[index].y).toBeGreaterThan(positions[index - 1].y);
      }
    } else {
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          const index = row * 3 + column;
          expect(Math.abs(positions[index].y - positions[row * 3].y)).toBeLessThan(2);
          expect(Math.abs(positions[index].x - positions[column].x)).toBeLessThan(2);
        }
        if (row) expect(positions[row * 3].y).toBeGreaterThan(positions[(row - 1) * 3].y);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
