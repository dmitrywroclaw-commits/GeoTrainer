import { expect, test } from '@playwright/test';

test('new names are discoverable by aliases and show their actual object, status and sources', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('link', { name: /Так называемые/ })).toContainText('Карточек: 101');
  await page.getByRole('link', { name: /Так называемые/ }).click();
  await expect(page.locator('.record-card')).toHaveCount(101);
  for (const [query, id, target, status] of [
    ['Мыс Бурь', 'cape-hope', 'Мыс на Капском полуострове', 'Устойчивый топоним'],
    ['The Big Apple', 'big-apple', 'Нью-Йорк', 'Устойчивое образное имя'],
    ['Рапануи', 'easter-island', 'Рапануи в юго-восточной части Тихого океана', 'Устойчивый топоним'],
    ['благовоний', 'fragrant-harbour', 'Гонконг', 'Перевод названия'],
    ['страна огня и льда', 'iceland-name', 'Исландия', 'Перевод названия'],
    ['Семь сестёр', 'seven-sisters-falls', 'Гейрангер-фьорд, Норвегия', 'Устойчивый топоним'],
  ]) {
    await page.goto('/learn/names');
    await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill(query);
    await page.locator(`.record-card[href="/name/${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/name/${id}$`));
    await expect(page.locator('.record-detail .lead')).toHaveText(target);
    await expect(page.locator('.detail-main > .eyebrow')).toContainText(status);
    await expect(page.getByRole('heading', { name: 'Что стоит за названием' })).toBeVisible();
    await expect(page.locator('.record-caveat')).not.toBeEmpty();
    await expect(page.locator('.source-block a').first()).toHaveAttribute('href', /^https:/);
  }
  await page.goto('/learn/names');
  await page.getByRole('button', { name: 'Запахи', exact: true }).click();
  await expect(page.locator('.record-card')).toHaveCount(3);
  await expect(page.locator('.record-card[href="/name/fragrant-harbour"]')).toBeVisible();
  await page.getByRole('button', { name: 'Линии и точки', exact: true }).click();
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('полюс');
  await expect(page.locator('.record-card')).toHaveCount(2);
  await expect(page.locator('.record-card[href="/name/north-pole"]')).toBeVisible();
  await expect(page.locator('.record-card[href="/name/south-pole"]')).toBeVisible();
});

test('navigation includes the appended cards and wraps around the complete catalog', async ({ page }) => {
  await page.goto('/name/white-mountain');
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page).toHaveURL(/\/name\/arctic-circle$/);
  await expect(page.locator('.card-navigation')).toContainText('Карточка 24 из 101');
  await page.goto('/name/green-cape-islands');
  await expect(page.locator('.card-navigation')).toContainText('Карточка 101 из 101');
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page).toHaveURL(/\/name\/equator$/);
  await page.getByRole('button', { name: 'Случайная', exact: true }).click();
  await expect(page).toHaveURL(/\/name\/(?!equator$)[a-z-]+$/);
});

test('expanded names remain available offline with the cached application shell', async ({ page, context }) => {
  await page.goto('/learn/names');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.record-card')).toHaveCount(101);
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Благоухающая гавань');
  await page.locator('.record-card').click();
  await expect(page.getByRole('heading', { name: 'Благоухающая гавань', exact: true })).toBeVisible();
  await expect(page.locator('.record-caveat')).toContainText('несколько объяснений');
  await expect(page.locator('.source-block a')).toHaveCount(1);
});

test('long new names and explanations fit all required viewport widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(90_000);
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/learn/names', '/name/fragrant-harbour', '/name/long-white-cloud', '/name/green-cape-islands']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${route} at ${width}`).toBeLessThanOrEqual(1);
      await expect(page.locator(width < 1024 ? '.mobile-bottom-nav' : '.desktop-sidebar')).toBeVisible();
      if (width === 390 && route === '/learn/names') {
        await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Гонконг');
        await page.screenshot({ path: 'artifacts/names-qa/catalog-390.png', fullPage: true });
      }
      if ((width === 390 || width === 1440) && route === '/name/fragrant-harbour') {
        await page.screenshot({ path: `artifacts/names-qa/fragrant-harbour-${width}.png`, fullPage: true });
      }
    }
  }
});
