import { expect, test } from '@playwright/test';

test('Learn → outlines → context map → correct answer and explicit next', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Страны на карте/ }).click();
  await expect(page.locator('.geography-card')).toHaveCount(24);
  await expect(page.getByText('Найдено: 195', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Польша');
  await page.getByRole('link', { name: /Польша/ }).click();
  await expect(page.getByRole('heading', { name: 'Как запомнить' })).toBeVisible();
  await page.getByRole('button', { name: 'Силуэт', exact: true }).click();
  await expect(page.locator('.detail-media img').first()).toHaveAttribute('src', /outline-poland-question/);
  await page.getByRole('button', { name: 'На карте', exact: true }).click();
  await expect(page.locator('.detail-media img').first()).toHaveAttribute('src', /outline-poland-answer/);
  await page.getByRole('link', { name: 'Проверить себя' }).click();
  await expect(page.locator('.geography-answer-map')).toHaveCount(0);
  await page.getByRole('button', { name: 'Польша', exact: true }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.locator('.geography-answer-map img')).toHaveAttribute('src', /outline-poland-answer/);
  await expect(page.locator('.answer-button:enabled')).toHaveCount(0);
  await expect(page.getByText('1 / 5')).toBeVisible();
  await page.getByRole('button', { name: 'Следующий вопрос' }).click();
  await expect(page.getByText('2 / 5')).toBeVisible();
});

test('all-country catalog supports regions, incremental loading and search reset', async ({ page }) => {
  await page.goto('/learn/outlines');
  await expect(page.locator('.geography-card')).toHaveCount(24);
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(page.locator('.geography-card')).toHaveCount(48);
  await page.getByRole('combobox', { name: 'Регион' }).selectOption('Океания');
  await expect(page.locator('.geography-card')).toHaveCount(14);
  await expect(page.getByRole('link', { name: /Фиджи/ })).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Фиджи');
  await expect(page.locator('.geography-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Фиджи/ }).click();
  await expect(page.getByRole('heading', { name: 'Фиджи', exact: true })).toBeVisible();
  const map = page.locator('.detail-media img').first();
  await expect.poll(() => map.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.goto('/learn/outlines');
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('неизвестная страна');
  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Святой Престол');
  await expect(page.locator('.geography-card')).toHaveCount(1);
});

test('large countries, archipelagos and microstates have working silhouette and context views', async ({ page }) => {
  for (const id of ['united-states','russia','kiribati','france','holy-see','cyprus','somalia']) {
    await page.goto(`/geography/outline-${id}`);
    const image = page.locator('.detail-media img').first();
    await expect.poll(() => image.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Силуэт', exact: true }).click();
    await expect(image).toHaveAttribute('src', new RegExp(`outline-${id}-question`));
    await expect.poll(() => image.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  }
});

test('contour choices have neutral labels and support keyboard answers', async ({ page }) => {
  await page.goto('/quiz/session?mode=outline&count=1&focus=outline-malaysia-select-outline');
  await expect(page.locator('.outline-answer-grid .answer-button')).toHaveCount(4);
  for (const letter of ['А', 'Б', 'В', 'Г']) await expect(page.getByRole('button', { name: `Контур ${letter}`, exact: true })).toBeVisible();
  const target = page.locator('.answer-button').filter({ has: page.locator('img[src*="outline-malaysia-question"]') });
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 из 1' })).toBeVisible();
});

test('waterway sources, canal distinction and route explanation', async ({ page }) => {
  await page.goto('/learn/waterways');
  await expect(page.locator('.geography-card')).toHaveCount(20);
  await page.getByRole('button', { name: 'Каналы · 2' }).click();
  await page.getByRole('link', { name: /Панамский канал/ }).click();
  await expect(page.getByRole('heading', { name: 'Проследите путь' })).toBeVisible();
  await expect(page.getByText('Искусственный канал', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('link', { name: /Tide Tables/ })).toBeVisible();
  await page.goto('/quiz/session?mode=waterway&count=1&focus=bosphorus-route');
  await page.getByRole('button', { name: 'Чёрное море → Босфор → Мраморное море → Дарданеллы → Эгейское море', exact: true }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.locator('.geography-answer-map img')).toHaveAttribute('src', /bosphorus-diagram/);
});

test('strait banks and canal connections use the sourced relationships', async ({ page }) => {
  await page.goto('/quiz/session?mode=waterway&count=1&focus=gibraltar-banks');
  await expect(page.locator('.answer-button')).toHaveCount(4);
  await page.getByRole('button', { name: 'Европа и Африка', exact: true }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await page.goto('/quiz/session?mode=waterway&count=1&focus=suez-connects');
  await page.getByRole('button', { name: 'Средиземное море и Красное море', exact: true }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.locator('.geography-answer-map img')).toHaveAttribute('src', /suez-diagram/);
});

for (const topic of [{mode:'outline',focus:'outline-poland-identify',name:'Польша'}, {mode:'waterway',focus:'gibraltar-connects',name:'Гибралтарский пролив'}]) {
  test(`${topic.mode}: wrong answer persists in mistakes, review and progress`, async ({ page }) => {
    await page.goto(`/quiz/session?mode=${topic.mode}&count=1&focus=${topic.focus}`);
    await page.locator('.answer-button').filter({ hasNotText: topic.mode === 'outline' ? 'Польша' : 'Атлантический океан и Средиземное море' }).first().click();
    await expect(page.getByText(/Неверно/)).toBeVisible();
    await page.goto('/mistakes');
    await page.reload();
    await expect(page.locator('.mistake-row').filter({ hasText: topic.name })).toBeVisible();
    await page.getByRole('link', { name: 'Повторить ошибки' }).click();
    await expect(page.getByRole('heading', { name: topic.mode === 'outline' ? 'Какая страна изображена по контуру?' : /Какие водоёмы соединяет/ })).toBeVisible();
    await page.goto('/progress');
    await expect(page.locator('.domain-row').filter({ hasText: topic.mode === 'outline' ? 'Страны на карте' : 'Проливы и каналы' })).toContainText('0 из 1 верно');
    await page.reload();
    await expect(page.locator('.progress-overview')).toContainText('1');
  });
}

test('new content works offline when visited, with explicit uncached image state', async ({ page, context }) => {
  await page.goto('/geography/outline-poland');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match('/media/geography/outline-poland-answer.svg')))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  const map = page.locator('.detail-media img').first();
  await expect.poll(() => map.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await page.goto('/geography/suez');
  await expect(page.getByText(/Изображение сейчас недоступно без сети/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Как запомнить' })).toBeVisible();
});

test('new views fit all required widths and navigation stays accessible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(90_000);
  for (const width of [360,390,430,1280,1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/learn/outlines','/learn/waterways','/geography/outline-malaysia','/geography/panama','/quiz','/quiz/session?mode=outline&count=1&focus=outline-chile-select-outline','/quiz/session?mode=waterway&count=1&focus=bosphorus-route']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${route} at ${width}`).toBeLessThanOrEqual(1);
      if (!route.startsWith('/quiz/session')) await expect(page.locator(width < 1024 ? '.mobile-bottom-nav' : '.desktop-sidebar')).toBeVisible();
    }
  }
});
