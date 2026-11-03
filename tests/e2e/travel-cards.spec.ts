import { expect, test } from '@playwright/test';

test('architecture remains available with sourced illustrations and a reason', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('link', { name: /Экзотические блюда/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Традиционные блюда мира/ })).toBeVisible();
  await page.getByRole('link', { name: /Архитектура/ }).click();
  await expect(page.locator('.entry-card')).toHaveCount(83);
  await page.getByRole('link', { name: /Эйфелева башня/ }).click();
  await expect(page.getByRole('heading', { name: 'Почему интересно' })).toBeVisible();
  await expect(page.getByText('Башню построили для большой выставки, а теперь по её силуэту легко узнать Париж.')).toBeVisible();
  const image = page.locator('.detail-media .media-frame img');
  await expect.poll(() => image.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.source-block a[href*="commons.wikimedia.org"], .source-block a[href*="flickr.com"]').first()).toBeVisible();
});

test('disabled exotic-food catalog and direct card links expose no content', async ({ page }) => {
  await page.goto('/learn/food');
  await expect(page.getByRole('heading', { name: 'Раздел не найден' })).toBeVisible();
  for (const id of ['food-balut', 'food-hakarl']) {
    await page.goto(`/travel/${id}`);
    await expect(page.getByRole('heading', { name: 'Карточка не найдена' })).toBeVisible();
    await expect(page.locator('.detail-media')).toHaveCount(0);
  }
  await page.goto('/learn/traditional-food');
  await expect(page.getByRole('heading', { name: 'Традиционные блюда мира' })).toBeVisible();
});

test('architecture catalog and details fit required viewport widths', async ({ page }) => {
  for (const width of [360, 390, 430, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/learn/architecture', '/travel/architecture-eifeleva-bashnya']) {
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${route}`).toBe(true);
    }
  }
});
