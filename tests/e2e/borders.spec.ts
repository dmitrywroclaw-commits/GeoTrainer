import { expect, test } from '@playwright/test';

test('border Learn card and correct quiz reveal', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Границы/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Границы' })).toBeVisible();
  await page.getByRole('link', { name: /Швейцария/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Соседи по суше' })).toBeVisible();
  await page.getByRole('link', { name: 'Проверить себя' }).click();
  await expect(page.getByRole('heading', { name: /НЕ граничит/ })).toBeVisible();
  const map = page.locator('.quiz-image img');
  await expect(map).toHaveAttribute('src', /switzerland-question\.svg/);
  await page.getByRole('button', { name: 'Бельгия' }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(map).toHaveAttribute('src', /switzerland-answer\.svg/);
  await expect(page.getByRole('button', { name: 'Следующий вопрос' })).toBeVisible();
});

test('wrong border answer appears in Mistakes after reload', async ({ page }) => {
  await page.goto('/quiz/session?mode=border&count=5&focus=border-064');
  await page.getByRole('button', { name: 'Франция' }).click();
  await expect(page.getByText(/Неверно\. Правильный ответ: Бельгия/)).toBeVisible();
  await page.goto('/mistakes');
  await page.reload();
  await expect(page.getByRole('link', { name: /Границы Швейцария/ })).toBeVisible();
  await page.getByRole('link', { name: 'Повторить ошибки' }).click();
  await expect(page.getByRole('heading', { name: /НЕ граничит/ })).toBeVisible();
});

test('visited border map remains available offline', async ({ page, context }) => {
  await page.goto('/border/switzerland');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match('/media/maps/switzerland-answer.svg')))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  const map = page.getByRole('img', { name: 'Карта: Швейцария и соседние страны' });
  await expect.poll(() => map.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test('border views fit required widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(60_000);
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    for (const route of ['/learn/borders', '/border/liechtenstein', '/quiz/session?mode=border&count=5&focus=border-016']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});
