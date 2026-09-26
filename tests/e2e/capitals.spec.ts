import { expect, test } from '@playwright/test';

test('country and capital card lead to a text question with explanation', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Столицы/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Столицы' })).toBeVisible();
  await expect(page.getByText('203 карточек')).toBeVisible();
  await page.getByPlaceholder('Город или страна').fill('Токио');
  await expect(page.locator('.entry-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Токио/ }).click();
  await expect(page.getByRole('heading', { name: 'Токио' })).toBeVisible();
  await expect(page.getByText('Япония', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'О городе' })).toBeVisible();
  await expect(page.getByText(/Токио вырос из города Эдо/)).toBeVisible();
  await page.getByRole('link', { name: 'Проверить себя' }).click();
  await expect(page.getByRole('heading', { name: 'Какова столица страны «Япония»?' })).toBeVisible();
  await expect(page.locator('.quiz-image')).toHaveCount(0);
  await page.getByRole('button', { name: 'Токио' }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.getByText(/Токио вырос из города Эдо/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Следующий вопрос' })).toBeVisible();
});

test('wrong capital answer appears in Mistakes after reload', async ({ page }) => {
  await page.goto('/quiz/session?mode=capital&count=5&focus=capital-japan-tokyo-country');
  await page.locator('.answer-button').filter({ hasNotText: 'Токио' }).first().click();
  await expect(page.getByText(/Неверно\. Правильный ответ: Токио/)).toBeVisible();
  await page.goto('/mistakes');
  await page.reload();
  await expect(page.getByRole('link', { name: /Токио/ })).toBeVisible();
});

test('capital card and viewed photo stay available offline', async ({ page, context }) => {
  await page.goto('/capital/capital-japan-tokyo');
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('.detail-media .media-frame img');
    return image?.complete && image.naturalWidth > 0;
  });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Токио' })).toBeVisible();
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('.detail-media .media-frame img');
    return image?.complete && image.naturalWidth > 0;
  });
});

test('capital screens fit required widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(60_000);
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    for (const route of ['/learn/capitals', '/capital/capital-japan-tokyo', '/quiz/session?mode=capital&count=5&focus=capital-japan-tokyo-country']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});
