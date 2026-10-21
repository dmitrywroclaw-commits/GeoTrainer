import { expect, test } from '@playwright/test';

test('traditional dishes show eight countries, search, history, ingredients, customs and credits', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Традиционные блюда мира/ }).click();
  await expect(page.getByRole('heading', { name: 'Традиционные блюда мира' })).toBeVisible();
  await expect(page.locator('.entry-card')).toHaveCount(8);
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Узбекистан');
  await expect(page.locator('.entry-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Палов/ }).click();
  await expect(page.getByRole('heading', { name: 'Палов (плов)' })).toBeVisible();
  for (const heading of ['История', 'Из чего готовят', 'Традиции', 'Источники и права']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Palov culture and tradition', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Страница файла в Wikimedia Commons' })).toBeVisible();
  const photo = page.locator('.detail-media .media-frame img');
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.getByRole('heading', { name: 'Неаполитанская пицца' })).toBeVisible();
});

test('traditional dish catalog and detail fit required viewport widths', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop project covers explicit viewport matrix.');
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/learn/traditional-food', '/traditional-food/traditional-food-pizza-napoletana']) {
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${route}`).toBe(true);
    }
  }
});
