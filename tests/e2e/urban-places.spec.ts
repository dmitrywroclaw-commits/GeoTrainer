import { expect, test } from '@playwright/test';

test('urban places show local photos and source credits', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Городские места/ }).click();
  await expect(page.getByRole('heading', { name: 'Городские места' })).toBeVisible();
  await expect(page.getByText('199 из 199 карточек')).toBeVisible();
  await page.getByPlaceholder('Место, город или страна').fill('Сибуя');
  await expect(page.locator('.urban-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Перекрёсток Сибуя (Shibuya Crossing)' })).toBeVisible();
  await page.getByPlaceholder('Место, город или страна').fill('Shibuya');
  await expect(page.locator('.urban-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Shibuya Crossing/ }).click();
  await expect(page.getByRole('heading', { name: 'Перекрёсток Сибуя (Shibuya Crossing)' })).toBeVisible();
  await expect(page.getByText(/диагональный переход стал символом/)).toBeVisible();
  await expect(page.getByText(/Черновик по редакционному списку/)).toBeVisible();
  const photo = page.locator('.urban-detail .media-frame img');
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const box = await page.locator('.urban-detail .media-frame').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
  await expect(page.getByRole('link', { name: 'Оригинал фотографии' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Условия лицензии' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Проверить себя' })).toHaveCount(0);
});

test('urban place cards fit mobile and desktop widths', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop project covers explicit viewport matrix.');
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/learn/urban-places');
    await expect(page.locator('.urban-card')).toHaveCount(199);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
    const box = await page.locator('.urban-card .media-frame').first().boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
  }
});
