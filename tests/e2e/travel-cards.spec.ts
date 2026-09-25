import { expect, test } from '@playwright/test';

test('food and architecture cards show sourced illustrations and a reason', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Еда мира/ }).click();
  await expect(page.getByRole('heading', { name: 'Еда мира' })).toBeVisible();
  await expect(page.locator('.entry-card')).toHaveCount(51);
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Балут');
  await expect(page.locator('.entry-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Balut/ }).click();
  await expect(page.getByRole('heading', { name: 'Балут (Balut)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Почему интересно' })).toBeVisible();
  await expect(page.getByText('Один из самых известных «испытательных» стритфудов Юго-Восточной Азии.')).toBeVisible();
  const foodImage = page.locator('.detail-media .media-frame img');
  await expect.poll(() => foodImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.source-block a[href*="commons.wikimedia.org"], .source-block a[href*="flickr.com"]').first()).toBeVisible();

  await page.goto('/learn/architecture');
  await expect(page.locator('.entry-card')).toHaveCount(83);
  await page.getByRole('link', { name: /Эйфелева башня/ }).click();
  await expect(page.getByRole('heading', { name: 'Почему интересно' })).toBeVisible();
  await expect(page.getByText('Башню построили для большой выставки, а теперь по её силуэту легко узнать Париж.')).toBeVisible();
  const architectureImage = page.locator('.detail-media .media-frame img');
  await expect.poll(() => architectureImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.source-block a[href*="commons.wikimedia.org"], .source-block a[href*="flickr.com"]').first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('new catalogs and details fit required viewport widths', async ({ page }) => {
  for (const width of [360, 390, 430, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/learn/food', '/travel/food-balut', '/learn/architecture', '/travel/architecture-eifeleva-bashnya']) {
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${route}`).toBe(true);
    }
  }
});
